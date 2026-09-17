import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsService } from '../../contacts.service';
import * as XLSX from 'xlsx';

const customerTypes = [
  '1 Customer',
  '2 Network Consultant',
  '3 Service Provider',
  '4 General Contacts'
];

const contactTypes = [
  '1 Builder', '2 Seller', '3 Buyer', '4 Landlord', '5 Tenants', '6 Corporate Clients',
  '7 Plumber/Bath Fitting', '8 Painter', '9 Electrician', '10 Carpenter/Furniture',
  '11 Home Appliance Repair', '12 Interior Designer', '13 Cook/House Maid', '14 Key Maker',
  '15 Others', '16 None', '17 None', '18 Marble/Granite Flooring', '19 Electrycity Connection',
  '20 Shop Establishment', '21 Property Lawyers', '22 DTH Connections', '23 Internet Broadband',
  '24 Gas Connection', '25 Water Connection', '26 Construction Material Dealers', '27 Architects',
  '28 Property Valuers', '29 Insurance', '30 Car Loans', '31 Wooden Flooring', '32 Wallpaper',
  '33 Wall Mounting Brackets', '34 Vinyl Flooring', '35 Vaastu Consulting', '36 TV/DVD Repair',
  '37 Tiles Flooring', '38 Steel fabricators', '39 Room Partitions/Dividers', '40 PVC Flooring',
  '41 Pest Control', '42 Packers & Movers', '43 Modular Kitchen', '44 House Keeping', '45 Home Loans',
  '46 False Ceiling', '47 Curtains Installation', '48 Concrete Flooring', '49 Civil Work', '50 Investor',
  '51 Visitor', '52 Friends', '53 Relatives', '54 Chartered Accountant', '55 Printing & Advertising',
  '56 Others', '57 Doctor', '58 Software', '59 Advocate'
];

const sources = [
  '1 Self', '2 Others', '3 99acres.com', '4 Magicbricks.com', '5 Makaan.com', '6 Indiaproperty.com',
  '7 Iproperty.com', '8 Abodesindia.com', '9 Propertywala.com', '10 Realestateindia.com',
  '12 Real Estate Portals (Others)', '13 Justdial.com', '14 Sulekha.com', '15 Indiamart.com',
  '16 Clickindia.com', '17 Indialist.com', '18 Quickr.com', '19 Click.in', '20 Webindia123.com',
  '21 Olx.in', '22 AskLaila.com', '23 Classified Portals (Others)', '24 Own Website', '25 DNA Infoline',
  '26 Direct Client', '27 Old Client Referral', '28 Newspaper ads', '29 Magazine ads',
  '30 Poster/Banner/Billboards', '31 TV ads', '32 Agent Referral', '33 SMS ads', '34 Email Marketing',
  '35 Walk-in', '36 Friends & Relatives', '37 Area Group', '38 Real Estate Club', '39 Employee',
  '40 Telecalling', '41 Referral', '42 FaceBook', '43 Google Search', '44 Real Club', '45 V-Serve',
  '46 BPT', '47 IVR System', '48 VCC Panel', '49 Time Of India', '50 Midday', '51 Mumbai Mirror',
  '52 Gujarat Samachar', '53 Mumbai Samachar', '54 Loksatta', '55 Nav Bharat Times', '56 Infoline.com',
  '57 Canopy', '58 Promotional Activities', '59 Road Show', '60 Cold Calling', '61 Housing.co.in',
  '62 Property Feast', '63 Blog', '64 Google+', '65 Linkedin', '66 Proxio', '67 Housing.com',
  '68 Toll Free No', '69 Staff Referral', '70 Indianmoney.com'
];

const genders = [
  '1 Male',
  '2 Female',
  '3 Other'
];

function cleanPrefixAndNumber(val: any, list: string[]): string | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  const str = val.toString().trim();
  
  // If the user selected the full string like "1 Customer" or typed "1 Customer"
  const matchFull = str.match(/^\d+\s+(.*)$/);
  if (matchFull) {
    return matchFull[1];
  }

  // If the user typed just the number, e.g. "1" or 1
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    // Find the item in list that starts with that number followed by space
    const matchedItem = list.find(item => item.startsWith(`${num} `));
    if (matchedItem) {
      const match = matchedItem.match(/^\d+\s+(.*)$/);
      return match ? match[1] : matchedItem;
    }
  }

  // Otherwise return the string itself
  return str;
}

function cleanPrefix(val: any): string | undefined {
  if (!val) return undefined;
  const str = val.toString().trim();
  const match = str.match(/^\d+\s+(.*)$/);
  return match ? match[1] : str;
}

@Component({
  selector: 'app-import-contacts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-contacts.html',
  styleUrl: './import-contacts.css',
})
export class ImportContacts {
  @Output() close = new EventEmitter<void>();
  @Output() fileUploaded = new EventEmitter<File>();

  selectedFile: File | null = null;
  selectedFileName: string = '';

  constructor(private contactsService: ContactsService) { }

  // File selection handle karne ke liye
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
      console.log('Selected file:', file.name);
    }
  }

  // Selected file ko list se hatane ke liye
  removeSelectedFile(event: Event) {
    event.stopPropagation(); // Dropzone trigger hone se rokne ke liye
    this.selectedFile = null;
    this.selectedFileName = '';
  }

  // File download click handle karne ke liye (vaultstone standard 35 columns template with dropdown lists)
  async downloadSampleFile() {
    console.log('Downloading vaultstone sample excel layout template with dropdowns...');

    // Exact 35 columns headers based on images and requirements
    const headers = [
      'Customer_Code', 'Customer_Prifx', 'Customer_Name', 'Customer_LName',
      'Customer_ISD', 'Customer_Mobile', 'Customer_Email', 'Customer_CustomerType',
      'Customer_ContactType', 'Customer_Gender', 'Customer_Phone', 'Customer_BusinessName',
      'Customer_BusinessType', 'Customer_AddressName', 'Customer_PinCode', 'Customer_DOBDate',
      'Customer_AniversaryDate', 'Customer_IsSmsNotification', 'Customer_IsEmailNotification',
      'Customer_LocalityId', 'Customer_CityId', 'Customer_StateId', 'Customer_Remark',
      'Customer_SourceId', 'Customer_FaxNumber', 'Customer_Website', 'Customer_OfficeName',
      'Customer_Designation', 'Customer_ServiceLocation', 'Customer_BranchId', 'Customer_EmployeeId',
      'Customer_IsTelecalling', 'Customer_SearchKeyword', 'Customer_Private', 'Customer_IsSecure'
    ];

    // Dummy record format for customer reference
    const sampleData = {
      'Customer_Code': 'GC260616-105500-1234',
      'Customer_Prifx': 'Mr',
      'Customer_Name': 'John',
      'Customer_LName': 'Doe',
      'Customer_ISD': '+91',
      'Customer_Mobile': '9876543210',
      'Customer_Email': 'john.doe@example.com',
      'Customer_CustomerType': '1 Customer',
      'Customer_ContactType': '5 Tenants',
      'Customer_Gender': '1 Male',
      'Customer_Phone': '0222543210',
      'Customer_BusinessName': 'B2BBricks Corp',
      'Customer_BusinessType': 'Private Limited',
      'Customer_AddressName': '123 Business Street, Landmark building',
      'Customer_PinCode': '440012',
      'Customer_DOBDate': '1995-08-20',
      'Customer_AniversaryDate': '2022-11-25',
      'Customer_IsSmsNotification': 'Yes',
      'Customer_IsEmailNotification': 'Yes',
      'Customer_LocalityId': 'Dhantoli',
      'Customer_CityId': 'Nagpur',
      'Customer_StateId': 'Maharashtra',
      'Customer_Remark': 'Interested in commercial retail space.',
      'Customer_SourceId': '1 Self',
      'Customer_FaxNumber': '',
      'Customer_Website': 'www.b2bbricks.com',
      'Customer_OfficeName': 'B2BBricks Nagpur Office',
      'Customer_Designation': 'Manager',
      'Customer_ServiceLocation': 'Nagpur',
      'Customer_BranchId': 'Global Team',
      'Customer_EmployeeId': '',
      'Customer_IsTelecalling': 'Yes',
      'Customer_SearchKeyword': 'Nagpur commercial space',
      'Customer_Private': 'True',
      'Customer_IsSecure': 'True'
    };

    const ExcelJS = await import('exceljs');
    const workbook = new (ExcelJS.Workbook || (ExcelJS as any).default.Workbook)();
    const worksheet = workbook.addWorksheet('Contacts_Template');

    // Create a hidden sheet to store large dropdown options list
    const dropdownSheet = workbook.addWorksheet('DropdownData');
    dropdownSheet.state = 'hidden';

    // Populate dropdown data sheets from module level variables
    customerTypes.forEach((val, index) => {
      dropdownSheet.getCell(`A${index + 1}`).value = val;
    });

    contactTypes.forEach((val, index) => {
      dropdownSheet.getCell(`B${index + 1}`).value = val;
    });

    sources.forEach((val, index) => {
      dropdownSheet.getCell(`C${index + 1}`).value = val;
    });

    // 4. Yes/No in Column D
    dropdownSheet.getCell('D1').value = 'Yes';
    dropdownSheet.getCell('D2').value = 'No';

    // 5. True/False in Column E
    dropdownSheet.getCell('E1').value = 'True';
    dropdownSheet.getCell('E2').value = 'False';

    // 6. Gender options in Column F
    genders.forEach((val, index) => {
      dropdownSheet.getCell(`F${index + 1}`).value = val;
    });

    // Define columns
    worksheet.columns = headers.map(header => ({
      header: header,
      key: header,
      width: 24
    }));

    // Add dummy row matching the headers structure
    worksheet.addRow(sampleData);

    // Apply data validations for up to 2000 rows (row 2 to 2001)
    for (let i = 2; i <= 2001; i++) {
      // B: Customer_Prifx
      worksheet.getCell(`B${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"Mr,Mrs,Miss,Dr,Prof"']
      };

      // E: Customer_ISD
      worksheet.getCell(`E${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"+91,+1,+44,+971,+61,+65,+966,+965,+974,+973,+968,+353,+64"']
      };

      // H: Customer_CustomerType
      worksheet.getCell(`H${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['DropdownData!$A$1:$A$4']
      };

      // I: Customer_ContactType
      worksheet.getCell(`I${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['DropdownData!$B$1:$B$59']
      };

      // J: Customer_Gender
      worksheet.getCell(`J${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['DropdownData!$F$1:$F$3']
      };

      // R: Customer_IsSmsNotification
      worksheet.getCell(`R${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['DropdownData!$D$1:$D$2']
      };

      // S: Customer_IsEmailNotification
      worksheet.getCell(`S${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['DropdownData!$D$1:$D$2']
      };

      // X: Customer_SourceId
      worksheet.getCell(`X${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['DropdownData!$C$1:$C$70']
      };

      // AF: Customer_IsTelecalling
      worksheet.getCell(`AF${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['DropdownData!$D$1:$D$2']
      };

      // AH: Customer_Private
      worksheet.getCell(`AH${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['DropdownData!$E$1:$E$2']
      };

      // AI: Customer_IsSecure
      worksheet.getCell(`AI${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['DropdownData!$E$1:$E$2']
      };
    }

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vaultstone_Contacts_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error writing Excel template:', err);
      alert('Failed to generate Excel template. Please try again.');
    }
  }

  // Submit button action handler - Parses and uploads sheet data
  uploadFile() {
    if (!this.selectedFile) return;

    console.log('Reading and parsing uploaded Excel sheet...');
    const fileReader = new FileReader();

    fileReader.onload = (e: any) => {
      try {
        const arrayBuffer = e.target.result;
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Target the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert worksheet rows to JSON array
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawRows.length === 0) {
          alert('Excel sheet is empty. Please add contacts data.');
          return;
        }

        // Limit the upload to 2000 records per Excel sheet as per warning
        const limit = 2000;
        const processRows = rawRows.slice(0, limit);

        // Map B2BBricks Excel column headers to database Contact schema properties
        const mappedContacts = processRows.map(row => {
          // Normalize binary fields (Customer_Private, notifications, isSecure)
          const isPrivate = row['Customer_Private'] === 'Yes' ||
            row['Customer_Private'] === 'yes' ||
            row['Customer_Private'] === true ||
            row['Customer_Private'] === 1 ||
            row['Customer_Private'] === 'True' ||
            row['Customer_Private'] === 'true';

          const isSecure = row['Customer_IsSecure'] === 'Yes' ||
            row['Customer_IsSecure'] === 'yes' ||
            row['Customer_IsSecure'] === true ||
            row['Customer_IsSecure'] === 1 ||
            row['Customer_IsSecure'] === 'True' ||
            row['Customer_IsSecure'] === 'true';

          const sendSms = row['Customer_IsSmsNotification'] === 'Yes' ||
            row['Customer_IsSmsNotification'] === 'yes' ||
            row['Customer_IsSmsNotification'] === true ||
            row['Customer_IsSmsNotification'] === 1 ||
            row['Customer_IsSmsNotification'] === ''; // default to true

          const sendEmail = row['Customer_IsEmailNotification'] === 'Yes' ||
            row['Customer_IsEmailNotification'] === 'yes' ||
            row['Customer_IsEmailNotification'] === true ||
            row['Customer_IsEmailNotification'] === 1 ||
            row['Customer_IsEmailNotification'] === ''; // default to true

          // Build contact schema body
          return {
            uniqueNumber: row['Customer_Code'] ? row['Customer_Code'].toString().trim() : undefined,
            salutation: (() => {
              let prefix = row['Customer_Prifx'] ? row['Customer_Prifx'].toString().trim() : undefined;
              if (prefix === 'Select') prefix = undefined;
              const genderCleaned = cleanPrefixAndNumber(row['Customer_Gender'], genders);
              if (!prefix && genderCleaned) {
                if (genderCleaned === 'Male') {
                  return 'Mr';
                } else if (genderCleaned === 'Female') {
                  return 'Mrs';
                }
              }
              return prefix;
            })(),
            firstName: row['Customer_Name'] ? row['Customer_Name'].toString().trim() : '',
            lastName: row['Customer_LName'] ? row['Customer_LName'].toString().trim() : undefined,
            countryCode: (() => {
              const isd = row['Customer_ISD'] ? row['Customer_ISD'].toString().trim() : '+91';
              return (isd && !isd.startsWith('+') && /^\d+$/.test(isd)) ? '+' + isd : isd;
            })(),
            mobile: row['Customer_Mobile'] ? row['Customer_Mobile'].toString().trim() : '',
            email: row['Customer_Email'] ? row['Customer_Email'].toString().trim() : undefined,
            customerType: cleanPrefixAndNumber(row['Customer_CustomerType'], customerTypes) || 'Customer',
            contactType: cleanPrefixAndNumber(row['Customer_ContactType'], contactTypes) || 'Employee',
            otherNumbers: row['Customer_Phone'] ? row['Customer_Phone'].toString().trim() : undefined,
            companyName: row['Customer_BusinessName'] ? row['Customer_BusinessName'].toString().trim() : undefined,
            companyType: row['Customer_BusinessType'] ? row['Customer_BusinessType'].toString().trim() : undefined,
            address: row['Customer_AddressName'] ? row['Customer_AddressName'].toString().trim() : undefined,
            pincode: row['Customer_PinCode'] ? row['Customer_PinCode'].toString().trim() : undefined,
            dob: row['Customer_DOBDate'] ? row['Customer_DOBDate'].toString().trim() : undefined,
            anniversary: row['Customer_AniversaryDate'] ? row['Customer_AniversaryDate'].toString().trim() : undefined,
            sendSmsGreeting: sendSms,
            sendEmailGreeting: sendEmail,
            locality: row['Customer_LocalityId'] ? row['Customer_LocalityId'].toString().trim() : undefined,
            city: row['Customer_CityId'] ? row['Customer_CityId'].toString().trim() : undefined,
            customerRemark: row['Customer_Remark'] ? row['Customer_Remark'].toString().trim() : undefined,
            source: cleanPrefixAndNumber(row['Customer_SourceId'], sources) || 'Spreadsheet Import',
            faxNumber: row['Customer_FaxNumber'] ? row['Customer_FaxNumber'].toString().trim() : undefined,
            website: row['Customer_Website'] ? row['Customer_Website'].toString().trim() : undefined,
            designation: row['Customer_Designation'] ? row['Customer_Designation'].toString().trim() : undefined,
            professionalLocality: row['Customer_ServiceLocation'] ? row['Customer_ServiceLocation'].toString().trim() : undefined,
            branch: row['Customer_BranchId'] ? row['Customer_BranchId'].toString().trim() : 'Global Team',
            keyword: row['Customer_SearchKeyword'] ? row['Customer_SearchKeyword'].toString().trim() : undefined,
            visibility: isPrivate ? 'Private' : 'Branch',
            isConfidential: isSecure
          };
        }).filter(contact => {
          // Require at least firstName (Customer_Name) and mobile (Customer_Mobile)
          return contact.firstName && contact.mobile;
        });

        if (mappedContacts.length === 0) {
          alert('No valid records found. Make sure Customer_Name and Customer_Mobile columns are filled.');
          return;
        }

        console.log('Sending mapped contacts to server:', mappedContacts.length);

        this.contactsService.importContacts(mappedContacts).subscribe({
          next: (res: any) => {
            alert(`Successfully imported ${res.count || mappedContacts.length} contacts!`);
            this.closeImportForm();
          },
          error: (err: any) => {
            console.error('Spreadsheet bulk import failed:', err);
            alert('Import failed: ' + (err.error?.message || err.message || 'Server error occurred'));
          }
        });

      } catch (err) {
        console.error('Excel file reading/parsing error:', err);
        alert('Failed to process Excel file. Please double-check formatting.');
      }
    };

    fileReader.readAsArrayBuffer(this.selectedFile);
  }

  // Close widget panel form handler
  closeImportForm() {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.close.emit();
  }
}