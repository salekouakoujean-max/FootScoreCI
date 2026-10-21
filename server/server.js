import express from 'express';

const app = express();
app.use(express.json());

// Autoriser l'application Android à communiquer avec le serveur
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

const PORT = process.env.PORT || 8080;
const KEY = process.env.FOOTBALL_API_KEY;
const upstream = 'https://live-football-api.com/api/v1';

async function proxy(path, res) {
  if (!KEY) {
    return res.status(503).json({ error: 'FOOTBALL_API_KEY not configured' });
  }

  try {
    const r = await fetch(upstream + path, {
      headers: { 'Authorization': `Bearer ${KEY}` }
    });

    const text = await r.text();
    res.status(r.status)
      .type(r.headers.get('content-type') || 'application/json')
      .send(text);
  } catch (e) {
    res.status(502).json({ error: 'upstream unavailable' });
  }
}

app.get('/api/health', (q, r) => r.json({ ok: true, service: 'FootScore CI' }));
app.get('/api/matches', (q, r) => proxy('/matches', r));
app.get('/api/live-details', (q, r) => proxy('/live-details', r));
app.get('/api/standings', (q, r) => proxy('/standings', r));

app.listen(PORT, () => console.log(`FootScore CI server on ${PORT}`));

