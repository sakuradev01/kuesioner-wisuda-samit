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

// ✅ CORS: allow dev + prod (kalau kamu pakai proxy / same-origin, ini juga aman)
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
  })
);

app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // ssl: { rejectUnauthorized: true }, // kalau hosting wajib SSL, uncomment
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

// --- helper: pastikan row wisuda_questionnaire ada ---
async function ensureWisudaRow(uuid) {
  await pool.execute(
    `INSERT INTO wisuda_questionnaire (uuid)
     VALUES (?)
     ON DUPLICATE KEY UPDATE uuid = VALUES(uuid)`,
    [uuid]
  );
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
    if (!ok) return res.status(401).json({ message: "Login gagal" });

    await ensureWisudaRow(user.uuid);

    const token = jwt.sign(
      { id: user.id, uuid: user.uuid },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      token,
      user: { id: user.id, uuid: user.uuid, name: user.name },
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
    await ensureWisudaRow(uuid);

    const [rows] = await pool.execute(
      `SELECT
        class,
        nomination_vote_1, nomination_vote_2, nomination_reason,
        isDone_nomination, isDone_dreams
      FROM wisuda_questionnaire
      WHERE uuid = ? LIMIT 1`,
      [uuid]
    );

    return res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ============ SUBMIT NOMINATION (vote2 optional) ============
app.post("/api/wisuda/nomination", requireJwt, async (req, res) => {
  try {
    const uuid = req.user.uuid;
    const { student_class, vote1, vote2, reason } = req.body;

    // ✅ vote2 boleh null, tapi vote1 & reason wajib
    if (!student_class || !vote1 || !reason?.trim()) {
      return res.status(400).json({ message: "Data nominasi belum lengkap" });
    }

    // normalize vote2
    const v2 = vote2 ? String(vote2).trim() : null;

    if (v2 && vote1 === v2) {
      return res.status(400).json({ message: "Vote 1 dan Vote 2 tidak boleh sama" });
    }

    await pool.execute(
      `INSERT INTO wisuda_questionnaire
        (uuid, class, nomination_vote_1, nomination_vote_2, nomination_reason, isDone_nomination)
       VALUES
        (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
        class = VALUES(class),
        nomination_vote_1 = VALUES(nomination_vote_1),
        nomination_vote_2 = VALUES(nomination_vote_2),
        nomination_reason = VALUES(nomination_reason),
        isDone_nomination = 1`,
      [uuid, student_class, vote1, v2, reason]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ============ SUBMIT DREAMS ============
app.post("/api/wisuda/dreams", requireJwt, async (req, res) => {
  try {
    const uuid = req.user.uuid;

    await pool.execute(
      `INSERT INTO wisuda_questionnaire (uuid, isDone_dreams)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE isDone_dreams = 1`,
      [uuid]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ============ ADMIN: GET NOMINATIONS + SUMMARY ============
app.get("/api/admin/nominations", async (req, res) => {
  try {
    // list submissions
    const [rows] = await pool.execute(
      `
      SELECT
        w.uuid,
        s.name AS student_name,
        w.\`class\` AS student_class,
        w.nomination_vote_1 AS vote1,
        w.nomination_vote_2 AS vote2,
        w.nomination_reason AS reason,
        w.updated_at
      FROM wisuda_questionnaire w
      LEFT JOIN student s ON s.uuid = w.uuid
      WHERE w.isDone_nomination = 1
      ORDER BY w.updated_at DESC
      `
    );

    // summary vote counts (vote1 + vote2 digabung)
    const [summary] = await pool.execute(
      `
      SELECT vote, COUNT(*) AS total
      FROM (
        SELECT nomination_vote_1 AS vote
        FROM wisuda_questionnaire
        WHERE isDone_nomination = 1
          AND nomination_vote_1 IS NOT NULL
          AND nomination_vote_1 <> ''

        UNION ALL

        SELECT nomination_vote_2 AS vote
        FROM wisuda_questionnaire
        WHERE isDone_nomination = 1
          AND nomination_vote_2 IS NOT NULL
          AND nomination_vote_2 <> ''
      ) t
      GROUP BY vote
      ORDER BY total DESC
      `
    );

    return res.json({
      nominations: rows || [],
      summary: summary || [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

const PORT = Number(process.env.PORT || 3003);
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
