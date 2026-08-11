---
name: database-design
description: >
  Use when designing or reviewing database schemas, writing migrations, adding
  indexes, optimizing queries, or working with the multi-tenant PostgreSQL
  database structure for the HRMS project.
---

# Database Design

## Connection & Conventions

- **Engine**: PostgreSQL 17
- **Database**: `hrms_db` on localhost:5432
- **Connection**: `pg` pool via `database.js` — always use `pool.query()`
- **Naming**: `snake_case` for tables, columns, indexes, constraints

## Multi-Tenancy Schema Pattern

Every tenant gets its own schema:

```
public          → global tables (tenants, shared.demo_requests)
tenant_default  → primary tenant schema
tenant_xxx      → each customer tenant gets a schema
```

Access pattern in controllers:
```javascript
const schema = req.tenantId; // from tenant middleware
await pool.query(`SELECT * FROM "${schema}".users WHERE user_id = $1`, [id]);
```

## Naming Rules

| Element | Convention | Example |
|---|---|---|
| Tables | `snake_case`, plural | `users`, `departments`, `email_templates` |
| Columns | `snake_case`, singular | `user_id`, `first_name`, `created_at` |
| Primary keys | `<table>_id` | `user_id`, `department_id` |
| Foreign keys | `<referenced_table>_id` | `user_id`, `department_id` |
| Indexes | `idx_<table>_<column>` | `idx_users_email` |
| Unique constraints | `<table>_<column>_key` | `users_email_key` |
| Check constraints | `<table>_<column>_check` | `holidays_type_check` |

## Column Types Guide

| Data | Type | Reason |
|---|---|---|
| IDs | `SERIAL` or `INTEGER` (PK) | Auto-increment, fast joins |
| Text short | `VARCHAR(255)` | Names, titles, slugs |
| Text long | `TEXT` | Descriptions, content, JSON bodies |
| Email | `VARCHAR(255)` with UNIQUE | Standard limit |
| Phone | `VARCHAR(20)` | Handles formats with +, -, spaces |
| Dates | `DATE` | Birth dates, hire dates |
| Timestamps | `TIMESTAMP WITHOUT TIME ZONE` | created_at, updated_at |
| Booleans | `BOOLEAN` | is_active, is_two_factor_enabled |
| Money | `NUMERIC(12,2)` | Salary, budget, amounts |
| JSON | `JSONB` | Permissions, social_links, education (arrays of objects) |
| Enums | `VARCHAR` + CHECK constraint | `status IN ('active','inactive')` |

## Must-Have Columns on Every Table

```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

## Indexing Strategy

### Always Index
- All primary keys (auto-indexed)
- All foreign keys
- `email` columns (for login lookups)
- `status` columns (for filtering)
- `tenant_id` (for multi-tenant queries)
- Columns used in `WHERE`, `ORDER BY`, `JOIN`

### Composite Indexes
```sql
CREATE INDEX idx_attendance_emp_date ON tenant_default.attendance(employee_id, date);
CREATE INDEX idx_tasks_assignee_status ON tenant_default.tasks(assigned_to, status);
```

### Avoid
- Indexing boolean columns (low cardinality)
- Over-indexing (write overhead)
- Indexes on columns never used in WHERE/JOIN

## Query Patterns

### Parameterized Queries (MANDATORY)
```javascript
// ✅ Safe
await pool.query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ DANGEROUS — never concatenate
await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
```

### Pagination
```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const offset = (page - 1) * limit;

await pool.query(
  `SELECT * FROM "${schema}".employees ORDER BY employee_id DESC LIMIT $1 OFFSET $2`,
  [limit, offset]
);
```

### Dynamic Updates (Partial)
```javascript
const fields = [];
const values = [];
let idx = 1;

if (req.body.first_name) {
  fields.push(`first_name = $${idx++}`);
  values.push(req.body.first_name);
}
if (req.body.email) {
  fields.push(`email = $${idx++}`);
  values.push(req.body.email);
}
fields.push(`updated_at = NOW()`);

await pool.query(
  `UPDATE "${schema}".employees SET ${fields.join(', ')} WHERE employee_id = $${idx}`,
  [...values, id]
);
```

## Migration Pattern

Use `.sql` files in `src/config/` or `src/scripts/`:

```javascript
// src/scripts/upgrade_table.js
const pool = require('../database');

async function run() {
  const schemas = await pool.query(
    `SELECT schema_name FROM information_schema.schemata
     WHERE schema_name LIKE 'tenant_%'`
  );

  for (const { schema_name } of schemas.rows) {
    await pool.query(`
      ALTER TABLE "${schema_name}".table_name
      ADD COLUMN IF NOT EXISTS new_col VARCHAR(255)
    `);
  }
  console.log('Done');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
```

## JSONB Patterns

```sql
-- Query JSONB array
SELECT * FROM employees WHERE social_links @> '{"linkedin": "https://linkedin.com/in/..."}';

-- Query array of objects (education)
SELECT * FROM employees WHERE education @> '[{"degree": "B.Tech"}]';
```

## CHECK Constraints

Use instead of enum types for portability:

```sql
ALTER TABLE holidays ADD CONSTRAINT holidays_type_check
  CHECK (type IN ('mandatory', 'restricted'));
```

## Performance Rules

- Always `LIMIT` on list queries (never return unbounded rows)
- Use `EXPLAIN ANALYZE` on slow queries
- Avoid `SELECT *` in production queries — name columns explicitly
- Prefer `COUNT(*)` over `COUNT(column)` unless you need non-null count
- Use `COALESCE` for nullable fields in aggregations
- Schema-qualify all table names (`"${schema}".table`) to avoid search_path issues
