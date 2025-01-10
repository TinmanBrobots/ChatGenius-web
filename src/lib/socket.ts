import { io } from 'socket.io-client';
import { toast } from '@/components/ui/use-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: {
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  },
});

// Handle connection errors
socket.on('connect_error', (error) => {
  toast({
    title: "Connection Error",
    description: "Unable to establish real-time connection. Some features may be unavailable.",
    variant: "destructive",
  });
});

// Handle disconnection
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect' || reason === 'transport close') {
    toast({
      title: "Connection Lost",
      description: "Lost connection to the server. Attempting to reconnect...",
      variant: "destructive",
    });
  }
}); 