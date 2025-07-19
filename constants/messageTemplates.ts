import { MessageTemplate } from '@/components/dashboard/messages/MessageTemplates'

export const DEFAULT_MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: '1',
    name: 'Appointment Confirmation',
    content: 'Hi {name}, this is a reminder of your appointment tomorrow at {time}. Reply Y to confirm or N to reschedule.',
    category: 'appointment',
    variables: ['name', 'time']
  },
  {
    id: '2',
    name: 'Welcome Message',
    content: 'Welcome to our service! We\'re excited to have you. Feel free to text us anytime with questions.',
    category: 'greeting',
    isAIGenerated: true
  },
  {
    id: '3',
    name: 'Follow-up',
    content: 'Hi {name}, thank you for visiting us today! We hope you had a great experience. See you next time!',
    category: 'follow-up',
    variables: ['name']
  }
]