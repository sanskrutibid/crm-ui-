import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-property-history',
  imports: [],
  templateUrl: './property-history.html',
  styleUrl: './property-history.css',
})
export class PropertyHistory {
  
    @Input() propertyId!: string;

  @Output() close = new EventEmitter<void>();
}
