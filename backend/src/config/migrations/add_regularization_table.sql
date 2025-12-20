-- Migration: Add attendance_regularization table
CREATE TABLE IF NOT EXISTS attendance_regularization (
  regularization_id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  original_clock_in TIME,
  original_clock_out TIME,
  requested_clock_in TIME NOT NULL,
  requested_clock_out TIME NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
