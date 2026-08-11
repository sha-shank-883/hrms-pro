# HRMS Project: Detailed File & Module Report

This report provides an in-depth breakdown of the codebase, detailing every major file and script in both the internal backend and frontend structures.

## 🗄️ Backend Layer (`backend/src/`)

The backend works via an MVC structure: Routes ➔ Controllers ➔ Storage logic. It uses Express.js and PostgreSQL.

### 📍 Routes (`backend/src/routes/`)
Routes define the endpoint URLs clients can hit. They contain no business logic—they pass incoming requests to the appropriate controllers.
* **`assetRoutes.js`**: Endpoints for company inventory and asset management (`/api/assets`).
* **`attendanceRoutes.js`**: Endpoints for punching in/out, viewing timesheets, geo-fencing (`/api/attendance`).
* **`auditRoutes.js`**: Endpoints for fetching system action logs (`/api/audit-logs`).
* **`authRoutes.js`**: Endpoints for user authentication, Login/SSO, 2FA (`/api/auth`).
* **`chatRoutes.js`**: Endpoints for fetching older chat messages and conversation histories (`/api/chat`).
* **`departmentRoutes.js`**: Endpoints for CRUD operations on departments and organizational structure.
* **`documentRoutes.js`**: Endpoints for file uploads, folders, viewing docs.
* **`emailTemplateRoutes.js`**: Endpoints to manage dynamic email templates.
* **`employeeRoutes.js`**: Endpoints for managing users, updating profiles, and directory listing.
* **`holidayRoutes.js`**: Public holiday configurations.
* **`leaveRoutes.js`**: Leave requests, approvals, leave balances, and regularizations.
* **`payrollRoutes.js`**: Monthly payroll calculation, salary structures, payslip generation.
* **`performanceRoutes.js`**: Performance reviews, goals, OKRs, feedback loops.
* **`recruitmentRoutes.js`**: ATS (Applicant Tracking), managing candidates.
* **`reportRoutes.js`**: Generation of PDF/CSV exports for attendance, payroll, churn risk data.
* **`settingsRoutes.js`**: Global organization settings, integrations, white-labeling.
* **`shiftRoutes.js`**: Managing worker shifts, shift rostering, times.
* **`taskRoutes.js`**: Kanban/Task management systems in the dashboard.
* **`tenantRoutes.js`**: Multi-tenancy configurations (creating new workspaces).
* **`uploadRoutes.js`**: Cloud bucket or local file ingestion.

### 🧠 Controllers (`backend/src/controllers/`)
The controllers hold the actual "Brain" and logic of the application. They execute SQL statements and generate responses.
* **`assetController.js`**: Assigns/revokes objects (laptops, keys) from employees.
* **`attendanceController.js`**: Calculates working hours, calculates overtime, registers geolocation distance checking.
* **`auditController.js`**: Tracks user data mutation footprints.
* **`authController.js`**: Generates JSON Web Tokens (JWT), verifies passwords, hashes data via bcrypt.
* **`chatController.js`**: Stores messages generated from WebSockets into PostgreSQL.
* **`departmentController.js`**: Database transactions for the org chart hierarchy.
* **`documentController.js`**: Manages secure access controls for HR files.
* **`emailTemplateController.js`**: Parses Handlebars/HTML, sends emails via Nodemailer based on templates.
* **`employeeController.js`**: Handles massive joins between user credentials, roles, and profiles.
* **`holidayController.js`**: Validates working days vs holidays.
* **`leaveController.js`**: Subtracts balances taking into account weekend and public holidays.
* **`payrollController.js`**: High-complexity logic dealing with tax deductions (TDS, PF), allowances, deductions, gross payouts.
* **`performanceController.js`**: Aggregates reviews and outputs scored matrices.
* **`recruitmentController.js`**: State manipulation for recruitment funnels.
* **`reportController.js`**: Assembles heavily processed analytics data (e.g., Attrition risk scoring).
* **`settingsController.js`**: Manages company-specific overrides.
* **`shiftController.js`**: Complex rostering assigning users overlapping schedules.
* **`taskController.js`**: Handles task status updates and subtask completion checking.
* **`tenantController.js`**: Isolates data sets based on tenant IDs per schema.
* **`uploadController.js`**: Handles Multer parsing logic.

### 🛠️ Scripts (`backend/src/scripts/`)
Contains vital CLI/Setup scripts mostly used for migrations or administrative control.
* **`setupMultiTenancy.js` / `createTenant.js`**: Fundamental scripts to generate schema isolation for different customer companies.
* **`migrate_*` / `add_*` / `create_*` scripts** (e.g., `add_shift_tables.js`, `add_email_templates_table.js`): Schema migrations that alter PSQL architecture.
* **`generate_demo_data.js`**: Seeds a local database with fake names/departments for testing.
* **`fix_*` scripts** (e.g., `fix_2fa_schema.js`): Patches for schema recovery for the production environment.
* **`testEmail.js` / `testEmailTemplates.js`**: Dry-run tests before deploying notification features.

---

## 💻 Frontend Layer (`frontend/src/`)

The frontend relies heavily on Vite (React) for SPAs (Single Page Applications) utilizing React Router mapping.

### 📄 Pages (`frontend/src/pages/`)
Pages correspond 1-to-1 with a URL in the browser. They fetch the container logic.
* **`Analytics.jsx` & `Reports.jsx` & `ChurnRiskReport.jsx`**: Administrative data visualization, using robust chart libraries to plot attrition and system usage.
* **`Attendance.jsx` & `Leaves.jsx`**: User portals that render calendars, check-in widgets, and request tables.
* **`Chat.jsx`**: A real-time message room relying heavily on the socket context wrapper.
* **`Dashboard.jsx`**: Modular landing page aggregating active stats from Payroll, Leave, and the Todo list.
* **`Departments.jsx` / `Employees.jsx` / `Profile.jsx`**: Core directories and structural read-outs of the employee base.
* **`Documents.jsx` / `MyDocuments.jsx` / `Assets.jsx`**: Asset tracking.
* **`EmailTemplates.jsx` / `SendEmail.jsx`**: GUI builders to test, edit, and mass-dispatch administrative emails.
* **`Login.jsx` & Password Reset pages**: Entry-gate pages isolated from the authenticated layout.
* **`Payroll.jsx` & `MyPayslips.jsx`**: Salary processing (Admin) and payslip downloads (Employee).
* **`Performance.jsx` / `PerformanceReview.jsx`**: 360 review forms.
* **`Recruitment.jsx` / `Onboarding.jsx`**: Applicant tracking and initial setup for new hires.
* **`Settings.jsx` / `SuperAdmin.jsx` / `LiveActivity.jsx`**: Deep-system configuration interfaces to view multi-tenant live updates.

### 🧩 Components (`frontend/src/components/`)
Modular pieces intended for re-use inside pages.
* **`Layout.jsx`**: The core shell (sidebar, navigation header) rendering all protected pages.
* **`ProtectedRoute.jsx` / `SuperAdminRoute.jsx`**: Security gating wrappers to eject unauthorized roles.
* ***Module Folders*** (`attendance/`, `dashboard/`, `employees/`, `leaves/`, `payroll/`): Contain feature-specific widgets (e.g. A `<TimesheetTable>` goes here instead of cluttering the Page logic).

### 🌐 Services (`frontend/src/services/`)
Houses logic exclusively relating to server HTTP communication.
* **`index.js` / `api.js`**: Global Axios configurations setting auth tokens and tenant scopes.
* **`*Service.js`** files: Contains explicit fetch/post method functions wrapping the endpoints defined in the backend `routes`. 

### ⚙️ Context & Hooks
* **`AuthContext`**: Uses React Context API to hold the logged-in JWT token persistently globally.
* **`SocketContext`**: Holds the live WS/Websocket connection allowing things like `Chat.jsx` to push and pull data instantly without page reloading.

---

## 🎯 Summary for Future Changes

To safely alter any single module, standard methodology should be:
1. Validate required data fields on the *Frontend Page*.
2. Prepare the payload in the *Frontend Service*.
3. Route it through the *Backend Router*.
4. Digest and mutate the Database in the *Backend Controller*.
5. (If new tables are needed, run a script from the `scripts` folder).
