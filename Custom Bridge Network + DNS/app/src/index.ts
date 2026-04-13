import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { createClient } from 'redis';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Hostnames here are container names — not IPs, not localhost
// Docker's custom bridge network resolves them via DNS automatically
const pool = new Pool({
  host: process.env.PG_HOST,
  port: 5432,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DB,
});

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:6379`,
});

redisClient.connect().catch(console.error);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'API is up' });
});

// Hits Postgres — returns current DB time
app.get('/pg', async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT NOW() as time');
  res.json({ postgres: result.rows[0].time });
});

// Hits Redis — writes and reads a value
app.get('/redis', async (_req: Request, res: Response) => {
  await redisClient.set('visited', new Date().toISOString());
  const value = await redisClient.get('visited');
  res.json({ redis: value });
});

app.listen(PORT, () => console.log(`API running on :${PORT}`));