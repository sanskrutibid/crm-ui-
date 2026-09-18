import { Component ,ViewEncapsulation} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-backlog',
  imports: [CommonModule, RouterModule],
  templateUrl: './backlog.html',
  styleUrl: './backlog.css',
  encapsulation: ViewEncapsulation.None
})
export class Backlog {
   selectedProspect: any | null = null;

  // UI States
  showFolderDropdown = false;
  showSortDropdown = false;
  showOrderDropdown = false;

  // Prospect Database
  prospectsDatabase: { [key: string]: any } = {

  };

  // HTML loop ke liye array
  get prospectsArray() {
    return Object.values(this.prospectsDatabase);
  }

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const returnId = params['returnTo'];
      if (returnId && this.prospectsDatabase[returnId]) {
        this.selectedProspect = this.prospectsDatabase[returnId];
      }
    });
  }

  selectProspect(id: string) {
    this.selectedProspect = this.prospectsDatabase[id];
  }

  clearSelection() {
    this.selectedProspect = null;
    this.router.navigate([], { queryParams: { returnTo: null }, queryParamsHandling: 'merge' });
  }

  navigateToConvert(prospectId: string) {
    this.router.navigate(['/convert', prospectId], { queryParams: { returnTo: prospectId } });
  }
}
