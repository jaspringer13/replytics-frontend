import { createClient } from '@supabase/supabase-js';
import { ValidatedSession } from './jwt-validation';

// Initialize Supabase client with service role for secure operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export enum SecurityEventType {
  // Authentication Events
  SUCCESSFUL_AUTHENTICATION = 'SUCCESSFUL_AUTHENTICATION',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_HIJACK_ATTEMPT = 'SESSION_HIJACK_ATTEMPT',
  
  // Authorization Events
  PERMISSION_VIOLATION = 'PERMISSION_VIOLATION',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
  ROLE_ESCALATION_ATTEMPT = 'ROLE_ESCALATION_ATTEMPT',
  
  // Tenant Isolation Events
  CROSS_TENANT_ACCESS_ATTEMPT = 'CROSS_TENANT_ACCESS_ATTEMPT',
  CROSS_TENANT_RESOURCE_ACCESS = 'CROSS_TENANT_RESOURCE_ACCESS',
  TENANT_BOUNDARY_VIOLATION = 'TENANT_BOUNDARY_VIOLATION',
  
  // Suspicious Activity
  MULTIPLE_FAILED_LOGINS = 'MULTIPLE_FAILED_LOGINS',
  SUSPICIOUS_CONCURRENT_SESSIONS = 'SUSPICIOUS_CONCURRENT_SESSIONS',
  SUSPICIOUS_IP_ACTIVITY = 'SUSPICIOUS_IP_ACTIVITY',
  UNUSUAL_ACCESS_PATTERN = 'UNUSUAL_ACCESS_PATTERN',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  
  // Data Access Events
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  BULK_DATA_EXPORT = 'BULK_DATA_EXPORT',
  UNAUTHORIZED_DATA_MODIFICATION = 'UNAUTHORIZED_DATA_MODIFICATION',
  
  // System Events
  API_RATE_LIMIT_EXCEEDED = 'API_RATE_LIMIT_EXCEEDED',
  UNUSUAL_API_USAGE = 'UNUSUAL_API_USAGE',
  SYSTEM_INTRUSION_ATTEMPT = 'SYSTEM_INTRUSION_ATTEMPT'
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  email?: string;
  tenantId?: string;
  businessId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  timestamp: Date;
  requestPath?: string;
  requestMethod?: string;
  responseStatus?: number;
}

export interface ThreatAnalysis {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  indicators: string[];
  recommendedActions: string[];
  shouldBlock: boolean;
}

/**
 * Central security event logging system
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private alertThresholds = new Map<SecurityEventType, number>();
  private ipTracker = new Map<string, { attempts: number; lastAttempt: Date }>();

  private constructor() {
    this.initializeAlertThresholds();
  }

  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  private initializeAlertThresholds(): void {
    this.alertThresholds.set(SecurityEventType.AUTHENTICATION_FAILURE, 5);
    this.alertThresholds.set(SecurityEventType.CROSS_TENANT_ACCESS_ATTEMPT, 1);
    this.alertThresholds.set(SecurityEventType.PERMISSION_VIOLATION, 3);
    this.alertThresholds.set(SecurityEventType.BRUTE_FORCE_ATTEMPT, 10);
  }

  /**
   * Logs a security event with real-time threat analysis
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Perform real-time threat analysis
      const threatAnalysis = await this.analyzeEvent(event);
      
      // Store the event in the database
      const { error } = await supabase
        .from('security_audit_log')
        .insert({
          event_type: event.type,
          severity: event.severity,
          user_id: event.userId,
          email: event.email,
          tenant_id: event.tenantId,
          business_id: event.businessId,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          request_path: event.requestPath,
          request_method: event.requestMethod,
          response_status: event.responseStatus,
          details: JSON.stringify(event.details),
          risk_score: threatAnalysis.riskScore,
          risk_level: threatAnalysis.riskLevel,
          created_at: event.timestamp.toISOString()
        });

      if (error) {
        console.error('Failed to log security event:', error);
        return;
      }

      // Check if immediate action is required
      if (threatAnalysis.shouldBlock) {
        await this.handleCriticalThreat(event, threatAnalysis);
      }

      // Check for alert thresholds
      await this.checkAlertThresholds(event);

      // Log to console for immediate visibility
      if (event.severity === SecuritySeverity.HIGH || event.severity === SecuritySeverity.CRITICAL) {
        console.error('SECURITY ALERT:', {
          type: event.type,
          severity: event.severity,
          userId: event.userId,
          ipAddress: event.ipAddress,
          details: event.details,
          threatAnalysis
        });
      }

    } catch (error) {
      console.error('Error in security monitoring:', error);
    }
  }

  /**
   * Analyzes security events for threat patterns
   */
  private async analyzeEvent(event: SecurityEvent): Promise<ThreatAnalysis> {
    let riskScore = this.getBaseRiskScore(event.type);
    const indicators: string[] = [];
    const recommendedActions: string[] = [];

    // IP-based analysis
    if (event.ipAddress !== 'unknown') {
      const ipActivity = await this.analyzeIPActivity(event.ipAddress, event.type);
      riskScore += ipActivity.riskIncrease;
      indicators.push(...ipActivity.indicators);
    }

    // User-based analysis
    if (event.userId) {
      const userActivity = await this.analyzeUserActivity(event.userId, event.type);
      riskScore += userActivity.riskIncrease;
      indicators.push(...userActivity.indicators);
    }

    // Time-based analysis
    const timeRisk = this.analyzeTimePatterns(event.timestamp);
    riskScore += timeRisk.riskIncrease;
    indicators.push(...timeRisk.indicators);

    // Determine risk level and actions
    const analysis = this.determineRiskLevel(riskScore);
    
    return {
      riskScore: Math.min(riskScore, 100),
      riskLevel: analysis.level,
      indicators,
      recommendedActions: analysis.actions,
      shouldBlock: analysis.shouldBlock
    };
  }

  /**
   * Analyzes IP address activity patterns
   */
  private async analyzeIPActivity(
    ipAddress: string, 
    eventType: SecurityEventType
  ): Promise<{ riskIncrease: number; indicators: string[] }> {
    const indicators: string[] = [];
    let riskIncrease = 0;

    // Check recent activity from this IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentEvents, error } = await supabase
      .from('security_audit_log')
      .select('event_type, created_at, severity')
      .eq('ip_address', ipAddress)
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !recentEvents) {
      return { riskIncrease: 0, indicators };
    }

    // Count failed authentication attempts
    const failedAttempts = recentEvents.filter(e => 
      e.event_type === SecurityEventType.AUTHENTICATION_FAILURE
    ).length;

    if (failedAttempts >= 10) {
      riskIncrease += 30;
      indicators.push(`${failedAttempts} failed authentication attempts from IP in last hour`);
    } else if (failedAttempts >= 5) {
      riskIncrease += 15;
      indicators.push(`${failedAttempts} failed authentication attempts from IP`);
    }

    // Check for multiple event types (suspicious diversity)
    const uniqueEventTypes = new Set(recentEvents.map(e => e.event_type));
    if (uniqueEventTypes.size >= 5) {
      riskIncrease += 20;
      indicators.push('Diverse suspicious activity patterns from IP');
    }

    // Check for rapid-fire requests
    const rapidRequests = recentEvents.filter(e => 
      new Date(e.created_at).getTime() > Date.now() - 5 * 60 * 1000
    ).length;

    if (rapidRequests >= 20) {
      riskIncrease += 25;
      indicators.push('Rapid-fire requests indicating potential automation');
    }

    return { riskIncrease, indicators };
  }

  /**
   * Analyzes user-specific activity patterns
   */
  private async analyzeUserActivity(
    userId: string, 
    eventType: SecurityEventType
  ): Promise<{ riskIncrease: number; indicators: string[] }> {
    const indicators: string[] = [];
    let riskIncrease = 0;

    // Check recent user activity
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { data: userEvents, error } = await supabase
      .from('security_audit_log')
      .select('event_type, created_at, ip_address, severity')
      .eq('user_id', userId)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !userEvents) {
      return { riskIncrease: 0, indicators };
    }

    // Check for multiple IP addresses (possible account compromise)
    const uniqueIPs = new Set(userEvents.map(e => e.ip_address));
    if (uniqueIPs.size >= 5) {
      riskIncrease += 25;
      indicators.push(`User accessed from ${uniqueIPs.size} different IP addresses`);
    }

    // Check for privilege escalation attempts
    const escalationAttempts = userEvents.filter(e => 
      e.event_type === SecurityEventType.ROLE_ESCALATION_ATTEMPT ||
      e.event_type === SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT
    ).length;

    if (escalationAttempts >= 3) {
      riskIncrease += 30;
      indicators.push('Multiple privilege escalation attempts');
    }

    // Check for unusual access patterns
    const offHoursActivity = userEvents.filter(e => {
      const hour = new Date(e.created_at).getHours();
      return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
    }).length;

    if (offHoursActivity >= 10) {
      riskIncrease += 15;
      indicators.push('Significant off-hours activity');
    }

    return { riskIncrease, indicators };
  }

  /**
   * Analyzes time-based patterns for suspicious activity
   */
  private analyzeTimePatterns(timestamp: Date): { riskIncrease: number; indicators: string[] } {
    const indicators: string[] = [];
    let riskIncrease = 0;

    const hour = timestamp.getHours();
    const day = timestamp.getDay();

    // Weekend activity
    if (day === 0 || day === 6) {
      riskIncrease += 5;
      indicators.push('Weekend activity');
    }

    // Late night/early morning activity
    if (hour < 5 || hour > 23) {
      riskIncrease += 10;
      indicators.push('Off-hours activity');
    }

    return { riskIncrease, indicators };
  }

  /**
   * Gets base risk score for different event types
   */
  private getBaseRiskScore(eventType: SecurityEventType): number {
    const baseScores: Record<SecurityEventType, number> = {
      [SecurityEventType.SUCCESSFUL_AUTHENTICATION]: 0,
      [SecurityEventType.AUTHENTICATION_FAILURE]: 10,
      [SecurityEventType.TOKEN_EXPIRED]: 5,
      [SecurityEventType.INVALID_TOKEN]: 15,
      [SecurityEventType.SESSION_HIJACK_ATTEMPT]: 40,
      [SecurityEventType.PERMISSION_VIOLATION]: 20,
      [SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT]: 25,
      [SecurityEventType.ROLE_ESCALATION_ATTEMPT]: 35,
      [SecurityEventType.CROSS_TENANT_ACCESS_ATTEMPT]: 50,
      [SecurityEventType.CROSS_TENANT_RESOURCE_ACCESS]: 45,
      [SecurityEventType.TENANT_BOUNDARY_VIOLATION]: 40,
      [SecurityEventType.MULTIPLE_FAILED_LOGINS]: 30,
      [SecurityEventType.SUSPICIOUS_CONCURRENT_SESSIONS]: 25,
      [SecurityEventType.SUSPICIOUS_IP_ACTIVITY]: 25,
      [SecurityEventType.UNUSUAL_ACCESS_PATTERN]: 20,
      [SecurityEventType.BRUTE_FORCE_ATTEMPT]: 35,
      [SecurityEventType.SENSITIVE_DATA_ACCESS]: 15,
      [SecurityEventType.BULK_DATA_EXPORT]: 25,
      [SecurityEventType.UNAUTHORIZED_DATA_MODIFICATION]: 30,
      [SecurityEventType.API_RATE_LIMIT_EXCEEDED]: 15,
      [SecurityEventType.UNUSUAL_API_USAGE]: 20,
      [SecurityEventType.SYSTEM_INTRUSION_ATTEMPT]: 50
    };

    return baseScores[eventType] || 10;
  }

  /**
   * Determines risk level and recommended actions
   */
  private determineRiskLevel(riskScore: number): {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    actions: string[];
    shouldBlock: boolean;
  } {
    if (riskScore >= 80) {
      return {
        level: 'CRITICAL',
        actions: [
          'Block user account immediately',
          'Invalidate all user sessions',
          'Alert security team',
          'Initiate incident response'
        ],
        shouldBlock: true
      };
    } else if (riskScore >= 60) {
      return {
        level: 'HIGH',
        actions: [
          'Require additional authentication',
          'Temporarily restrict access',
          'Alert security team',
          'Monitor closely'
        ],
        shouldBlock: false
      };
    } else if (riskScore >= 30) {
      return {
        level: 'MEDIUM',
        actions: [
          'Log detailed activity',
          'Increase monitoring',
          'Review access patterns'
        ],
        shouldBlock: false
      };
    } else {
      return {
        level: 'LOW',
        actions: ['Standard monitoring'],
        shouldBlock: false
      };
    }
  }

  /**
   * Handles critical security threats
   */
  private async handleCriticalThreat(event: SecurityEvent, analysis: ThreatAnalysis): Promise<void> {
    console.error('CRITICAL SECURITY THREAT DETECTED:', {
      event,
      analysis,
      timestamp: new Date().toISOString()
    });

    // In a production environment, this would:
    // 1. Send alerts to security team
    // 2. Potentially block the user/IP
    // 3. Trigger automated incident response
    // 4. Create support tickets
    
    // For now, just log the critical event
    try {
      await supabase
        .from('security_incidents')
        .insert({
          event_type: event.type,
          severity: 'CRITICAL',
          user_id: event.userId,
          ip_address: event.ipAddress,
          risk_score: analysis.riskScore,
          indicators: JSON.stringify(analysis.indicators),
          recommended_actions: JSON.stringify(analysis.recommendedActions),
          status: 'OPEN',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to create security incident:', error);
    }
  }

  /**
   * Checks if alert thresholds have been exceeded
   */
  private async checkAlertThresholds(event: SecurityEvent): Promise<void> {
    const threshold = this.alertThresholds.get(event.type);
    if (!threshold) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentEvents, error } = await supabase
      .from('security_audit_log')
      .select('id')
      .eq('event_type', event.type)
      .gte('created_at', oneHourAgo.toISOString());

    if (error || !recentEvents) return;

    if (recentEvents.length >= threshold) {
      await this.triggerSecurityAlert(event.type, recentEvents.length, threshold);
    }
  }

  /**
   * Triggers security alerts when thresholds are exceeded
   */
  private async triggerSecurityAlert(
    eventType: SecurityEventType,
    count: number,
    threshold: number
  ): Promise<void> {
    console.warn(`SECURITY ALERT: ${eventType} threshold exceeded. Count: ${count}, Threshold: ${threshold}`);
    
    // In production, this would send notifications to security team
    try {
      await supabase
        .from('security_alerts')
        .insert({
          alert_type: 'THRESHOLD_EXCEEDED',
          event_type: eventType,
          count,
          threshold,
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  }
}

/**
 * Convenience function to log security events
 */
export async function logSecurityEvent(
  type: SecurityEventType,
  details: Record<string, any>,
  session?: ValidatedSession,
  request?: any
): Promise<void> {
  const monitor = SecurityMonitor.getInstance();
  
  const event: SecurityEvent = {
    type,
    severity: getSeverityForEventType(type),
    userId: session?.userId,
    email: session?.email,
    tenantId: session?.tenantId,
    businessId: session?.businessId,
    ipAddress: request ? getClientIP(request) : 'unknown',
    userAgent: request ? (request.headers?.get('user-agent') || 'unknown') : 'unknown',
    details,
    timestamp: new Date(),
    requestPath: request?.url,
    requestMethod: request?.method
  };

  await monitor.logSecurityEvent(event);
}

/**
 * Gets default severity for event types
 */
function getSeverityForEventType(type: SecurityEventType): SecuritySeverity {
  const severityMap: Record<SecurityEventType, SecuritySeverity> = {
    [SecurityEventType.SUCCESSFUL_AUTHENTICATION]: SecuritySeverity.LOW,
    [SecurityEventType.AUTHENTICATION_FAILURE]: SecuritySeverity.MEDIUM,
    [SecurityEventType.TOKEN_EXPIRED]: SecuritySeverity.LOW,
    [SecurityEventType.INVALID_TOKEN]: SecuritySeverity.MEDIUM,
    [SecurityEventType.SESSION_HIJACK_ATTEMPT]: SecuritySeverity.CRITICAL,
    [SecurityEventType.PERMISSION_VIOLATION]: SecuritySeverity.MEDIUM,
    [SecurityEventType.UNAUTHORIZED_ACCESS_ATTEMPT]: SecuritySeverity.HIGH,
    [SecurityEventType.ROLE_ESCALATION_ATTEMPT]: SecuritySeverity.HIGH,
    [SecurityEventType.CROSS_TENANT_ACCESS_ATTEMPT]: SecuritySeverity.CRITICAL,
    [SecurityEventType.CROSS_TENANT_RESOURCE_ACCESS]: SecuritySeverity.CRITICAL,
    [SecurityEventType.TENANT_BOUNDARY_VIOLATION]: SecuritySeverity.CRITICAL,
    [SecurityEventType.MULTIPLE_FAILED_LOGINS]: SecuritySeverity.HIGH,
    [SecurityEventType.SUSPICIOUS_CONCURRENT_SESSIONS]: SecuritySeverity.HIGH,
    [SecurityEventType.SUSPICIOUS_IP_ACTIVITY]: SecuritySeverity.HIGH,
    [SecurityEventType.UNUSUAL_ACCESS_PATTERN]: SecuritySeverity.MEDIUM,
    [SecurityEventType.BRUTE_FORCE_ATTEMPT]: SecuritySeverity.HIGH,
    [SecurityEventType.SENSITIVE_DATA_ACCESS]: SecuritySeverity.MEDIUM,
    [SecurityEventType.BULK_DATA_EXPORT]: SecuritySeverity.HIGH,
    [SecurityEventType.UNAUTHORIZED_DATA_MODIFICATION]: SecuritySeverity.HIGH,
    [SecurityEventType.API_RATE_LIMIT_EXCEEDED]: SecuritySeverity.MEDIUM,
    [SecurityEventType.UNUSUAL_API_USAGE]: SecuritySeverity.MEDIUM,
    [SecurityEventType.SYSTEM_INTRUSION_ATTEMPT]: SecuritySeverity.CRITICAL
  };

  return severityMap[type] || SecuritySeverity.MEDIUM;
}

/**
 * Extracts client IP address from request headers
 */
function getClientIP(request: any): string {
  if (!request?.headers) return 'unknown';
  
  const forwarded = request.headers.get?.('x-forwarded-for') || request.headers['x-forwarded-for'];
  const realIP = request.headers.get?.('x-real-ip') || request.headers['x-real-ip'];
  const cfConnectingIP = request.headers.get?.('cf-connecting-ip') || request.headers['cf-connecting-ip'];
  
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP.trim();
  }
  
  if (cfConnectingIP) {
    return Array.isArray(cfConnectingIP) ? cfConnectingIP[0] : cfConnectingIP.trim();
  }
  
  return 'unknown';
}