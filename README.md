# Simple Agent Demo

A minimal demonstration of an agent using the Claude Agent SDK with SKILL.md files, deployable to DigitalOcean.

## Features

- Simple HTTP API server
- Five example skills using the official SKILL.md format:
  - **greeting** - Generate friendly greetings
  - **calculator** - Perform arithmetic operations
  - **dice-roller** - Roll dice (1d20, 3d6+4, etc.)
  - **unit-converter** - Convert units (temperature, distance, weight, volume)
  - **joke-generator** - Tell jokes from various categories
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
      "description": "Generate a friendly greeting message"
    },
    {
      "name": "calculator",
      "description": "Perform basic arithmetic operations"
    },
    {
      "name": "dice-roller",
      "description": "Roll virtual dice in various combinations"
    },
    {
      "name": "unit-converter",
      "description": "Convert between different units of measurement"
    },
    {
      "name": "joke-generator",
      "description": "Generate jokes from various categories"
    }
  ]
}
```

### POST /agent
Interact with the agent using natural language.

**Request:**
```json
{
  "message": "Can you roll 3d6 for me?"
}
```

**Request:**
```json
{
  "message": "What's 125 divided by 5?"
}
```

**Request:**
```json
{
  "message": "Convert 100 celsius to fahrenheit"
}
```

**Request:**
```json
{
  "message": "Tell me a programming joke"
}
```

## Usage Examples

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# List skills
curl http://localhost:3000/skills

# Ask the agent to use a skill
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"Greet me please!"}'

# Use calculator
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"What is 7 times 6?"}'

# Roll dice
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"Roll 2d20+5 for me"}'

# Convert units
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"Convert 5 miles to kilometers"}'

# Get a joke
curl -X POST http://localhost:3000/agent \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me a dad joke"}'
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
├── .claude/
│   └── skills/           # Skills directory (Claude Code format)
│       ├── calculator/
│       │   └── SKILL.md
│       ├── greeting/
│       │   └── SKILL.md
│       ├── dice-roller/
│       │   └── SKILL.md
│       ├── unit-converter/
│       │   └── SKILL.md
│       └── joke-generator/
│           └── SKILL.md
├── .do/
│   └── app.yaml          # DigitalOcean App Platform config
├── src/
│   └── index.js          # Main application
├── .env.example          # Environment template
├── .gitignore
├── Dockerfile            # Docker configuration
├── package.json
└── README.md
```

## Adding New Skills

Skills use the official Claude Code SKILL.md format. Create a new directory in `.claude/skills/` with a `SKILL.md` file:

```markdown
# My Skill

Brief description of what this skill does.

## Usage

Call this skill to do something:
- `/my-skill arg1 arg2`

## Examples

\```
User: /my-skill hello
Result: Processed 'hello'
\```

## Instructions

When this skill is invoked:

1. Parse the arguments
2. Perform the operation
3. Return the result in a clear format
```

The skill will be automatically discovered by Claude Code when the agent starts.

For more information on the SKILL.md format, see: https://code.claude.com/docs/en/skills

## Cost Estimation

DigitalOcean App Platform pricing:
- Basic XXS: $5/month (512 MB RAM, 1 vCPU)
- Includes 100 GB bandwidth

Note: You'll also incur Anthropic API usage costs based on your usage.

## License

MIT
