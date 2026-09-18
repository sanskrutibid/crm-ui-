import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-opportunity-shortlisted-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './opportunity-shortlisted-properties.html',
  styleUrl: './opportunity-shortlisted-properties.css',
})
export class OpportunityShortlistedProperties implements OnInit {
  @Input() lead: any;
  @Output() close = new EventEmitter<void>();

  selectedStatus = 'all';

  properties = [
    {
      name:'Green Valley Residency',
      location:'Nagpur',
      image:'assets/property1.jpg',
      status:'pending'
    },
    {
      name:'Royal Heights',
      location:'Pune',
      image:'assets/property2.jpg',
      status:'accepted'
    },
    {
      name:'Dream City',
      location:'Mumbai',
      image:'assets/property3.jpg',
      status:'rejected'
    }
  ];

  filteredProperties = [...this.properties];

  ngOnInit() {
    this.filterByCustomerCity();
  }

  filterByCustomerCity() {
    const city = (this.lead?.city || '').trim().toLowerCase();
    if (city) {
      const matched = this.properties.filter(p => p.location.toLowerCase().includes(city));
      if (matched.length > 0) {
        this.properties = matched;
      }
    }
    this.filterProperties();
  }

  filterProperties(){
    if(this.selectedStatus==='all'){
      this.filteredProperties=[...this.properties];
      return;
    }
    this.filteredProperties=this.properties.filter(
      x=>x.status===this.selectedStatus
    );
  }
}