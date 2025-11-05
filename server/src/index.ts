import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { sequelize, testConnection } from './db/connection.js';
import './models/index.js';
import todayRoutes from './routes/today.js';
import completeRoutes from './routes/complete.js';
import progressRoutes from './routes/progress.js';
import challengesRoutes from './routes/challenges.js';
import winsRoutes from './routes/wins.js';
import authRoutes from './routes/auth.js';
import journalRoutes from './routes/journal.js';
import { authenticateAnon } from './middleware/auth.js';

const app = express();
const httpServer = createServer(app);

// Determine CORS origin based on environment
const getCorsOrigin = (): string => {
  // Explicit CORS_ORIGIN env var takes precedence
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN;
  }
  
  // Otherwise, use environment-based defaults
  if (process.env.NODE_ENV === 'production') {
    return 'https://out.madsens.dev';
  }
  
  // Development default
  return 'http://localhost:5173';
};

const corsOrigin = getCorsOrigin();

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

// Store io instance in app for route access
app.set('io', io);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

  // Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: (req: express.Request) => {
    return (req.headers['x-anon-id'] as string) || req.ip || 'unknown';
  },
  message: { error: 'Too many requests' },
});

app.use('/api', globalLimiter);

// Socket.IO authentication
io.use((socket: any, next: any) => {
  const anonId = socket.handshake.headers['x-anon-id'] as string;
  if (!anonId) {
    return next(new Error('Missing x-anon-id'));
  }
  socket.data.userId = anonId;
  next();
});

io.on('connection', (socket: any) => {
  const userId = socket.data.userId;
  socket.join(userId);
  console.log(`Socket connected: ${userId}`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${userId}`);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/today', todayRoutes);
app.use('/api/complete', completeRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/wins', winsRoutes);
app.use('/api/journal', journalRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

async function start() {
  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database. Exiting.');
    process.exit(1);
  }

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start();

