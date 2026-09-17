import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';

interface CampaignStructure {
  id: number;
  type: 'Email' | 'WhatsApp' | 'SMS';
  status: 'Running' | 'Draft' | 'Completed';
  title: string;
  targetAudience: string;
  deliveryProgress: number;
  createdOn: string;
  launchedOn?: string;
  budgetSpent: number;
  senderId: string;
  totalSent: number;
  openRate: number;
  clickRate: number;
  messageContent: string;
}

@Component({
  selector: 'app-all-campaign',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './all-campaign.html',
  styleUrls: ['./all-campaign.css']
})
export class AllCampaigns {
  
  selectedCampaign: CampaignStructure | null = null;

  campaigns: CampaignStructure[] = [
    {
      id: 1,
      type: 'Email',
      status: 'Running',
      title: 'Summer Dhamaka Real Estate Offer',
      targetAudience: 'Premium Buyers Segment',
      deliveryProgress: 75,
      createdOn: '2026-05-15',
      launchedOn: '2026-05-20',
      budgetSpent: 15000,
      senderId: 'newsletter@propertyhub.com',
      totalSent: 5000,
      openRate: 64,
      clickRate: 22,
      messageContent: 'Dear Premium Buyer,\n\nGet up to 10% instant discount on booking 3BHK luxury apartments this summer! Offer valid till 15th June 2026. Use code SUMMER10.'
    },
    {
      id: 2,
      type: 'WhatsApp',
      status: 'Draft',
      title: 'Site Visit Follow-up Reminder',
      targetAudience: 'Active Site Visitors',
      deliveryProgress: 0,
      createdOn: '2026-06-01',
      budgetSpent: 0,
      senderId: '+91 98765 43210 (WA Biz)',
      totalSent: 0,
      openRate: 0,
      clickRate: 0,
      messageContent: 'Hello [Name],\n\nThank you for visiting Metro Residency yesterday. Do you have any questions regarding the layout plan or down-payment structure? Let us know!'
    }
  ];

  openCampaignDetails(campaign: CampaignStructure) {
    this.selectedCampaign = campaign;
  }

  closeCampaignDetails() {
    this.selectedCampaign = null;
  }
}