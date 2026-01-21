import { query } from '@anthropic-ai/claude-agent-sdk';
import http from 'http';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3000;

// Enhanced diagnostics
const API_KEY_STATUS = ANTHROPIC_API_KEY ?
  `SET (length: ${ANTHROPIC_API_KEY.length}, starts with: ${ANTHROPIC_API_KEY.substring(0, 7)}...)` :
  'NOT SET';

console.log(`[STARTUP] Environment diagnostics:`);
console.log(`[STARTUP]   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[STARTUP]   PORT: ${PORT}`);
console.log(`[STARTUP]   ANTHROPIC_API_KEY: ${API_KEY_STATUS}`);

if (!ANTHROPIC_API_KEY) {
  console.error('[STARTUP] FATAL: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

if (ANTHROPIC_API_KEY.length < 20 || !ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
  console.error('[STARTUP] WARNING: ANTHROPIC_API_KEY appears invalid (wrong format or too short)');
  console.error('[STARTUP]   Expected format: sk-ant-api03-...');
  console.error('[STARTUP]   Actual starts with: ' + ANTHROPIC_API_KEY.substring(0, 10));
}

// Skills are loaded from .claude/skills/ directory
// The SDK will discover them when settingSources includes 'project'
const skillsDir = path.join(__dirname, '../.claude/skills');
console.log(`Skills will be loaded from: ${skillsDir}`);

// Simple HTTP server to handle requests
const server = http.createServer(async (req, res) => {
  // Add CORS headers to all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve index.html for root and /index.html
  if ((req.url === '/' || req.url === '/index.html') && req.method === 'GET') {
    const indexPath = path.join(__dirname, '../public/index.html');
    try {
      const content = fs.readFileSync(indexPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to load index.html' }));
    }
    return;
  }

  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    const apiKeySet = !!process.env.ANTHROPIC_API_KEY;
    const apiKeyValid = apiKeySet &&
                        process.env.ANTHROPIC_API_KEY.length > 20 &&
                        process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      config: {
        apiKeySet,
        apiKeyValid,
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT
      }
    }));
    return;
  }

  // Agent endpoint with streaming support
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

        // Set up SSE for streaming responses
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        // Send keepalive every 10 seconds to prevent timeout
        const keepaliveInterval = setInterval(() => {
          res.write(': keepalive\n\n');
        }, 10000);

        try {
          console.log(`[AGENT] Processing request at ${new Date().toISOString()}`);
          console.log(`[AGENT] API key available: ${process.env.ANTHROPIC_API_KEY ? 'YES' : 'NO'}`);

          // Use query() to interact with Claude with our custom skills
          const result = query({
            prompt: message,
            options: {
              permissionMode: 'bypassPermissions',
              allowDangerouslySkipPermissions: true,
              settingSources: ['project']
            }
          });

          // Stream messages as they arrive
          let finalResult = null;
          let messageCount = 0;

          for await (const msg of result) {
            messageCount++;
            console.log(`[AGENT] Received message ${messageCount}, type: ${msg.type}`);

            // Send progress updates
            res.write(`data: ${JSON.stringify({ type: 'progress', message: msg })}\n\n`);

            if (msg.type === 'result') {
              finalResult = msg;
            }
          }

          console.log(`[AGENT] Query completed successfully with ${messageCount} messages`);

          // Send final result
          if (finalResult && finalResult.subtype === 'success') {
            res.write(`data: ${JSON.stringify({
              type: 'complete',
              success: true,
              response: finalResult.result,
              usage: finalResult.usage,
              cost_usd: finalResult.total_cost_usd
            })}\n\n`);
          } else {
            console.error(`[AGENT] Query failed with subtype: ${finalResult?.subtype}`);
            res.write(`data: ${JSON.stringify({
              type: 'error',
              success: false,
              error: finalResult?.errors || ['Unknown error occurred']
            })}\n\n`);
          }
        } catch (error) {
          console.error('[AGENT] Exception during query:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            timestamp: new Date().toISOString()
          });

          // Check if it's an authentication error
          const isAuthError = error.message?.toLowerCase().includes('auth') ||
                              error.message?.toLowerCase().includes('401') ||
                              error.message?.toLowerCase().includes('api key');

          if (isAuthError) {
            console.error('[AGENT] AUTHENTICATION ERROR DETECTED - Check ANTHROPIC_API_KEY configuration');
          }

          res.write(`data: ${JSON.stringify({
            type: 'error',
            success: false,
            error: error.message
          })}\n\n`);
        } finally {
          clearInterval(keepaliveInterval);
          res.end();
        }
      } catch (error) {
        console.error('Error parsing request:', error);
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
      'GET / - Web interface',
      'GET /health',
      'GET /skills',
      'POST /agent'
    ]
  }));
});

server.listen(PORT, () => {
  console.log(`Simple Agent Demo running on port ${PORT}`);
  console.log(`\nWeb interface: http://localhost:${PORT}`);
  console.log(`\nAPI endpoints:`);
  console.log(`  GET  /health - Health check`);
  console.log(`  GET  /skills - List available skills`);
  console.log(`  POST /agent  - Interact with agent`);
});