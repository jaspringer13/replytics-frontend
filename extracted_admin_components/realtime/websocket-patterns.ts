/**
 * Extracted WebSocket Patterns from Voice Bot Admin
 * 
 * Key improvements over basic WebSocket implementation:
 * 1. Exponential backoff reconnection strategy
 * 2. Connection state management
 * 3. Message type routing
 * 4. Error boundary handling
 * 5. Automatic cleanup on unmount
 * 6. Ping/pong health checks (implied)
 * 7. Max reconnection attempts
 * 8. Event handler registration pattern
 */

// Enhanced WebSocket Manager with Reconnection Logic
export class EnhancedWebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // 1 second
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  
  // Message handlers
  private messageHandlers = new Map<string, Set<(data: any) => void>>();
  private connectionStateHandlers = new Set<(state: 'connected' | 'disconnected' | 'reconnecting') => void>();
  
  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect with automatic reconnection support
   */
  async connect(): Promise<void> {
    this.isIntentionallyClosed = false;
    this.reconnectAttempts = 0;
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connection established');
          this.reconnectAttempts = 0;
          this.notifyConnectionState('connected');
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
        
        this.ws.onclose = (event) => {
          console.log('WebSocket connection closed', { 
            code: event.code, 
            reason: event.reason,
            wasClean: event.wasClean 
          });
          
          this.notifyConnectionState('disconnected');
          
          if (!this.isIntentionallyClosed) {
            this.scheduleReconnection();
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnection() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      this.notifyConnectionState('disconnected');
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );
    
    this.reconnectAttempts++;
    console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    this.notifyConnectionState('reconnecting');

    this.reconnectTimeoutId = setTimeout(async () => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        try {
          await this.connect();
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }
    }, delay);
  }

  /**
   * Send message with connection state validation
   */
  send(type: string, data: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, message not sent:', { type, data });
      return false;
    }

    try {
      const message = JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      });

      this.ws.send(message);
      return true;
      
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      
      // Check if connection was lost during send
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.scheduleReconnection();
      }
      
      return false;
    }
  }

  /**
   * Register message handler for specific message type
   */
  on(messageType: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    
    this.messageHandlers.get(messageType)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(messageType)?.delete(handler);
    };
  }

  /**
   * Register connection state change handler
   */
  onConnectionStateChange(handler: (state: 'connected' | 'disconnected' | 'reconnecting') => void): () => void {
    this.connectionStateHandlers.add(handler);
    
    return () => {
      this.connectionStateHandlers.delete(handler);
    };
  }

  /**
   * Handle incoming messages and route to appropriate handlers
   */
  private handleMessage(message: any) {
    const { type, data } = message;
    
    // Special handling for ping/pong
    if (type === 'ping') {
      this.send('pong', {});
      return;
    }
    
    // Route to registered handlers
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in message handler for type ${type}:`, error);
        }
      });
    }
  }

  /**
   * Notify all connection state handlers
   */
  private notifyConnectionState(state: 'connected' | 'disconnected' | 'reconnecting') {
    this.connectionStateHandlers.forEach(handler => {
      try {
        handler(state);
      } catch (error) {
        console.error('Error in connection state handler:', error);
      }
    });
  }

  /**
   * Close connection and cleanup
   */
  disconnect() {
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.messageHandlers.clear();
    this.connectionStateHandlers.clear();
  }

  /**
   * Get current connection state
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get WebSocket ready state
   */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// React Hook for WebSocket Management
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketOptions {
  url: string;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: any) => void;
}

export const useEnhancedWebSocket = (options: UseWebSocketOptions) => {
  const [connectionState, setConnectionState] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsManager = useRef<EnhancedWebSocketManager | null>(null);

  useEffect(() => {
    // Create WebSocket manager
    wsManager.current = new EnhancedWebSocketManager(options.url);
    
    // Set up connection state handler
    const unsubscribeState = wsManager.current.onConnectionStateChange((state) => {
      setConnectionState(state);
      
      if (state === 'connected') {
        options.onOpen?.();
      } else if (state === 'disconnected') {
        options.onClose?.();
      }
    });
    
    // Set up generic message handler if provided
    let unsubscribeMessage: (() => void) | null = null;
    if (options.onMessage) {
      unsubscribeMessage = wsManager.current.on('*', (data) => {
        setLastMessage(data);
        options.onMessage!(data);
      });
    }
    
    // Connect
    wsManager.current.connect().catch((error) => {
      console.error('Failed to establish WebSocket connection:', error);
      options.onError?.(error);
    });
    
    // Cleanup
    return () => {
      unsubscribeState();
      unsubscribeMessage?.();
      wsManager.current?.disconnect();
    };
  }, [options.url]);

  const sendMessage = useCallback((type: string, data: any) => {
    return wsManager.current?.send(type, data) ?? false;
  }, []);

  const subscribe = useCallback((messageType: string, handler: (data: any) => void) => {
    return wsManager.current?.on(messageType, handler) ?? (() => {});
  }, []);

  return {
    connectionState,
    lastMessage,
    sendMessage,
    subscribe,
    isConnected: connectionState === 'connected',
  };
};

// Typed Message Handlers for Specific Use Cases
export interface ConfigurationUpdate {
  type: 'business' | 'voice_settings' | 'conversation_rules';
  business_id: string;
  data: any;
  timestamp: string;
}

export interface ServiceUpdate {
  type: 'service_created' | 'service_updated' | 'service_deleted';
  business_id: string;
  service_id: string;
  data?: any;
  timestamp: string;
}

export class TypedWebSocketManager extends EnhancedWebSocketManager {
  onConfigUpdate(handler: (update: ConfigurationUpdate) => void): () => void {
    return this.on('config_update', handler);
  }
  
  onServiceUpdate(handler: (update: ServiceUpdate) => void): () => void {
    return this.on('service_update', handler);
  }
  
  sendConfigUpdate(update: Partial<ConfigurationUpdate>) {
    return this.send('config_update', update);
  }
  
  sendServiceUpdate(update: Partial<ServiceUpdate>) {
    return this.send('service_update', update);
  }
}

// Connection Health Monitor
export class WebSocketHealthMonitor {
  private ws: EnhancedWebSocketManager;
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private lastPongTime: number = Date.now();
  
  constructor(ws: EnhancedWebSocketManager, pingIntervalMs = 30000) {
    this.ws = ws;
    
    // Set up ping interval
    this.pingInterval = setInterval(() => {
      if (this.ws.isConnected) {
        this.sendPing();
      }
    }, pingIntervalMs);
    
    // Listen for pongs
    this.ws.on('pong', () => {
      this.lastPongTime = Date.now();
      if (this.pongTimeout) {
        clearTimeout(this.pongTimeout);
        this.pongTimeout = null;
      }
    });
  }
  
  private sendPing() {
    const sent = this.ws.send('ping', {});
    
    if (sent) {
      // Set timeout for pong response
      this.pongTimeout = setTimeout(() => {
        console.warn('Pong timeout - connection may be stale');
        // Force reconnection
        this.ws.disconnect();
        this.ws.connect();
      }, 5000);
    }
  }
  
  get connectionHealth(): 'healthy' | 'stale' | 'disconnected' {
    if (!this.ws.isConnected) return 'disconnected';
    
    const timeSinceLastPong = Date.now() - this.lastPongTime;
    if (timeSinceLastPong > 60000) return 'stale'; // 1 minute
    
    return 'healthy';
  }
  
  cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
    }
  }
}