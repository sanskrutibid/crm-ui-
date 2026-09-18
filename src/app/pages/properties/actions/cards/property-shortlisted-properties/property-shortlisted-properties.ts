import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-property-shortlisted-properties',
  imports: [],
  templateUrl: './property-shortlisted-properties.html',
  styleUrl: './property-shortlisted-properties.css',
})
export class PropertyShortlistedProperties {

   @Input() property: any;

  @Output() close = new EventEmitter<void>();

}
