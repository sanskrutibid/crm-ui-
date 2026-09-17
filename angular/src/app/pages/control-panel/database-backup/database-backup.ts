import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-database-backup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './database-backup.html',
  styleUrls: ['./database-backup.css']
})
export class DatabaseBackup {

  constructor(private fb: FormBuilder) {

    this.backupForm = this.fb.group({

      module: ['', Validators.required],

      type: ['Full Backup', Validators.required],

      description: ['']

    });

  }

  //==============================

  showCreateForm = false;

  searchText = '';

  selectedBackup: any = null;

  backupForm!: FormGroup;

  //==============================

  backups:any[] = [

    {

      id:1,

      module:'Contacts',

      type:'Full Backup',

      description:'',

      date:'24 Jul 2026 10:00 AM',

      status:'Completed'

    },

    {

      id:2,

      module:'Employees',

      type:'Incremental Backup',

      description:'',

      date:'23 Jul 2026 08:45 PM',

      status:'Pending'

    }

  ];

  //==============================

  filteredBackups(){

    if(!this.searchText){

      return this.backups;

    }

    return this.backups.filter(x=>

      x.module.toLowerCase()

      .includes(this.searchText.toLowerCase())

    );

  }

  //==============================

  selectBackup(item:any){

    this.selectedBackup=item;

  }

  //==============================

  openCreateBackup(){

    this.showCreateForm=true;

    this.backupForm.reset({

      type:'Full Backup'

    });

  }

  //==============================

  cancelBackup(){

    this.showCreateForm=false;

    this.backupForm.reset({

      type:'Full Backup'

    });

  }

  //==============================

  saveBackup(){

    if(this.backupForm.invalid){

      this.backupForm.markAllAsTouched();

      return;

    }

    const value=this.backupForm.value;

    const now=new Date();

    const backup={

      id:Date.now(),

      module:value.module,

      type:value.type,

      description:value.description,

      date:now.toLocaleString(),

      status:'Pending'

    };

    this.backups.unshift(backup);

    this.selectedBackup=backup;

    this.showCreateForm=false;

    this.backupForm.reset({

      type:'Full Backup'

    });

  }

}
