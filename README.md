# Smart Civic Issue Reporter

## Problem Statement
Citizens face difficulties reporting civic issues like potholes, garbage accumulation, and streetlight failures. Current systems lack transparency, real-time tracking, and efficient classification, leading to delayed resolutions and frustrated communities.

## Solution Overview
A production-ready web platform that enables citizens to report civic issues with automatic geolocation, intelligent AI classification, and real-time status tracking. Municipal authorities can manage issues efficiently while maintaining public transparency.

## Key Features ✅

### 🏠 Citizen Portal
- **Issue Reporting Form**: Image upload, category selection, auto-geolocation
- **Personal Dashboard**: View submitted issues with real-time status tracking
- **Smart Tracking**: Auto-generated unique issue IDs for easy follow-up

### 🏛️ Authority Dashboard  
- **Secure Authentication**: JWT-based login with bcrypt password hashing
- **Department Management**: Role-based access for different municipal departments
- **Issue Workflow**: Complete lifecycle management (Submitted → In Progress → Resolved)
- **Resolution Documentation**: Upload proof images and detailed resolution notes

### 🌍 Public Transparency View
- **Community Dashboard**: Real-time public view of all issues
- **Statistical Analytics**: Issue trends, resolution rates, and category breakdown
- **Government Accountability**: No login required, full transparency

### 🤖 Intelligent AI Classification
- **Smart Priority Detection**: Analyzes descriptions for urgency keywords
- **Risk Assessment**: Category-based priority scoring and evidence analysis
- **Actionable Suggestions**: Context-aware recommendations for resolution
- **Evidence Quality**: Image analysis and completeness scoring

## Tech Stack
- **Frontend**: React.js 18.2+ with Tailwind CSS for responsive design
- **Backend**: Node.js with Express.js RESTful API
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Authentication**: JWT tokens with bcrypt password security
- **Security**: CORS configuration, input validation, secure headers

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier available)

### Installation & Setup

1. **Set up Supabase Database**
   ```bash
   # Follow the detailed guide in SUPABASE_SETUP.md
   # 1. Create Supabase project at https://supabase.com
   # 2. Get your Project URL and Service Role Key
   # 3. Run the SQL schema in Supabase SQL Editor
   ```

2. **Configure Environment Variables**
   ```bash
   cd backend
   copy .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

5. **Start Backend Server**
   ```bash
   cd backend
   npm start
   # Server runs on http://localhost:5000
   ```

6. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm start
   # App runs on http://localhost:3000
   ```

### Demo Credentials
- **Authority Login**: admin / admin123

### Sample Usage
1. Open http://localhost:3000
2. Report an issue using "Report Issue" 
3. View your issues in "My Dashboard"
4. Check "Public View" for transparency
5. Login as admin to manage issues

## Project Structure
```
smart-civic-reporter/
├── frontend/                 # React.js application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Main page components
│   │   ├── services/        # API service functions
│   │   └── utils/           # Helper functions
├── backend/                  # Node.js Express API
│   ├── routes/              # API route handlers
│   ├── config/              # Database configuration
│   ├── uploads/             # File storage
│   └── .env.example         # Environment variables template
└── README.md
```

## Future Scope (40% - Post-Hackathon)

### 🤖 Advanced AI Integration
- **Real ML Models**: Computer vision for automatic issue classification
- **Predictive Analytics**: Issue hotspot prediction and resource allocation
- **Smart Routing**: Automatic assignment to relevant departments

### 🏛️ Government Integration
- **Municipal APIs**: Real integration with city management systems
- **Workflow Automation**: Auto-ticket creation in government systems
- **Resource Planning**: Budget allocation based on issue patterns

### 📊 Advanced Analytics
- **Performance Dashboards**: Response time analytics, resolution rates  
- **Community Insights**: Issue pattern analysis, citizen satisfaction
- **Predictive Maintenance**: Proactive infrastructure monitoring

### 🔗 IoT & Blockchain
- **IoT Sensors**: Automatic issue detection (smart waste bins, traffic sensors)
- **Blockchain**: Immutable issue tracking and transparent governance
- **Smart Contracts**: Automated resolution verification and payments

## Authentication

### Authority Login Credentials
After running the setup script, use these credentials:

**Roads & Infrastructure**
- Username: `roads.admin`
- Password: `SecureRoad2026!`

**Waste Management**  
- Username: `waste.admin`
- Password: `CleanCity2026!`

**Public Utilities**
- Username: `utilities.admin` 
- Password: `PowerLight2026!`

**General Administration**
- Username: `general.admin`
- Password: `CityAdmin2026!`

## Production Features

✅ **Enterprise Security**: JWT authentication with bcrypt password hashing  
✅ **Real Database**: PostgreSQL with Supabase cloud infrastructure
✅ **Intelligent AI**: Rule-based classification with priority detection
✅ **Scalable Architecture**: Microservices-ready with clean separation
✅ **Real-time Updates**: Live status tracking and notifications
✅ **Production Deployment**: Environment-based configuration ready

## API Endpoints

### Issues
- `GET /api/issues` - Get all issues with filtering
- `GET /api/issues/:id` - Get specific issue details
- `POST /api/issues` - Create new issue with AI classification
- `PUT /api/issues/:id/status` - Update issue status  
- `POST /api/issues/:id/resolution` - Add resolution proof

### Authentication  
- `POST /api/auth/login` - JWT-based authority login
- `POST /api/auth/logout` - Secure logout
- `GET /api/auth/verify` - Token validation

### File Upload
- `POST /api/upload` - Secure image upload with validation

---

**Built for**: Hackathon Demonstration | **Team**: Full-Stack Prototype | **Date**: January 2026