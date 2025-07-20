/**
 * AI Assistant data models and types
 */

// AI Query Types
export interface AIQuery<TPageData = Record<string, unknown>> {
  id: string;
  query: string;
  context: AIContext<TPageData>;
  timestamp: Date;
  userId: string;
  businessId: string;
}

export interface AIContext<TPageData = Record<string, unknown>> {
  currentPage: string;
  pageData?: TPageData;
  userRole: string;
  recentActions: UserAction[];
  activeFilters?: Record<string, string | number | boolean>;
  visibleData?: VisibleDataContext;
}

export interface UserAction<TData = unknown> {
  type: string;
  target: string;
  timestamp: Date;
  data?: TData;
}

export interface VisibleDataContext {
  metrics?: Record<string, number>;
  charts?: string[];
  tables?: string[];
  timeRange?: { start: Date; end: Date };
}

// AI Response Types
export interface AIResponse<T = unknown> {
  id: string;
  queryId: string;
  response: string;
  data?: T;
  visualizations?: AIVisualization[];
  suggestedActions?: AIAction[];
  confidence: number;
  processingTime: number;
  timestamp: Date;
}

export interface AIVisualization<T = unknown> {
  type: 'chart' | 'table' | 'metric' | 'list';
  config: VisualizationConfig;
  data: T;
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
export interface AIAction<TParameters = Record<string, unknown>> {
  id: string;
  type: ActionType;
  label: string;
  description?: string;
  confidence: number;
  parameters: TParameters;
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
export interface ActionRequest<TParameters = Record<string, unknown>> {
  actionId: string;
  confirmed: boolean;
  parameters: TParameters;
  userId: string;
  businessId: string;
}

export interface ActionResult<TDetail = unknown> {
  actionId: string;
  status: 'success' | 'failed' | 'partial';
  executedAt: Date;
  results: {
    successful: number;
    failed: number;
    details: ActionDetail<TDetail>[];
  };
  rollbackAvailable: boolean;
  rollbackId?: string;
}

export interface ActionDetail<T = unknown> {
  entityId: string;
  entityType: string;
  status: 'success' | 'failed';
  message?: string;
  previousState?: T;
  newState?: T;
}

// Pattern Recognition Types
export interface Pattern<TMetadata = Record<string, unknown>> {
  id: string;
  type: PatternType;
  confidence: number;
  timeframe: { start: Date; end: Date };
  description: string;
  dataPoints: DataPoint<TMetadata>[];
  impact: PatternImpact;
  recommendations: Recommendation[];
}

export type PatternType = 
  | 'revenue_trend'
  | 'customer_behavior'
  | 'capacity_pattern'
  | 'seasonal_trend'
  | 'anomaly';

export interface DataPoint<TMetadata = Record<string, unknown>> {
  timestamp: Date;
  value: number;
  label?: string;
  metadata?: TMetadata;
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
export interface RealtimeUpdate<T = unknown> {
  type: 'data_change' | 'pattern_detected' | 'action_completed' | 'alert';
  payload: T;
  timestamp: Date;
  source: string;
  businessId: string;
}

export interface AINotification<T = unknown> {
  id: string;
  type: 'insight' | 'alert' | 'recommendation' | 'update';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  data?: T;
  actions?: AIAction[];
  expiresAt?: Date;
  dismissible: boolean;
}

// Conversation Types
export interface AIConversation<TMessageData = unknown> {
  id: string;
  businessId: string;
  userId: string;
  messages: AIMessage<TMessageData>[];
  context: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage<T = unknown> {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: T;
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