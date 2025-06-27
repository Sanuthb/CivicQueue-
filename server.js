const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let queues = {
  passport: [],
  license: [],
  property: []
};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/queue/:dept', (req, res) => {
  const dept = req.params.dept;
  res.json(queues[dept] || []);
});

app.post('/api/ticket', (req, res) => {
    const { name, dept, isPriority } = req.body;
    const ticket = {
      name,
      number: queues[dept].length + 1,
      createdAt: new Date(),
      priority: !!isPriority
    };
    queues[dept].push(ticket);
    io.emit('queueUpdate', { dept });
    res.json(ticket);
  });
  
  app.post('/api/ticket/qr', async (req, res) => {
    const { ticket } = req.body;
    try {
      const qrData = `CivicQueue Ticket\nName: ${ticket.name}\nNumber: ${ticket.number}\nDept: ${ticket.dept}\nTime: ${new Date().toLocaleString()}`;
      const qrImage = await QRCode.toDataURL(qrData);
      res.json({ qrImage });
    } catch (err) {
      res.status(500).json({ error: 'QR generation failed' });
    }
  });
io.on('connection', socket => {
  console.log('New client connected');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
