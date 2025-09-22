import * as signalR from '@microsoft/signalr';

export interface LeaveNotification {
  type: 'LeaveRequestSubmitted' | 'LeaveRequestProcessed' | 'LeaveBalanceUpdated' | 'ManagerNotification' | 'UserNotification';
  message: string;
  data?: any;
}

export interface ScheduleUpdateNotification {
  type: 'AssignmentUpdated' | 'BulkAssignmentsUpdated';
  data: any;
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds

  private listeners: Map<string, Set<(notification: any) => void>> = new Map();
  private scheduleConnection: signalR.HubConnection | null = null;
  private isScheduleConnected = false;

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

      // Get the base URL from environment
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5199';

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${baseUrl}/leaveHub`, {
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

      // Also start schedule connection
      await this.startScheduleConnection();

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

    if (this.scheduleConnection) {
      try {
        await this.scheduleConnection.stop();
        this.isScheduleConnected = false;
        console.log('SignalR schedule connection stopped');
      } catch (error) {
        console.error('Error stopping SignalR schedule connection:', error);
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

  async startScheduleConnection(): Promise<void> {
    if (this.isScheduleConnected) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.warn('No access token available for SignalR schedule connection');
        return;
      }

      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5199';

      this.scheduleConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${baseUrl}/scheduleHub`, {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

      // Set up schedule event handlers
      this.setupScheduleEventHandlers();

      await this.scheduleConnection.start();
      this.isScheduleConnected = true;

      // Join the schedule updates group
      await this.scheduleConnection.invoke('JoinScheduleGroup');

      console.log('✅ SignalR Schedule connection started and joined group');

    } catch (error) {
      console.error('❌ Error starting SignalR schedule connection:', error);
    }
  }

  private setupScheduleEventHandlers(): void {
    if (!this.scheduleConnection) return;

    // Handle assignment updates
    this.scheduleConnection.on('AssignmentUpdated', (assignment: any) => {
      console.log('📡 Received assignment update:', assignment);
      this.notifyListeners('assignmentUpdated', assignment);
    });

    // Handle bulk assignment updates
    this.scheduleConnection.on('BulkAssignmentsUpdated', (assignments: any[]) => {
      console.log('📡 Received bulk assignments update:', assignments);
      this.notifyListeners('bulkAssignmentsUpdated', assignments);
    });

    // Handle connection events
    this.scheduleConnection.onreconnecting(() => {
      console.log('📡 SignalR schedule connection reconnecting...');
      this.isScheduleConnected = false;
    });

    this.scheduleConnection.onreconnected(async () => {
      console.log('📡 SignalR schedule connection reconnected');
      this.isScheduleConnected = true;
      // Re-join the group after reconnection
      try {
        await this.scheduleConnection!.invoke('JoinScheduleGroup');
        console.log('✅ Re-joined schedule updates group after reconnection');
      } catch (error) {
        console.error('❌ Error re-joining schedule group:', error);
      }
    });

    this.scheduleConnection.onclose((error) => {
      console.log('📡 SignalR schedule connection closed:', error);
      this.isScheduleConnected = false;
    });
  }

  addListener(event: string, callback: (notification: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  removeListener(event: string, callback: (notification: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private notifyListeners(event: string, notification: any): void {
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

  isScheduleConnectionActive(): boolean {
    return this.isScheduleConnected && this.scheduleConnection?.state === signalR.HubConnectionState.Connected;
  }
}

// Create singleton instance
const signalRService = new SignalRService();

export default signalRService;