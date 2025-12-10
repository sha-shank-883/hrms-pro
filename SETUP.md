# HRMS Pro - Quick Setup Guide

## Step-by-Step Setup

### 1. Install PostgreSQL
Download and install PostgreSQL from: https://www.postgresql.org/download/

### 2. Create Database
Open PostgreSQL command line (psql) and run:
```sql
CREATE DATABASE hrms_db;
```

### 3. Run Database Schema
From the backend directory:
```bash
cd backend
psql -U postgres -d hrms_db -f src/config/schema.sql
```

Or manually run the SQL commands from `backend/src/config/schema.sql` in your PostgreSQL client.

### 4. Configure Backend

1. Navigate to `backend/.env` file
2. Update the following variables:
   - `DB_PASSWORD`: Your PostgreSQL password
   - `JWT_SECRET`: Change to a secure random string (important for production!)
   - `SMTP_HOST`: Email server host (e.g., smtp.gmail.com)
   - `SMTP_PORT`: Email server port (e.g., 587)
   - `SMTP_USER`: Email address
   - `SMTP_PASS`: Email password (or App Password)

### 5. Install and Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend should start on http://localhost:5000

### 6. Install and Start Frontend

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend should start on http://localhost:5173

### 7. Login to Application

Open your browser and navigate to: http://localhost:5173

**Default Credentials:**
- Email: admin@hrmspro.com
- Password: admin123

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check database credentials in `.env` file
- Verify database exists: `psql -U postgres -l`

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.js`

### Module Not Found Errors
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

### CORS Errors
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that backend is running before starting frontend

## Quick Test

1. Login with default credentials
2. Navigate to Departments
3. Click "Add Department" button
4. Fill in the form and submit
5. Verify the department appears in the table

## Next Steps

After successful setup:

1. **Change Default Password**
   - Go to Profile/Settings
   - Update admin password

2. **Create Departments**
   - Add your company's departments

3. **Add Employees**
   - Create employee records
   - Assign to departments

4. **Configure Settings**
   - Set working hours
   - Configure leave types
   - Set company information

5. **Explore Features**
   - Test attendance tracking
   - Create tasks
   - Submit leave requests
   - Generate reports

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in backend `.env`
2. Use a strong, unique `JWT_SECRET`
3. Use environment-specific database credentials
4. Enable HTTPS/SSL
5. Set up proper firewall rules
6. Build frontend: `npm run build`
7. Serve frontend build with nginx or apache
8. Use PM2 or similar for backend process management

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is running and accessible
4. Check that all dependencies are installed

Enjoy using HRMS Pro! 🚀
