const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const inputPath = path.join(process.cwd(), 'docs', 'database', 'admin-master-tables-formalized.md');
const outputPath = path.join(process.cwd(), 'docs', 'database', 'admin-master-tables-formalized.xlsx');
const raw = fs.readFileSync(inputPath, 'utf8');
const lines = raw.split(/\r?\n/);

const wb = XLSX.utils.book_new();
let i = 0;

function safeSheetName(name) {
  return name.replace(/[\\/?*\[\]:]/g, '').slice(0, 31);
}

while (i < lines.length) {
  const line = lines[i].trim();
  if (!line.startsWith('## ')) {
    i += 1;
    continue;
  }

  const title = line.replace(/^##\s+/, '').trim();
  i += 1;

  while (i < lines.length && !lines[i].trim().startsWith('| Column name |')) {
    if (lines[i].trim().startsWith('## ')) break;
    i += 1;
  }

  if (i >= lines.length || !lines[i].trim().startsWith('| Column name |')) {
    continue;
  }

  const headers = lines[i].split('|').map(s => s.trim()).filter(Boolean);
  i += 2; // skip header + separator

  const rows = [];
  while (i < lines.length) {
    const rowLine = lines[i].trim();
    if (!rowLine.startsWith('|')) break;
    const cells = rowLine.split('|').map(s => s.trim()).filter(Boolean);
    if (cells.length >= headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = cells[idx] ?? '';
      });
      rows.push(row);
    }
    i += 1;
  }

  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  ws['!autofilter'] = { ref: XLSX.utils.encode_range(XLSX.utils.decode_range(ws['!ref'])) };
  ws['!cols'] = headers.map((h) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map(r => String(r[h] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 14), 48) };
  });

  XLSX.utils.book_append_sheet(wb, ws, safeSheetName(title));
}

XLSX.writeFile(wb, outputPath);
console.log(outputPath);
