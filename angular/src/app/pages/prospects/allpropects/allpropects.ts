import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-allpropects',
  standalone: true, // Standalone component
  imports: [CommonModule, RouterModule],
  templateUrl: './allpropects.html',
  styleUrl: './allpropects.css',
  encapsulation: ViewEncapsulation.None
})
export class Allpropects implements OnInit {
  selectedProspect: any | null = null;

  // UI States
  showFolderDropdown = false;
  showSortDropdown = false;
  showOrderDropdown = false;

  // Prospect Database
  prospectsDatabase: { [key: string]: any } = {
    nitin: {
      id: 'nitin',
      name: 'Mr Nitin Kulkarni',
      phone: '+91-*******095',
      date: 'Mar 2022',
      assignTo: 'Yash Chandekar',
      tag: 'BUILDER',
      tagClass: 'builder-tag',
      remark: 'Interested in property structures, setup callback process'
    },
    dayamati: {
      id: 'dayamati',
      name: 'Mrs Dayamati Chirawali',
      phone: '+91-*******031',
      date: 'Apr 2026',
      assignTo: 'Gourav Raut',
      tag: 'TOUFIQUE',
      tagClass: 'toufique',
      remark: 'Spoke with client, looking for immediate requirements'
    }
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