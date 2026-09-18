import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Role } from '../models/role.model';
import { RoleServiceTs } from '../services/role.service';

@Component({
  selector: 'app-create-role',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-role.html',
  styleUrl: './create-role.css'
})
export class CreateRole {

  roleName = '';

  recommendedPermission = 'Custom';

  editingRoleId: number | null = null;

  permissions = [

    {
      title: 'Task Management',
      actions: ['View','Add','Edit','Delete']
    },

    {
      title:'Contact Management',
      actions:['View','Add','Edit','Delete','Transfer','History']
    },

    {
      title:'Lead Management',
      actions:[
        'View',
        'Add',
        'Edit',
        'Delete',
        'Transfer',
        'History',
        'Follow-Up',
        'Status',
        'Re-open',
        'Duplicate'
      ]
    },

    {
      title:'Opportunity Management',
      actions:[
        'View',
        'Add',
        'Edit',
        'Delete',
        'Transfer',
        'History',
        'Follow-Up',
        'Status',
        'Re-open'
      ]
    },

    {
      title:'Property Management',
      actions:[
        'View',
        'Add',
        'Edit',
        'Delete',
        'Transfer',
        'History',
        'Follow-Up',
        'Status',
        'Re-open'
      ]
    },

    {
      title:'Project Management',
      actions:[
        'View',
        'Add',
        'Edit',
        'Delete',
        'Transfer'
      ]
    },

    {
      title:'Document Management',
      actions:['View','Add','Edit','Delete']
    },

    {
      title:'Agreement Management',
      actions:['View','Add','Edit','Delete']
    },

    {
      title:'Report Management',
      actions:['Reports']
    },

    {
      title:'Site Visits',
      actions:['View','Add','Delete']
    },

    {
      title:'Marketing & Campaign Management',
      actions:['Marketing & Campaign']
    },

    {
      title:'User Management',
      actions:['View']
    }

  ];

otherPermissions = [

'Activity',

'Send Proposal',

'Agent Networking',

'Download',

'Website / Social Media Publish',

'Group Transfer',

'Hide Mobile Number',

'Communication',

'Limited History',

'Source Masking',

'Training',

'Required Followup Location',

'AI Assistant',

'Attendance (Selfie)',

'Control Panel',

'Setup',

'API Configurations',

'Data Security and Audit'

];

  selectedPermissions:any={};

  constructor(
  private roleService: RoleServiceTs,
  private router: Router
) {

  this.permissions.forEach(module => {

    module.actions.forEach(action => {

      this.selectedPermissions[module.title + '-' + action] = false;

    });

  });

  this.otherPermissions.forEach(permission => {

    this.selectedPermissions[permission] = false;

  });

  const role=history.state.role;

if(role){

this.loadRole(role);
}

 const editRole = history.state.role;

  if (editRole) {

    this.editingRoleId = editRole.id;

    this.roleName = editRole.roleName;

    this.recommendedPermission = editRole.recommendedPermission;

    Object.keys(editRole.permissions).forEach(module => {

      editRole.permissions[module].forEach((action: string) => {

        this.selectedPermissions[module + '-' + action] = true;

      });

    });

  }

}

saveRole() {

  // Role Name Validation
  if (!this.roleName.trim()) {
    alert('Please Enter Role Name');
    return;
  }

  // Duplicate Role Validation
 const exists = this.roleService.getAllRoles().find(role =>

  role.roleName.trim().toLowerCase() ===
  this.roleName.trim().toLowerCase()

  &&

  role.id !== this.editingRoleId

);

  if (exists) {
    alert('Role already exists');
    return;
  }

  // Prepare Permission Object
  const permissionObject: any = {};

  this.permissions.forEach(module => {

    permissionObject[module.title] = [];

    module.actions.forEach(action => {

      if (this.selectedPermissions[module.title + '-' + action]) {

        permissionObject[module.title].push(action);

      }

    });

  });

  // Other Permissions
  permissionObject['Other Permissions'] = [];

  this.otherPermissions.forEach(permission => {

    if (this.selectedPermissions[permission]) {

      permissionObject['Other Permissions'].push(permission);

    }

  });

  // Create Role Object
  const role: Role = {

    id: Date.now(),

    roleName: this.roleName.trim(),

    recommendedPermission: this.recommendedPermission,

    permissions: permissionObject

  };

  if (history.state.role) {
    role.id = history.state.role.id;
  } else if (this.editingRoleId) {
    role.id = this.editingRoleId;
  }

  const isEditing = !!this.editingRoleId || !!history.state.role;
  const oldRoleName = history.state.role?.roleName;

  if (isEditing) {
    const oldName = oldRoleName || this.roleName;
    this.roleService.updateRole(role, oldName).subscribe({
      next: () => {
        alert('Role Updated Successfully');
        this.finishSave();
      },
      error: (err) => {
        console.error('Error updating role:', err);
        alert(err?.error?.message || 'Error updating role');
      }
    });
  } else {
    this.roleService.addRole(role).subscribe({
      next: () => {
        alert('Role Created Successfully');
        this.finishSave();
      },
      error: (err) => {
        console.error('Error creating role:', err);
        alert(err?.error?.message || 'Error creating role');
      }
    });
  }

}

finishSave() {
  // Reset Form
  this.roleName = '';
  this.recommendedPermission = 'Custom';
  this.clearAll();

  // Redirect
  this.router.navigate(['/roles']);
}

  selectAll() {

  this.permissions.forEach(module => {

    module.actions.forEach(action => {

      this.selectedPermissions[module.title + '-' + action] = true;

    });

  });

  this.otherPermissions.forEach(permission => {

    this.selectedPermissions[permission] = true;

  });

}

clearAll() {

  this.permissions.forEach(module => {

    module.actions.forEach(action => {

      this.selectedPermissions[module.title + '-' + action] = false;

    });

  });

  this.otherPermissions.forEach(permission => {

    this.selectedPermissions[permission] = false;

  });

}

onPermissionChange(){

this.clearAll();

switch(this.recommendedPermission){

case 'Admin':

this.selectAll();

break;

case 'Manager':

this.managerPermission();

break;

case 'Executive':

this.executivePermission();

break;

}

}

goBack() {

  this.router.navigate(['/roles']);

}

executivePermission(){

this.permissions.forEach(module=>{

module.actions.forEach(action=>{

if(

action=='View'||

action=='Add'

){

this.selectedPermissions[module.title+'-'+action]=true;

}

});

});

}

managerPermission(){

this.permissions.forEach(module=>{

module.actions.forEach(action=>{

if(

action=='View'||

action=='Add'||

action=='Edit'

){

this.selectedPermissions[module.title+'-'+action]=true;

}

});

});

}

loadRole(role:any){

this.roleName=role.roleName;

this.recommendedPermission=role.recommendedPermission;

Object.keys(role.permissions).forEach(module=>{

role.permissions[module].forEach((action:string)=>{

this.selectedPermissions[module+'-'+action]=true;

});

});

}

}