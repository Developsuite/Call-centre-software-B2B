const fs = require('fs');
const files = [
  'd:/Projects/call_centre_software/src/app/hr/page.tsx',
  'd:/Projects/call_centre_software/src/app/hr/employees/page.tsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Visually thin the border by drastically lowering opacity
  content = content.replace(/border-\[0\.5px\] border-slate-300\/60/g, 'border border-slate-200/30');
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
