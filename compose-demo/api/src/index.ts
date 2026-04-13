import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { createClient } from 'redis';

const app = express();
const PORT = process.env.PORT ?? 3001;

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

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/users', async (_req: Request, res: Response) => {
  const result = await pool.query('SELECT NOW() as time');
  res.json(result.rows);
});

app.get('/cache', async (_req: Request, res: Response) => {
  await redisClient.set('ping', 'pong');
  const val = await redisClient.get('ping');
  res.json({ redis: val });
});

app.listen(PORT, () => console.log(`API on :${PORT}`));