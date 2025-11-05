import { io, Socket } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3055';

export const socket: Socket = io(apiUrl, {
  extraHeaders: {
    'x-anon-id': localStorage.getItem('anonId') || '',
  },
});

