import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  ChartBarIcon,
  CpuChipIcon,
  UserGroupIcon,
  CogIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
  BeakerIcon,
  CommandLineIcon,
  BoltIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  ServerIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  badgeColor?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Admin Dashboard' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const navigation: NavigationItem[] = [
    {
      name: 'Overview',
      href: '/admin/dashboard',
      icon: HomeIcon,
      description: 'System overview and key metrics',
    },
    {
      name: 'AI Systems',
      href: '/admin/ai-systems',
      icon: CpuChipIcon,
      description: 'AI matching and personality analysis',
      badge: 'ACTIVE',
      badgeColor: 'bg-green-500',
    },
    {
      name: 'Performance',
      href: '/admin/performance',
      icon: ChartBarIcon,
      description: 'Matching performance and analytics',
    },
    {
      name: 'User Analytics',
      href: '/admin/users',
      icon: UserGroupIcon,
      description: 'User behavior and engagement metrics',
    },
    {
      name: 'Skill Analysis',
      href: '/admin/skills',
      icon: BeakerIcon,
      description: 'Market demand and skill predictions',
      badge: 'HOT',
      badgeColor: 'bg-red-500',
    },
    {
      name: 'System Health',
      href: '/admin/health',
      icon: ShieldCheckIcon,
      description: 'Infrastructure and service monitoring',
    },
    {
      name: 'Migration Tools',
      href: '/admin/migrations',
      icon: ServerIcon,
      description: 'Database migration management',
    },
    {
      name: 'Activity Logs',
      href: '/admin/logs',
      icon: ClipboardDocumentListIcon,
      description: 'System activity and audit trails',
    },
    {
      name: 'Configuration',
      href: '/admin/config',
      icon: AdjustmentsHorizontalIcon,
      description: 'System settings and parameters',
    },
    {
      name: 'API Console',
      href: '/admin/api',
      icon: CommandLineIcon,
      description: 'Direct API interaction and testing',
    },
  ];

  const isCurrentPath = (path: string) => {
    return router.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-slate-800/90 backdrop-blur-xl border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <CpuChipIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                <p className="text-xs text-slate-400">AI-Powered Platform</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = isCurrentPath(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <item.icon
                      className={`mr-4 h-6 w-6 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.name}</span>
                        {item.badge && (
                          <span
                            className={`px-2 py-1 text-xs font-bold text-white rounded-full ${
                              item.badgeColor || 'bg-blue-500'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${
                        isActive ? 'text-purple-100' : 'text-slate-400 group-hover:text-slate-300'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* System Status */}
          <div className="px-6 py-4 border-t border-slate-700">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">System Status</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">Operational</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">AI Systems</span>
                  <span className="text-green-400 font-medium">Active</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Database</span>
                  <span className="text-green-400 font-medium">Healthy</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">API Services</span>
                  <span className="text-green-400 font-medium">Running</span>
                </div>
              </div>
            </div>
          </div>

          {/* User info and logout */}
          <div className="px-6 py-4 border-t border-slate-700">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">Administrator</p>
                <p className="text-xs text-slate-400">Super Admin</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
