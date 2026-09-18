import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-opportunity-terms-condition',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './opportunity-terms-condition.html',
  styleUrl: './opportunity-terms-condition.css',
})
export class OpportunityTermsCondition {
  @Output() close = new EventEmitter<void>();

selectedTemplate: number | null = null;

content = '';

templates = [

  {
    id:1,
    name:'Booking Terms',
    content:`
    <h3>Booking Terms</h3>
    <p>Customer must complete payment within 30 days.</p>
    `
  },

  {
    id:2,
    name:'Site Visit Terms',
    content:`
    <h3>Site Visit Terms</h3>
    <p>Site visit timings are subject to availability.</p>
    `
  },

  {
    id:3,
    name:'Cancellation Policy',
    content:`
    <h3>Cancellation Policy</h3>
    <p>Cancellation charges may apply as per company policy.</p>
    `
  }

];

loadTemplate() {

  const template = this.templates.find(
    x => x.id === this.selectedTemplate
  );

  this.content = template ? template.content : '';

}

  sendTerms() {
    console.log(this.content);
    alert('Terms & Conditions sent successfully.');
    this.close.emit();
  }

  cancel() {
    this.close.emit();
  }
}