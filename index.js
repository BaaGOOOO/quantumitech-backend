import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:3000",
    process.env.FRONTEND_ORIGIN || ""
  ].filter(Boolean),
}));

app.get("/", (_req, res) => res.json({ ok: true, msg: "API működik 🚀" }));

app.post("/api/checkout", (req, res) => {
  const { email, plan } = req.body || {};
  if (!email || !plan) return res.status(400).json({ error: "email és plan kötelező" });

  const payment_url = `https://example.com/pay?email=${encodeURIComponent(email)}&plan=${encodeURIComponent(plan)}`;
  res.json({ ok: true, payment_url });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API fut a ${PORT} porton`));
