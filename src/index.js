import { query, createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import http from 'http';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

// Define skills as MCP tools
const greetingTool = tool(
  'greeting',
  'Generate a friendly greeting message',
  {
    name: z.string().describe('The name of the person to greet')
  },
  async ({ name }) => {
    return {
      content: [{
        type: 'text',
        text: `Hello, ${name}! Welcome to the Simple Agent Demo!`
      }]
    };
  }
);

const calculatorTool = tool(
  'calculator',
  'Perform basic arithmetic operations',
  {
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('The operation to perform'),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number')
  },
  async ({ operation, a, b }) => {
    let result;
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) {
          return {
            content: [{ type: 'text', text: 'Error: Division by zero' }],
            isError: true
          };
        }
        result = a / b;
        break;
    }
    return {
      content: [{
        type: 'text',
        text: `Result: ${a} ${operation} ${b} = ${result}`
      }]
    };
  }
);

// Create MCP server with tools
const mcpServer = createSdkMcpServer({
  name: 'simple-agent-demo-server',
  version: '1.0.0',
  tools: [greetingTool, calculatorTool]
});

// Simple HTTP server to handle requests
const server = http.createServer(async (req, res) => {
  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
    return;
  }

  // Agent endpoint
  if (req.url === '/agent' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { message } = JSON.parse(body);

        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'message field is required' }));
          return;
        }

        // Use query() to interact with Claude with our custom tools
        const result = query({
          prompt: message,
          options: {
            mcpServers: {
              'simple-agent-demo': mcpServer
            },
            permissionMode: 'bypassPermissions',
            allowDangerouslySkipPermissions: true
          }
        });

        // Collect all messages from the async generator
        const messages = [];
        let finalResult = null;

        for await (const msg of result) {
          messages.push(msg);
          if (msg.type === 'result') {
            finalResult = msg;
          }
        }

        if (finalResult && finalResult.subtype === 'success') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            response: finalResult.result,
            usage: finalResult.usage,
            cost_usd: finalResult.total_cost_usd
          }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: finalResult?.errors || ['Unknown error occurred']
          }));
        }
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // List skills endpoint
  if (req.url === '/skills' && req.method === 'GET') {
    const skills = [
      { name: 'greeting', description: 'Generate a friendly greeting message' },
      { name: 'calculator', description: 'Perform basic arithmetic operations' }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ skills }));
    return;
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not found',
    availableEndpoints: [
      'GET /health',
      'GET /skills',
      'POST /agent'
    ]
  }));
});

server.listen(PORT, () => {
  console.log(`Simple Agent Demo running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /health - Health check`);
  console.log(`  GET  /skills - List available skills`);
  console.log(`  POST /agent  - Interact with agent`);
});
