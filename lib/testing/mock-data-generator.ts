// Type definitions matching api-client.ts
interface Call {
  id: string;
  phoneNumber: string;
  customerName?: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'missed' | 'in_progress' | 'failed';
  duration: number;
  startTime: string;
  endTime?: string;
  recordingUrl?: string;
  transcript?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  summary?: string;
}

interface SMS {
  id: string;
  phoneNumber: string;
  customerName?: string;
  message: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  conversationId: string;
  status: 'sent' | 'delivered' | 'failed' | 'received';
}

interface Booking {
  id: string;
  customerName: string;
  phoneNumber: string;
  date: string;
  time: string;
  service: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
}

// Realistic barber shop data patterns based on research
const PEAK_HOURS = [10, 11, 12, 14, 15, 16]; // 10am-12pm, 2pm-4pm
const BUSY_DAYS = [5, 6]; // Friday and Saturday
const SERVICES = [
  'Haircut',
  'Beard Trim',
  'Hot Towel Shave',
  'Hair & Beard',
  'Kids Cut',
  'Senior Cut',
  'Fade Cut',
  'Line Up'
];

const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Thomas', 'Christopher', 'Daniel', 'Paul', 'Mark', 'Donald', 'George',
  'Sarah', 'Emily', 'Jessica', 'Ashley', 'Amanda', 'Jennifer', 'Michelle'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

const CALL_REASONS = [
  'Book appointment',
  'Check availability',
  'Price inquiry',
  'Hours of operation',
  'Cancel appointment',
  'Reschedule appointment',
  'Services offered',
  'Walk-in availability'
];

const SMS_TEMPLATES = [
  'Hi, do you have any openings today?',
  'Can I book a haircut for tomorrow at 2pm?',
  'Need to reschedule my appointment',
  'What time do you close today?',
  'Do you take walk-ins?',
  'How much for a fade cut?',
  'Thanks! See you at {time}',
  'Running 10 minutes late, is that ok?'
];

interface MockDataOptions {
  startDate?: Date;
  endDate?: Date;
  callCount?: number;
  smsCount?: number;
  bookingCount?: number;
  missedCallRate?: number; // Default 0.15 (15%)
  conversionRate?: number; // Default 0.35 (35% of calls result in bookings)
  cancelRate?: number; // Default 0.14 (14% cancellation rate)
}

export class MockDataGenerator {
  private usedPhoneNumbers = new Set<string>();
  private regularCustomers: Array<{ name: string; phone: string }> = [];

  constructor() {
    // Pre-generate some regular customers (30% return rate)
    for (let i = 0; i < 50; i++) {
      this.regularCustomers.push(this.generateCustomer());
    }
  }

  private generateCustomer() {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const phone = this.generatePhoneNumber();
    
    return {
      name: `${firstName} ${lastName}`,
      phone
    };
  }

  private generatePhoneNumber(): string {
    let phone: string;
    do {
      const areaCode = ['415', '510', '408', '650', '925'][Math.floor(Math.random() * 5)];
      const prefix = Math.floor(Math.random() * 900) + 100;
      const suffix = Math.floor(Math.random() * 9000) + 1000;
      phone = `+1${areaCode}${prefix}${suffix}`;
    } while (this.usedPhoneNumbers.has(phone));
    
    this.usedPhoneNumbers.add(phone);
    return phone;
  }

  private isReturnCustomer(): boolean {
    return Math.random() < 0.3; // 30% chance of return customer
  }

  private getCustomer() {
    if (this.isReturnCustomer() && this.regularCustomers.length > 0) {
      return this.regularCustomers[Math.floor(Math.random() * this.regularCustomers.length)];
    }
    return this.generateCustomer();
  }

  private generateCallDuration(status: string): number {
    if (status === 'missed') return 0;
    
    // Average call duration: 45-180 seconds for bookings, 20-60 for inquiries
    const isBookingCall = Math.random() < 0.35; // 35% conversion rate
    
    if (isBookingCall) {
      return Math.floor(Math.random() * 135) + 45; // 45-180 seconds
    }
    return Math.floor(Math.random() * 40) + 20; // 20-60 seconds
  }

  private generateTimestamp(date: Date, isPeakHours = false): Date {
    const timestamp = new Date(date);
    
    // Business hours: 9am - 7pm
    let hour: number;
    if (isPeakHours) {
      hour = PEAK_HOURS[Math.floor(Math.random() * PEAK_HOURS.length)];
    } else {
      hour = Math.floor(Math.random() * 10) + 9; // 9am-7pm
    }
    
    const minute = Math.floor(Math.random() * 60);
    timestamp.setHours(hour, minute, Math.floor(Math.random() * 60));
    
    return timestamp;
  }

  generateCalls(options: MockDataOptions = {}): Call[] {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      callCount = 1000,
      missedCallRate = 0.15
    } = options;

    const calls: Call[] = [];
    const dayRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const callsPerDay = Math.ceil(callCount / dayRange);

    for (let dayOffset = 0; dayOffset < dayRange; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      
      const dayOfWeek = currentDate.getDay();
      const isBusyDay = BUSY_DAYS.includes(dayOfWeek);
      const dailyCalls = isBusyDay ? callsPerDay * 1.5 : callsPerDay;

      for (let i = 0; i < dailyCalls; i++) {
        const customer = this.getCustomer();
        const isMissed = Math.random() < missedCallRate;
        const status = isMissed ? 'missed' : 'completed';
        const isPeak = Math.random() < 0.6; // 60% of calls during peak hours
        
        const startTime = this.generateTimestamp(currentDate, isPeak);
        const duration = this.generateCallDuration(status);
        const endTime = new Date(startTime.getTime() + duration * 1000);

        const call: Call = {
          id: `call-${calls.length + 1}`,
          phoneNumber: customer.phone,
          customerName: customer.name,
          direction: 'inbound',
          status: status as any,
          duration,
          startTime: startTime.toISOString(),
          endTime: duration > 0 ? endTime.toISOString() : undefined,
          summary: isMissed ? undefined : CALL_REASONS[Math.floor(Math.random() * CALL_REASONS.length)]
        };

        calls.push(call);
      }
    }

    return calls.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  generateSMS(options: MockDataOptions = {}): SMS[] {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      smsCount = 500
    } = options;

    const messages: SMS[] = [];
    const conversations = new Map<string, string>(); // phone -> conversationId

    for (let i = 0; i < smsCount; i++) {
      const customer = this.getCustomer();
      const timestamp = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      );

      // Get or create conversation ID
      let conversationId = conversations.get(customer.phone);
      if (!conversationId) {
        conversationId = `conv-${conversations.size + 1}`;
        conversations.set(customer.phone, conversationId);
      }

      const isInbound = Math.random() < 0.6; // 60% inbound
      const template = SMS_TEMPLATES[Math.floor(Math.random() * SMS_TEMPLATES.length)];
      const message = template.replace('{time}', 
        `${Math.floor(Math.random() * 4) + 1}:${Math.random() < 0.5 ? '00' : '30'}pm`
      );

      const sms: SMS = {
        id: `sms-${i + 1}`,
        phoneNumber: customer.phone,
        customerName: customer.name,
        message,
        direction: isInbound ? 'inbound' : 'outbound',
        timestamp: timestamp.toISOString(),
        conversationId,
        status: isInbound ? 'received' : 'delivered'
      };

      messages.push(sms);
    }

    return messages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  generateBookings(options: MockDataOptions = {}): Booking[] {
    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days future
      bookingCount = 200,
      cancelRate = 0.14
    } = options;

    const bookings: Booking[] = [];
    const dayRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const bookingsPerDay = Math.ceil(bookingCount / dayRange);

    for (let dayOffset = 0; dayOffset < dayRange; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      
      const dayOfWeek = currentDate.getDay();
      const isBusyDay = BUSY_DAYS.includes(dayOfWeek);
      const dailyBookings = isBusyDay ? bookingsPerDay * 1.5 : bookingsPerDay;

      for (let i = 0; i < dailyBookings; i++) {
        const customer = this.getCustomer();
        const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
        const isPeak = Math.random() < 0.7; // 70% during peak hours
        
        const bookingTime = this.generateTimestamp(currentDate, isPeak);
        const isCancelled = Math.random() < cancelRate;
        const isPast = bookingTime < new Date();
        
        let status: 'confirmed' | 'pending' | 'cancelled';
        if (isCancelled) {
          status = 'cancelled';
        } else if (isPast) {
          status = 'confirmed';
        } else {
          status = Math.random() < 0.8 ? 'confirmed' : 'pending';
        }

        const booking: Booking = {
          id: `booking-${bookings.length + 1}`,
          customerName: customer.name,
          phoneNumber: customer.phone,
          date: bookingTime.toISOString().split('T')[0],
          time: bookingTime.toTimeString().slice(0, 5),
          service,
          status,
          notes: Math.random() < 0.2 ? 'First time customer' : undefined
        };

        bookings.push(booking);
      }
    }

    return bookings.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });
  }

  // Generate comprehensive test data
  generateAllData(options: MockDataOptions = {}): {
    calls: Call[];
    sms: SMS[];
    bookings: Booking[];
    stats: {
      totalCalls: number;
      missedCalls: number;
      conversionRate: number;
      peakHour: number;
      busiestDay: string;
    };
  } {
    const calls = this.generateCalls(options);
    const sms = this.generateSMS(options);
    const bookings = this.generateBookings(options);

    // Calculate stats
    const missedCalls = calls.filter(c => c.status === 'missed').length;
    const callHours = calls.map(c => new Date(c.startTime).getHours());
    const hourCounts = callHours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const peakHour = Number(Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 11);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const callDays = calls.map(c => new Date(c.startTime).getDay());
    const dayCounts = callDays.reduce((acc, day) => {
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const busiestDayIndex = Number(Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 5);
    const busiestDay = dayNames[busiestDayIndex];

    return {
      calls,
      sms,
      bookings,
      stats: {
        totalCalls: calls.length,
        missedCalls,
        conversionRate: bookings.length / (calls.length - missedCalls),
        peakHour,
        busiestDay
      }
    };
  }
}

// Export singleton instance for consistent data
export const mockDataGenerator = new MockDataGenerator();