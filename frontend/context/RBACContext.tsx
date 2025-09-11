import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface Permission {
  resource: string;
  action: string;
  scope?: string;
}

export interface UserRole {
  name: string;
  permissions: Permission[];
  level: number;
}

// Define admin scopes and permissions
export const ADMIN_PERMISSIONS = {
  // AI Systems
  AI_VIEW: { resource: 'ai', action: 'read' },
  AI_MANAGE: { resource: 'ai', action: 'write' },
  AI_REFRESH: { resource: 'ai', action: 'refresh' },
  AI_ANALYZE: { resource: 'ai', action: 'analyze' },
  
  // Users
  USER_VIEW: { resource: 'users', action: 'read' },
  USER_MANAGE: { resource: 'users', action: 'write' },
  USER_DELETE: { resource: 'users', action: 'delete' },
  
  // Performance
  PERFORMANCE_VIEW: { resource: 'performance', action: 'read' },
  
  // Health
  HEALTH_VIEW: { resource: 'health', action: 'read' },
  HEALTH_MANAGE: { resource: 'health', action: 'write' },
  
  // Logs
  LOGS_VIEW: { resource: 'logs', action: 'read' },
  LOGS_EXPORT: { resource: 'logs', action: 'export' },
  
  // Migrations
  MIGRATION_VIEW: { resource: 'migrations', action: 'read' },
  MIGRATION_RUN: { resource: 'migrations', action: 'execute' },
  MIGRATION_ROLLBACK: { resource: 'migrations', action: 'rollback' },
  
  // Configuration
  CONFIG_VIEW: { resource: 'config', action: 'read' },
  CONFIG_MANAGE: { resource: 'config', action: 'write' },
  
  // API Console
  API_CONSOLE: { resource: 'api', action: 'console' },
} as const;

// Define roles with their permissions
export const ROLES: Record<string, UserRole> = {
  super_admin: {
    name: 'Super Admin',
    level: 100,
    permissions: Object.values(ADMIN_PERMISSIONS),
  },
  admin: {
    name: 'Admin',
    level: 80,
    permissions: [
      ADMIN_PERMISSIONS.AI_VIEW,
      ADMIN_PERMISSIONS.AI_MANAGE,
      ADMIN_PERMISSIONS.AI_REFRESH,
      ADMIN_PERMISSIONS.AI_ANALYZE,
      ADMIN_PERMISSIONS.USER_VIEW,
      ADMIN_PERMISSIONS.USER_MANAGE,
      ADMIN_PERMISSIONS.PERFORMANCE_VIEW,
      ADMIN_PERMISSIONS.HEALTH_VIEW,
      ADMIN_PERMISSIONS.LOGS_VIEW,
      ADMIN_PERMISSIONS.MIGRATION_VIEW,
      ADMIN_PERMISSIONS.CONFIG_VIEW,
    ],
  },
  moderator: {
    name: 'Moderator',
    level: 60,
    permissions: [
      ADMIN_PERMISSIONS.AI_VIEW,
      ADMIN_PERMISSIONS.USER_VIEW,
      ADMIN_PERMISSIONS.PERFORMANCE_VIEW,
      ADMIN_PERMISSIONS.HEALTH_VIEW,
      ADMIN_PERMISSIONS.LOGS_VIEW,
    ],
  },
  analyst: {
    name: 'Analyst',
    level: 40,
    permissions: [
      ADMIN_PERMISSIONS.AI_VIEW,
      ADMIN_PERMISSIONS.PERFORMANCE_VIEW,
      ADMIN_PERMISSIONS.LOGS_VIEW,
    ],
  },
};

interface RBACContextType {
  userRole: UserRole | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  canAccess: (resource: string, action?: string) => boolean;
  getRoleLevel: () => number;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

interface RBACProviderProps {
  children: ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (user?.role) {
      // Map user role from backend to our RBAC system
      const roleMapping: Record<string, string> = {
        admin: user.role === 'admin' ? 'super_admin' : 'admin',
        moderator: 'moderator',
        analyst: 'analyst',
      };

      const mappedRole = roleMapping[user.role] || 'analyst';
      setUserRole(ROLES[mappedRole] || null);
    } else {
      setUserRole(null);
    }
  }, [user]);

  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false;
    
    return userRole.permissions.some(p => 
      p.resource === permission.resource && 
      p.action === permission.action &&
      (!permission.scope || p.scope === permission.scope)
    );
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const canAccess = (resource: string, action?: string): boolean => {
    if (!userRole) return false;
    
    return userRole.permissions.some(p => {
      if (p.resource !== resource) return false;
      if (action && p.action !== action) return false;
      return true;
    });
  };

  const getRoleLevel = (): number => {
    return userRole?.level || 0;
  };

  const isAdmin = userRole?.level >= 80;
  const isSuperAdmin = userRole?.level >= 100;

  const value: RBACContextType = {
    userRole,
    hasPermission,
    hasAnyPermission,
    canAccess,
    getRoleLevel,
    isAdmin,
    isSuperAdmin,
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
};
