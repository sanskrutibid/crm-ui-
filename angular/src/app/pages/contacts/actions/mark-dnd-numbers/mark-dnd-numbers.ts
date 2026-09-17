import { Component ,Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-mark-dnd-numbers',
   standalone: true,
  imports: [],
  templateUrl: './mark-dnd-numbers.html',
  styleUrl: './mark-dnd-numbers.css',
})
export class MarkDndNumbers {

  @Output() close = new EventEmitter<void>();

  closeDndForm() {
     console.log('Cancel clicked');
    this.close.emit(); 
  }
}
