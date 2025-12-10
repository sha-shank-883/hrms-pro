const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../../frontend/src/App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Define the target block to replace
// We use a regex to be more flexible with whitespace
const targetRegex = /<Route path="super-admin" element=\{\s*<ProtectedRoute allowedRoles=\{\['admin'\]\}>\s*<SuperAdmin \/>\s*<\/ProtectedRoute>\s*\} \/>/;

const replacement = `<Route path="super-admin" element={
                <SuperAdminRoute>
                  <SuperAdmin />
                </SuperAdminRoute>
              } />`;

if (targetRegex.test(content)) {
    const newContent = content.replace(targetRegex, replacement);
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Successfully updated App.jsx');
} else {
    console.error('Target content not found in App.jsx');
    // Log the part of the file where we expect it to be
    const lines = content.split('\n');
    console.log('Lines 125-140:');
    console.log(lines.slice(125, 140).join('\n'));
}
