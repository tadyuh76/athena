# Athena - Premium Eco Fashion E-commerce

A modern, minimalist e-commerce platform for sustainable luxury fashion, built with TypeScript, Node.js, and Supabase.

## Tech Stack

- **Frontend**: HTML, CSS, Bootstrap 5, TypeScript
- **Backend**: Node.js, TypeScript (without Express)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Email/Password, Google OAuth

## Features

- ✅ Email authentication with verification
- ✅ Google OAuth integration
- ✅ Password reset functionality
- ✅ User profile management
- ✅ Product catalog with filtering
- ✅ Shopping cart system
- ✅ Wishlist functionality
- ✅ Responsive design

## Project Structure

```
athena/
├── api/                 # Backend API server
│   ├── src/
│   │   ├── services/   # Business logic
│   │   ├── middleware/ # Auth middleware
│   │   └── utils/      # Helper functions
│   └── package.json
├── public/             # Frontend static files
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   ├── src/services/  # Frontend services
│   └── *.html         # HTML pages
├── database/          # Database schemas
├── server.js          # Main deployment server
└── package.json       # Monorepo configuration
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd athena
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google OAuth (from Supabase dashboard)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Set up Supabase

1. Create a new Supabase project
2. Run the database schema from `database/athena_schema_supabase.sql`
3. Enable Google OAuth provider in Authentication settings
4. Add redirect URL: `http://localhost:3000/auth/callback`

### 5. Run the development server

```bash
npm run dev
```

This starts:

- API server on http://localhost:3001
- Main server on http://localhost:3000

## Deployment

### Single Domain Deployment

The application is designed to run on a single domain with the API served at `/api` endpoints.

### Production Build

```bash
npm run build
npm start
```

### Environment Variables for Production

Set these environment variables in your hosting platform:

- All Supabase keys and URLs
- `JWT_SECRET` with a secure random string
- `FRONTEND_URL` with your production domain
- `NODE_ENV=production`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/callback` - OAuth callback
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update user profile

### Products

- `GET /api/products` - List products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `GET /api/categories` - List categories
- `GET /api/collections` - List collections

### Shopping Cart

- `GET /api/cart` - Get current cart
- `POST /api/cart` - Create new cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update item quantity
- `DELETE /api/cart/items/:id` - Remove item

### Wishlist

- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:id` - Remove from wishlist

## License

MIT
