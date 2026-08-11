---
name: performance-optimization
description: >
  Use when optimizing database queries, reducing bundle sizes, improving
  frontend load times, or tuning mobile app performance. Covers backend,
  frontend (React/Vite), and mobile (React Native).
---

# Performance Optimization

## Backend — Database

### N+1 Query Prevention
```javascript
// ❌ BAD — N+1: one query per department
const departments = await pool.query('SELECT * FROM departments');
for (const dept of departments.rows) {
  const empCount = await pool.query(
    'SELECT COUNT(*) FROM employees WHERE department_id = $1', [dept.department_id]
  );
}

// ✅ GOOD — single JOIN
await pool.query(`
  SELECT d.*, COUNT(e.employee_id) as employee_count
  FROM "${schema}".departments d
  LEFT JOIN "${schema}".employees e ON e.department_id = d.department_id
  GROUP BY d.department_id
`);
```

### Always LIMIT
```javascript
// ❌ BAD — returns all rows
await pool.query('SELECT * FROM employees');

// ✅ GOOD — paginated
const limit = Math.min(parseInt(req.query.limit) || 20, 100);
const offset = ((parseInt(req.query.page) || 1) - 1) * limit;
await pool.query(
  `SELECT * FROM "${schema}".employees ORDER BY employee_id LIMIT $1 OFFSET $2`,
  [limit, offset]
);
```

### Select Only Needed Columns
```javascript
// ❌ BAD
await pool.query('SELECT * FROM users');

// ✅ GOOD
await pool.query('SELECT user_id, email, role FROM users');
```

### Use COALESCE for Aggregations
```javascript
-- Returns 0 instead of null when no rows match
SELECT COALESCE(COUNT(*), 0) as count FROM employees WHERE department_id = $1
SELECT COALESCE(SUM(salary), 0) as total FROM payroll WHERE status = 'paid'
```

### Index-Covering Queries
Design queries so they can be satisfied by an index alone when possible:
```sql
-- Index on (employee_id, date) covers this query without touching the table
SELECT employee_id, date, status FROM attendance WHERE employee_id = 1 ORDER BY date;
```

## Backend — API

### Response Compression
```javascript
const compression = require('compression');
app.use(compression()); // Gzip all responses
```

### JSON Serialization
- Return only what the frontend needs
- Use `parseInt` / `parseFloat` for numeric DB fields (they come as strings)
- Format dates client-side, not server-side

### Batch Operations
When processing multiple records, use batch endpoints:
```javascript
// ✅ Single request for bulk operation
POST /api/attendance/bulk-clock-in
{ "employee_ids": [1, 2, 3, 4, 5] }
```

## Frontend (React + Vite)

### Code Splitting (Vite Config)
```javascript
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        charts: ['recharts', 'chart.js'],
        ui: ['react-icons'],
      }
    }
  }
}
```

### Lazy Loading Routes
```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Employees = lazy(() => import('../pages/Employees'));

<Suspense fallback={<div>Loading...</div>}>
  <Dashboard />
</Suspense>
```

### Image Optimization
- Use WebP format instead of PNG/JPEG
- Lazy load below-the-fold images with `loading="lazy"`
- Resize images to display dimensions server-side
- Use CSS gradients/vectors instead of images where possible

### Avoid Unnecessary Re-Renders
```javascript
// ✅ useMemo for expensive computations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name));
}, [data]);

// ✅ useCallback for stable function references
const handleClick = useCallback((id) => {
  setSelected(id);
}, []);

// ✅ React.memo for expensive components
export default React.memo(EmployeeCard);
```

### State Management
- Keep state as local as possible (no global store for everything)
- Use `useContext` for auth/theme only
- Normalize nested data before storing in state

### Bundle Analysis
```bash
npx vite build
npx vite-bundle-analyzer
# or
npx source-map-explorer dist/assets/*.js
```

## Mobile (React Native)

### FlatList Optimization
```tsx
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id.toString()}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={getItemLayout} // for fixed-height items
/>
```

### Image Caching
```tsx
import { Image } from 'expo-image'; // replaces <Image> from react-native

<Image
  source={{ uri: 'https://...' }}
  cachePolicy="memory-disk"
  placeholder={blurhash}
/>
```

### Avoid Inline Styles in Render
```tsx
// ❌ BAD — creates new object every render
<View style={{ padding: 10, margin: 5 }} />

// ✅ GOOD — defined outside component
const styles = StyleSheet.create({
  container: { padding: 10, margin: 5 }
});
```

### Memoize Callbacks
```tsx
// ✅
const onPress = useCallback((id) => {
  navigation.navigate('Detail', { id });
}, [navigation]);
```

### Lazy Load Screens
```tsx
const DashboardScreen = lazy(() => import('./screens/DashboardScreen'));
```

## General

### Caching Strategy
| Data Type | Cache Location | TTL |
|---|---|---|
| Public settings | Browser localStorage | Session |
| User profile | React state + re-fetch on mount | Session |
| Department list | React state + periodic refresh | 5 min |
| Attendance records | React state on page load | Page view |
| Static assets | CDN / service worker | Long (cache bust with hash) |

### Web Vitals Targets
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- First meaningful paint: < 1.5s

### Monitoring
- Check Vite build output for chunk size warnings (>500KB)
- Profile React renders with React DevTools Profiler
- Monitor network tab for waterfall (slow requests)
- Check DB query times via server logs
