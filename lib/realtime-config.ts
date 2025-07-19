import { apiClient } from './api-client';

export interface ConfigurationUpdate {
  type: 'service_update' | 'hours_update' | 'business_update';
  businessId: string;
  data: any;
  timestamp: string;
}

class RealtimeConfigManager {
  private ws: WebSocket | null = null;
  private businessId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(update: ConfigurationUpdate) => void>> = new Map();

  async initialize(businessId: string) {
    this.businessId = businessId;
    this.connect();
  }

  private connect() {
    if (!this.businessId) return;

    // Get the token from localStorage or session
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      console.error('No auth token available for WebSocket connection');
      return;
    }

    // Construct WebSocket URL with token as query parameter
    const baseURL = process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
    const wsURL = baseURL.replace(/^http/, 'ws');
    const url = `${wsURL}/api/v2/config/businesses/${this.businessId}/ws?token=${token}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data) as ConfigurationUpdate;
          this.handleUpdate(update);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleUpdate(update: ConfigurationUpdate) {
    const typeListeners = this.listeners.get(update.type) || new Set();
    const allListeners = this.listeners.get('*') || new Set();

    typeListeners.forEach(listener => listener(update));
    allListeners.forEach(listener => listener(update));
  }

  subscribe(type: string, callback: (update: ConfigurationUpdate) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.listeners.clear();
    this.businessId = null;
    this.reconnectAttempts = 0;
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }
}

export const realtimeConfigManager = new RealtimeConfigManager();