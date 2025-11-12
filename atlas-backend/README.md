# ATLAS Backend API Server

Production backend for ATLAS Clinical Decision Support System.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Edit .env file with your settings
   - Default admin login: admin / atlas123

3. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Update frontend:**
   In your ATLAS frontend .env.local file:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

## API Endpoints

- **Health Check:** GET /health
- **Authentication:** POST /auth/login
- **Patients:** GET/POST/PUT/DELETE /patients
- **Consultations:** GET/POST/PUT/DELETE /consultation
- **Reference Data:** GET /reference/medications, /conditions, /guidelines
- **Performance:** POST /performance_metrics

## Database

Uses SQLite with automatic initialization and seeding.
Database file: ./data/atlas.db

## Default Credentials

- Username: dmin
- Password: tlas123 (change this!)

## Production Deployment

For production deployment, update:
1. Change NODE_ENV=production in .env
2. Set strong JWT_SECRET
3. Configure proper FRONTEND_URL
4. Use a reverse proxy (nginx) for SSL
5. Set up monitoring and backups

## Support

Check /health endpoint for server status.
View logs for troubleshooting.
