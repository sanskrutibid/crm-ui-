const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../src/assets/Opportunity-Import-Template.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const headers = [];
const range = XLSX.utils.decode_range(worksheet['!ref']);
const row = range.s.r; // first row

for (let col = range.s.c; col <= range.e.c; col++) {
  const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = worksheet[cellRef];
  headers.push(cell ? cell.v : null);
}

console.log('Template Headers:', headers);
