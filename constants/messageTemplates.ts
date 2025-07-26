import { MessageTemplate } from '@/components/dashboard/messages/MessageTemplates'

/**
 * Helper function to validate template consistency
 * Ensures that the variables array matches the placeholders found in the content string
 */
export function validateTemplate(template: MessageTemplate): boolean {
  if (!template.variables || template.variables.length === 0) {
    // If no variables declared, content should have no placeholders
    const placeholders = template.content.match(/\{(\w+)\}/g) || [];
    return placeholders.length === 0;
  }
  
  const placeholders = template.content.match(/\{(\w+)\}/g) || [];
  const foundVariables = placeholders.map(p => p.slice(1, -1));
  
  // Check exact match: same variables in both sets
  return template.variables.length === foundVariables.length &&
         template.variables.every(v => foundVariables.includes(v)) &&
         foundVariables.every(v => template.variables!.includes(v));
}

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

// Validate all default templates at module load time
DEFAULT_MESSAGE_TEMPLATES.forEach(template => {
  if (!validateTemplate(template)) {
    console.warn(`Template "${template.name}" has inconsistent variables:`, template);
  }
});