const { pool } = require('../config/database');
const attendanceService = require('../services/attendanceService');

/**
 * Looks up the tenant ID based on the device's serial number.
 */
async function resolveTenantByDevice(serialNumber) {
    const query = 'SELECT tenant_id, status FROM shared.biometric_devices WHERE serial_number = $1';
    const result = await pool.query(query, [serialNumber]);
    
    if (result.rows.length === 0) {
        throw new Error(`Unregistered device: ${serialNumber}`);
    }
    
    const device = result.rows[0];
    if (device.status !== 'active') {
        throw new Error(`Device ${serialNumber} is not active`);
    }
    
    // Update last ping
    await pool.query('UPDATE shared.biometric_devices SET last_ping = CURRENT_TIMESTAMP WHERE serial_number = $1', [serialNumber]);
    
    return device.tenant_id;
}

exports.handleUniversalWebhook = async (req, res) => {
    try {
        const { deviceSerial, biometricId, timestamp, punchType } = req.body;

        if (!deviceSerial || !biometricId || !timestamp) {
            return res.status(400).json({ error: "Missing required fields: deviceSerial, biometricId, timestamp" });
        }

        // 1. Resolve Tenant
        const tenantId = await resolveTenantByDevice(deviceSerial);

        // 2. Process via Attendance Service
        await attendanceService.processUnifiedPunch({
            tenantId,
            deviceSerial,
            biometricId,
            timestamp: new Date(timestamp),
            punchType: punchType || 'Unknown'
        });

        res.status(200).json({ success: true, message: 'Punch logged successfully' });

    } catch (error) {
        console.error("Biometric Universal Webhook Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.handleZktecoWebhook = async (req, res) => {
    try {
        // ZKTeco devices often send raw text like:
        // SN=123456789&table=ATTLOG&Stamp=9999
        // 1\t2026-05-06 08:30:00\t0\t1\t0\t0
        
        // For demonstration, assuming text parser middleware or raw body:
        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        
        // Simplified parsing logic for ZKTeco format
        const snMatch = rawBody.match(/SN=([^&]+)/);
        if (!snMatch) {
             // Let's assume some ZK implementations send SN in headers or query params
             const snParam = req.query.SN || req.headers['x-device-sn'];
             if (!snParam) return res.status(400).send("No SN provided");
        }
        
        const deviceSerial = snMatch ? snMatch[1] : req.query.SN;
        const tenantId = await resolveTenantByDevice(deviceSerial);

        // Example regex to find punch lines: ID\tDate Time\tState...
        // This is a basic implementation. A real ZKTeco parser needs to handle the exact ADMS protocol.
        const logLines = rawBody.split('\n').filter(line => line.includes('\t'));
        
        let processedCount = 0;
        for (const line of logLines) {
            const parts = line.split('\t');
            if (parts.length >= 2) {
                const biometricId = parts[0];
                const timestamp = new Date(parts[1]);
                
                await attendanceService.processUnifiedPunch({
                    tenantId,
                    deviceSerial,
                    biometricId,
                    timestamp,
                    punchType: 'Biometric' // State could be parsed if known (0=CheckIn, 1=CheckOut, etc.)
                });
                processedCount++;
            }
        }

        res.status(200).send("OK");

    } catch (error) {
        console.error("ZKTeco Webhook Error:", error.message);
        res.status(500).send("Error");
    }
};
