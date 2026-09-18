import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AssetsList } from '../assets-list/assets-list';
import { AssignAsset } from '../assign-asset/assign-asset';
import { ReturnAsset } from '../return-asset/return-asset';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [
    CommonModule,
    AssetsList,
    AssignAsset,
    ReturnAsset
  ],
  templateUrl: './assets.html',
  styleUrl: './assets.css'
})
export class Assets {

  selectedTab = 'list';

  changeTab(tab:string){

    this.selectedTab = tab;

  }

}