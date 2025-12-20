const { query } = require('../config/database');

const createHolidayTables = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS holidays (
                holiday_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                date DATE NOT NULL,
                type VARCHAR(20) NOT NULL CHECK (type IN ('mandatory', 'restricted')),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Created table 'holidays'");

        await query(`
            CREATE TABLE IF NOT EXISTS employee_restricted_holidays (
                request_id SERIAL PRIMARY KEY,
                employee_id INTEGER REFERENCES employees(employee_id),
                holiday_id INTEGER REFERENCES holidays(holiday_id),
                status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
                year INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(employee_id, holiday_id)
            );
        `);
        console.log("Created table 'employee_restricted_holidays'");

        // Insert some sample holidays if empty
        const check = await query('SELECT count(*) FROM holidays');
        if (parseInt(check.rows[0].count) === 0) {
            await query(`
                INSERT INTO holidays (name, date, type, description) VALUES
                ('New Year', '2025-01-01', 'mandatory', 'New Year celebration'),
                ('Republic Day', '2025-01-26', 'mandatory', 'Republic Day of India'),
                ('Holi', '2025-03-14', 'mandatory', 'Festival of Colors'),
                ('Good Friday', '2025-04-18', 'restricted', 'Good Friday'),
                ('Eid al-Fitr', '2025-03-31', 'restricted', 'Eid celebration'),
                ('Independence Day', '2025-08-15', 'mandatory', 'Independence Day'),
                ('Diwali', '2025-10-20', 'mandatory', 'Festival of Lights'),
                ('Christmas', '2025-12-25', 'mandatory', 'Christmas Day')
            `);
            console.log("Inserted sample holidays");
        }

    } catch (err) {
        console.error("Error creating holiday tables:", err);
    }
};

createHolidayTables();
