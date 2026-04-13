import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from Docker!', pid: process.pid });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on :${PORT}`);
});