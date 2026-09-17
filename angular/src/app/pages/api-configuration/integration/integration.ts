import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-integration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './integration.html',
  styleUrl: './integration.css',
})
export class Integration {
  // Purna data items jo image me dikh rahe hain
  integrationList: any[] = [
    { 
      id: '24', name: 'Website Url', img: '../img/website.png', formType: 'website',
      subTitle: '(Intregrate your website with crm)', warning: 'Sample website :http://yourdomain.com .'
    },
    { 
      id: 'SMS1', name: 'Transactional Sms', img: '../img/transactionalsms.png', formType: 'sms',
      subTitle: '(Configure sms to send important notification..)'
    },
    { 
      id: 'SMS2', name: 'Promotional Sms', img: '../img/pramotionalsms.png', formType: 'sms',
      subTitle: '(Configure sms to send important notification..)'
    },
    { 
      id: 'WHATSAPP1', name: 'Transactional WhatsApp', img: '../img/whatsapp.png', formType: 'whatsapptrans',
      subTitle: '(Configure whatsapp to send important notification)',
      providers: ['GET', 'POST', 'CURL', 'WHATSAPP', 'GAPPA', '360DIALOG', 'MSG91', 'INTERAKT', 'GALLABOX', 'AISENSY', 'WATI', 'NEXTEL', 'SMSIDEA', 'TELSPIEL', 'CUNNEKT', 'HEYX', 'GUPSHUP', 'GET-OLD'],
      info: 'Choose POST method for supported platforms: WAUTOPILOT, ASKEVA, GETAMSG, CHATMYBOT, CEOITBOX, CHATI, JALPAI, BOTCONTROLPANEL, OFFICIALWA, BONVOICE, WABA_SMS_BOX.',
      warning: 'Warning: Do not send marketing WhatsApp. Your WhatsApp number can be blocked by your provider.'
    },
    { 
      id: 'WHATSAPP2', name: 'Promotional WhatsApp', img: '../img/whatsapp2.png', formType: 'whatsapppromo',
      subTitle: '(Configure whatsapp to send important notification..)',
      providers: ['GET', 'POST', 'CURL', 'WHATSAPP', 'GAPPA', '360DIALOG', 'MSG91', 'INTERAKT', 'GALLABOX', 'AISENSY', 'WATI', 'NEXTEL', 'SMSIDEA', 'TELSPIEL', 'CUNNEKT', 'HEYX', 'GUPSHUP', 'GET-OLD'],
      info: 'Choose POST method for supported platforms: WAUTOPILOT, ASKEVA, GETAMSG, CHATMYBOT, CEOITBOX, CHATI, JALPAI, BOTCONTROLPANEL, OFFICIALWA, BONVOICE, WABA_SMS_BOX.',
      warning: 'Warning: Please read WhatsApp policy from your api provider'
    },
    { 
      id: 'EMAILPROMOTION', name: 'Promotional Email', img: '../img/promoemail.png', formType: 'email',
      subTitle: '(Available for mandrill.com, sendinblue.com, mailgun.com or elasticemail)'
    },
    { 
      id: 'EMAILVERIFY', name: 'Email Address Verification', img: '../img/emailverify.png', formType: 'email_verify',
      subTitle: '(Enable email verification and email data validation)'
    },
  { 
  id: 'FACEBOOK', 
  name: 'Facebook', // Sidebar me dikhne ke liye
  title: 'Connect B2BBricks + Facebook Lead Ads', // Right side header title
  img: '../img/facebook.png', 
  formType: 'facebook',
  subTitle: '(Send info between B2BBricks and Facebook Lead Ads automatically—no code required)',
  warning: 'Please do not select more than 25 pages in a single connection.'
},
  { 
  id: 'MAGICBRICKS', 
  name: 'Magicbricks', // Sidebar me dikhne ke liye
  title: 'Magicbricks.com', // Right side header title
  img: '../img/magicbrick.png', 
  formType: 'magicbricks',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: '99ACRES', 
  name: '99acres', // Sidebar me dikhne ke liye
  title: '99acres.com', // Right side header title
  img: '../img/99acres.png', 
  formType: '99acres',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'COMMONFLOOR', 
  name: 'Commonfloor', // Sidebar me dikhne ke liye
  title: 'Commonfloor.com', // Right side header title
  img: '../img/Commonfloor.png', 
  formType: 'commonfloor',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'HOUSING', 
  name: 'Housing', // Sidebar me dikhne ke liye
  title: 'Housing.com', // Right side header title
  img: '../img/Housing.png', 
  formType: 'housing',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'MAKAAN', 
  name: 'Makaan', // Sidebar me dikhne ke liye
  title: 'Makaan.com', // Right side header title
  img: '../img/Makaan.png', 
  formType: 'makaan',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'SULEKHA', 
  name: 'Sulekha', // Sidebar me dikhne ke liye
  title: 'Sulekha.com', // Right side header title
  img: '../img/Sulekha.png', 
  formType: 'sulekha',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'JUSTDIAL', 
  name: 'Justdail', // Sidebar me dikhne ke liye
  title: 'Justdail.com', // Right side header title
  img: '../img/Justdail.png', 
  formType: 'justdial',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'TAWK.TO', 
  name: 'tawk.to', // Sidebar me dikhne ke liye
  title: 'tawk.to', // Right side header title
  img: '../img/tawk.png', 
  formType: 'tawk',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'PROPERTYWALA', 
  name: 'PropertyWala.com', // Sidebar me dikhne ke liye
  title: 'PropertyWala.com', // Right side header title
  img: '../img/PropertyWala.png', 
  formType: 'propertywala',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'INDIAPROPERTY', 
  name: 'Indiaproperty.com', // Sidebar me dikhne ke liye
  title: 'Indiaproperty.com', // Right side header title
  img: '../img/Indiaproperty.png', 
  formType: 'indiaproperty',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'ROOFANDFLOOR', 
  name: 'Roofandfloor', // Sidebar me dikhne ke liye
  title: 'Roofandfloor.com', // Right side header title
  img: '../img/Roofandfloor.png', 
  formType: 'roofandfloor',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'INDIAMART', 
  name: 'IndiaMART', // Sidebar me dikhne ke liye
  title: 'IndiaMART.com', // Right side header title
  img: '../img/IndiaMART.png', 
  formType: 'indiamart',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'REALESTATEINDIA', 
  name: 'Realestateindia.com', // Sidebar me dikhne ke liye
  title: 'Realestateindia.com', // Right side header title
  img: '../img/Realestateindia.png', 
  formType: 'realestateindia',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'CLICK2CALL', 
  name: 'Click2Call Services', // Sidebar me dikhne ke liye
  title: 'Click2Call Services', // Right side header title
  img: '../img/Click2CalL.png', 
  formType: 'click2call',
  subTitle: '(Response Integration,Capture all response from portal)',
},
  { 
  id: 'IVRDIALER', 
  name: 'IVR Dialer', // Sidebar me dikhne ke liye
  title: 'IVR Dialer', // Right side header title
  img: '../img/IVR.png', 
  formType: 'ivrdialer',
  subTitle: '(automated calling system that dials customers automatically and plays)',
}
  ];





  employeeList: any[] = [
    { value: 'administrator', name: 'Administrator' },
    { value: 'afsana_khatun', name: 'Afsana Khatun' },
    { value: 'antara_ramteke', name: 'Antara Ramteke' },
    { value: 'apurva_thakur', name: 'Apurva Thakur' },
    { value: 'gourav_raut', name: 'Gourav Raut' },
    { value: 'jasmin_kapoor', name: 'Jasmin Kapoor' },
    { value: 'krutika_ijmulwar', name: 'Krutika Ijmulwar' },
    { value: 'navin_tolani', name: 'Navin Tolani' },
    { value: 'niharika_jarunde', name: 'Niharika jarunde' },
    { value: 'pragati_karokar', name: 'Pragati Karokar' },
    { value: 'rajbir_kaur_bajwa', name: 'Rajbir Kaur Bajwa' },
    { value: 'shubham_pophare', name: 'Shubham Pophare' },
    { value: 'sneha_kamble', name: 'Sneha Kamble' },
    { value: 'sumit_chijwani', name: 'Sumit Chijwani' },
    { value: 'yash_chandekar', name: 'Yash Chandekar' }
  ];

  // 2. Form Model Object define karein ([(ngModel)] binding ke liye)
  gatewayForm: any = {
    apiKey: '',
    username: '',
    password: '',
    commonFloorId: '',
    uniqueId: '',
    selectedApiVersion: '',
    branch: '',
    assignTo: ''
  };


onSubmitGateway(): void {
    console.log("Submitting Gateway Form Data:", this.gatewayForm);
    // Yahan aap apna API submit ka logic likh sakte hain
  }


  
  selectedIntegration: any = null; 

  // Left sidebar par click karne ki window
  selectIntegration(item: any) {
    this.selectedIntegration = item;
  }

  // Back button event handler
  goBack() {
    this.selectedIntegration = null; // Wapas primary dashboard trigger karega
  }
}