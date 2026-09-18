import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-assets-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assets-list.html',
  styleUrl: './assets-list.css'
})
export class AssetsList {

  assets = [

    {
      id:'AST001',
      name:'Dell Latitude 5440',
      category:'Laptop',
      brand:'Dell',
      serial:'DL123456',
      employee:'Rahul Sharma',
      status:'Assigned',
      purchaseDate:'12-Jan-2026'
    },

    {
      id:'AST002',
      name:'HP ProBook',
      category:'Laptop',
      brand:'HP',
      serial:'HP785421',
      employee:'Available',
      status:'Available',
      purchaseDate:'20-Feb-2026'
    },

    {
      id:'AST003',
      name:'Lenovo Monitor',
      category:'Monitor',
      brand:'Lenovo',
      serial:'LN458796',
      employee:'Priya Patel',
      status:'Assigned',
      purchaseDate:'15-Mar-2026'
    },

    {
      id:'AST004',
      name:'Apple iPhone 15',
      category:'Mobile',
      brand:'Apple',
      serial:'APL987654',
      employee:'Maintenance',
      status:'Maintenance',
      purchaseDate:'01-Apr-2026'
    }

  ];

}