const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/metasafe', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Models
const User = mongoose.model('User', {
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  reputation: { type: Number, default: 100 },
  flags: { type: Number, default: 0 },
  status: { type: String, enum: ['excellent', 'good', 'neutral', 'critical'], default: 'good' },
});

const Incident = mongoose.model('Incident', {
  userId: mongoose.Schema.Types.ObjectId,
  category: { type: String, enum: ['harassment', 'threats', 'bullying', 'stalking'], default: 'harassment' },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  description: String,
  timestamp: { type: Date, default: Date.now },
});

const Zone = mongoose.model('Zone', {
  name: String,
  active: { type: Boolean, default: true },
  protectedUsers: [mongoose.Schema.Types.ObjectId],
  blockedUsers: [mongoose.Schema.Types.ObjectId],
});

// Routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: 'User registered' });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret');
  res.json({ token, user });
});

app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.get('/api/incidents', async (req, res) => {
  const incidents = await Incident.find().populate('userId', 'name');
  res.json(incidents);
});

app.get('/api/zones', async (req, res) => {
  const zones = await Zone.find();
  res.json(zones);
});

app.post('/api/zones', async (req, res) => {
  const zone = new Zone(req.body);
  await zone.save();
  res.status(201).json(zone);
});

// Socket for real-time
io.on('connection', (socket) => {
  console.log('User connected');
  setInterval(() => {
    // Simulate incident alerts
    const mockIncident = { category: 'bullying', severity: 'high', description: 'New incident detected' };
    io.emit('incidentAlert', mockIncident);
  }, 30000);
});

server.listen(5000, () => console.log('Server running on port 5000'));