const ExcelJS = require('exceljs');
const path = require('path');

async function main() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Opportunities');

  // Define columns
  const columns = [
    { header: 'Customer Name', key: 'customerName', width: 25, required: true },
    { header: 'Customer Mobile', key: 'customerMobile', width: 20, required: true },
    { header: 'Customer Email', key: 'customerEmail', width: 25, required: false },
    { header: 'Customer Company', key: 'customerCompany', width: 25, required: false },
    { header: 'Request Date', key: 'requestDate', width: 18, required: true },
    { header: 'For (Purpose)', key: 'purpose', width: 18, required: false },
    { header: 'Looking For', key: 'lookingFor', width: 22, required: false },
    { header: 'Min Budget', key: 'minBudget', width: 15, required: false },
    { header: 'Max Budget', key: 'maxBudget', width: 15, required: false },
    { header: 'Budget Unit', key: 'budgetUnit', width: 15, required: false },
    { header: 'Min Area', key: 'minArea', width: 15, required: false },
    { header: 'Max Area', key: 'maxArea', width: 15, required: false },
    { header: 'Area Unit', key: 'areaUnit', width: 15, required: false },
    { header: 'City', key: 'city', width: 18, required: false },
    { header: 'Locality', key: 'locality', width: 18, required: false },
    { header: 'Bedroom', key: 'bedroom', width: 15, required: false },
    { header: 'Furnishing', key: 'furnishing', width: 18, required: false },
    { header: 'Transaction', key: 'transaction', width: 18, required: false },
    { header: 'Preferences', key: 'preferences', width: 25, required: false },
    { header: 'Property Age', key: 'propertyAge', width: 15, required: false },
    { header: 'Description', key: 'description', width: 30, required: false },
    { header: 'Internal Note', key: 'internalNote', width: 30, required: false },
    { header: 'Stage/Purpose', key: 'stagePurpose', width: 18, required: false },
    { header: 'Schedule Date', key: 'scheduleDate', width: 18, required: false },
    { header: 'Schedule Time', key: 'scheduleTime', width: 18, required: false },
    { header: 'Schedule Where', key: 'scheduleWhere', width: 20, required: false },
    { header: 'Schedule Remark', key: 'scheduleRemark', width: 25, required: false },
    { header: 'Keyword', key: 'keyword', width: 20, required: false },
    { header: 'Refer By', key: 'referBy', width: 18, required: false },
    { header: 'Folder', key: 'folder', width: 18, required: false },
    { header: 'Source', key: 'source', width: 18, required: true },
    { header: 'Branch', key: 'branch', width: 18, required: true },
    { header: 'Assigned To', key: 'assignedTo', width: 20, required: false },
    { header: 'Status', key: 'status', width: 15, required: false }
  ];

  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width
  }));

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;

  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: col.required ? 'FFFFFFFF' : 'FF333333' }
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: col.required ? 'FFFF0000' : 'FFD3D3D3' } // Red or Light Grey
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF999999' } },
      left: { style: 'thin', color: { argb: 'FF999999' } },
      bottom: { style: 'medium', color: { argb: 'FF333333' } },
      right: { style: 'thin', color: { argb: 'FF999999' } }
    };
  });

  // Add some sample data rows
  const sampleRow1 = {
    customerName: 'Rahul Sharma',
    customerMobile: '9876543210',
    customerEmail: 'rahul.sharma@example.com',
    customerCompany: 'Sharma Tech Solutions',
    requestDate: '26-Jun-2026',
    purpose: 'Buy',
    lookingFor: 'Residential Apartment',
    minBudget: 80,
    maxBudget: 120,
    budgetUnit: 'Lacs',
    minArea: 1000,
    maxArea: 1500,
    areaUnit: 'Sq.Ft.',
    city: 'Nagpur',
    locality: 'Dhantoli',
    bedroom: '2 BHK',
    furnishing: 'Semi Furnished',
    transaction: 'Resale',
    preferences: 'Road facing, high floor preferred',
    propertyAge: '0-5 Years',
    description: 'Looking for a spacious 2 BHK apartment for family',
    internalNote: 'High intent customer. Wants to close quickly.',
    stagePurpose: 'Site Visit',
    scheduleDate: '28-Jun-2026',
    scheduleTime: '11:00am',
    scheduleWhere: 'Dhantoli Heights Project Site',
    scheduleRemark: 'Rahul will visit with family.',
    keyword: 'dhantoli flat 2bhk',
    referBy: 'Google Ads',
    folder: 'Dhantoli Premium',
    source: 'Website',
    branch: 'Nagpur Branch',
    assignedTo: 'Agent Name or User ID',
    status: 'In Progress'
  };

  const sampleRow2 = {
    customerName: 'Priya Patel',
    customerMobile: '9123456789',
    customerEmail: 'priya.patel@example.com',
    customerCompany: 'Patel Trading Corp',
    requestDate: '26-Jun-2026',
    purpose: 'Rent/Lease',
    lookingFor: 'Residential Independent House / Villa',
    minBudget: 35000,
    maxBudget: 50000,
    budgetUnit: 'Rupees',
    minArea: 1500,
    maxArea: 2500,
    areaUnit: 'Sq.Ft.',
    city: 'Nagpur',
    locality: 'Ramdaspeth',
    bedroom: '3 BHK',
    furnishing: 'Fully Furnished',
    transaction: 'Resale',
    preferences: 'Gated community, modular kitchen',
    propertyAge: '5-10 Years',
    description: 'Renting a fully furnished villa/house',
    internalNote: 'Relocating from Pune next month.',
    stagePurpose: 'Site Visit',
    scheduleDate: '29-Jun-2026',
    scheduleTime: '4:00pm',
    scheduleWhere: 'Ramdaspeth Green Valley Villa 12',
    scheduleRemark: 'Priya wants to see modular kitchen details.',
    keyword: 'ramdaspeth villa rent',
    referBy: 'Direct Walkin',
    folder: 'Ramdaspeth Rental',
    source: 'Spreadsheet Import',
    branch: 'Nagpur Branch',
    assignedTo: 'Agent Name or User ID',
    status: 'In Progress'
  };

  worksheet.addRow(sampleRow1);
  worksheet.addRow(sampleRow2);

  // Style the sample rows slightly
  for (let r = 2; r <= 3; r++) {
    const row = worksheet.getRow(r);
    row.height = 20;
    for (let c = 1; c <= columns.length; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
      };
    }
  }

  const outputPath = path.join(__dirname, '../src/assets/Opportunity-Import-Template.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Generated styled template successfully at: ${outputPath}`);
}

main().catch(err => {
  console.error('Error generating template:', err);
  process.exit(1);
});
