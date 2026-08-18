import { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AdminHeader from '../components/AdminHeader';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/?login=true" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;

  // Enforce tab-level permission security for Sub Admin accounts
  if (user?.role === 'sub_admin') {
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    if (perms.length > 0) {
      const currentTab = location.pathname.replace('/admin/', '').split('/')[0] || 'dashboard';
      const isPermitted = perms.includes(currentTab) || perms.includes(`/admin/${currentTab}`) || perms.includes(location.pathname);
      if (!isPermitted) {
        const firstAllowed = perms[0]?.startsWith('/admin') ? perms[0] : `/admin/${perms[0]}`;
        return <Navigate to={firstAllowed || '/admin/dashboard'} replace />;
      }
    }
  }

  const toggle = () => setCollapsed(prev => !prev);

  return (
    <div className="admin-root flex h-screen bg-surface dark:bg-surface-dark overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      {/* Main content */}
      <div
        className={`
          flex flex-col flex-1 min-w-0 overflow-hidden
          transition-all duration-300
          ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}
        `}
      >
        <AdminHeader onMenuToggle={toggle} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
