import { query } from '@anthropic-ai/claude-agent-sdk';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;

if (!ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

// Skills are loaded from .claude/skills/ directory
// The SDK will discover them when settingSources includes 'project'
const skillsDir = path.join(__dirname, '../.claude/skills');
console.log(`Skills will be loaded from: ${skillsDir}`);

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

        // Use query() to interact with Claude with our custom skills
        // Skills are loaded from .claude/skills/ when settingSources includes 'project'
        const result = query({
          prompt: message,
          options: {
            permissionMode: 'bypassPermissions',
            allowDangerouslySkipPermissions: true,
            settingSources: ['project']  // Enable loading skills from .claude/skills/
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
    const availableSkills = [
      { name: 'greeting', description: 'Generate a friendly greeting message' },
      { name: 'calculator', description: 'Perform basic arithmetic operations' },
      { name: 'dice-roller', description: 'Roll virtual dice in various combinations' },
      { name: 'unit-converter', description: 'Convert between different units of measurement' },
      { name: 'joke-generator', description: 'Generate jokes from various categories' }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ skills: availableSkills }));
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