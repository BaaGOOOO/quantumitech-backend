import { pool } from "./db.js";

export async function bootstrap() {
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
