import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// selalu load env dari folder server/
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// ✅ CORS: allow dev + prod
const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://wisuda-v2.samit.co.id",
  "https://www.wisuda-v2.samit.co.id",
]);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/postman
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// --- middleware auth (Bearer token) ---
function requireJwt(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// --- helper: pastikan row wisuda_questionnaire ada untuk batch aktif ---
async function ensureWisudaRow(uuid, batchId) {
  await pool.execute(
    `
    INSERT INTO wisuda_questionnaire (uuid, batch_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE uuid = VALUES(uuid)
    `,
    [uuid, batchId]
  );
}

// --- helper: ambil / buat batch aktif ---
async function getOrCreateActiveBatch() {
  const [rows] = await pool.execute(
    `
    SELECT id, batch_no, label
    FROM wisuda_batches
    WHERE is_active = 1
    ORDER BY id DESC
    LIMIT 1
    `
  );

  if (rows.length > 0) return rows[0];

  const [result] = await pool.execute(
    `
    INSERT INTO wisuda_batches (batch_no, label, is_active)
    VALUES (1, 'Batch 1', 1)
    `
  );

  return {
    id: result.insertId,
    batch_no: 1,
    label: "Batch 1",
  };
}

// ============ AUTH LOGIN ============
app.post("/api/auth/login", async (req, res) => {
  try {
    const { uuid, password } = req.body;

    if (!uuid || !password) {
      return res.status(400).json({ message: "uuid dan password wajib" });
    }

    const [rows] = await pool.execute(
      "SELECT id, uuid, password, name FROM student WHERE uuid = ? LIMIT 1",
      [uuid]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Login gagal" });
    }

    const user = rows[0];

    const hash = String(user.password).replace(/^\$2y\$/, "$2b$");
    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return res.status(401).json({ message: "Login gagal" });
    }

    const activeBatch = await getOrCreateActiveBatch();
    await ensureWisudaRow(user.uuid, activeBatch.id);

    const token = jwt.sign(
      { id: user.id, uuid: user.uuid },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ============ GET STATUS ============
app.get("/api/wisuda/status", requireJwt, async (req, res) => {
  try {
    const uuid = req.user.uuid;
    const activeBatch = await getOrCreateActiveBatch();

    await ensureWisudaRow(uuid, activeBatch.id);

    const [rows] = await pool.execute(
      `
      SELECT
        \`class\` AS class,
        nomination_vote_1,
        nomination_vote_2,
        nomination_reason_1,
        nomination_reason_2,
        isDone_nomination,
        isDone_dreams
      FROM wisuda_questionnaire
      WHERE uuid = ? AND batch_id = ?
      LIMIT 1
      `,
      [uuid, activeBatch.id]
    );

    return res.json({
      ...(rows[0] || {}),
      batch: activeBatch,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ============ SUBMIT NOMINATION ============
app.post("/api/wisuda/nomination", requireJwt, async (req, res) => {
  try {
    const uuid = req.user.uuid;
    const activeBatch = await getOrCreateActiveBatch();
    const { student_class, vote1, vote2, reason1, reason2 } = req.body;

    const v1 = vote1 ? String(vote1).trim() : "";
    const v2 = vote2 ? String(vote2).trim() : null;
    const r1 = (reason1 ?? "").toString().trim();
    const r2 = (reason2 ?? "").toString().trim();

    if (!student_class || !v1 || !r1) {
      return res.status(400).json({ message: "Data nominasi belum lengkap" });
    }

    if (v2 && !r2) {
      return res.status(400).json({ message: "Alasan Vote 2 wajib diisi" });
    }

    if (v2 && v1 === v2) {
      return res.status(400).json({ message: "Vote 1 dan Vote 2 tidak boleh sama" });
    }

    await pool.execute(
      `
      INSERT INTO wisuda_questionnaire
        (
          uuid,
          batch_id,
          \`class\`,
          nomination_vote_1,
          nomination_vote_2,
          nomination_reason_1,
          nomination_reason_2,
          isDone_nomination
        )
      VALUES
        (?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        \`class\` = VALUES(\`class\`),
        nomination_vote_1 = VALUES(nomination_vote_1),
        nomination_vote_2 = VALUES(nomination_vote_2),
        nomination_reason_1 = VALUES(nomination_reason_1),
        nomination_reason_2 = VALUES(nomination_reason_2),
        isDone_nomination = 1,
        updated_at = NOW()
      `,
      [uuid, activeBatch.id, student_class, v1, v2, r1, v2 ? r2 : null]
    );

    return res.json({
      ok: true,
      batch: activeBatch,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ============ SUBMIT DREAMS ============
app.post("/api/wisuda/dreams", requireJwt, async (req, res) => {
  try {
    const uuid = req.user.uuid;
    const activeBatch = await getOrCreateActiveBatch();

    await pool.execute(
      `
      INSERT INTO wisuda_questionnaire (uuid, batch_id, isDone_dreams)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE
        isDone_dreams = 1,
        updated_at = NOW()
      `,
      [uuid, activeBatch.id]
    );

    return res.json({
      ok: true,
      batch: activeBatch,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ============ ADMIN: GET NOMINATIONS + SUMMARY ============
app.get("/api/admin/nominations", async (req, res) => {
  try {
    const activeBatch = await getOrCreateActiveBatch();

    const [rows] = await pool.execute(
      `
      SELECT
        w.uuid,
        s.name AS student_name,
        w.\`class\` AS student_class,
        w.nomination_vote_1 AS vote1,
        w.nomination_reason_1 AS reason1,
        w.nomination_vote_2 AS vote2,
        w.nomination_reason_2 AS reason2,
        w.updated_at
      FROM wisuda_questionnaire w
      LEFT JOIN student s ON s.uuid = w.uuid
      WHERE w.isDone_nomination = 1
        AND w.batch_id = ?
      ORDER BY w.updated_at DESC
      `,
      [activeBatch.id]
    );

    const [summary] = await pool.execute(
      `
      SELECT vote, COUNT(*) AS total
      FROM (
        SELECT nomination_vote_1 AS vote
        FROM wisuda_questionnaire
        WHERE isDone_nomination = 1
          AND batch_id = ?
          AND nomination_vote_1 IS NOT NULL
          AND nomination_vote_1 <> ''

        UNION ALL

        SELECT nomination_vote_2 AS vote
        FROM wisuda_questionnaire
        WHERE isDone_nomination = 1
          AND batch_id = ?
          AND nomination_vote_2 IS NOT NULL
          AND nomination_vote_2 <> ''
      ) t
      GROUP BY vote
      ORDER BY total DESC
      `,
      [activeBatch.id, activeBatch.id]
    );

    return res.json({
      batch: activeBatch,
      nominations: rows || [],
      summary: summary || [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ============ ADMIN: NEXT BATCH ============
app.post("/api/admin/batches/next", async (req, res) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [activeRows] = await conn.execute(
      `
      SELECT id, batch_no
      FROM wisuda_batches
      WHERE is_active = 1
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
      `
    );

    const currentBatchNo = activeRows.length > 0 ? Number(activeRows[0].batch_no) : 0;
    const nextBatchNo = currentBatchNo + 1;
    const nextLabel = `Batch ${nextBatchNo}`;

    await conn.execute(
      `
      UPDATE wisuda_batches
      SET is_active = 0
      WHERE is_active = 1
      `
    );

    const [result] = await conn.execute(
      `
      INSERT INTO wisuda_batches (batch_no, label, is_active)
      VALUES (?, ?, 1)
      `,
      [nextBatchNo, nextLabel]
    );

    await conn.commit();

    return res.json({
      ok: true,
      batch: {
        id: result.insertId,
        batch_no: nextBatchNo,
        label: nextLabel,
      },
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ message: "Gagal membuat batch baru" });
  } finally {
    conn.release();
  }
});

const PORT = Number(process.env.PORT || 3003);
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});