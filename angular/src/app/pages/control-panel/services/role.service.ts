import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { Role } from '../models/role.model';
import { environment } from '../../../../environments/environment';

const MODULE_TO_BACKEND: Record<string, string> = {
  'Task Management': 'audit',
  'Contact Management': 'account',
  'Lead Management': 'lead',
  'Opportunity Management': 'opportunity',
  'Property Management': 'property',
  'Project Management': 'project',
  'Document Management': 'document',
  'Agreement Management': 'agreement',
  'Report Management': 'import',
  'Site Visits': 'siteVisits',
  'Marketing & Campaign Management': 'marketing',
  'User Management': 'user'
};

const BACKEND_TO_MODULE: Record<string, string> = {};
for (const [k, v] of Object.entries(MODULE_TO_BACKEND)) {
  BACKEND_TO_MODULE[v] = k;
}

const ACTION_TO_BACKEND: Record<string, string> = {
  'View': 'view',
  'Add': 'add',
  'Edit': 'edit',
  'Delete': 'delete',
  'Transfer': 'transfer',
  'History': 'history',
  'Follow-Up': 'followup',
  'Status': 'status',
  'Re-open': 'reassign',
  'Duplicate': 'duplicate',
  'Reports': 'reports',
  'Marketing & Campaign': 'marketing_campaign'
};

const BACKEND_TO_ACTION: Record<string, string> = {};
for (const [k, v] of Object.entries(ACTION_TO_BACKEND)) {
  BACKEND_TO_ACTION[v] = k;
}

const OTHER_TO_BACKEND: Record<string, { group: string; action: string }> = {
  'Activity': { group: 'other', action: 'activity' },
  'Send Proposal': { group: 'other', action: 'sendProposal' },
  'Agent Networking': { group: 'other', action: 'agentNetworking' },
  'Download': { group: 'other', action: 'download' },
  'Website / Social Media Publish': { group: 'other', action: 'websitePublish' },
  'Group Transfer': { group: 'other', action: 'groupTransfer' },
  'Hide Mobile Number': { group: 'other', action: 'hideMobileNumber' },
  'Communication': { group: 'other', action: 'communication' },
  'Limited History': { group: 'other', action: 'limitedHistory' },
  'Source Masking': { group: 'other', action: 'sourceMasking' },
  'Training': { group: 'other', action: 'training' },
  'Required Followup Location': { group: 'other', action: 'requiredLocation' },
  'AI Assistant': { group: 'other', action: 'aiAssistant' },
  'Attendance (Selfie)': { group: 'other', action: 'attendanceSelfie' },
  'Control Panel': { group: 'controlPanel', action: 'controlPanel' },
  'Setup': { group: 'controlPanel', action: 'setup' },
  'API Configurations': { group: 'controlPanel', action: 'apiConfiguration' },
  'Data Security and Audit': { group: 'controlPanel', action: 'dataSecurityAudit' }
};

const BACKEND_TO_OTHER: Record<string, string> = {};
for (const [frontendName, backendLoc] of Object.entries(OTHER_TO_BACKEND)) {
  const key = `${backendLoc.group}_${backendLoc.action}`;
  BACKEND_TO_OTHER[key] = frontendName;
}

@Injectable({
  providedIn: 'root'
})
export class RoleServiceTs {

  private roles: Role[] = [];

  private rolesSubject = new BehaviorSubject<Role[]>([]);

  roles$ = this.rolesSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialize with local fallback default roles immediately
    this.roles = this.getDefaultRoles();
    this.rolesSubject.next(this.roles);

    // Fetch live roles from the server
    this.fetchRoles().subscribe({
      error: (err) => console.error('Error fetching roles on init:', err)
    });
  }

  fetchRoles(): Observable<Role[]> {
    return this.http.get<any>(`${environment.apiUrl}/roles`).pipe(
      tap((res: any) => {
        const payload = res.data || res;
        if (Array.isArray(payload)) {
          this.roles = payload.map(r => this.mapBackendToFrontend(r));
          this.rolesSubject.next(this.roles);
        }
      })
    );
  }

  addRole(role: Role): Observable<any> {
    const payload = this.mapFrontendToBackend(role);
    return this.http.post<any>(`${environment.apiUrl}/roles`, payload).pipe(
      tap(() => this.fetchRoles().subscribe())
    );
  }

  getRoleById(id: any) {
    return this.roles.find(x => x.id == id);
  }

  updateRole(role: Role, oldName?: string): Observable<any> {
    const payload = this.mapFrontendToBackend(role);

    // If role name changed, delete the old role name on backend, then post the new one
    if (oldName && oldName !== role.roleName) {
      return this.deleteRole(oldName).pipe(
        switchMap(() => this.http.post<any>(`${environment.apiUrl}/roles`, payload)),
        tap(() => this.fetchRoles().subscribe())
      );
    }

    return this.http.post<any>(`${environment.apiUrl}/roles`, payload).pipe(
      tap(() => this.fetchRoles().subscribe())
    );
  }

  deleteRole(name: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/roles/${encodeURIComponent(name)}`).pipe(
      tap(() => this.fetchRoles().subscribe())
    );
  }

  getRolesSubject() {
    return this.rolesSubject;
  }

  getAllRoles(): Role[] {
    return this.roles;
  }

  private mapBackendToFrontend(backendRole: any): Role {
    const permissions: { [module: string]: string[] } = {};

    const standardModules = [
      { title: 'Task Management', actions: ['View', 'Add', 'Edit', 'Delete'] },
      { title: 'Contact Management', actions: ['View', 'Add', 'Edit', 'Delete', 'Transfer', 'History'] },
      { title: 'Lead Management', actions: ['View', 'Add', 'Edit', 'Delete', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open', 'Duplicate'] },
      { title: 'Opportunity Management', actions: ['View', 'Add', 'Edit', 'Delete', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open'] },
      { title: 'Property Management', actions: ['View', 'Add', 'Edit', 'Delete', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open'] },
      { title: 'Project Management', actions: ['View', 'Add', 'Edit', 'Delete', 'Transfer'] },
      { title: 'Document Management', actions: ['View', 'Add', 'Edit', 'Delete'] },
      { title: 'Agreement Management', actions: ['View', 'Add', 'Edit', 'Delete'] },
      { title: 'Report Management', actions: ['Reports'] },
      { title: 'Site Visits', actions: ['View', 'Add', 'Delete'] },
      { title: 'Marketing & Campaign Management', actions: ['Marketing & Campaign'] },
      { title: 'User Management', actions: ['View'] }
    ];

    for (const mod of standardModules) {
      permissions[mod.title] = [];
    }
    permissions['Other Permissions'] = [];

    const backendPerms = backendRole.permissions || {};
    const entries = (backendPerms instanceof Map)
      ? Array.from(backendPerms.entries())
      : Object.entries(backendPerms);

    for (const [key, isAllowed] of entries) {
      if (!isAllowed) continue;

      const frontendOther = BACKEND_TO_OTHER[key];
      if (frontendOther) {
        if (!permissions['Other Permissions'].includes(frontendOther)) {
          permissions['Other Permissions'].push(frontendOther);
        }
        continue;
      }

      const underscoreIndex = key.indexOf('_');
      if (underscoreIndex !== -1) {
        const backendModule = key.substring(0, underscoreIndex);
        const backendAction = key.substring(underscoreIndex + 1);

        const frontendModule = BACKEND_TO_MODULE[backendModule];
        const frontendAction = BACKEND_TO_ACTION[backendAction];

        if (frontendModule && frontendAction) {
          if (!permissions[frontendModule].includes(frontendAction)) {
            permissions[frontendModule].push(frontendAction);
          }
        }
      }
    }

    let recommendedPermission = 'Custom';
    const nameLower = (backendRole.name || '').toLowerCase();
    if (nameLower === 'super admin' || nameLower === 'admin') {
      recommendedPermission = 'Admin';
    } else if (nameLower === 'manager') {
      recommendedPermission = 'Manager';
    } else if (nameLower === 'agent' || nameLower === 'agent/broker') {
      recommendedPermission = 'Executive';
    }

    return {
      id: backendRole.id || backendRole._id || Date.now(),
      roleName: backendRole.name,
      recommendedPermission,
      permissions
    };
  }

  private mapFrontendToBackend(frontendRole: Role): any {
    const backendPermissions: Record<string, boolean> = {};

    const standardModules = [
      { title: 'Task Management', actions: ['View', 'Add', 'Edit', 'Delete'] },
      { title: 'Contact Management', actions: ['View', 'Add', 'Edit', 'Delete', 'Transfer', 'History'] },
      { title: 'Lead Management', actions: ['View', 'Add', 'Edit', 'Delete', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open', 'Duplicate'] },
      { title: 'Opportunity Management', actions: ['View', 'Add', 'Edit', 'Delete', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open'] },
      { title: 'Property Management', actions: ['View', 'Add', 'Edit', 'Delete', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open'] },
      { title: 'Project Management', actions: ['View', 'Add', 'Edit', 'Delete', 'Transfer'] },
      { title: 'Document Management', actions: ['View', 'Add', 'Edit', 'Delete'] },
      { title: 'Agreement Management', actions: ['View', 'Add', 'Edit', 'Delete'] },
      { title: 'Report Management', actions: ['Reports'] },
      { title: 'Site Visits', actions: ['View', 'Add', 'Delete'] },
      { title: 'Marketing & Campaign Management', actions: ['Marketing & Campaign'] },
      { title: 'User Management', actions: ['View'] }
    ];

    const frontendPermissions = frontendRole.permissions || {};

    for (const mod of standardModules) {
      const backendModId = MODULE_TO_BACKEND[mod.title];
      if (!backendModId) continue;

      const activeActions = frontendPermissions[mod.title] || [];
      for (const action of mod.actions) {
        const backendActionId = ACTION_TO_BACKEND[action];
        if (!backendActionId) continue;

        const key = `${backendModId}_${backendActionId}`;
        backendPermissions[key] = activeActions.includes(action);
      }
    }

    const otherList = [
      'Activity', 'Send Proposal', 'Agent Networking', 'Download',
      'Website / Social Media Publish', 'Group Transfer', 'Hide Mobile Number',
      'Communication', 'Limited History', 'Source Masking', 'Training',
      'Required Followup Location', 'AI Assistant', 'Attendance (Selfie)',
      'Control Panel', 'Setup', 'API Configurations', 'Data Security and Audit'
    ];

    const activeOther = frontendPermissions['Other Permissions'] || [];
    for (const item of otherList) {
      const mapped = OTHER_TO_BACKEND[item];
      if (mapped) {
        const key = `${mapped.group}_${mapped.action}`;
        backendPermissions[key] = activeOther.includes(item);
      }
    }

    return {
      name: frontendRole.roleName,
      permissions: backendPermissions
    };
  }

  getDefaultRoles(): Role[] {
    const allModulePermissions = {
      'Task Management': ['View', 'Add', 'Edit', 'Delete'],
      'Contact Management': ['View', 'Add', 'Edit', 'Delete', 'Transfer', 'History'],
      'Lead Management': ['View', 'Add', 'Edit', 'Delete', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open', 'Duplicate'],
      'Opportunity Management': ['View', 'Add', 'Edit', 'Delete', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open'],
      'Property Management': ['View', 'Add', 'Edit', 'Delete', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open'],
      'Project Management': ['View', 'Add', 'Edit', 'Delete', 'Transfer'],
      'Document Management': ['View', 'Add', 'Edit', 'Delete'],
      'Agreement Management': ['View', 'Add', 'Edit', 'Delete'],
      'Report Management': ['Reports'],
      'Site Visits': ['View', 'Add', 'Delete'],
      'Marketing & Campaign Management': ['Marketing & Campaign'],
      'User Management': ['View']
    };

    const allOtherPermissions = [
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

    const superAdminRole: Role = {
      id: 1,
      roleName: 'Super Admin',
      recommendedPermission: 'Admin',
      permissions: {
        ...allModulePermissions,
        'Other Permissions': [...allOtherPermissions]
      }
    };

    const adminRole: Role = {
      id: 2,
      roleName: 'Admin',
      recommendedPermission: 'Admin',
      permissions: {
        ...allModulePermissions,
        'Other Permissions': [...allOtherPermissions]
      }
    };

    const agentRole: Role = {
      id: 3,
      roleName: 'Agent',
      recommendedPermission: 'Executive',
      permissions: {
        'Task Management': ['View', 'Add', 'Edit'],
        'Contact Management': ['View', 'Add', 'Edit', 'Transfer', 'History'],
        'Lead Management': ['View', 'Add', 'Edit', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open', 'Duplicate'],
        'Opportunity Management': ['View', 'Add', 'Edit', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open'],
        'Property Management': ['View', 'Add', 'Edit', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open'],
        'Project Management': ['View', 'Add'],
        'Document Management': ['View', 'Add', 'Edit'],
        'Agreement Management': ['View', 'Add', 'Edit'],
        'Report Management': ['Reports'],
        'Site Visits': ['View', 'Add'],
        'Marketing & Campaign Management': ['Marketing & Campaign'],
        'User Management': ['View'],
        'Other Permissions': [
          'Activity',
          'Send Proposal',
          'Agent Networking',
          'Download',
          'Website / Social Media Publish',
          'Group Transfer',
          'Communication',
          'AI Assistant',
          'Attendance (Selfie)'
        ]
      }
    };

    const agentBrokerRole: Role = {
      id: 4,
      roleName: 'Agent/Broker',
      recommendedPermission: 'Executive',
      permissions: {
        ...agentRole.permissions
      }
    };

    const managerRole: Role = {
      id: 5,
      roleName: 'Manager',
      recommendedPermission: 'Manager',
      permissions: {
        'Task Management': ['View', 'Add', 'Edit'],
        'Contact Management': ['View', 'Add', 'Edit', 'Transfer', 'History'],
        'Lead Management': ['View', 'Add', 'Edit', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open', 'Duplicate'],
        'Opportunity Management': ['View', 'Add', 'Edit', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open'],
        'Property Management': ['View', 'Add', 'Edit', 'Transfer', 'History', 'Follow-Up', 'Status', 'Re-open'],
        'Project Management': ['View', 'Add', 'Edit'],
        'Document Management': ['View', 'Add', 'Edit'],
        'Agreement Management': ['View', 'Add', 'Edit'],
        'Report Management': ['Reports'],
        'Site Visits': ['View', 'Add'],
        'Marketing & Campaign Management': ['Marketing & Campaign'],
        'User Management': ['View'],
        'Other Permissions': [
          'Activity',
          'Send Proposal',
          'Agent Networking',
          'Download',
          'Website / Social Media Publish',
          'Group Transfer',
          'Communication',
          'AI Assistant',
          'Attendance (Selfie)'
        ]
      }
    };

    return [superAdminRole, adminRole, agentRole, agentBrokerRole, managerRole];
  }

}
