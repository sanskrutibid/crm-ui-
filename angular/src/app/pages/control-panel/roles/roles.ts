import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Role } from '../models/role.model';
import { RoleServiceTs } from '../services/role.service';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-roles',
  imports: [CommonModule,RouterModule,FormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles {

filteredRoles: Role[] = [];

searchText = '';

  roles: Role[] = [];

  // selectedRole!: Role;
  selectedRole: Role | null = null;

  constructor(
    private roleService: RoleServiceTs,
    private router: Router
  ) {}

ngOnInit(){

    this.roleService.roles$

    .subscribe(res=>{
      this.roles = res;

      this.filteredRoles = [...this.roles];

    });

    this.roleService.fetchRoles().subscribe({
      error: (err) => console.error('Error fetching roles on init:', err)
    });

  }

selectRole(role:any){

this.selectedRole=role;

}

  createRole() {

    this.router.navigate(['/create-role']);

  }


  searchRole() {

  if (!this.searchText.trim()) {

    this.filteredRoles = [...this.roles];

    return;

  }

  this.filteredRoles = this.roles.filter(role =>

    role.roleName
        .toLowerCase()
        .includes(this.searchText.toLowerCase())

  );

}


  deleteRole() {

    if (!this.selectedRole) {
      return;
    }

    if (!confirm('Delete this role?')) {
      return;
    }

    this.roleService.deleteRole(this.selectedRole.roleName).subscribe({
      next: () => {
        alert('Role deleted successfully');
        this.selectedRole = null;
      },
      error: (err) => {
        console.error('Error deleting role:', err);
        alert(err?.error?.message || 'Error deleting role');
      }
    });

  }


editRole() {

  if (!this.selectedRole) {
    return;
  }

  this.router.navigate(
    ['/create-role'],
    {
      state: {
        role: this.selectedRole
      }
    }
  );

}

}

