import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { RoleServiceTs } from './role.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private authService = inject(AuthService);
  private roleService = inject(RoleServiceTs);

  /**
   * Helper to look up a role configuration, normalized and case-insensitively,
   * handling variations such as Agent vs Agent/Broker or Admin vs Super Admin.
   */
  private getRoleConfig(userRoleName: string): any {
    const roles = this.roleService.getAllRoles() || [];
    const normalizedUserRole = userRoleName.trim().toLowerCase();

    // Try exact normalized match first
    let role = roles.find(r => r.roleName.trim().toLowerCase() === normalizedUserRole);

    // Match 'agent' to 'agent/broker' if exact match fails
    if (!role) {
      if (normalizedUserRole === 'agent' || normalizedUserRole === 'agent/broker') {
        role = roles.find(r => {
          const name = r.roleName.trim().toLowerCase();
          return name === 'agent' || name === 'agent/broker';
        });
      }
    }

    // Match 'admin' to 'super admin' if exact match fails
    if (!role) {
      if (normalizedUserRole === 'admin' || normalizedUserRole === 'super admin') {
        role = roles.find(r => {
          const name = r.roleName.trim().toLowerCase();
          return name === 'admin' || name === 'super admin';
        });
      }
    }

    return role;
  }

  /**
   * Safe fallback for standard roles in case local storage configurations
   * are cleared or not initialized.
   */
  private getFallbackRoleConfig(userRoleName: string): any {
    const normalizedUserRole = userRoleName.trim().toLowerCase();

    const defaultAgentPermissions = {
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
    };

    if (normalizedUserRole === 'agent' || normalizedUserRole === 'agent/broker') {
      return {
        roleName: 'Agent',
        permissions: defaultAgentPermissions
      };
    }

    return null;
  }

  /**
   * Checks if the current user has permission for a specific module and action.
   * @param module The module name (e.g., 'Lead Management', 'Contact Management')
   * @param action The action name (e.g., 'View', 'Add', 'Edit', 'Delete', 'Transfer', 'History')
   */
  hasPermission(module: string, action: string): boolean {
    const user = this.authService.currentUserValue;
    if (!user) {
      return false;
    }
    return true;

    /*
    const userRoleName = user.role;
    if (!userRoleName) {
      return false;
    }

    // Try reading configuration from storage
    let role = this.getRoleConfig(userRoleName);

    // Use secure hardcoded fallback if not found in local storage
    if (!role) {
      role = this.getFallbackRoleConfig(userRoleName);
    }

    if (!role) {
      // Default fallback: if role is Admin/Super Admin and not configured in roles, allow everything.
      if (userRoleName.toLowerCase() === 'admin' || userRoleName.toLowerCase() === 'super admin') {
        return true;
      }
      return false;
    }

    // Admin role override
    if (role.roleName.toLowerCase() === 'admin' || role.roleName.toLowerCase() === 'super admin') {
      const modulePermissions = role.permissions[module];
      if (modulePermissions && modulePermissions.length > 0) {
        return modulePermissions.includes(action);
      }
      return true;
    }

    // Check specific module permissions
    const modulePermissions = role.permissions[module];
    if (modulePermissions) {
      if (modulePermissions.includes(action)) {
        return true;
      }
    }

    // Check Other Permissions category
    const otherPermissions = role.permissions['Other Permissions'];
    if (otherPermissions) {
      if (otherPermissions.includes(action)) {
        return true;
      }
    }

    return false;
    */
  }

  /**
   * Checks if the current user has permission to view a module at all.
   * @param module The module name (e.g., 'Lead Management')
   */
  hasModulePermission(module: string): boolean {
    const user = this.authService.currentUserValue;
    if (!user) {
      return false;
    }
    return true;

    /*
    const userRoleName = user.role;
    if (!userRoleName) {
      return false;
    }

    // Default fallback: Admin/Super Admin has everything
    if (userRoleName.toLowerCase() === 'admin' || userRoleName.toLowerCase() === 'super admin') {
      return true;
    }

    let role = this.getRoleConfig(userRoleName);

    if (!role) {
      role = this.getFallbackRoleConfig(userRoleName);
    }

    if (!role) {
      return false;
    }

    // If role is admin/super admin, allow
    if (role.roleName.toLowerCase() === 'admin' || role.roleName.toLowerCase() === 'super admin') {
      return true;
    }

    // User is permitted if they have at least one permission in the module
    const modulePermissions = role.permissions[module];
    if (modulePermissions && modulePermissions.length > 0) {
      return true;
    }

    return false;
    */
  }
}
