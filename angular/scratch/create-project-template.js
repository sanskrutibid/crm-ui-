const XLSX = require('xlsx');
const path = require('path');

const headers = [
  'Owner Name',
  'Owner Mobile',
  'Owner Email',
  'Project Name',
  'Launch Date',
  'RERA Number',
  'District Code',
  'Locking Duration',
  'Project Area',
  'Area Unit',
  'Type',
  'Total Room',
  'Price',
  'Interested In',
  'Transaction Type',
  'Developer Name',
  'Description',
  'Remark',
  'Address',
  'City',
  'Locality',
  'Pin Code',
  'Branch',
  'Assigned To'
];

const sampleData = [
  {
    'Owner Name': 'John Doe',
    'Owner Mobile': '9876543210',
    'Owner Email': 'john.doe@example.com',
    'Project Name': 'Solitaire Heights',
    'Launch Date': '2026-07-15',
    'RERA Number': 'PRM/KA/RERA/1251/446/PR/180516/001742',
    'District Code': 'SH-01',
    'Locking Duration': '30',
    'Project Area': '1200',
    'Area Unit': 'Sq.Ft.',
    'Type': 'Flat/Apartment',
    'Total Room': '3 BHK',
    'Price': '7500000',
    'Interested In': 'Buy',
    'Transaction Type': 'New',
    'Developer Name': 'Solitaire Developers',
    'Description': 'Luxury 3 BHK apartments with modern amenities.',
    'Remark': 'Good location, high demand.',
    'Address': '123 Main Road, Phase 1',
    'City': 'Mumbai',
    'Locality': 'Andheri West',
    'Pin Code': '400053',
    'Branch': 'Mumbai Main',
    'Assigned To': 'Administrator'
  }
];

const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');

const outputPath = path.join(__dirname, '../src/assets/Project-Import-Template.xlsx');
XLSX.writeFile(workbook, outputPath);
console.log('Successfully created Project-Import-Template.xlsx at:', outputPath);
