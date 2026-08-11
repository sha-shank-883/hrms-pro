/**
 * security-scan.js — Scans the backend for common security issues.
 * Run: node src/scripts/security-scan.js
 *
 * Checks:
 *   1. Route files: every endpoint has `protect` + `authorize` middleware
 *   2. Controller files: all queries use parameterized ($1, $2), not string concat
 *   3. Public routes: endpoints without auth middleware (intentional or gap?)
 *   4. Secrets: hardcoded keys or tokens in source code
 *   5. Validation: express-validator usage in routes
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const ROUTES_DIR = path.join(ROOT, 'src', 'routes');
const CONTROLLERS_DIR = path.join(ROOT, 'src', 'controllers');

const results = { pass: [], warn: [], fail: [] };
let totalIssues = 0;

function log(type, msg, file, line) {
  const tag = { pass: '✅', warn: '⚠️', fail: '❌' }[type];
  results[type].push({ msg, file, line });
  totalIssues++;
  console.log(`  ${tag} [${type.toUpperCase()}] ${msg}${file ? ` (${file}${line ? ':' + line : ''})` : ''}`);
}

// -------------------------------------------------------
// 1. Scan Route Files
// -------------------------------------------------------
console.log('\n=== 1. Route Security Check ===\n');

const routeFiles = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('Routes.js'));

for (const file of routeFiles) {
  const filePath = path.join(ROUTES_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Find all routes: router.get/post/put/delete/patch
  const routePattern = /router\.(get|post|put|delete|patch)\(/g;
  let match;
  const routes = [];

  while ((match = routePattern.exec(content)) !== null) {
    // Get the line number
    const lineNum = content.substring(0, match.index).split('\n').length;
    const method = match[1];
    const lineContent = lines[lineNum - 1].trim();

    // Check if this route has middleware before it
    // Look for protect/authorize in the same line or preceding lines
    const routeStart = Math.max(0, match.index - 200);
    const context = content.substring(routeStart, match.index + 200);

    const hasAuth = /authenticateToken/.test(context.substring(0, 100));
    const hasRoleCheck = /authorizeRole\(|authorize\(/.test(context.substring(0, 100));
    const isPublic = !hasAuth && !hasRoleCheck;

    routes.push({
      method,
      line: lineNum,
      lineContent,
      hasAuth,
      hasRoleCheck,
      isPublic
    });
  }

  for (const r of routes) {
    if (r.isPublic) {
      // Could be intentional (health, login, register, public CMS).
      // Flag it for review if it looks like a data endpoint.
      const suspicious = r.lineContent.match(/(departments|employees|settings|users|leaves|tasks|payroll)/i);
      if (suspicious) {
        log('warn', `Public route (no auth): ${r.method.toUpperCase()} — ${r.lineContent.replace(/,\s*$/, '')}`, file, r.line);
      } else {
        log('pass', `Intentionally public: ${r.method.toUpperCase()} ${r.lineContent.replace(/,\s*$/, '')}`, file, r.line);
      }
    } else if (!r.hasRoleCheck) {
      log('warn', `Has auth but no role check: ${r.method.toUpperCase()} ${r.lineContent.replace(/,\s*$/, '')}`, file, r.line);
    } else {
      log('pass', `Protected + authorized: ${r.method.toUpperCase()} ${r.lineContent.replace(/,\s*$/, '')}`, file, r.line);
    }
  }
}

// -------------------------------------------------------
// 2. Scan Controller Files for SQL Injection Risk
// -------------------------------------------------------
console.log('\n=== 2. SQL Injection Scan (String Concatenation in Queries) ===\n');

const controllerFiles = fs.readdirSync(CONTROLLERS_DIR).filter(f => f.endsWith('.js'));

// Patterns that indicate string concatenation in SQL
const sqlConcatPatterns = [
  /query\(`[^`]*\$\{/,
  /query\(`[^`]*'\s*\+/,
  /query\(`[^`]*"\s*\+/,
  /query\(['"][^'"]*\$\{/,
];

for (const file of controllerFiles) {
  const filePath = path.join(CONTROLLERS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Check for parameterized queries
  const hasParametrized = /\$\d+/.test(content);

  // Check for string concat in SQL
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match pool.query or client.query with template literal containing ${}
    if (/\.query\(`/.test(line) && /\$\{/.test(line)) {
      log('fail', `Possible SQL injection — string interpolation in query`, file, i + 1);
    }
    // Match .query with string concatenation
    if (/\.query\(['"`]/.test(line) && /\s*\+/.test(line) && !line.includes('$' + '{')) {
      // Verify it's actually a query, not a log statement
      if (line.includes('SELECT') || line.includes('INSERT') || line.includes('UPDATE') || line.includes('DELETE')) {
        log('fail', `Possible SQL injection — string concatenation in SQL`, file, i + 1);
      }
    }
  }

  if (hasParametrized) {
    log('pass', `Uses parameterized queries (\$1, \$2, ...)`, file);
  }
}

// -------------------------------------------------------
// 3. Scan for Hardcoded Secrets
// -------------------------------------------------------
console.log('\n=== 3. Hardcoded Secrets Scan ===\n');

const srcDir = path.join(ROOT, 'src');
function findJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...findJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allJsFiles = findJsFiles(path.join(ROOT, 'src')).map(f => path.relative(ROOT, f));

const secretPatterns = [
  { pattern: /xsmtpsib-[a-zA-Z0-9]{40,}/, name: 'Brevo SMTP API Key' },
  { pattern: /sk-[a-zA-Z0-9]{20,}/, name: 'OpenAI API Key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub Personal Access Token' },
  { pattern: /AKIA[A-Z0-9]{16}/, name: 'AWS Access Key' },
  { pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/, name: 'Private Key' },
];

let secretsFound = 0;
for (const file of allJsFiles) {
  const filePath = path.join(ROOT, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const { pattern, name } of secretPatterns) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        // Mask the secret in output
        const masked = lines[i].replace(pattern, '***REDACTED***').trim().substring(0, 80);
        log('fail', `${name} found: ${masked}`, file, i + 1);
        secretsFound++;
      }
    }
  }
}

if (secretsFound === 0) {
  log('pass', 'No hardcoded API keys or secrets found in src/');
}

// -------------------------------------------------------
// 4. Validation Middleware Check
// -------------------------------------------------------
console.log('\n=== 4. Validation Middleware Check ===\n');

for (const file of routeFiles) {
  const filePath = path.join(ROUTES_DIR, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const hasValidation = /body\(|param\(|query\(|validationResult/.test(content);

  if (hasValidation) {
    log('pass', `Uses express-validator`, file);
  } else {
    log('warn', `No express-validator found — add input validation`, file);
  }
}

// -------------------------------------------------------
// Summary
// -------------------------------------------------------
console.log('\n========================================');
console.log('   Security Scan Summary');
console.log('========================================\n');

console.log(`  ✅ Pass:  ${results.pass.length}`);
console.log(`  ⚠️  Warn:  ${results.warn.length}`);
console.log(`  ❌ Fail:  ${results.fail.length}`);
console.log(`  Total issues: ${totalIssues}`);
console.log('');

if (results.fail.length > 0) {
  console.log('  ❌ CRITICAL ISSUES TO FIX:');
  for (const r of results.fail) {
    console.log(`     - ${r.msg}${r.file ? ` (${r.file}${r.line ? ':' + r.line : ''})` : ''}`);
  }
  console.log('');
  process.exitCode = 1;
} else if (results.warn.length > 0) {
  console.log('  ⚠️  Warnings to review (not blocking)');
  console.log('');
} else {
  console.log('  ✅ All checks passed!');
  console.log('');
}
