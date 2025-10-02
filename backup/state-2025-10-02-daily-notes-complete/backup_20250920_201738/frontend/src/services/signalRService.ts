import * as signalR from '@microsoft/signalr';

export interface LeaveNotification {
  type: 'LeaveRequestSubmitted' | 'LeaveRequestProcessed' | 'LeaveBalanceUpdated' | 'ManagerNotification' | 'UserNotification';
  message: string;
  data?: any;
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds

  private listeners: Map<string, Set<(notification: LeaveNotification) => void>> = new Map();

  constructor() {
    this.connection = null;
  }

  async start(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('No access token available for SignalR connection');
        return;
      }

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5105/leaveHub', {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              return this.reconnectInterval;
            }
            return null; // Stop retrying
          }
        })
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      await this.connection.start();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('SignalR Connected successfully');

    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      this.scheduleReconnect();
    }
  }

  async stop(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        this.isConnected = false;
        console.log('SignalR connection stopped');
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Handle leave notifications
    this.connection.on('LeaveNotification', (notification: LeaveNotification) => {
      console.log('Received leave notification:', notification);
      this.notifyListeners('leave', notification);
    });

    // Handle connection events
    this.connection.onreconnecting(() => {
      console.log('SignalR reconnecting...');
      this.isConnected = false;
    });

    this.connection.onreconnected(() => {
      console.log('SignalR reconnected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.connection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.isConnected = false;
      if (error) {
        this.scheduleReconnect();
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached. Stopping reconnection attempts.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${this.reconnectInterval}ms`);
    
    setTimeout(() => {
      this.start();
    }, this.reconnectInterval);
  }

  addListener(event: string, callback: (notification: LeaveNotification) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  removeListener(event: string, callback: (notification: LeaveNotification) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private notifyListeners(event: string, notification: LeaveNotification): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('Error in SignalR event listener:', error);
        }
      });
    }
  }

  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state || null;
  }

  isConnectionActive(): boolean {
    return this.isConnected && this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Create singleton instance
const signalRService = new SignalRService();

export default signalRService;