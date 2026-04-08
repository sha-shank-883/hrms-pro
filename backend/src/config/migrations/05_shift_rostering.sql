-- Shift rostering migration

CREATE TABLE IF NOT EXISTS shifts (
  shift_id SERIAL PRIMARY KEY,
  shift_name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_shifts (
  assignment_id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
  shift_id INTEGER REFERENCES shifts(shift_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  assigned_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
