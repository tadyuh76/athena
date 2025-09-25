# Vercel Deployment Guide

This project has been configured to deploy on Vercel as serverless functions while maintaining local development capabilities.

## Prerequisites

1. A Vercel account
2. Vercel CLI installed (optional): `npm i -g vercel`
3. Supabase project with database configured

## Environment Variables

Set these environment variables in your Vercel project:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key  
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

Note: The frontend automatically detects the environment:
- In production (Vercel): Uses the deployment URL (e.g., https://ueh-athena.vercel.app)
- In development: Uses localhost:3000
- The API URL is automatically configured based on the environment

## Deployment

### Using Vercel Dashboard

1. Connect your GitHub repository to Vercel
2. Configure environment variables in project settings
3. Deploy with automatic builds on push

### Using Vercel CLI

```bash
# Install dependencies
npm install

# Build the project
npm run build:vercel

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

## Local Development

The project maintains full local development capabilities:

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

This starts:
- API server on http://localhost:3001
- Static file server with proxy on http://localhost:3000

## Project Structure

```
/
├── api/                 # Vercel serverless function entry point
│   └── index.js        # Vercel handler wrapper
├── api-src/            # TypeScript API source
│   ├── src/
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth middleware
│   │   ├── utils/        # Utilities
│   │   └── serverless-handler.ts  # Serverless adapter
│   └── dist/            # Compiled JavaScript
├── public/             # Static files (HTML, CSS, JS)
├── vercel.json         # Vercel configuration
└── package.json        # Project dependencies
```

## How It Works

1. **Development Mode**: Uses the original setup with separate API and static servers
2. **Production Mode**: 
   - Vercel serves static files from `/public`
   - API requests to `/api/*` are handled by serverless functions
   - The `api/index.js` wrapper adapts Vercel's request/response to Node.js format

## Configuration Details

The `vercel.json` file:
- Builds TypeScript API before deployment
- Routes `/api/*` requests to serverless functions
- Serves static files from `/public` directory
- Sets function timeout to 30 seconds

## Database Considerations

The Supabase client is configured for serverless:
- Connection pooling via singleton pattern
- Auto-refresh and session persistence disabled
- Optimized for cold starts

## Troubleshooting

1. **Build Errors**: Ensure all TypeScript files compile: `cd api && npm run build`
2. **Runtime Errors**: Check Vercel function logs in dashboard
3. **Environment Variables**: Verify all required env vars are set in Vercel
4. **CORS Issues**: CORS headers are automatically set in the API handler