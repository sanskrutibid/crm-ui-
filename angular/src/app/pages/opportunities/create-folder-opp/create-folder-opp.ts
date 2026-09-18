import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-folder-opp',
  imports: [],
  templateUrl: './create-folder-opp.html',
  styleUrl: './create-folder-opp.css',
})
export class CreateFolderOpp {

   constructor(private router: Router) {}

     goBack() {
  this.router.navigate(['/my-opportunities']);
}
   
}
