const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));

const dataDir = path.join(__dirname, 'src', 'data');
function readJSON(file) {
  try {
    const p = path.join(dataDir, file);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8') || 'null');
  } catch (e) { return null; }
}
function writeJSON(file, obj) {
  try {
    const p = path.join(dataDir, file);
    fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
    return true;
  } catch (e) { console.error(e); return false; }
}

app.get('/api/data', (req, res) => {
  const rooms = readJSON('rooms.json') || [];
  const reservations = readJSON('bookings.json') || [];
  const revenue = readJSON('revenue.json');
  res.json({ rooms, reservations, revenue: revenue || 0 });
});

app.post('/api/data', (req, res) => {
  try {
    const { rooms, reservations, revenue } = req.body || {};
    if (Array.isArray(rooms)) writeJSON('rooms.json', rooms);
    if (Array.isArray(reservations)) writeJSON('bookings.json', reservations);
    if (typeof revenue !== 'undefined') writeJSON('revenue.json', revenue);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

app.listen(port, () => console.log(`HRS server listening on http://localhost:${port}`));
