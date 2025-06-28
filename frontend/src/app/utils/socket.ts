import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '../../../types';

class SocketService {
  private socket: Socket<SocketEvents> | null = null;
  public isConnected: boolean = false;
  private isConnecting: boolean = false;

  connect(): Socket<SocketEvents> | null {
    if (this.isConnecting) {
      return this.socket;
    }

    if (!this.socket || !this.socket.connected) {
      this.isConnecting = true;
      
      try {
        this.socket = io('http://localhost:3000', { // Fixed: Connect to backend port 3000
          transports: ['websocket', 'polling'], // Added polling as fallback
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
          console.log('Connected to server');
          this.isConnected = true;
          this.isConnecting = false;
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected from server:', reason);
          this.isConnected = false;
          this.isConnecting = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.isConnected = false;
          this.isConnecting = false;
        });

      } catch (error) {
        console.error('Failed to create socket connection:', error);
        this.isConnecting = false;
        return null;
      }
    }
    
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
    }
  }

  joinMatch(matchId: number): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('joinMatch', { matchId });
      console.log(`Emitted joinMatch for match ${matchId}`);
    } else {
      console.error('Cannot join match: socket not connected');
    }
  }

  leaveMatch(matchId: number): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leaveMatch', { matchId });
      console.log(`Emitted leaveMatch for match ${matchId}`);
    }
  }

  getSocket(): Socket<SocketEvents> | null {
    if (!this.socket || !this.socket.connected) {
      console.log('Socket not connected, attempting to connect...');
      return this.connect();
    }
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService;