import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login';
import { SignupComponent } from './pages/auth/signup/signup';
import { authGuard, publicGuard } from './pages/auth/auth.guard';

import { Dashboard } from './layout/dashboard/dashboard';
import { CreateContacts } from './pages/contacts/create-contacts/create-contacts';
import { OpenTasks } from './pages/todolist/open-tasks/open-tasks';
import { AllTasks } from './pages/todolist/all-tasks/all-tasks';
import { AllContacts } from './pages/contacts/all-contacts/all-contacts';
import { Todayscall } from './pages/prospects/todayscall/todayscall';
import { Allpropects } from './pages/prospects/allpropects/allpropects';
import { Backlog } from './pages/prospects/backlog/backlog';
import { GroupTransfer } from './pages/shared/group-transfer/group-transfer';
import { CreateFolder } from './pages/shared/create-folder/create-folder';
import { CreateLeads } from './pages/leads/create-leads/create-leads';
import { MyLeads } from './pages/leads/my-leads/my-leads';
import { TodaysLeads } from './pages/leads/todays-leads/todays-leads';
import { Todayfollow } from './pages/leads/todayfollow/todayfollow';
import { OpenLeads } from './pages/leads/open-leads/open-leads';
import { AllLeads } from './pages/leads/all-leads/all-leads';
import { LeadBacklog } from './pages/leads/lead-backlog/lead-backlog';
import { LeadCalendar } from './pages/leads/lead-calender/calender';
import { ConvertComponent } from './pages/contacts/convert/convert';
import { CreateOpportunity } from './pages/opportunities/create-opportunity/create-opportunity';
import { MyOpportunities } from './pages/opportunities/my-opportunities/my-opportunities';
import { TodayFollowups } from './pages/opportunities/today-followups-opp/today-followups';
import { OpenOpp } from './pages/opportunities/open-opp/open-opp';
import { AllOpp } from './pages/opportunities/all-opp/all-opp';
import { OppBacklog } from './pages/opportunities/opp-backlog/opp-backlog';
import { OppCalendar } from './pages/opportunities/opp-calendar/opp-calendar';
import { CreateProperty } from './pages/properties/create-property/create-property';
import { MyProperty } from './pages/properties/my-property/my-property';
import { PropertyFollowups } from './pages/properties/property-todayfollowups/property-followups';
import { AvailableProperty } from './pages/properties/available-property/available-property';
import { AllProperty } from './pages/properties/all-property/all-property';
import { FollowUpsProperty } from './pages/properties/follow-ups-property/follow-ups-property';
import { BacklogProperty } from './pages/properties/backlog-property/backlog-property';
import { CreateProject } from './pages/project/create-project/create-project';
import { AvailableProject } from './pages/project/available-project/available-project';
import { AllProject } from './pages/project/all-project/all-project';
import { ReraProject } from './pages/project/rera-project/rera-project';
import { CreateVisit } from './pages/site-visits/create-visit/create-visit';
import { AllVisits } from './pages/site-visits/all-visits/all-visits';
import { CreateTemplate } from './pages/templates/create-template/create-template';
import { AllTemplates } from './pages/templates/all-templates/all-templates';
import { AllCampaigns } from './pages/campaign/all-campaign/all-campaign';
import { AllAudienceComponent } from './pages/campaign/all-audience/all-audience';
import { SoldAgreement } from './pages/agreements/sold-agreement/sold-agreement';
import { RentAgreement } from './pages/agreements/rent-agreement/rent-agreement';
import { AddCampaign } from './pages/campaign/add-campaign/add-campaign';
import { CreateAgreement } from './pages/agreements/addsale-agreement/create-agreement';
import { CreateDocument } from './pages/documents/create-document/create-document';
import { AllDocument } from './pages/documents/all-document/all-document';
import { LegalDocument } from './pages/documents/legal-document/legal-document';
import { Reports } from './pages/reports/reports';
import { AddrentAgreement } from './pages/agreements/addrent-agreement/addrent-agreement';
import { Integration } from './pages/api-configuration/integration/integration';
import { AttendanceComponent } from './pages/attendance/attendance';
import { LeadRouting } from './pages/api-configuration/lead-routing/lead-routing';
import { Webhook } from './pages/api-configuration/webhook/webhook';
import { AddTask } from './pages/todolist/add-task/add-task';

import { ComposeMail } from './pages/mailbox/compose-mail/compose-mail';
import { ScheduledMails } from './pages/mailbox/scheduled-mails/scheduled-mails';
import { MailDeliveryReports } from './pages/mailbox/delivery-reports/delivery-reports';
import { SendSms } from './pages/messages/send-sms/send-sms';
import { ScheduledSms } from './pages/messages/scheduled-sms/scheduled-sms';
import { SmsDeliveryReports } from './pages/messages/delivery-reports/delivery-reports';
import { AdvancedSearch } from './pages/shared/advanced-search/advanced-search';
import { SearchResultComponent } from './pages/shared/search-result/search-result';
import { SmtpSettingsComponent } from './pages/shared/smtp-settings/smtp-settings';
import { CreateAudience } from './pages/contacts/actions/create-audience/create-audience';
import { SendGroupSms } from './pages/contacts/actions/send-group-sms/send-group-sms';
import { SendGroupEmail } from './pages/contacts/actions/send-group-email/send-group-email';
import { GroupDelete } from './pages/contacts/actions/group-delete/group-delete';
import { DownloadContacts } from './pages/contacts/actions/download-contacts/download-contacts';
import { ImportContacts } from './pages/contacts/actions/import-contacts/import-contacts';
import { MarkDndNumbers } from './pages/contacts/actions/mark-dnd-numbers/mark-dnd-numbers';
import { EmailVerification } from './pages/contacts/actions/email-verification/email-verification';
import { MergeContacts } from './pages/contacts/actions/merge-contacts/merge-contacts';
import { GroupTransferOpp } from './pages/opportunities/group-transfer-opp/group-transfer-opp';
import { CreateFolderOpp } from './pages/opportunities/create-folder-opp/create-folder-opp';
import { PropertyTransfer } from './pages/properties/property-transfer/property-transfer';
import { PropertyCreateFolder } from './pages/properties/property-create-folder/property-create-folder';
import { PropertyDownlaodAction } from './pages/properties/actions/property-downlaod-action/property-downlaod-action';
import { Roles } from './pages/control-panel/roles/roles';
import { CreateRole } from './pages/control-panel/create-role/create-role';
import { AdministratorDashboard } from './pages/administrator/administrator-dashboard/administrator-dashboard';
import { Empattendance } from './pages/administrator/attendance/empattendance/empattendance';
import { Leave } from './pages/administrator/leave/leave/leave';
import { Payroll } from './pages/administrator/payroll/payroll/payroll';
import { Documents } from './pages/administrator/documents/documents/documents';
import { Assets } from './pages/administrator/assets/assets/assets';
import { Holidays } from './pages/administrator/holidays/holidays/holidays';
import { TimeLines } from './pages/geo-location/time-lines/time-lines';
import { LiveLocation } from './pages/geo-location/live-location/live-location';
import { RouteForToday } from './pages/geo-location/route-for-today/route-for-today';
import { Branches } from './pages/control-panel/branches/branches';
import { Sources } from './pages/control-panel/sources/sources';
import { DatabaseBackup } from './pages/control-panel/database-backup/database-backup';
import { ActiveSessions } from './pages/control-panel/active-sessions/active-sessions';
import { LoginHistory } from './pages/control-panel/login-history/login-history';
import { ChangePassword } from './pages/setting/change-password/change-password';
import { GoogleCalendarSettingsComponent } from './pages/setting/google-calendar/google-calendar';
import { GoogleCallbackComponent } from './pages/setting/google-callback/google-callback';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [publicGuard]
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        component: Dashboard
      },

      {
        path: 'create-contact',
        component: CreateContacts
      },
      {
        path: 'edit-contact/:id',
        component: CreateContacts
      },
      {
        path: 'all-contacts',
        component: AllContacts
      },
      {
        path: 'group-transfer',
        component: GroupTransfer
      },
      {
        path: 'advanced-search',
        component: AdvancedSearch
      },
      {
        path: 'search-result',
        component: SearchResultComponent
      },
      {
        path: 'smtp-settings',
        component: SmtpSettingsComponent
      },
      {
        path: 'create-folder',
        component: CreateFolder
      },
      {
        path: 'create-leads',
        component: CreateLeads
      },
      {
        path: 'my-leads',
        component: MyLeads
      },
      {
        path: 'todays-leads',
        component: TodaysLeads
      },
      {
        path: 'open-leads',
        component: OpenLeads
      },
      {
        path: 'leadtodays-followups',
        component: Todayfollow
      },
      {
        path: 'open-leads',
        component: OpenLeads
      },
      {
        path: 'all-leads',
        component: AllLeads
      },
      {
        path: 'lead-backlog',
        component: LeadBacklog
      },
      {
        path: 'lead-calendar',
        component: LeadCalendar
      },
      {
        path: 'convert/:id',
        component: ConvertComponent
      },
      {
        path: 'create-opportunities',
        component: CreateOpportunity
      },
      {
        path: 'edit-opportunities/:id',
        component: CreateOpportunity
      },
      {
        path: 'my-opportunities',
        component: MyOpportunities
      },
      {
        path: 'open-opp',
        component: OpenOpp
      },
      {
        path: 'all-opp',
        component: AllOpp
      },
      {
        path: 'opp-backlog',
        component: OppBacklog
      },
      {
        path: 'opp-calendar',
        component: OppCalendar
      },
      {
        path: 'today-followups-opp',
        component: TodayFollowups
      },
      {
        path: 'create-property',
        component: CreateProperty
      },
      {
        path: 'my-properties',
        component: MyProperty
      },
      {
        path: 'property-todayfollowups',
        component: PropertyFollowups
      },
      {
        path: 'available-properties',
        component: AvailableProperty
      },
      {
        path: 'available-property',
        redirectTo: 'available-properties',
        pathMatch: 'full'
      },
      {
        path: 'all-properties',
        component: AllProperty
      },
      {
        path: 'all-property',
        redirectTo: 'all-properties',
        pathMatch: 'full'
      },
      {
        path: 'followups-properties',
        component: FollowUpsProperty
      },
      {
        path: 'follow-ups-property',
        redirectTo: 'followups-properties',
        pathMatch: 'full'
      },
      {
        path: 'property-backlog',
        component: BacklogProperty
      },

      {
        path: 'open-tasks',
        component: OpenTasks
      },
      {
        path: 'all-tasks',
        component: AllTasks
      },
      {
        path: 'add-task',
        component: AddTask
      },
      {
        path: 'time-line',
        component: TimeLines
      },
      {
        path: 'route-for-today',
        component: RouteForToday
      },

      {
        path: 'live-location',
        component: LiveLocation
      },

       {
        path: 'branches',
        component:Branches
      },

             {
        path: 'login-history',
        component:LoginHistory
      },


       {
        path: 'sources',
        component:Sources
      },

         {
        path: 'databackup',
        component:DatabaseBackup
      },
              {
        path: 'active-sessions',
        component:ActiveSessions
      },

      {
        path: 'todays-call',
        component: Todayscall
      },
      {
        path: 'all-prospects',
        component: Allpropects
      },
      {
        path: 'backlog',
        component: Backlog
      },
      {
        path: 'create-project',
        component: CreateProject
      },
      {
        path: 'available-projects',
        component: AvailableProject
      },
      {
        path: 'available-project',
        redirectTo: 'available-projects',
        pathMatch: 'full'
      },
      {
        path: 'all-projects',
        component: AllProject
      },
      {
        path: 'all-project',
        redirectTo: 'all-projects',
        pathMatch: 'full'
      },
      {
        path: 'rera-projects',
        component: ReraProject
      },
      {
        path: 'rera-project',
        redirectTo: 'rera-projects',
        pathMatch: 'full'
      },
      {
        path: 'create-visit',
        component: CreateVisit
      },
      {
        path: 'edit-visit/:id',
        component: CreateVisit
      },
      {
        path: 'all-visits',
        component: AllVisits
      },
      {
        path: 'create-template',
        component: CreateTemplate
      },
      {
        path: 'all-templates',
        component: AllTemplates
      },

      {
        path: 'all-campaigns',
        component: AllCampaigns
      },
      {
        path: 'all-audience',
        component: AllAudienceComponent
      },
      {
        path: 'add-campaign',
        component: AddCampaign
      },

      {
        path: 'sold-agreement',
        component: SoldAgreement
      },

      {
        path: 'create-sale-agreement',
        component: CreateAgreement
      },
      {
        path: 'create-rent-agreement',
        component: AddrentAgreement
      },
      {
        path: 'rent-agreement',
        component: RentAgreement
      },
      {
        path: 'createdocument',
        component: CreateDocument
      },
      {
        path: 'all-documents',
        component: AllDocument
      },
      {
        path: 'legal-documents',
        component: LegalDocument
      },
      {
        path: 'reports',
        component: Reports
      },
      // {
      //   path: 'attendance',
      //   component: AttendanceComponent
      // },
      {
        path: 'compose-mail',
        component: ComposeMail
      },
      {
        path: 'scheduled-mails',
        component: ScheduledMails
      },
      {
        path: 'mail-delivery-reports',
        component: MailDeliveryReports
      },
      {
        path: 'send-sms',
        component: SendSms
      },
      {
        path: 'delivery-reports',
        component: SmsDeliveryReports
      },
      {
        path: 'scheduled-sms',
        component: ScheduledSms
      },
      {
        path: 'integration',
        component: Integration
      },
      {
        path: 'lead-routing',
        component: LeadRouting
      },
      {
        path: 'webhook',
        component: Webhook
      },
      {
        path: 'create-audience',
        component: CreateAudience
      },
      {
        path: 'send-group-sms',
        component: SendGroupSms
      },
      {
        path: 'send-group-email',
        component: SendGroupEmail
      },
      {
        path: 'group-delete',
        component: GroupDelete
      },
      {
        path: 'download-contacts',
        component: DownloadContacts
      },
      {
        path: 'import-contacts',
        component: ImportContacts
      },
      {
        path: 'mark-dnd-numbers',
        component: MarkDndNumbers
      },
      {
        path: 'email-verification',
        component: EmailVerification
      },
      {
        path: 'merge-contacts',
        component: MergeContacts
      },
      {
        path: 'group-transfer-opp',
        component: GroupTransferOpp
      },
      {
        path: 'create-folder-opp',
        component: CreateFolderOpp
      },
      {
        path: 'property-transfer',
        component: PropertyTransfer
      },
      {
        path: 'property-folder',
        component: PropertyCreateFolder
      },
      {
        path: 'action-create-audience',
        component: CreateAudience
      },
      {
        path: 'property-download-action',
        component: PropertyDownlaodAction
      },
      {
        path: 'roles',
        component: Roles
      },
      {
        path: 'create-role',
        component: CreateRole
      },
        {
        path: 'change-password',
        component: ChangePassword
      },
      {
        path: 'google-calendar',
        component: GoogleCalendarSettingsComponent
      },
      {
        path: 'google-callback',
        component: GoogleCallbackComponent
      },

      {
        path: 'admin-dashboard',
        component: AdministratorDashboard
      },

      {
        path: 'administrator',
        children: [

          {
            path: 'dashboard',
            component: AdministratorDashboard
          },
          {
            path: 'empattendance',
            component: Empattendance
          },

          {
            path: 'leave',
            component: Leave
          },
          {
            path: 'payroll',
            component: Payroll
          },
          {
            path: 'documents',
            component: Documents
          },
          {
            path: 'assets',
            component: Assets
          },

          {
            path: 'holidays',
            component: Holidays
          },
          {
            path: 'employees',
            loadComponent: () =>
              import('./pages/administrator/employees/employee/employee')
                .then(c => c.Employee),

            children: [

              {
                path: '',
                redirectTo: 'list',
                pathMatch: 'full'
              },

              {
                path: 'list',
                loadComponent: () =>
                  import('./pages/administrator/employees/employee-list/employee-list')
                    .then(c => c.EmployeeList)
              },

              {
                path: 'add',
                loadComponent: () =>
                  import('./pages/administrator/employees/employee-add/employee-add')
                    .then(c => c.EmployeeAdd)
              },

              {
                path: 'profile/:id',
                loadComponent: () =>
                  import('./pages/administrator/employees/employee-profile/employee-profile')
                    .then(c => c.EmployeeProfile)
              },

              {
                path: 'details/:id',
                loadComponent: () =>
                  import('./pages/administrator/employees/employee-details/employee-details')
                    .then(c => c.EmployeeDetails)
              },

              {
                path: 'edit/:id',
                loadComponent: () =>
                  import('./pages/administrator/employees/employee-edit/employee-edit')
                    .then(c => c.EmployeeEdit)
              }

            ]

          }

        ]

      }
    ]
  }
];