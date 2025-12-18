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
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,

  // Kalau hosting kamu WAJIB SSL, uncomment bagian ini:
  // ssl: { rejectUnauthorized: true },

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
  // butuh UNIQUE uuid biar upsert ini jalan
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

    // cek user dari tabel student
    const [rows] = await pool.execute(
      "SELECT id, uuid, password, name FROM student WHERE uuid = ? LIMIT 1",
      [uuid]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Login gagal" });
    }

    const user = rows[0];

    // PHP bcrypt ($2y$) -> Node kadang perlu $2b$
    const hash = String(user.password).replace(/^\$2y\$/, "$2b$");
    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ message: "Login gagal" });

    // auto create row wisuda_questionnaire
    await ensureWisudaRow(user.uuid);

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
        dalang_access: user.dalang_access,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ============ GET STATUS (done apa belum) ============
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

// ============ SUBMIT NOMINATION ============
app.post("/api/wisuda/nomination", requireJwt, async (req, res) => {
  try {
    const uuid = req.user.uuid;
    const { student_class, vote1, vote2, reason } = req.body;

    if (!student_class || !vote1 || !vote2 || !reason?.trim()) {
      return res.status(400).json({ message: "Data nominasi belum lengkap" });
    }
    if (vote1 === vote2) {
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
      [uuid, student_class, vote1, vote2, reason]
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
       ON DUPLICATE KEY UPDATE
        isDone_dreams = 1`,
      [uuid]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.listen(3002, () => console.log("API running on http://localhost:3002"));
