const { query } = require('../config/database');

const calculateRisk = async (employeeId) => {
    try {
        // 1. Fetch Employee Details (Tenure)
        const empResult = await query(
            'SELECT hire_date, salary FROM employees WHERE employee_id = $1',
            [employeeId]
        );

        if (empResult.rows.length === 0) return null;

        const employee = empResult.rows[0];
        const hireDate = new Date(employee.hire_date);
        const now = new Date();
        const tenureMonths = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());

        // 2. Fetch Performance Details (Avg Manager Rating)
        // Get stats from last 2 cycles if possible, or all time avg
        const perfResult = await query(
            `SELECT AVG(manager_rating) as avg_rating 
       FROM performance_reviews 
       WHERE employee_id = $1 AND manager_rating IS NOT NULL`,
            [employeeId]
        );

        const avgRating = parseFloat(perfResult.rows[0].avg_rating) || 0; // Default to 0 if no reviews

        // 3. Fetch Attendance Details (Last 30 days)
        // Count days present and late arrivals
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

        // standard start time 09:15:00 for late check
        const attendanceResult = await query(
            `SELECT 
         COUNT(*) as days_present,
         COUNT(CASE WHEN clock_in > '09:15:00' THEN 1 END) as late_days
       FROM attendance 
       WHERE employee_id = $1 AND date >= $2 AND status = 'present'`,
            [employeeId, dateStr]
        );

        const { days_present, late_days } = attendanceResult.rows[0];
        // Assume 20 working days in a month for simple calculation
        const expectedDays = 20;
        const absentDays = Math.max(0, expectedDays - parseInt(days_present));
        const lateRate = parseInt(late_days) / parseInt(days_present || 1);

        // --- Risk Calculation Logic ---
        let riskScore = 0;
        const factors = [];

        // Factor 1: Tenure (Weight: 20%)
        // High risk if very new (< 6 months) or stagnating (> 5 years = 60 months)
        let tenureRisk = 0;
        if (tenureMonths < 6) {
            tenureRisk = 80;
            factors.push('New Hire (Early Integration Risk)');
        } else if (tenureMonths > 60) {
            tenureRisk = 60;
            factors.push('Long Tenure (Stagnation Risk)');
        } else {
            tenureRisk = 10; // Stable
        }
        riskScore += tenureRisk * 0.2;

        // Factor 2: Performance (Weight: 50%)
        // Critical factor. 
        let perfRisk = 0;
        if (avgRating === 0) {
            perfRisk = 50; // Unknown/Neutral
        } else if (avgRating < 3.0) {
            perfRisk = 90;
            factors.push('Low Performance Rating');
        } else if (avgRating < 3.5) {
            perfRisk = 50;
            factors.push('Moderate Performance');
        } else if (avgRating > 4.5) {
            // High performers might leave if underpaid/bored, but generally low risk for *forced* churn, 
            // but high risk for *voluntary* churn?
            // For MVP, let's assume high performance = good retention unless tenure is high.
            perfRisk = 10;
        } else {
            perfRisk = 20;
        }
        riskScore += perfRisk * 0.5;

        // Factor 3: Attendance (Weight: 30%)
        let attendanceRisk = 0;
        if (absentDays >= 3) {
            attendanceRisk = 80;
            factors.push('Frequent Absenteeism');
        } else if (lateRate > 0.2) { // Late more than 20% of the time
            attendanceRisk = 60;
            factors.push('Frequent Lateness');
        } else {
            attendanceRisk = 10;
        }
        riskScore += attendanceRisk * 0.3;

        // Normalize Score
        riskScore = Math.min(100, Math.max(0, Math.round(riskScore)));

        let riskLevel = 'Low';
        if (riskScore >= 70) riskLevel = 'High';
        else if (riskScore >= 40) riskLevel = 'Medium';

        return {
            riskScore,
            riskLevel,
            factors,
            metrics: {
                tenureMonths,
                avgRating: avgRating.toFixed(1),
                absentDays,
                lateRate: (lateRate * 100).toFixed(0) + '%'
            }
        };

    } catch (error) {
        console.error('Calculate churn risk error:', error);
        return null;
    }
};

module.exports = {
    calculateRisk
};
