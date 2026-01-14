/**
 * A simple calculator skill that performs basic math operations
 */
export const calculatorSkill = {
  name: 'calculator',
  description: 'Performs basic math operations (add, subtract, multiply, divide)',

  async execute({ operation, a, b }) {
    const num1 = parseFloat(a);
    const num2 = parseFloat(b);

    if (isNaN(num1) || isNaN(num2)) {
      return { error: 'Invalid numbers provided' };
    }

    let result;
    switch (operation) {
      case 'add':
        result = num1 + num2;
        break;
      case 'subtract':
        result = num1 - num2;
        break;
      case 'multiply':
        result = num1 * num2;
        break;
      case 'divide':
        if (num2 === 0) {
          return { error: 'Cannot divide by zero' };
        }
        result = num1 / num2;
        break;
      default:
        return { error: 'Unknown operation. Use: add, subtract, multiply, or divide' };
    }

    return {
      operation,
      a: num1,
      b: num2,
      result
    };
  }
};
