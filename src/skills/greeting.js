/**
 * A simple greeting skill that responds with a friendly message
 */
export const greetingSkill = {
  name: 'greeting',
  description: 'Greets the user with a friendly message',

  async execute({ name = 'friend' }) {
    return {
      message: `Hello, ${name}! I'm a simple agent with skills. How can I help you today?`,
      timestamp: new Date().toISOString()
    };
  }
};
