import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:3000", process.env.FRONTEND_ORIGIN].filter(Boolean),
}));

app.get("/", (_req, res) => res.json({ ok: true, msg: "API működik 🚀" }));

app.post("/api/checkout", async (req, res) => {
  try {
    const { email, plan } = req.body;
    if (!email || !plan) {
      return res.status(400).json({ error: "Hiányzik email vagy plan" });
    }

    // Itt történik az adatbázisba mentés
    const result = await pool.query(
      "INSERT INTO orders (email, plan) VALUES ($1, $2) RETURNING id",
      [email, plan]
    );

    const orderId = result.rows[0].id;
    const paymentUrl = `https://example.com/pay?order=${orderId}`;

    res.json({ ok: true, orderId, payment_url: paymentUrl });
  } catch (err) {
    console.error("❌ Hiba a /checkout alatt:", err);
    res.status(500).json({ error: "Szerver hiba" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Backend fut port: ${PORT}`));
