import { io } from 'socket.io-client';
import { toast } from '@/components/ui/use-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: {
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  },
});

// Heartbeat interval
let heartbeatInterval: NodeJS.Timeout | null = null;

// Start heartbeat
const startHeartbeat = () => {
  if (heartbeatInterval) return;
  
  heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('heartbeat');
    }
  }, 30000); // Send heartbeat every 30 seconds
};

// Stop heartbeat
const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

// Handle browser visibility changes
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (socket.connected) {
      if (document.hidden) {
        socket.emit('presence:away');
      } else {
        socket.emit('presence:active');
      }
    }
  });
}

// Handle successful connection
socket.on('connect', () => {
  startHeartbeat();
  
  // Set initial presence
  if (!document.hidden) {
    socket.emit('presence:active');
  } else {
    socket.emit('presence:away');
  }
});

// Handle connection errors
socket.on('connect_error', (error) => {
  stopHeartbeat();
  toast({
    title: "Connection Error",
    description: "Unable to establish real-time connection. Some features may be unavailable.",
    variant: "destructive",
  });
});

// Handle disconnection
socket.on('disconnect', (reason) => {
  stopHeartbeat();
  
  if (reason === 'io server disconnect' || reason === 'transport close') {
    toast({
      title: "Connection Lost",
      description: "Lost connection to the server. Attempting to reconnect...",
      variant: "destructive",
    });
  }
});

// Clean up on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stopHeartbeat();
    if (socket.connected) {
      socket.disconnect();
    }
  });
}

export const updateSocketAuth = (token: string | null, userId: string | null) => {
  socket.auth = { token, userId };
  
  if (token && userId) {
    socket.connect();
  } else {
    if (socket.connected) {
      socket.disconnect();
    }
  }
}; 