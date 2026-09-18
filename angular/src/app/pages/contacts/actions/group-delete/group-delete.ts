import { Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-group-delete',
   standalone: true,
  imports: [],
  templateUrl: './group-delete.html',
  styleUrl: './group-delete.css',
})
export class GroupDelete {
@Output() close = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  constructor() {}

  
  confirmDeleteContacts() {
    console.log('Contacts Delete Confirmed!');
    
    
    
    this.confirmed.emit(); 
  }

  
  closeDeleteForm() {
    console.log('Delete Form Closed');
    this.close.emit(); 
  }

}
