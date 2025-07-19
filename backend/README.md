# Replytics Dashboard API Backend

Production-ready FastAPI backend for the Replytics AI Voice Receptionist Dashboard.

## Features

- 🔐 JWT Authentication with email/password and Google OAuth
- 📊 Analytics and reporting endpoints
- 👥 Customer management
- 📞 Call history and recordings
- 💬 SMS messaging
- ⚙️ Business settings and voice configuration
- 📅 Business hours management
- 💳 Billing and usage tracking
- 🚀 Real-time updates via WebSocket
- 🛡️ Rate limiting and security middleware

## Tech Stack

- **Framework**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + Google OAuth
- **Deployment**: Render

## Local Development

1. **Install dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Run the development server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. **Access the API documentation**:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/dashboard/auth` - Login with email/password
- `POST /api/dashboard/auth/google` - Google OAuth login
- `POST /api/dashboard/auth/refresh` - Refresh JWT token

### Business Management
- `GET/PATCH /api/v2/dashboard/business/profile` - Business profile
- `GET/PATCH /api/v2/dashboard/business/voice-settings` - Voice agent settings
- `GET/PATCH /api/v2/dashboard/business/conversation-rules` - AI conversation rules

### Analytics
- `GET /api/v2/dashboard/analytics/overview` - Analytics dashboard data

### Customer Management
- `GET /api/v2/dashboard/customers` - List customers with filtering
- `GET /api/v2/dashboard/customers/segments/counts` - Customer segment counts

### Services & Hours
- `GET/POST /api/v2/dashboard/services` - Manage services
- `GET/PATCH /api/v2/dashboard/hours` - Business hours

### Communications
- `GET /api/dashboard/calls` - Call history
- `GET /api/dashboard/sms` - SMS messages
- `POST /api/dashboard/sms/send` - Send SMS

### Billing
- `GET /api/dashboard/billing` - Usage and limits

## Deployment on Render

### Method 1: Using Render Dashboard

1. **Fork/Clone this repository** to your GitHub account

2. **Go to Render Dashboard**:
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"

3. **Connect your repository**:
   - Select your GitHub repo
   - Choose the branch (usually `main`)

4. **Configure the service**:
   - **Name**: `replytics-dashboard-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. **Add environment variables**:
   ```
   SECRET_KEY=<generate-a-secure-key>
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   VOICE_BOT_URL=https://replytics-dhhf.onrender.com
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   ALLOWED_ORIGINS=["https://your-frontend.vercel.app"]
   ```

6. **Deploy**:
   - Click "Create Web Service"
   - Wait for the build and deployment to complete

### Method 2: Using render.yaml

1. The `render.yaml` file is already configured
2. Push to your GitHub repository
3. In Render Dashboard, use "New +" → "Blueprint"
4. Connect your repository and deploy

## Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  google_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Business profiles
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT,
  industry TEXT,
  phone_number TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  timezone TEXT DEFAULT 'America/New_York',
  description TEXT,
  plan TEXT DEFAULT 'starter',
  conversation_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Voice settings
CREATE TABLE voice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  voice_id TEXT DEFAULT 'emma',
  voice_speed FLOAT DEFAULT 1.0,
  voice_pitch FLOAT DEFAULT 1.0,
  greeting_message TEXT,
  voice_gender TEXT DEFAULT 'female',
  language TEXT DEFAULT 'en-US',
  transfer_number TEXT,
  enable_transfer BOOLEAN DEFAULT false,
  max_call_duration INTEGER DEFAULT 300,
  record_calls BOOLEAN DEFAULT true,
  transcribe_calls BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Business hours
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
  is_closed BOOLEAN DEFAULT false,
  time_slots JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Calls
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  phone_number TEXT,
  customer_name TEXT,
  direction TEXT,
  status TEXT,
  duration INTEGER, -- in seconds
  recording_url TEXT,
  transcript TEXT,
  summary TEXT,
  sentiment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SMS messages
CREATE TABLE sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  conversation_id TEXT,
  phone_number TEXT,
  message TEXT,
  direction TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  segment TEXT DEFAULT 'new',
  total_spent DECIMAL(10,2) DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  last_interaction TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX idx_calls_business_id ON calls(business_id);
CREATE INDEX idx_sms_business_id ON sms_messages(business_id);
CREATE INDEX idx_customers_business_id ON customers(business_id);
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | JWT signing key | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `VOICE_BOT_URL` | Voice bot service URL | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | Yes |
| `DEBUG` | Debug mode (true/false) | No |
| `PORT` | Server port | No |

## Security Considerations

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use strong SECRET_KEY** - Generate with: `openssl rand -hex 32`
3. **Restrict CORS origins** - Only allow your frontend domain
4. **Enable rate limiting** - Configured in middleware
5. **Use HTTPS in production** - Render provides this automatically

## Monitoring

- Health check: `GET /health`
- Metrics: `GET /metrics` (Prometheus format)
- Logs: Available in Render dashboard

## Support

For issues or questions:
1. Check the API docs at `/docs`
2. Review error messages in Render logs
3. Ensure all environment variables are set correctly