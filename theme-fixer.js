const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /bg-slate-950/g, replacement: 'bg-white' },
  { regex: /bg-slate-900/g, replacement: 'bg-white' },
  { regex: /bg-slate-800\/50/g, replacement: 'bg-slate-50/50' },
  { regex: /bg-slate-800/g, replacement: 'bg-slate-50' },
  { regex: /bg-slate-700/g, replacement: 'bg-slate-100' },
  { regex: /text-slate-500/g, replacement: 'text-slate-500' },
  { regex: /text-slate-400/g, replacement: 'text-slate-500' },
  { regex: /text-slate-300/g, replacement: 'text-slate-600' },
  { regex: /text-slate-200/g, replacement: 'text-slate-700' },
  { regex: /border-slate-700/g, replacement: 'border-slate-200' },
  { regex: /border-slate-600/g, replacement: 'border-slate-300' },
  { regex: /hover:text-white/g, replacement: 'hover:text-slate-900' },
  { regex: /text-white(?!.*bg-brand-red)(?<!bg-brand-red.*)/g, replacement: 'text-slate-900' } // Rough heuristic, will need manual review
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Theme fixes
      let newContent = content;
      for (const { regex, replacement } of replacements) {
        newContent = newContent.replace(regex, replacement);
      }
      
      // specific text-white fixes where regex isn't enough
      // For SystemSettings.tsx
      if (fullPath.includes('SystemSettings.tsx')) {
         newContent = newContent.replace(/text-white/g, 'text-slate-900');
         // revert for brand red button
         newContent = newContent.replace(/text-slate-900 hover:bg-slate-600/g, 'text-slate-900 hover:bg-slate-200');
      }
      
      if (fullPath.includes('EmployeeForm.tsx')) {
        newContent = newContent.replace(/text-white hover:bg-slate-600/g, 'text-slate-900 hover:bg-slate-200');
        newContent = newContent.replace(/text-white/g, 'text-slate-900');
      }

      if (fullPath.includes('EmployeeDetail.tsx')) {
         newContent = newContent.replace(/text-white hover:bg-slate-600/g, 'text-slate-900 hover:bg-slate-200');
      }

      if (fullPath.includes('EmployeeList.tsx')) {
         newContent = newContent.replace(/text-white/g, 'text-slate-900');
      }

      if (fullPath.includes('Dashboard.tsx')) {
         newContent = newContent.replace(/text-white/g, 'text-slate-900');
      }

      if (fullPath.includes('PendingApprovals.tsx')) {
          newContent = newContent.replace(/'#fff'/g, "'#0f172a'");
      }
      
      if (fullPath.includes('Reports.tsx')) {
          newContent = newContent.replace(/'#fff'/g, "'#0f172a'");
      }
      if (fullPath.includes('TeamAttendance.tsx')) {
          newContent = newContent.replace(/'#fff'/g, "'#0f172a'");
      }
      
      if (fullPath.includes('MyAttendance.tsx')) {
          newContent = newContent.replace(/text-white/g, 'text-slate-900');
          // Fix Check In / Check Out buttons
          newContent = newContent.replace(/bg-slate-800 text-slate-900/g, 'bg-slate-100 text-slate-900');
      }

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
