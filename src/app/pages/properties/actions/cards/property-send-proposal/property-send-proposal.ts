import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-property-send-proposal',
  imports: [],
  templateUrl: './property-send-proposal.html',
  styleUrl: './property-send-proposal.css',
})
export class PropertySendProposal {

  @Input() propertyId: any;

  @Output() close = new EventEmitter<void>();
}
