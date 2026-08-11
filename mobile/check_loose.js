const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('src/screens/DashboardScreen.tsx', 'utf-8');

const ast = babel.parse(code, {
  presets: ['@babel/preset-typescript', '@babel/preset-react'],
  filename: 'DashboardScreen.tsx'
});

let found = false;
babel.traverse(ast, {
  JSXText(path) {
    const text = path.node.value;
    // Check if the text is NOT purely whitespace
    if (text.trim().length > 0) {
      // Find closest JSXElement parent
      let parent = path.parentPath;
      while (parent && parent.type !== 'JSXElement') {
        parent = parent.parentPath;
      }
      if (parent) {
        const parentName = parent.node.openingElement.name.name;
        if (parentName !== 'Text' && parentName !== 'StyledText') {
          console.log(`Loose text found: "${text.trim()}" inside <${parentName}> at line ${path.node.loc.start.line}`);
          found = true;
        }
      }
    }
  },
  JSXExpressionContainer(path) {
    let parent = path.parentPath;
    while (parent && parent.type !== 'JSXElement') {
      parent = parent.parentPath;
    }
    if (parent) {
      const parentName = parent.node.openingElement.name.name;
      if (parentName !== 'Text' && parentName !== 'StyledText') {
        // If it's a string literal or number literal inside {}
        if (path.node.expression.type === 'StringLiteral' || path.node.expression.type === 'NumericLiteral') {
           console.log(`Loose expression literal: ${path.node.expression.value} inside <${parentName}> at line ${path.node.loc.start.line}`);
           found = true;
        }
      }
    }
  }
});

if (!found) console.log("No loose text nodes found by simple AST check.");
