import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neonhoz kell
});

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", process.env.FRONTEND_ORIGIN].filter(Boolean),
  })
);

// --- bootstrap: extension + tábla létrehozás idempotensen
async function bootstrap() {
  await pool.query(`create extension if not exists pgcrypto;`);
  await pool.query(`
    create table if not exists orders (
      id uuid primary key default gen_random_uuid(),
      email text not null,
      plan  text not null,
      status text not null default 'initiated',
      created_at timestamptz default now()
    );
  `);
}

// healthcheck
app.get("/", (_req, res) => res.json({ ok: true, msg: "API működik 🚀" }));

// DEBUG 1: DB ping
app.get("/api/debug/ping", async (_req, res) => {
  try {
    const r = await pool.query("select now()");
    res.json({ ok: true, now: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DEBUG 2: orders count
app.get("/api/debug/count", async (_req, res) => {
  try {
    const r = await pool.query("select count(*)::int as n from orders");
    res.json({ ok: true, count: r.rows[0].n });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// CHECKOUT: beszúr DB-be és visszaad payment_url-t
app.post("/api/checkout", async (req, res) => {
  try {
    const { email, plan } = req.body || {};
    if (!email || !plan) return res.status(400).json({ error: "email és plan kötelező" });

    const result = await pool.query(
      "insert into orders (email, plan) values ($1, $2) returning id",
      [email, plan]
    );
    const orderId = result.rows[0].id;

    const payment_url = `https://example.com/pay?order=${orderId}`;
    res.json({ ok: true, orderId, payment_url });
  } catch (e) {
    console.error("❌ /api/checkout error:", e);
    res.status(500).json({ error: "szerver hiba" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  await bootstrap().catch((e) => console.error("Bootstrap error:", e));
  console.log(`✅ Backend fut port: ${PORT}`);
});
