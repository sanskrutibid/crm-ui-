import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-attendance-request',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance-request.html',
  styleUrl: './attendance-request.css'
})
export class AttendanceRequest {

  requests = [

    {
      userId: 'USR001',
      name: 'Rahul Sharma',
      image: 'assets/images/user.png',
      type: 'Missed Punch',
      date: '15 Jul 2026',
      reason: 'Forgot Check Out',
      status: 'Pending'
    },

    {
      userId: 'USR002',
      name: 'Priya Patel',
      image: 'assets/images/user.png',
      type: 'Regularization',
      date: '14 Jul 2026',
      reason: 'Client Meeting',
      status: 'Approved'
    },

    {
      userId: 'USR003',
      name: 'Amit Singh',
      image: 'assets/images/user.png',
      type: 'Work From Home',
      date: '13 Jul 2026',
      reason: 'Medical Reason',
      status: 'Pending'
    },

    {
      userId: 'USR004',
      name: 'Sneha Verma',
      image: 'assets/images/user.png',
      type: 'Overtime',
      date: '12 Jul 2026',
      reason: 'Project Deployment',
      status: 'Rejected'
    }

  ];

}