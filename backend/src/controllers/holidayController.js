const { query } = require('../config/database');

const getAllHolidays = async (req, res) => {
    try {
        const { year } = req.query;
        let queryText = 'SELECT * FROM holidays';
        const params = [];

        if (year) {
            queryText += ' WHERE EXTRACT(YEAR FROM date) = $1';
            params.push(year);
        }

        queryText += ' ORDER BY date ASC';

        const result = await query(queryText, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get holidays error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch holidays', error: error.message });
    }
};

const getEmployeeRestrictedHolidays = async (req, res) => {
    try {
        const { employee_id, year } = req.query;

        const result = await query(
            `SELECT rh.*, h.name, h.date, h.description 
             FROM employee_restricted_holidays rh
             JOIN holidays h ON rh.holiday_id = h.holiday_id
             WHERE rh.employee_id = $1 AND rh.year = $2`,
            [employee_id, year || new Date().getFullYear()]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Get employee RH error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch restricted holidays', error: error.message });
    }
};

const optInRestrictedHoliday = async (req, res) => {
    try {
        const { employee_id, holiday_id } = req.body;
        const year = new Date().getFullYear();

        // Check if already opted
        const existing = await query(
            'SELECT * FROM employee_restricted_holidays WHERE employee_id = $1 AND holiday_id = $2',
            [employee_id, holiday_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Already opted for this holiday' });
        }

        // Check quota (e.g., max 2 per year) - mock limit 2
        const countResult = await query(
            'SELECT COUNT(*) as count FROM employee_restricted_holidays WHERE employee_id = $1 AND year = $2',
            [employee_id, year]
        );

        if (parseInt(countResult.rows[0].count) >= 2) {
            return res.status(400).json({ success: false, message: 'Restricted Holiday quota (2) exceeded for this year' });
        }

        const result = await query(
            'INSERT INTO employee_restricted_holidays (employee_id, holiday_id, year, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [employee_id, holiday_id, year, 'approved']
        );

        res.status(201).json({ success: true, message: 'Opted for Restricted Holiday successfully', data: result.rows[0] });

    } catch (error) {
        console.error('Opt-in RH error:', error);
        res.status(500).json({ success: false, message: 'Failed to opt-in for holiday', error: error.message });
    }
};

module.exports = {
    getAllHolidays,
    getEmployeeRestrictedHolidays,
    optInRestrictedHoliday
};
