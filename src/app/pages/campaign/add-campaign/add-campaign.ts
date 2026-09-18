import { Component, ViewEncapsulation } from '@angular/core';
import { RouterModule, } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-campaign',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './add-campaign.html',
  styleUrls: ['./add-campaign.css'],
  encapsulation: ViewEncapsulation.None 
})
export class AddCampaign {
  currentStep: number = 1;

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    } else {
      alert('Campaign Launched Successfully!');
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  selectAudience(type: string) {
    console.log('Audience selected:', type);
    this.nextStep();
  }
}