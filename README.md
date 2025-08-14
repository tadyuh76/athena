# Athena - Blog Platform

A modern full-stack blog platform built with TypeScript, Node.js (without Express), Supabase, and Bootstrap.

## Features

- 🚀 **Modern Stack**: TypeScript, Node.js, Supabase
- 🎨 **Beautiful UI**: Bootstrap 5 with custom styling
- 📝 **Post Management**: Create and view blog posts
- 🔄 **Real-time**: Live data fetching and updates
- 🌱 **Database Seeding**: Sample data for testing

## Tech Stack

### Backend

- **Node.js** - Runtime environment (without Express)
- **TypeScript** - Type-safe JavaScript
- **Supabase** - PostgreSQL database with JavaScript client

### Frontend

- **HTML5 & CSS3** - Modern web standards
- **TypeScript** - Type-safe frontend development
- **Bootstrap 5** - Responsive UI framework
- **Vite** - Fast build tool and dev server

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Supabase Configuration

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy the project URL and anon key
3. In the backend directory, copy `.env.example` to `.env`:

```bash
cd backend
cp .env.example .env
```

4. Update the `.env` file with your Supabase credentials:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
PORT=3001
```

### 3. Database Setup

```bash
# Seed the database with sample data
npm run db:seed
```

### 4. Start Development Servers

From the root directory:

```bash
# Start both frontend and backend concurrently
npm run dev
```

Or start them separately:

```bash
# Backend (from backend directory)
cd backend
npm run dev

# Frontend (from frontend directory)
cd frontend
npm run dev
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## API Endpoints

| Method | Endpoint         | Description         |
| ------ | ---------------- | ------------------- |
| GET    | `/api/posts`     | Get all posts       |
| POST   | `/api/posts`     | Create a new post   |
| GET    | `/api/posts/:id` | Get a specific post |
| GET    | `/api/health`    | Health check        |

## Project Structure

```
athena/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── index.ts        # Main server file
│   │   └── seed.ts         # Database seeding
│   └── package.json
├── frontend/               # Frontend application
│   ├── src/
│   │   ├── main.ts         # Main TypeScript entry
│   │   ├── style.css       # Custom styles
│   │   ├── services/       # API services
│   │   └── components/     # UI components
│   ├── index.html          # Main HTML file
│   └── package.json
└── package.json           # Root package.json
```

## Database Schema

The application uses a simple `posts` table:

```sql
CREATE TABLE posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Development

### Adding New Features

1. **Backend**: Add new routes in `backend/src/index.ts`
2. **Frontend**: Create new components in `frontend/src/components/`
3. **Database**: Create migrations directly in Supabase dashboard or via SQL

### Building for Production

```bash
# Build both frontend and backend
npm run build

# Or build separately
cd backend && npm run build
cd frontend && npm run build
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**: Check your Supabase credentials in `.env`
2. **CORS Issues**: Ensure the backend CORS configuration allows your frontend URL
3. **TypeScript Errors**: Check that all dependencies are properly installed

### Getting Help

- Check the console for error messages
- Verify all environment variables are set correctly
- Ensure all dependencies are installed
- Check that both servers are running on the correct ports

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
# athena
