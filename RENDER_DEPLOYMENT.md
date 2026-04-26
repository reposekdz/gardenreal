# Garden TVET School - Render Production Deployment

This guide explains how to deploy the Garden TVET School application on [Render.com](https://render.com).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         RENDER                                  │
│  ┌──────────────────────┐     ┌─────────────────────────────┐ │
│  │   garden-tvet-web    │────▶│    garden-tvet-api         │ │
│  │   (Frontend)         │     │    (Backend)               │ │
│  │   Node.js + React    │     │    Express.js              │ │
│  │   Port: 3000         │     │    Port: 5000              │ │
│  └──────────────────────┘     └──────────────┬──────────────┘ │
│                                               │                │
│                                               ▼                │
│                                    ┌──────────────────────────┐│
│                                    │   garden-tvet-db         ││
│                                    │   (MySQL)                ││
│                                    │   Managed Database       ││
│                                    └──────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **GitHub Account**: Your code must be in a GitHub repository
2. **Render Account**: Sign up at https://render.com
3. **Africa's Talking Account**: For SMS notifications (required for production)

## Deployment Steps

### Step 1: Prepare Your Repository

Ensure your repository has the following structure:
```
garden/
├── backend/
│   ├── render.yaml              # Render configuration
│   ├── server.js                # Express server
│   ├── db.js                    # Database connection
│   ├── package.json
│   ├── .env.example
│   ├── full exported db/        # Full production database
│   │   └── garden_tvet.sql
│   ├── controllers/
│   ├── routes/
│   └── ...
├── frontend/
│   ├── server.js                # Production server
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       └── ...
└── README.md
```

### Step 2: Deploy via Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Create New**: Click "New" and select "Blueprint"
3. **Connect Repository**: Select your GitHub repository
4. **Select Blueprint**: Choose the `backend/render.yaml` file
5. **Configure**: Review and configure as needed
6. **Apply**: Click "Apply Blueprint"

Render will automatically create:
- 1 MySQL database (free tier)
- 1 Backend API service (Node.js)
- 1 Frontend service (Node.js)

### Step 3: Configure Environment Variables

After the initial deployment, you need to set these in the Render Dashboard:

#### For garden-tvet-api service:
1. Go to your API service in Render Dashboard
2. Click "Environment"
3. Add/Edit these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| JWT_SECRET | (generate new) | Run: `node scripts/generate-jwt-secret.js` |
| AFRICASTALKING_USERNAME | reponsekdz06 | From Africa's Talking |
| AFRICASTALKING_API_KEY | your_api_key | From Africa's Talking |
| NODE_ENV | production | |

#### For garden-tvet-web service:
The environment variables are automatically configured via the render.yaml:
- API_URL: Automatically set from backend service URL
- VITE_API_URL: Automatically set from backend service URL

### Step 4: Database Setup

After deployment, run migrations:

1. Go to your API service in Render Dashboard
2. Click "Shell"
3. Run the migration script:
```bash
node scripts/run_migration.js
```

This will:
1. Import the full production database from `full exported db/garden_tvet.sql`
2. Run additional setup scripts (school_info, hero_slides, trades, etc.)

### Step 5: Verify Deployment

Test your deployment:

- **Frontend**: https://garden-tvet-web.onrender.com
- **Backend API**: https://garden-tvet-api.onrender.com/api/health
- **Database**: Automatically connected via DATABASE_URL

## Production Features

### Fully Dynamic Content
- All data fetched from MySQL database through RESTful APIs
- No static placeholders - all content is dynamic
- Student management, finance records, discipline, stock, news, applications

### Rich Features
- Student enrollment and management
- Parent portal with payment tracking
- Finance and fee management
- Discipline record tracking
- Inventory/stock management
- News and content management
- Student application system
- SMS notifications via Africa's Talking
- Dashboard with real-time statistics
- Multi-language support (English, French, Kinyarwanda)

## Environment Variables Reference

### Backend (.env)
```env
NODE_ENV=production
PORT=5000

# Database - set automatically by Render
DATABASE_URL=mysql://...

# Security
JWT_SECRET=<your-generated-secret>

# SMS (Africa's Talking)
AFRICASTALKING_USERNAME=reponsekdz06
AFRICASTALKING_API_KEY=<your-api-key>

# CORS
FRONTEND_URL=https://garden-tvet-web.onrender.com
```

### Frontend
```env
# Server-side (for server.js)
API_URL=https://garden-tvet-api.onrender.com
NODE_ENV=production
PORT=3000

# Client-side (Vite build)
VITE_API_URL=https://garden-tvet-api.onrender.com
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check that DATABASE_URL is set in backend environment
   - Verify MySQL service is running in Render Dashboard
   - Check logs: Click "Logs" in Render Dashboard

2. **Frontend Can't Connect to Backend**
   - Verify API_URL is set correctly in frontend environment
   - Check CORS settings in backend
   - Verify both services are deployed and running

3. **Build Failures**
   - Check that all dependencies are in package.json
   - Verify Node version compatibility (use Node 18+)
   - Check build logs in Render Dashboard

4. **Static Files Not Loading**
   - Ensure uploads folder is accessible
   - Check file paths in database

### Viewing Logs

1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab

### Connecting to Database via CLI

1. Go to your MySQL service in Render Dashboard
2. Click "Info" tab
3. Use the connection string with a MySQL client

## Production Recommendations

### Free Tier Limitations
- Services sleep after 15 minutes of inactivity
- Limited compute resources
- 1 database with 1GB storage

### Production Upgrade Recommendations
1. Upgrade to paid plans for:
   - Always-on services
   - More compute resources
   - Larger database storage

2. Configure custom domains in Render Dashboard

3. Set up SSL (automatic in Render)

## Development Workflow

### Local Development
```bash
# Backend
cd backend
npm install
npm run dev  # Runs on localhost:5000

# Frontend
cd frontend
npm install
npm run dev  # Runs on localhost:5173
```

### Making Changes
1. Push changes to GitHub
2. Render auto-deploys (if auto-deploy enabled)
3. Or manually trigger deploy in Dashboard

## API Endpoints

The backend provides these main API routes:
- `/api/auth` - Authentication (login, register, user management)
- `/api/students` - Student management
- `/api/parents` - Parent portal
- `/api/finance` - Fees and payments
- `/api/discipline` - Discipline records
- `/api/stock` - Inventory management
- `/api/news` - News management
- `/api/applications` - Student applications
- `/api/dashboard` - Dashboard statistics
- `/api/content` - Website content management
- `/api/hero` - Hero slides management
- `/api/trades` - Trade programs
- `/api/sms` - SMS notifications
- `/api/parent-payments` - Parent payment tracking

---

**Production Status**: This application is fully production-ready with real database, all features enabled, and dynamic content management.
