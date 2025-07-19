/**
 * AI Assistant data models and types
 */

// AI Query Types
export interface AIQuery {
  id: string;
  query: string;
  context: AIContext;
  timestamp: Date;
  userId: string;
  businessId: string;
}

export interface AIContext {
  currentPage: string;
  pageData?: Record<string, any>;
  userRole: string;
  recentActions: UserAction[];
  activeFilters?: Record<string, any>;
  visibleData?: VisibleDataContext;
}

export interface UserAction {
  type: string;
  target: string;
  timestamp: Date;
  data?: any;
}

export interface VisibleDataContext {
  metrics?: Record<string, number>;
  charts?: string[];
  tables?: string[];
  timeRange?: { start: Date; end: Date };
}

// AI Response Types
export interface AIResponse {
  id: string;
  queryId: string;
  response: string;
  data?: any;
  visualizations?: AIVisualization[];
  suggestedActions?: AIAction[];
  confidence: number;
  processingTime: number;
  timestamp: Date;
}

export interface AIVisualization {
  type: 'chart' | 'table' | 'metric' | 'list';
  config: VisualizationConfig;
  data: any;
  title?: string;
  description?: string;
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'scatter' | 'heatmap';
  dimensions?: {
    x: string;
    y: string;
    group?: string;
  };
  colors?: string[];
  interactive?: boolean;
}

// AI Action Types
export interface AIAction {
  id: string;
  type: ActionType;
  label: string;
  description?: string;
  confidence: number;
  parameters: Record<string, any>;
  requiresConfirmation: boolean;
  estimatedImpact?: ActionImpact;
}

export type ActionType = 
  | 'send_sms'
  | 'reschedule_appointment'
  | 'update_pricing'
  | 'create_promotion'
  | 'generate_report'
  | 'update_settings'
  | 'bulk_action';

export interface ActionImpact {
  affectedCount: number;
  estimatedRevenue?: number;
  riskLevel: 'low' | 'medium' | 'high';
  reversible: boolean;
}

// Action Execution Types
export interface ActionRequest {
  actionId: string;
  confirmed: boolean;
  parameters: Record<string, any>;
  userId: string;
  businessId: string;
}

export interface ActionResult {
  actionId: string;
  status: 'success' | 'failed' | 'partial';
  executedAt: Date;
  results: {
    successful: number;
    failed: number;
    details: ActionDetail[];
  };
  rollbackAvailable: boolean;
  rollbackId?: string;
}

export interface ActionDetail {
  entityId: string;
  entityType: string;
  status: 'success' | 'failed';
  message?: string;
  previousState?: any;
  newState?: any;
}

// Pattern Recognition Types
export interface Pattern {
  id: string;
  type: PatternType;
  confidence: number;
  timeframe: { start: Date; end: Date };
  description: string;
  dataPoints: DataPoint[];
  impact: PatternImpact;
  recommendations: Recommendation[];
}

export type PatternType = 
  | 'revenue_trend'
  | 'customer_behavior'
  | 'capacity_pattern'
  | 'seasonal_trend'
  | 'anomaly';

export interface DataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface PatternImpact {
  severity: 'low' | 'medium' | 'high';
  financialImpact?: number;
  affectedSegments?: string[];
  probability?: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  type: 'action' | 'insight' | 'warning';
  suggestedAction?: AIAction;
  expectedOutcome?: string;
  confidence: number;
}

// Real-time Update Types
export interface RealtimeUpdate {
  type: 'data_change' | 'pattern_detected' | 'action_completed' | 'alert';
  payload: any;
  timestamp: Date;
  source: string;
  businessId: string;
}

export interface AINotification {
  id: string;
  type: 'insight' | 'alert' | 'recommendation' | 'update';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  data?: any;
  actions?: AIAction[];
  expiresAt?: Date;
  dismissible: boolean;
}

// Conversation Types
export interface AIConversation {
  id: string;
  businessId: string;
  userId: string;
  messages: AIMessage[];
  context: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  actions?: AIAction[];
  visualizations?: AIVisualization[];
}

export interface ConversationContext {
  topic?: string;
  entities: ExtractedEntity[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  intent?: string;
}

export interface ExtractedEntity {
  type: 'customer' | 'service' | 'date' | 'metric' | 'action';
  value: string;
  confidence: number;
  context?: string;
}