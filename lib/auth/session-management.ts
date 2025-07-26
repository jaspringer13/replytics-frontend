import { createClient } from '@supabase/supabase-js';
import { ValidatedSession } from './jwt-validation';
import { logSecurityEvent, SecurityEventType } from './security-monitoring';

// Initialize Supabase client with service role for secure operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SessionInfo {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  deviceInfo?: {
    browser: string;
    os: string;
    device: string;
  };
  location?: {
    country: string;
    city: string;
  };
}

export interface SessionSecurityMetrics {
  totalActiveSessions: number;
  uniqueIpAddresses: number;
  suspiciousConcurrentSessions: boolean;
  unusualLocationActivity: boolean;
  recentSecurityEvents: number;
  riskScore: number;
}

/**
 * Comprehensive session management with security controls
 */
export class SessionManager {
  private static readonly MAX_CONCURRENT_SESSIONS = 10;
  private static readonly SESSION_TIMEOUT_MINUTES = 60;
  private static readonly SUSPICIOUS_SESSION_THRESHOLD = 5;

  /**
   * Creates a new session record for tracking
   */
  static async createSession(
    session: ValidatedSession,
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Parse device information from user agent
      const deviceInfo = this.parseUserAgent(userAgent);

      // Create session record
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          id: sessionId,
          user_id: session.userId,
          tenant_id: session.tenantId,
          business_id: session.businessId,
          ip_address: ipAddress,
          user_agent: userAgent,
          device_browser: deviceInfo.browser,
          device_os: deviceInfo.os,
          device_type: deviceInfo.device,
          is_active: true,
          created_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + this.SESSION_TIMEOUT_MINUTES * 60 * 1000).toISOString()
        });

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }

      // Log session creation
      await logSecurityEvent(
        SecurityEventType.SUCCESSFUL_AUTHENTICATION,
        {
          sessionId,
          deviceInfo,
          ipAddress
        },
        session,
        { headers: { get: () => userAgent } }
      );

      // Check for suspicious concurrent sessions
      await this.checkConcurrentSessions(session.userId);

      return sessionId;

    } catch (error) {
      console.error('Error in session creation:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Updates session activity timestamp
   */
  static async updateSessionActivity(
    sessionId: string,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          last_activity_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + this.SESSION_TIMEOUT_MINUTES * 60 * 1000).toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error updating session activity:', error);
      }

    } catch (error) {
      console.error('Error in session activity update:', error);
    }
  }

  /**
   * Invalidates a specific session
   */
  static async invalidateSession(
    sessionId: string,
    userId: string,
    reason: string = 'manual_logout'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          end_reason: reason
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error invalidating session:', error);
        return;
      }

      // Log session invalidation
      await logSecurityEvent(
        SecurityEventType.SUCCESSFUL_AUTHENTICATION,
        {
          action: 'session_invalidated',
          sessionId,
          reason
        },
        { userId } as ValidatedSession,
        undefined
      );

    } catch (error) {
      console.error('Error in session invalidation:', error);
    }
  }

  /**
   * Invalidates all sessions for a user
   */
  static async invalidateAllUserSessions(
    userId: string,
    reason: string = 'security_precaution'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          end_reason: reason
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error invalidating all user sessions:', error);
        return;
      }

      // Log mass session invalidation
      await logSecurityEvent(
        SecurityEventType.SUCCESSFUL_AUTHENTICATION,
        {
          action: 'all_sessions_invalidated',
          reason
        },
        { userId } as ValidatedSession,
        undefined
      );

    } catch (error) {
      console.error('Error in mass session invalidation:', error);
    }
  }

  /**
   * Gets all active sessions for a user
   */
  static async getUserActiveSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false });

      if (error || !sessions) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      return sessions.map(session => ({
        id: session.id,
        userId: session.user_id,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
        isActive: session.is_active,
        createdAt: new Date(session.created_at),
        lastActivityAt: new Date(session.last_activity_at),
        expiresAt: new Date(session.expires_at),
        deviceInfo: {
          browser: session.device_browser,
          os: session.device_os,
          device: session.device_type
        }
      }));

    } catch (error) {
      console.error('Error in getting user sessions:', error);
      return [];
    }
  }

  /**
   * Gets session security metrics for a user
   */
  static async getSessionSecurityMetrics(userId: string): Promise<SessionSecurityMetrics> {
    try {
      const activeSessions = await this.getUserActiveSessions(userId);
      
      // Count unique IP addresses
      const uniqueIPs = new Set(activeSessions.map(s => s.ipAddress));
      
      // Check for suspicious concurrent sessions
      const suspiciousConcurrentSessions = activeSessions.length > this.SUSPICIOUS_SESSION_THRESHOLD;
      
      // Check for unusual location activity (simplified)
      const uniqueLocations = uniqueIPs.size;
      const unusualLocationActivity = uniqueLocations > 3; // More than 3 different IPs
      
      // Get recent security events count
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { data: securityEvents, error } = await supabase
        .from('security_audit_log')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', twentyFourHoursAgo.toISOString());

      const recentSecurityEvents = securityEvents?.length || 0;

      // Calculate risk score
      let riskScore = 0;
      if (suspiciousConcurrentSessions) riskScore += 30;
      if (unusualLocationActivity) riskScore += 20;
      if (recentSecurityEvents > 10) riskScore += 25;
      if (activeSessions.length > this.MAX_CONCURRENT_SESSIONS) riskScore += 40;

      return {
        totalActiveSessions: activeSessions.length,
        uniqueIpAddresses: uniqueIPs.size,
        suspiciousConcurrentSessions,
        unusualLocationActivity,
        recentSecurityEvents,
        riskScore: Math.min(riskScore, 100)
      };

    } catch (error) {
      console.error('Error getting session security metrics:', error);
      return {
        totalActiveSessions: 0,
        uniqueIpAddresses: 0,
        suspiciousConcurrentSessions: false,
        unusualLocationActivity: false,
        recentSecurityEvents: 0,
        riskScore: 0
      };
    }
  }

  /**
   * Validates session is still active and not compromised
   */
  static async validateSessionSecurity(
    sessionId: string,
    userId: string,
    currentIpAddress: string
  ): Promise<{ isValid: boolean; reason?: string }> {
    try {
      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error || !session) {
        return { isValid: false, reason: 'Session not found' };
      }

      // Check if session is active
      if (!session.is_active) {
        return { isValid: false, reason: 'Session is inactive' };
      }

      // Check if session has expired
      const expiresAt = new Date(session.expires_at);
      if (expiresAt < new Date()) {
        // Automatically invalidate expired session
        await this.invalidateSession(sessionId, userId, 'expired');
        return { isValid: false, reason: 'Session expired' };
      }

      // Check for IP address changes (basic security check)
      if (session.ip_address !== currentIpAddress) {
        await logSecurityEvent(
          SecurityEventType.SUSPICIOUS_IP_ACTIVITY,
          {
            sessionId,
            originalIp: session.ip_address,
            currentIp: currentIpAddress
          },
          { userId } as ValidatedSession,
          undefined
        );

        // Don't invalidate immediately, but log the event
        // In high-security environments, you might want to invalidate here
      }

      return { isValid: true };

    } catch (error) {
      console.error('Error validating session security:', error);
      return { isValid: false, reason: 'Validation error' };
    }
  }

  /**
   * Cleans up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          end_reason: 'expired'
        })
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error cleaning up expired sessions:', error);
      }

    } catch (error) {
      console.error('Error in session cleanup:', error);
    }
  }

  /**
   * Checks for suspicious concurrent sessions
   */
  private static async checkConcurrentSessions(userId: string): Promise<void> {
    try {
      const activeSessions = await this.getUserActiveSessions(userId);
      
      if (activeSessions.length > this.SUSPICIOUS_SESSION_THRESHOLD) {
        await logSecurityEvent(
          SecurityEventType.SUSPICIOUS_CONCURRENT_SESSIONS,
          {
            sessionCount: activeSessions.length,
            threshold: this.SUSPICIOUS_SESSION_THRESHOLD,
            sessions: activeSessions.map(s => ({
              id: s.id,
              ipAddress: s.ipAddress,
              createdAt: s.createdAt,
              deviceInfo: s.deviceInfo
            }))
          },
          { userId } as ValidatedSession,
          undefined
        );
      }

      // Auto-invalidate oldest sessions if exceeding maximum
      if (activeSessions.length > this.MAX_CONCURRENT_SESSIONS) {
        const sessionsToInvalidate = activeSessions
          .sort((a, b) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime())
          .slice(0, activeSessions.length - this.MAX_CONCURRENT_SESSIONS);

        for (const session of sessionsToInvalidate) {
          await this.invalidateSession(session.id, userId, 'max_sessions_exceeded');
        }
      }

    } catch (error) {
      console.error('Error checking concurrent sessions:', error);
    }
  }

  /**
   * Parses user agent string to extract device information
   */
  private static parseUserAgent(userAgent: string): { browser: string; os: string; device: string } {
    // Simplified user agent parsing
    // In production, use a proper user agent parsing library
    
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('macOS') || userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      device = 'Mobile';
    } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
      device = 'Tablet';
    }

    return { browser, os, device };
  }
}

/**
 * Middleware helper to update session activity on each request
 */
export async function updateSessionActivity(
  session: ValidatedSession,
  request: any
): Promise<void> {
  try {
    if (session.sessionId) {
      await SessionManager.updateSessionActivity(session.sessionId, session.userId);
    }
  } catch (error) {
    console.error('Error updating session activity:', error);
  }
}

/**
 * Helper to validate session security on sensitive operations
 */
export async function validateSensitiveOperation(
  session: ValidatedSession,
  operation: string,
  request: any
): Promise<boolean> {
  try {
    // Get current IP address
    const currentIp = request.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers?.get?.('x-real-ip') || 
                     'unknown';

    // Validate session security
    const validation = await SessionManager.validateSessionSecurity(
      session.sessionId,
      session.userId,
      currentIp
    );

    if (!validation.isValid) {
      await logSecurityEvent(
        SecurityEventType.SESSION_HIJACK_ATTEMPT,
        {
          operation,
          reason: validation.reason,
          sessionId: session.sessionId
        },
        session,
        request
      );

      return false;
    }

    // Log sensitive operation
    await logSecurityEvent(
      SecurityEventType.SENSITIVE_DATA_ACCESS,
      {
        operation,
        sessionId: session.sessionId
      },
      session,
      request
    );

    return true;

  } catch (error) {
    console.error('Error validating sensitive operation:', error);
    return false;
  }
}

/**
 * Schedule cleanup of expired sessions (run periodically)
 */
export function scheduleSessionCleanup(): NodeJS.Timeout {
  return setInterval(async () => {
    await SessionManager.cleanupExpiredSessions();
  }, 15 * 60 * 1000); // Every 15 minutes
}