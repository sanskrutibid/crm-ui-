import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-property-publish',
  imports: [],
  templateUrl: './property-publish.html',
  styleUrl: './property-publish.css',
})
export class PropertyPublish {

    @Input() propertyId: any;

  @Output() close = new EventEmitter<void>();

}