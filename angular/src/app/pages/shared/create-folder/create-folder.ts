import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
  import { Location } from '@angular/common';

@Component({
  selector: 'app-create-folder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-folder.html',
  styleUrls: ['./create-folder.css']
})
export class CreateFolder {

  @Input() title: string = 'Create Folder';
  @Input() totalRecords: number = 0;

  @Output() close = new EventEmitter<void>();



constructor(private location: Location){}

goBack(): void{
   this.location.back();
}

  folderName = '';
  orderNumber = 0;
  permission = '';
  onlyAssigned = false;
  smartFolder = false;
  additionalFilter = '';

  submitFolder() {

  if (!this.folderName.trim()) {
    alert('Folder Name is required');
    return;
  }

  const payload = {
    folderName: this.folderName,
    orderNumber: this.orderNumber,
    permission: this.permission,
    additionalFilter: this.additionalFilter,
    onlyAssigned: this.onlyAssigned,
    smartFolder: this.smartFolder
  };

  console.log(payload);
}
}