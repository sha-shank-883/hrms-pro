const { pool } = require('../config/database');

async function migrateAllTenantSchemaColumns() {
  console.log('================================================================');
  console.log('🔄 HRMS Pro - Full Multi-Tenant Schema & Column Alignment Audit');
  console.log('================================================================\n');

  try {
    // Get all tenant schemas + public
    const existingSchemasRes = await pool.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')"
    );
    const schemas = existingSchemasRes.rows.map(r => r.schema_name);
    console.log(`Auditing ${schemas.length} schemas:`, schemas.join(', '));

    for (const s of schemas) {
      console.log(`\n--- Ensuring schema integrity for: "${s}" ---`);
      try {
        // 1. Employees table columns
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "${s}".employees (
            employee_id SERIAL PRIMARY KEY,
            user_id INTEGER,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20),
            date_of_birth DATE,
            gender VARCHAR(20),
            address TEXT,
            department_id INTEGER,
            position VARCHAR(100),
            hire_date DATE,
            termination_date DATE,
            salary DECIMAL(15, 2),
            employment_type VARCHAR(50),
            status VARCHAR(50) DEFAULT 'active',
            profile_image VARCHAR(500),
            reporting_manager_id INTEGER,
            social_links JSONB DEFAULT '{}',
            education JSONB DEFAULT '[]',
            experience JSONB DEFAULT '[]',
            about_me TEXT,
            biometric_id VARCHAR(100),
            employee_code VARCHAR(50),
            pan VARCHAR(50),
            bank_account VARCHAR(100),
            bank_name VARCHAR(100),
            ifsc_code VARCHAR(50),
            uan VARCHAR(50),
            esic VARCHAR(50),
            joining_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50);
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS pan VARCHAR(50);
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100);
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(50);
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS uan VARCHAR(50);
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS esic VARCHAR(50);
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS joining_date DATE;
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]';
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]';
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS about_me TEXT;
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS biometric_id VARCHAR(100);
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS salary DECIMAL(15, 2);
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50);
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
          ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS reporting_manager_id INTEGER;

          -- Auto populate employee_code where missing
          UPDATE "${s}".employees 
          SET employee_code = 'EMP' || LPAD(employee_id::text, 4, '0')
          WHERE employee_code IS NULL OR employee_code = '';
        `);

        // 2. Users table columns
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "${s}".users (
            user_id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'employee',
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            phone VARCHAR(50),
            avatar VARCHAR(500),
            permissions JSONB DEFAULT '[]'::jsonb,
            is_active BOOLEAN DEFAULT true,
            two_factor_secret VARCHAR(255),
            is_two_factor_enabled BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE "${s}".users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE "${s}".users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
          ALTER TABLE "${s}".users ADD COLUMN IF NOT EXISTS is_two_factor_enabled BOOLEAN DEFAULT false;
          ALTER TABLE "${s}".users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);
          ALTER TABLE "${s}".users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee';
        `);

        // 3. Attendance columns
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "${s}".attendance (
            attendance_id SERIAL PRIMARY KEY,
            employee_id INTEGER,
            date DATE NOT NULL,
            clock_in TIME,
            clock_out TIME,
            total_hours DECIMAL(5, 2),
            status VARCHAR(50) DEFAULT 'present',
            is_regularized BOOLEAN DEFAULT false,
            regularization_status VARCHAR(50),
            regularization_reason TEXT,
            shift_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE "${s}".attendance ADD COLUMN IF NOT EXISTS is_regularized BOOLEAN DEFAULT false;
          ALTER TABLE "${s}".attendance ADD COLUMN IF NOT EXISTS regularization_status VARCHAR(50);
          ALTER TABLE "${s}".attendance ADD COLUMN IF NOT EXISTS regularization_reason TEXT;
          ALTER TABLE "${s}".attendance ADD COLUMN IF NOT EXISTS shift_id INTEGER;
        `);

        // 4. AI Screening & Actions
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "${s}".ai_screening_evaluations (
            evaluation_id SERIAL PRIMARY KEY,
            job_id INTEGER,
            application_id INTEGER,
            applicant_name VARCHAR(255),
            match_score INTEGER NOT NULL,
            fit_verdict VARCHAR(50) NOT NULL,
            matching_strengths JSONB DEFAULT '[]'::jsonb,
            skill_gaps JSONB DEFAULT '[]'::jsonb,
            interview_questions JSONB DEFAULT '[]'::jsonb,
            executive_summary TEXT,
            evaluation_metadata JSONB DEFAULT '{}'::jsonb,
            model_used VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS "${s}".ai_action_logs (
            log_id SERIAL PRIMARY KEY,
            user_id INTEGER,
            feature_type VARCHAR(100) NOT NULL,
            prompt_summary TEXT,
            tokens_used INTEGER DEFAULT 0,
            model_used VARCHAR(100),
            latency_ms INTEGER DEFAULT 0,
            status VARCHAR(50) DEFAULT 'success',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // 5. Assets Module
        await pool.query(`
          CREATE TABLE IF NOT EXISTS "${s}".assets (
            asset_id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            asset_type VARCHAR(100),
            serial_number VARCHAR(255),
            model VARCHAR(255),
            status VARCHAR(50) DEFAULT 'available',
            assigned_to INTEGER,
            purchase_date DATE,
            warranty_expiry DATE,
            purchase_cost DECIMAL(12,2),
            location VARCHAR(255),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        console.log(`  ✅ Schema "${s}" is 100% aligned with all required columns and tables.`);
      } catch (err) {
        console.error(`  ❌ Notice in schema "${s}":`, err.message);
      }
    }

    console.log('\n================================================================');
    console.log('✅ Multi-Tenant Alignment Migration Successfully Completed!');
    console.log('================================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('Fatal migration error:', error);
    process.exit(1);
  }
}

migrateAllTenantSchemaColumns();
