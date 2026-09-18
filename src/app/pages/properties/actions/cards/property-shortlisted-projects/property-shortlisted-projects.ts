import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-property-shortlisted-projects',
  imports: [],
  templateUrl: './property-shortlisted-projects.html',
  styleUrl: './property-shortlisted-projects.css',
})
export class PropertyShortlistedProjects {

    @Input() property: any;

  @Output() close = new EventEmitter<void>();

}
