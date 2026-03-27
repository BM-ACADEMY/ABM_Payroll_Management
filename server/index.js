const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const compression = require('compression');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST", "PATCH"]
  }
});

// Connect Database
connectDB();

// Init Middleware
app.use(compression());
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Pass io to request object for use in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/company-leaves', require('./routes/companyLeave'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/complaints', require('./routes/complaint'));
app.use('/api/scores', require('./routes/score'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/time-logs', require('./routes/timeLogRoutes'));

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_board', (boardId) => {
    socket.join(boardId);
    console.log(`User ${socket.id} joined board: ${boardId}`);
  });

  socket.on('leave_board', (boardId) => {
    socket.leave(boardId);
    console.log(`User ${socket.id} left board: ${boardId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});
