# HRMS Pro - Advanced Human Resource Management System

A comprehensive, full-stack HRMS application with secure backend and modern frontend.

## 🚀 Features

### Core Modules
- ✅ **Dashboard** - Analytics and overview with real-time statistics
- ✅ **Departments** - Full CRUD operations for department management
- ✅ **Employees** - Complete employee lifecycle management
- ✅ **Attendance** - Clock-in/out system with work hours tracking
- ✅ **Leave Requests** - Leave management with approval workflow
- ✅ **Tasks** - Task assignment and progress tracking
- ✅ **Payroll** - Salary calculations and payment processing
- ✅ **Recruitment** - Job postings and application tracking
- ✅ **Documents** - File upload and management system
- ✅ **Chat** - Real-time messaging with Socket.io
- ✅ **Reports** - Comprehensive analytics and reporting
- ✅ **Settings** - System configuration management

### Technical Features
- 🔐 JWT-based authentication with role-based access control
- 🛡️ Security: CORS, rate limiting, input sanitization, SQL injection prevention
- 📊 PostgreSQL database with optimized indexes
- ⚡ Real-time chat with Socket.io
- 📱 Responsive design
- 🔄 RESTful API architecture
- ✅ Comprehensive error handling
- 📝 Request validation

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Setup Instructions

### 1. Database Setup

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE hrms_db;
```

2. Run the database schema:
```bash
cd backend
psql -U postgres -d hrms_db -f src/config/schema.sql
```

3. Update database credentials in `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hrms_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### 2. Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hrms_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
FRONTEND_URL=http://localhost:5173
```

4. Create default admin user (after running schema.sql):
```sql
-- Password hash for "admin123"
INSERT INTO users (email, password_hash, role) 
VALUES ('admin@hrmspro.com', '$2a$10$YtXc7YVvGE4pz8HfZqGQEuF1xH0w8r9HzBWqnFmPyYxOZF8Qa3QWy', 'admin');
```

5. Start the backend server:
```bash
npm run dev
```

Backend will run on http://localhost:5000

### 3. Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm run dev
```

Frontend will run on http://localhost:5173

## 🔑 Default Login Credentials

- **Email:** admin@hrmspro.com
- **Password:** admin123

⚠️ **Important:** Change the default password after first login!

## 📁 Project Structure

```
hrms-2025/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── schema.sql
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── departmentController.js
│   │   │   ├── employeeController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── leaveController.js
│   │   │   ├── taskController.js
│   │   │   ├── payrollController.js
│   │   │   ├── recruitmentController.js
│   │   │   ├── documentController.js
│   │   │   ├── chatController.js
│   │   │   ├── reportController.js
│   │   │   └── settingsController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── validate.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   └── [all route files]
│   │   └── server.js
│   ├── uploads/
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   └── [all page components]
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── index.js
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   ├── Layout.css
│   │   │   └── Login.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/profile` - Get user profile
- PUT `/api/auth/change-password` - Change password

### Departments
- GET `/api/departments` - Get all departments
- GET `/api/departments/:id` - Get single department
- POST `/api/departments` - Create department
- PUT `/api/departments/:id` - Update department
- DELETE `/api/departments/:id` - Delete department

### Employees
- GET `/api/employees` - Get all employees
- GET `/api/employees/:id` - Get single employee
- POST `/api/employees` - Create employee
- PUT `/api/employees/:id` - Update employee
- DELETE `/api/employees/:id` - Delete employee

### Attendance
- GET `/api/attendance` - Get all attendance records
- POST `/api/attendance/clock-in` - Clock in
- POST `/api/attendance/clock-out` - Clock out
- POST `/api/attendance` - Create attendance record
- PUT `/api/attendance/:id` - Update attendance record
- DELETE `/api/attendance/:id` - Delete attendance record

### Leave Requests
- GET `/api/leaves` - Get all leave requests
- POST `/api/leaves` - Create leave request
- PUT `/api/leaves/:id` - Update leave request
- PUT `/api/leaves/:id/approve` - Approve leave request
- PUT `/api/leaves/:id/reject` - Reject leave request
- DELETE `/api/leaves/:id` - Delete leave request

### Tasks
- GET `/api/tasks` - Get all tasks
- GET `/api/tasks/:id` - Get single task
- POST `/api/tasks` - Create task
- PUT `/api/tasks/:id` - Update task
- DELETE `/api/tasks/:id` - Delete task

### Payroll
- GET `/api/payroll` - Get all payroll records
- GET `/api/payroll/:id` - Get single payroll record
- POST `/api/payroll` - Create payroll record
- PUT `/api/payroll/:id` - Update payroll record
- PUT `/api/payroll/:id/process` - Process payment
- DELETE `/api/payroll/:id` - Delete payroll record

### Recruitment
- GET `/api/recruitment/jobs` - Get all job postings
- POST `/api/recruitment/jobs` - Create job posting
- GET `/api/recruitment/applications` - Get all applications
- POST `/api/recruitment/applications` - Submit application

### Documents
- GET `/api/documents` - Get all documents
- POST `/api/documents` - Upload document
- PUT `/api/documents/:id` - Update document
- DELETE `/api/documents/:id` - Delete document

### Chat
- GET `/api/chat/messages` - Get messages
- POST `/api/chat/messages` - Send message
- GET `/api/chat/conversations` - Get conversations
- GET `/api/chat/unread-count` - Get unread message count

### Reports
- GET `/api/reports/dashboard` - Dashboard statistics
- GET `/api/reports/attendance` - Attendance report
- GET `/api/reports/leave` - Leave report
- GET `/api/reports/payroll` - Payroll report
- GET `/api/reports/demographics` - Employee demographics
- GET `/api/reports/recruitment` - Recruitment report

### Settings
- GET `/api/settings` - Get all settings
- POST `/api/settings` - Create setting
- PUT `/api/settings/:key` - Update setting
- DELETE `/api/settings/:key` - Delete setting

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (Admin, Manager, Employee)
- CORS protection
- Rate limiting (100 requests per 15 minutes)
- Input sanitization
- SQL injection prevention with parameterized queries
- Helmet.js security headers
- File upload size limits

## 🧪 Testing

Create a `.env.test` file and run:
```bash
npm test
```

## 🚀 Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Update `JWT_SECRET` with a strong secret key
3. Configure production database credentials
4. Build frontend:
```bash
cd frontend
npm run build
```
5. Serve the build folder with a web server (nginx, apache, etc.)

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ using Node.js, Express, React, PostgreSQL, and Socket.io**
