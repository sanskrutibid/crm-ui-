import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface AudienceProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  segment: string;
  source: string;
  status: 'Active' | 'Inactive';
  addedOn: string;
  tags: string[];
  campaignsSent: number;
  openRate: number;
  clickRate: number;
}

@Component({
  selector: 'app-all-audience',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './all-audience.html',
  styleUrls: ['./all-audience.css']
})
export class AllAudienceComponent implements OnInit {

  // क्लिक किए हुए ऑडियंस की डिटेल होल्ड करने के लिए
  selectedAudience: AudienceProfile | null = null;

  // मॉक डेटा लिस्ट (डेटा ब्लैंक टेस्ट करने के लिए इस ऐरे को खाली [] कर सकते हैं)
  audiences: AudienceProfile[] = [
    {
      id: 1,
      name: 'Gourav Raut',
      email: 'gourav.raut@example.com',
      phone: '+91 9876543210',
      segment: 'High-Value Buyer',
      source: 'Website Walk-In',
      status: 'Active',
      addedOn: '2026-02-18',
      tags: ['Premium Lead', 'Ready to Buy', 'Inbound'],
      campaignsSent: 12,
      openRate: 85,
      clickRate: 42
    },
    {
      id: 2,
      name: 'Anjali Sharma',
      email: 'anjali.s@example.com',
      phone: '+91 9123456789',
      segment: 'Rent Prospects',
      source: '99acres Lead',
      status: 'Active',
      addedOn: '2026-03-05',
      tags: ['2BHK Required', 'Follow Up'],
      campaignsSent: 4,
      openRate: 50,
      clickRate: 12
    },
    {
      id: 3,
      name: 'Rajesh Kumar',
      email: 'rajesh.k@example.com',
      phone: '+91 8888888888',
      segment: 'Investor Club',
      source: 'Cold Call',
      status: 'Inactive',
      addedOn: '2025-11-20',
      tags: ['Commercial Property', 'Bulk Deal'],
      campaignsSent: 28,
      openRate: 20,
      clickRate: 3
    }
  ];

  constructor() { }

  ngOnInit(): void {}

  openAudienceDetails(audience: AudienceProfile) {
    this.selectedAudience = audience;
  }

  closeAudienceDetails() {
    this.selectedAudience = null;
  }
}