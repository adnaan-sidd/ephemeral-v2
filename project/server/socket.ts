import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-min-32-chars";

// Setup Socket.io with authentication
export function setupSocketIO(server: HttpServer) {
  const io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Get user from database
      const user = await storage.getUser(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.data.user = {
        id: user.id,
        email: user.email,
        plan: user.plan
      };
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.data.user.id})`);
    
    // Join user-specific room
    socket.join(`user:${socket.data.user.id}`);
    
    // Handle build:subscribe event
    socket.on('build:subscribe', (buildId) => {
      console.log(`User ${socket.data.user.id} subscribed to build ${buildId}`);
      socket.join(`build:${buildId}`);
    });
    
    // Handle build:unsubscribe event
    socket.on('build:unsubscribe', (buildId) => {
      console.log(`User ${socket.data.user.id} unsubscribed from build ${buildId}`);
      socket.leave(`build:${buildId}`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // Expose methods to emit events from other parts of the application
  return {
    io,
    
    // Emit build status update
    emitBuildStatus: (buildId: string, data: any) => {
      io.to(`build:${buildId}`).emit('build:status', { buildId, ...data });
    },
    
    // Emit build logs update
    emitBuildLogs: (buildId: string, logs: string) => {
      io.to(`build:${buildId}`).emit('build:logs', { buildId, logs });
    },
    
    // Emit user-specific notification
    emitNotification: (userId: string, notification: any) => {
      io.to(`user:${userId}`).emit('notification', notification);
    },
    
    // Emit global system notification
    emitSystemNotification: (message: string, type: 'info' | 'warning' | 'error' = 'info') => {
      io.emit('system', { message, type });
    }
  };
}
