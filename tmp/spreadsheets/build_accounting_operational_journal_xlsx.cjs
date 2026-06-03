const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const inputPath = path.join(process.cwd(), 'docs', 'database', 'accounting-operational-journal-tables.md');
const outputPath = path.join(process.cwd(), 'docs', 'database', 'accounting-operational-journal-tables.xlsx');
const raw = fs.readFileSync(inputPath, 'utf8');
const lines = raw.split(/\r?\n/);
const wb = XLSX.utils.book_new();
let i = 0;
const used = new Set();

const explicitNames = {
  'Final Consultant Master Table': 'Consultant Master',
  'Final Consultant Detail Table': 'Consultant Detail',
  'Final Rent Master Table': 'Rent Master',
  'Final Rent Detail Table': 'Rent Detail',
  'Final Travel Master Table': 'Travel Master',
  'Final Travel Detail Table': 'Travel Detail',
  'Final Consultant Voucher Schedule Master Table': 'Consultant Sch Mst',
  'Final Consultant Voucher Schedule Detail Table': 'Consultant Sch Dtl',
  'Final Rent Voucher Schedule Master Table': 'Rent Sch Mst',
  'Final Rent Voucher Schedule Detail Table': 'Rent Sch Dtl',
  'Final Expense Document Link Table': 'Expense Doc Link',
  'Final Journal Entry Master Table': 'Journal Entry Mst',
  'Final Journal Entry Detail Table': 'Journal Entry Dtl',
  'Final Journal Source Link Table': 'Journal Src Link'
};

function uniqueSheetName(title) {
  let name = explicitNames[title] || title.replace(/[\\/?*\[\]:]/g, '').slice(0, 31);
  let base = name.slice(0, 31);
  let n = 1;
  while (used.has(name)) {
    const suffix = ` ${n}`;
    name = base.slice(0, 31 - suffix.length) + suffix;
    n += 1;
  }
  used.add(name);
  return name;
}

while (i < lines.length) {
  const line = lines[i].trim();
  if (!line.startsWith('## ')) { i += 1; continue; }
  const title = line.replace(/^##\s+/, '').trim();
  i += 1;
  while (i < lines.length && !lines[i].trim().startsWith('| Column name |')) {
    if (lines[i].trim().startsWith('## ')) break;
    i += 1;
  }
  if (i >= lines.length || !lines[i].trim().startsWith('| Column name |')) continue;
  const headers = lines[i].split('|').map(s => s.trim()).filter(Boolean);
  i += 2;
  const rows = [];
  while (i < lines.length) {
    const rowLine = lines[i].trim();
    if (!rowLine.startsWith('|')) break;
    const cells = rowLine.split('|').map(s => s.trim()).filter(Boolean);
    if (cells.length >= headers.length) {
      const row = {};
      headers.forEach((h, idx) => row[h] = cells[idx] ?? '');
      rows.push(row);
    }
    i += 1;
  }
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  if (ws['!ref']) ws['!autofilter'] = { ref: ws['!ref'] };
  ws['!cols'] = headers.map((h) => {
    const maxLen = Math.max(h.length, ...rows.map(r => String(r[h] ?? '').length));
    return { wch: Math.min(Math.max(maxLen + 2, 14), 48) };
  });
  XLSX.utils.book_append_sheet(wb, ws, uniqueSheetName(title));
}

XLSX.writeFile(wb, outputPath);
console.log(outputPath);
console.log(XLSX.utils.book_new ? wb.SheetNames.join('\n') : '');
