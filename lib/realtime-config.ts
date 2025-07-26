import { apiClient } from './api-client';

// Configuration Update Types
export interface ConfigurationUpdate {
  type: 'service_update' | 'hours_update' | 'business_update' | 'voice_settings_update' | 'conversation_rules_update';
  businessId: string;
  phoneId?: string; // For phone-specific updates
  data: any;
  timestamp: string;
  requiresReload?: boolean;
}

export interface ServiceUpdate {
  type: 'service_created' | 'service_updated' | 'service_deleted' | 'service_reordered';
  businessId: string;
  serviceId: string;
  data?: any;
  timestamp: string;
}

export interface PhoneSettingsUpdate {
  type: 'voice_settings' | 'conversation_rules' | 'operating_hours' | 'sms_settings';
  phoneId: string;
  businessId: string;
  settings: any;
  timestamp: string;
  requiresReload: boolean;
}

export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

interface RealtimeConfigOptions {
  maxReconnectAttempts?: number;
  baseReconnectDelay?: number;
  pingInterval?: number;
  pongTimeout?: number;
  enableHealthCheck?: boolean;
}

class EnhancedRealtimeConfigManager {
  private ws: WebSocket | null = null;
  private businessId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private baseReconnectDelay: number;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  
  // Health check properties
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private lastPongTime: number = Date.now();
  private enableHealthCheck: boolean;
  private pingIntervalMs: number;
  private pongTimeoutMs: number;
  
  // State and message handlers
  private connectionState: ConnectionState = 'disconnected';
  private listeners: Map<string, Set<(update: any) => void>> = new Map();
  private connectionStateListeners = new Set<(state: ConnectionState) => void>();
  
  constructor(options: RealtimeConfigOptions = {}) {
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
    this.baseReconnectDelay = options.baseReconnectDelay ?? 1000;
    this.enableHealthCheck = options.enableHealthCheck ?? true;
    this.pingIntervalMs = options.pingInterval ?? 30000; // 30 seconds
    this.pongTimeoutMs = options.pongTimeout ?? 5000; // 5 seconds
  }

  async initialize(businessId: string): Promise<void> {
    this.businessId = businessId;
    this.isIntentionallyClosed = false;
    this.reconnectAttempts = 0;
    
    return this.connect();
  }

  private async connect(): Promise<void> {
    if (!this.businessId) {
      throw new Error('Business ID not set');
    }

    return new Promise((resolve, reject) => {
      // Get the token from localStorage or session
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        reject(new Error('No auth token available for WebSocket connection'));
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
          this.updateConnectionState('connected');
          this.startHealthCheck();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed', { 
            code: event.code, 
            reason: event.reason,
            wasClean: event.wasClean 
          });
          
          this.stopHealthCheck();
          this.updateConnectionState('disconnected');
          
          if (!this.isIntentionallyClosed) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      this.updateConnectionState('disconnected');
      // Notify listeners of permanent disconnection
      this.notifyListeners('connection_failed', { 
        reason: 'max_attempts_exceeded',
        attempts: this.reconnectAttempts 
      });
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );
    
    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    this.updateConnectionState('reconnecting');

    this.reconnectTimeout = setTimeout(async () => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        try {
          await this.connect();
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }
    }, delay);
  }

  private handleMessage(message: any) {
    const { type, data } = message;
    
    // Handle ping/pong for health check
    if (type === 'ping') {
      this.sendMessage({ type: 'pong', timestamp: new Date().toISOString() });
      return;
    }
    
    if (type === 'pong') {
      this.handlePong();
      return;
    }

    // Notify type-specific listeners
    this.notifyListeners(type, message);
    
    // Notify wildcard listeners
    this.notifyListeners('*', message);
  }

  private notifyListeners(type: string, data: any) {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in listener for type '${type}':`, error);
        }
      });
    }
  }

  // Health check implementation
  private startHealthCheck() {
    if (!this.enableHealthCheck) return;

    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendPing();
      }
    }, this.pingIntervalMs);
  }

  private stopHealthCheck() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private sendPing() {
    const sent = this.sendMessage({ 
      type: 'ping', 
      timestamp: new Date().toISOString() 
    });
    
    if (sent) {
      // Set timeout for pong response
      this.pongTimeout = setTimeout(() => {
        console.warn('Pong timeout - connection may be stale');
        // Force reconnection
        this.disconnect();
        this.connect().catch(error => {
          console.error('Failed to reconnect after pong timeout:', error);
        });
      }, this.pongTimeoutMs);
    }
  }

  private handlePong() {
    this.lastPongTime = Date.now();
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  // Connection state management
  private updateConnectionState(state: ConnectionState) {
    if (this.connectionState === state) return;
    
    this.connectionState = state;
    this.connectionStateListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in connection state listener:', error);
      }
    });
  }

  // Public methods - backward compatible
  subscribe(type: string, callback: (update: any) => void): () => void {
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

  onConnectionStateChange(handler: (state: ConnectionState) => void): () => void {
    this.connectionStateListeners.add(handler);
    
    // Immediately notify of current state
    handler(this.connectionState);
    
    return () => {
      this.connectionStateListeners.delete(handler);
    };
  }

  sendMessage(message: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, message not sent:', message);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      
      // Check if connection was lost during send
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.attemptReconnect();
      }
      
      return false;
    }
  }

  // Typed message senders
  sendConfigurationUpdate(update: Partial<ConfigurationUpdate>) {
    return this.sendMessage({
      ...update,
      timestamp: update.timestamp || new Date().toISOString()
    });
  }

  sendServiceUpdate(update: Partial<ServiceUpdate>) {
    return this.sendMessage({
      ...update,
      timestamp: update.timestamp || new Date().toISOString()
    });
  }

  sendPhoneSettingsUpdate(update: Partial<PhoneSettingsUpdate>) {
    return this.sendMessage({
      ...update,
      timestamp: update.timestamp || new Date().toISOString()
    });
  }

  disconnect() {
    this.isIntentionallyClosed = true;
    
    this.stopHealthCheck();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateConnectionState('disconnected');
    this.listeners.clear();
    this.connectionStateListeners.clear();
    this.businessId = null;
    this.reconnectAttempts = 0;
  }

  // Getters
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get state(): ConnectionState {
    return this.connectionState;
  }

  get connectionHealth(): 'healthy' | 'stale' | 'disconnected' {
    if (!this.isConnected) return 'disconnected';
    
    if (this.enableHealthCheck) {
      const timeSinceLastPong = Date.now() - this.lastPongTime;
      if (timeSinceLastPong > 60000) return 'stale'; // 1 minute
    }
    
    return 'healthy';
  }
}

// Export singleton instance with backward compatibility
export const realtimeConfigManager = new EnhancedRealtimeConfigManager();