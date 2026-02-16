const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const { createClient } = require('redis');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',  // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

// Middleware - CORS Configuration (FIXED)
app.use(cors({
  origin: '*',  // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // Cache preflight for 24 hours
}));

// Handle preflight OPTIONS requests for all routes
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redis client setup - DISABLED (Optional feature)
let redisClient = null;
console.log('ℹ️  Redis is disabled (optional feature, not required)');

// Uncomment below to enable Redis caching (requires Redis server running)
/*
(async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.on('connect', () => console.log('✅ Redis Client Connected'));
    
    await redisClient.connect();
  } catch (error) {
    console.log('Redis connection failed, running without cache:', error.message);
  }
})();
*/

// Make redis client available to routes
app.locals.redisClient = redisClient;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection handling
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    activeUsers.set(socket.id, { userId, roomId });
    io.to(roomId).emit('user-joined', { userId, socketId: socket.id });
    console.log(`User ${userId} joined room ${roomId}`);
  });

  socket.on('task-updated', (data) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.to(user.roomId).emit('task-update', data);
    }
  });

  socket.on('task-created', (data) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.to(user.roomId).emit('new-task', data);
    }
  });

  socket.on('task-deleted', (data) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      socket.to(user.roomId).emit('task-removed', data);
    }
  });

  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    if (user) {
      io.to(user.roomId).emit('user-left', { userId: user.userId, socketId: socket.id });
      activeUsers.delete(socket.id);
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const projectRoutes = require('./routes/projects');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisClient?.isOpen ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, io };