const axios = require('axios');
const speakeasy = require('speakeasy');
const { pool } = require('../config/database');

const API_URL = 'http://localhost:5001/api';

async function runDecouplingTests() {
    console.log('🧪 Starting Global Super Admin & Multi-Tenancy Decoupling Verification...');
    let passed = 0;
    let failed = 0;

    // Helper: authenticate Super Admin (handles 2FA if enabled)
    async function authenticateSuperAdmin() {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'info@hrmspro.online',
            password: 'Hrmspro@123'
        });

        if (loginRes.data.requires2FA) {
            // Fetch 2FA secret from shared.super_admins
            const secretRes = await pool.query('SELECT two_factor_secret FROM shared.super_admins WHERE id = $1', [loginRes.data.userId]);
            const secret = secretRes.rows[0].two_factor_secret;
            const token = speakeasy.totp({
                secret,
                encoding: 'base32'
            });

            const verifyRes = await axios.post(`${API_URL}/auth/2fa/verify-login`, {
                userId: loginRes.data.userId,
                token
            });
            return verifyRes.data;
        }

        return loginRes.data;
    }

    // Test 1: Global Super Admin Login without tenant ID
    let superAdminToken = null;
    try {
        console.log('\n▶ Test 1.3.7: POST /api/auth/login as Global Super Admin without tenant ID');
        const loginResult = await authenticateSuperAdmin();

        if (loginResult.success && loginResult.data.token && loginResult.data.user.isSuperAdmin === true) {
            superAdminToken = loginResult.data.token;
            console.log('  ✅ PASSED: Super Admin logged in globally. Role:', loginResult.data.user.role, 'isSuperAdmin:', loginResult.data.user.isSuperAdmin);
            passed++;
        } else {
            console.error('  ❌ FAILED: Unexpected response:', loginResult);
            failed++;
        }
    } catch (err) {
        console.error('  ❌ FAILED:', err.response?.data || err.message);
        failed++;
    }


    // Test 2: GET /api/auth/profile without tenant ID header
    try {
        console.log('\n▶ Test Profile: GET /api/auth/profile for Global Super Admin without tenant ID header');
        const profileRes = await axios.get(`${API_URL}/auth/profile`, {
            headers: {
                Authorization: `Bearer ${superAdminToken}`
            }
        });

        if (profileRes.data.success && profileRes.data.data.isSuperAdmin === true) {
            console.log('  ✅ PASSED: Profile fetched successfully. Email:', profileRes.data.data.email);
            passed++;
        } else {
            console.error('  ❌ FAILED: Profile response unexpected:', profileRes.data);
            failed++;
        }
    } catch (err) {
        console.error('  ❌ FAILED:', err.response?.data || err.message);
        failed++;
    }

    // Test 3: GET /api/tenants as Global Super Admin without x-tenant-id
    try {
        console.log('\n▶ Test 1.3.8: GET /api/tenants without x-tenant-id header');
        const tenantsRes = await axios.get(`${API_URL}/tenants`, {
            headers: {
                Authorization: `Bearer ${superAdminToken}`
            }
        });

        if (Array.isArray(tenantsRes.data)) {
            console.log(`  ✅ PASSED: Retrieved ${tenantsRes.data.length} tenants without requiring x-tenant-id.`);
            passed++;
        } else {
            console.error('  ❌ FAILED: Expected array of tenants, got:', tenantsRes.data);
            failed++;
        }
    } catch (err) {
        console.error('  ❌ FAILED:', err.response?.data || err.message);
        failed++;
    }

    // Test 4: Non-Super Admin access to /api/tenants is rejected with 403
    try {
        console.log('\n▶ Test 1.3.9: GET /api/tenants as regular employee');
        // Register or login a normal employee
        const empLoginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'john@example.com',
            password: 'Password@123'
        }, {
            headers: { 'x-tenant-id': 'tenant_default' }
        }).catch(() => null);

        if (empLoginRes?.data?.data?.token) {
            try {
                await axios.get(`${API_URL}/tenants`, {
                    headers: {
                        Authorization: `Bearer ${empLoginRes.data.data.token}`,
                        'x-tenant-id': 'tenant_default'
                    }
                });
                console.error('  ❌ FAILED: Employee was able to access /api/tenants');
                failed++;
            } catch (authErr) {
                if (authErr.response?.status === 403) {
                    console.log('  ✅ PASSED: Employee request to /api/tenants correctly rejected with 403 Forbidden.');
                    passed++;
                } else {
                    console.error('  ❌ FAILED: Unexpected status code:', authErr.response?.status);
                    failed++;
                }
            }
        } else {
            console.log('  ℹ️ Skipped employee check (test user not present), verifying with mock employee token...');
            const jwt = require('jsonwebtoken');
            const fakeEmpToken = jwt.sign({ userId: 999, email: 'emp@test.com', role: 'employee' }, process.env.JWT_SECRET || 'fallback_secret');
            try {
                await axios.get(`${API_URL}/tenants`, {
                    headers: { Authorization: `Bearer ${fakeEmpToken}`, 'x-tenant-id': 'tenant_default' }
                });
                console.error('  ❌ FAILED: Mock employee accessed /api/tenants');
                failed++;
            } catch (mockErr) {
                if (mockErr.response?.status === 403) {
                    console.log('  ✅ PASSED: Mock employee request correctly rejected with 403 Forbidden.');
                    passed++;
                } else {
                    console.error('  ❌ FAILED: Unexpected response:', mockErr.response?.status);
                    failed++;
                }
            }
        }
    } catch (err) {
        console.error('  ❌ FAILED:', err.message);
        failed++;
    }

    // Test 5: Verify Super Admin account independence from any tenant schema
    try {
        console.log('\n▶ Test 1.3.10: Tenant Deletion Independence Test');
        const testSlug = 'temp_sandbox_tenant';

        // 1. Create temporary tenant
        await axios.post(`${API_URL}/tenants`, {
            tenantId: testSlug,
            name: 'Temp Sandbox Tenant',
            adminEmail: 'sandbox_admin@test.com',
            adminPassword: 'Password@123'
        }, {
            headers: { Authorization: `Bearer ${superAdminToken}` }
        });
        console.log('  - Temporary tenant created:', testSlug);

        // 2. Drop the tenant schema directly via pool query (simulating schema destruction)
        await pool.query(`DROP SCHEMA IF EXISTS "${testSlug}" CASCADE`);
        await pool.query(`DELETE FROM shared.tenants WHERE tenant_id = $1`, [testSlug]);
        console.log('  - Temporary tenant schema destroyed.');

        // 3. Re-authenticate Super Admin
        const reLogin = await authenticateSuperAdmin();

        if (reLogin.success && reLogin.data.user.isSuperAdmin) {
            console.log('  ✅ PASSED: Super Admin login succeeded completely independent of tenant schema lifecycle.');
            passed++;
        } else {
            console.error('  ❌ FAILED: Super Admin login failed after schema drop');
            failed++;
        }
    } catch (err) {
        console.error('  ❌ FAILED:', err.response?.data || err.message);
        failed++;
    }

    console.log(`\n========================================`);
    console.log(`Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    await pool.end();
    if (failed > 0) process.exit(1);
}

runDecouplingTests();
