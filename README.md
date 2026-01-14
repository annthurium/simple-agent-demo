# Simple Agent Demo

A minimal demonstration of an agent using the Claude Agent SDK with skills, deployable to DigitalOcean.

## Features

- Simple HTTP API server
- Two example skills (greeting and calculator)
- Health check endpoint
- Docker containerization
- DigitalOcean App Platform configuration

## Prerequisites

- Node.js 18+
- Anthropic API key
- DigitalOcean account (for deployment)

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
```

4. Start the server:
```bash
npm start
```

Or use watch mode for development:
```bash
npm run dev
```

## API Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-13T..."
}
```

### GET /skills
List available skills.

**Response:**
```json
{
  "skills": [
    {
      "name": "greeting",
      "description": "Greets the user with a friendly message"
    },
    {
      "name": "calculator",
      "description": "Performs basic math operations"
    }
  ]
}
```

### POST /agent
Interact with the agent.

**Request (using a skill directly):**
```json
{
  "skill": "greeting",
  "params": {
    "name": "Alice"
  }
}
```

**Request (calculator skill):**
```json
{
  "skill": "calculator",
  "params": {
    "operation": "add",
    "a": 10,
    "b": 5
  }
}
```

**Request (let agent decide):**
```json
{
  "message": "Can you greet me?"
}
```

## Usage Examples

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# List skills
curl http://localhost:3000/skills

# Use greeting skill
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"skill":"greeting","params":{"name":"Alice"}}'

# Use calculator skill
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"skill":"calculator","params":{"operation":"multiply","a":7,"b":6}}'
```

## Deploy to DigitalOcean

### Method 1: Using doctl CLI

1. Install doctl:
```bash
# macOS
brew install doctl

# Or download from https://docs.digitalocean.com/reference/doctl/how-to/install/
```

2. Authenticate:
```bash
doctl auth init
```

3. Create the app:
```bash
doctl apps create --spec .do/app.yaml
```

4. Set your API key as a secret:
```bash
doctl apps create-deployment YOUR_APP_ID --app-spec .do/app.yaml
```

Then add the secret via the DigitalOcean dashboard:
- Go to your app settings
- Navigate to "Environment Variables"
- Add `ANTHROPIC_API_KEY` with your API key value

### Method 2: Using GitHub + DigitalOcean Dashboard

1. Push this code to a GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

2. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)

3. Click "Create App"

4. Connect your GitHub repository

5. Configure the app:
   - Set the Dockerfile path: `Dockerfile`
   - Set HTTP port: `3000`
   - Add environment variable: `ANTHROPIC_API_KEY` (as secret)

6. Click "Next" and then "Create Resources"

### Method 3: Using Docker Hub

1. Build and push the Docker image:
```bash
docker build -t your-username/simple-agent-demo .
docker push your-username/simple-agent-demo
```

2. In DigitalOcean, create an app using the Docker Hub image

3. Set environment variables in the DigitalOcean dashboard

## Testing the Deployed App

Once deployed, DigitalOcean will provide you with a URL. Test it:

```bash
# Replace with your actual URL
export APP_URL=https://your-app.ondigitalocean.app

# Health check
curl $APP_URL/health

# Test calculator skill
curl -X POST $APP_URL/agent \
  -H "Content-Type: application/json" \
  -d '{"skill":"calculator","params":{"operation":"add","a":15,"b":27}}'
```

## Project Structure

```
simple-agent-demo/
├── .do/
│   └── app.yaml          # DigitalOcean App Platform config
├── src/
│   ├── skills/
│   │   ├── greeting.js   # Greeting skill
│   │   └── calculator.js # Calculator skill
│   └── index.js          # Main application
├── .env.example          # Environment template
├── .gitignore
├── Dockerfile            # Docker configuration
├── package.json
└── README.md
```

## Adding New Skills

Create a new skill in [src/skills/](src/skills/):

```javascript
export const mySkill = {
  name: 'my-skill',
  description: 'What this skill does',

  async execute(params) {
    // Your skill logic here
    return {
      result: 'some value'
    };
  }
};
```

Then import and add it to the agent in [src/index.js](src/index.js):

```javascript
import { mySkill } from './skills/my-skill.js';

const agent = new Agent({
  apiKey: ANTHROPIC_API_KEY,
  skills: [greetingSkill, calculatorSkill, mySkill]
});
```

## Cost Estimation

DigitalOcean App Platform pricing:
- Basic XXS: $5/month (512 MB RAM, 1 vCPU)
- Includes 100 GB bandwidth

Note: You'll also incur Anthropic API usage costs based on your usage.

## License

MIT
