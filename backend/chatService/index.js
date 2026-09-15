const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const PORT = process.env.PORT || 3004;
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));

const { connectDB } = require('./db');
const { verifyToken, buildUserContext } = require('./util/auth');
const { ChatMessage } = require('./models/message.model');

connectDB();

app.get('/api/health', (_, res) => {
  res.json({ success: true, service: 'chat', status: 'ok' });
});

app.use('/api/chat', require('./routes/chat.route'));

io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
    socket.handshake.query?.token;

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error('Unauthorized'));
  }

  socket.user = buildUserContext(decoded);
  socket.data.joinedRooms = new Set();
  return next();
});

io.on('connection', (socket) => {
  console.log('Chat user connected:', socket.user?.email);

  socket.on('chat:join', async ({ videoId }, ack) => {
    try {
      if (!videoId) {
        const error = { success: false, message: 'videoId is required' };
        if (ack) ack(error);
        return;
      }

      const room = `video:${videoId}`;
      socket.join(room);
      socket.data.joinedRooms.add(videoId);

      const messages = await ChatMessage.find({ videoId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const payload = {
        success: true,
        messages: messages.reverse(),
      };

      socket.emit('chat:history', payload.messages);
      if (ack) ack(payload);
    } catch (error) {
      console.error('Error joining chat room:', error);
      if (ack) {
        ack({ success: false, message: 'Failed to load chat history' });
      }
    }
  });

  socket.on('chat:leave', ({ videoId }) => {
    if (!videoId) {
      return;
    }
    const room = `video:${videoId}`;
    socket.leave(room);
    socket.data.joinedRooms.delete(videoId);
  });

  socket.on('chat:message', async ({ videoId, content }, ack) => {
    try {
      if (!videoId || typeof content !== 'string') {
        const error = { success: false, message: 'videoId and content are required' };
        if (ack) ack(error);
        return;
      }

      if (!socket.data.joinedRooms.has(videoId)) {
        const error = { success: false, message: 'You must join the room before sending messages' };
        if (ack) ack(error);
        return;
      }

      const messageText = content.trim();
      if (!messageText) {
        const error = { success: false, message: 'Message cannot be empty' };
        if (ack) ack(error);
        return;
      }

      if (messageText.length > 1000) {
        const error = { success: false, message: 'Message is too long' };
        if (ack) ack(error);
        return;
      }

      const message = await ChatMessage.create({
        videoId,
        userId: socket.user.id,
        userName: socket.user.name,
        role: socket.user.role,
        content: messageText,
      });

      const payload = {
        id: message._id.toString(),
        videoId: message.videoId,
        userId: message.userId,
        userName: message.userName,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      };

      io.to(`video:${videoId}`).emit('chat:message', payload);
      if (ack) {
        ack({ success: true, message: payload });
      }
    } catch (error) {
      console.error('Error broadcasting chat message:', error);
      if (ack) {
        ack({ success: false, message: 'Failed to send message' });
      }
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('Chat user disconnected:', socket.user?.email, reason);
    socket.data.joinedRooms.clear();
  });
});

app.use((err, req, res, next) => {
  console.error('Chat service error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

server.listen(PORT, () => {
  console.log(`Chat service listening on port ${PORT}`);
});
