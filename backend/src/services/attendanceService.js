const { pool } = require('../config/database');

/**
 * Service to handle attendance logic across tenants.
 */
class AttendanceService {
    
    /**
     * Processes a unified punch payload and inserts it into the correct tenant schema.
     */
    async processUnifiedPunch(data) {
        const { tenantId, deviceSerial, biometricId, timestamp, punchType } = data;
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // 1. Switch to tenant schema
            await client.query(`SET search_path TO "${tenantId}"`);
            
            // 2. Find employee by biometric_id
            const userResult = await client.query('SELECT employee_id FROM employees WHERE biometric_id = $1', [biometricId]);
            
            if (userResult.rows.length === 0) {
                // We log it anyway as "unmatched" or simply throw to be handled
                console.warn(`[${tenantId}] Unmatched biometric ID: ${biometricId} from device ${deviceSerial}`);
                await client.query('ROLLBACK');
                return false; 
            }
            
            const employeeId = userResult.rows[0].employee_id;
            
            const insertQuery = `
                INSERT INTO attendance (
                    employee_id, date, clock_in, status, device_serial, punch_source
                ) VALUES (
                    $1, CURRENT_DATE, $2, 'present', $3, 'biometric'
                ) ON CONFLICT (employee_id, date) DO UPDATE 
                SET clock_out = EXCLUDED.clock_in,
                    punch_source = 'biometric',
                    device_serial = EXCLUDED.device_serial
            `;
            
            try {
                // We need to format the timestamp to just time for clock_in
                const timeOnly = timestamp.toISOString().split('T')[1].substring(0, 8);
                await client.query(insertQuery, [employeeId, timeOnly, deviceSerial]);
            } catch (err) {
                 // If the basic insert fails (maybe due to constraints or different schema),
                 // we log it. A proper implementation would query the schema columns first.
                 console.error(`[${tenantId}] Error inserting attendance for ${userId}:`, err.message);
                 await client.query('ROLLBACK');
                 throw err;
            }

            await client.query('COMMIT');
            return true;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new AttendanceService();
