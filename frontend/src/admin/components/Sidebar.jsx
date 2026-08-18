import { NavLink, useNavigate } from 'react-router-dom';
import {
  RiDashboardLine, RiFileTextLine, RiQuestionLine, RiBookOpenLine,
  RiBookLine, RiUserLine, RiShieldUserLine, RiShoppingCartLine, RiMoneyDollarCircleLine,
  RiBarChartLine, RiBellLine, RiLogoutBoxLine,
  RiMenuLine, RiShieldLine, RiGraduationCapLine,
  RiArrowRightSLine, RiFolderSettingsLine, RiFileList2Line, RiVipCrownLine, RiBookmarkLine,
  RiMailLine, RiTrophyLine
} from 'react-icons/ri';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export const navItems = [
  { id: 'dashboard', to: '/admin/dashboard', label: 'Dashboard', icon: RiDashboardLine },
  { id: 'exams', to: '/admin/exams', label: 'Odisha Exams', icon: RiShieldLine },
  { id: 'manage-mock-tests', to: '/admin/manage-mock-tests', label: 'Manage MockTest', icon: RiFolderSettingsLine },
  { id: 'subject-tests', to: '/admin/subject-tests', label: 'Subject Test', icon: RiBookmarkLine },
  { id: 'question-bank', to: '/admin/question-bank', label: 'Question Bank', icon: RiQuestionLine },
  { id: 'subjects', to: '/admin/subjects', label: 'Subjects', icon: RiBookOpenLine },
  { id: 'ebooks', to: '/admin/ebooks', label: 'PYQ E-Books', icon: RiBookLine },
  { id: 'materials', to: '/admin/materials', label: 'Materials', icon: RiFileList2Line },
  { id: 'subscriptions', to: '/admin/subscriptions', label: 'Subscriptions', icon: RiVipCrownLine },
  { id: 'students', to: '/admin/students', label: 'Students', icon: RiUserLine },
  { id: 'rankings', to: '/admin/rankings', label: 'Rankings', icon: RiTrophyLine },
  { id: 'orders', to: '/admin/orders', label: 'Orders', icon: RiShoppingCartLine },
  { id: 'payments', to: '/admin/payments', label: 'Payments', icon: RiMoneyDollarCircleLine },
  { id: 'contacts', to: '/admin/contacts', label: 'Contact Messages', icon: RiMailLine },
  { id: 'reports', to: '/admin/reports', label: 'Reports', icon: RiBarChartLine },
  { id: 'notifications', to: '/admin/notifications', label: 'Notifications', icon: RiBellLine },
  { id: 'credentials', to: '/admin/credentials', label: 'Admin Credentials', icon: RiShieldUserLine }
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Filter tabs for Sub Admin according to assigned permissions
  const visibleNavItems = navItems.filter(item => {
    // Admin / Superadmin has unrestricted access
    if (!user || user.role === 'admin' || user.role === 'superadmin') {
      return true;
    }
    // Sub Admin: check user.permissions
    if (user.role === 'sub_admin') {
      const perms = Array.isArray(user.permissions) ? user.permissions : [];
      return perms.includes(item.id) || perms.includes(item.to);
    }
    return true;
  });

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, logout',
    });
    if (result.isConfirmed) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen z-30
          bg-sidebar text-white flex flex-col
          transition-all duration-300 ease-in-out
          ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-[72px]' : 'translate-x-0 w-64'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-700/50 flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <RiGraduationCapLine className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm text-white leading-tight">ExamPlatform</p>
                <p className="text-[10px] text-slate-400">Admin Panel</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
              <RiGraduationCapLine className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={onToggle}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? <RiArrowRightSLine /> : <RiMenuLine />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 px-2 space-y-0.5 scrollbar-thin">
          {visibleNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? 'sidebar-link-active' : 'sidebar-link'
              }
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 border-t border-slate-700/50 pt-3 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
            title={collapsed ? 'Logout' : undefined}
          >
            <RiLogoutBoxLine className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
