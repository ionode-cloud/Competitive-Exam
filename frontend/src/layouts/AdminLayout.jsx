import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FilePlus, BookOpen, Users, BarChart3, LogOut, Shield, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: <FilePlus size={20} />, label: 'Create Exam', path: '/admin/create-exam' },
    { icon: <BookOpen size={20} />, label: 'Manage Questions', path: '/admin/manage-questions' },
    { icon: <Users size={20} />, label: 'Students', path: '/admin/students' },
    { icon: <BarChart3 size={20} />, label: 'Results', path: '/admin/results' },
    { icon: <Star size={20} />, label: 'Ratings', path: '/admin/ratings' },
    { icon: <Shield size={20} />, label: 'Admin Logs', path: '/admin/logs' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', background: 'white', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield color="white" size={24} />
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Admin Panel</span>
        </div>

        <nav style={{ flex: 1, padding: '24px 16px' }}>
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                borderRadius: '8px',
                marginBottom: '4px',
                textDecoration: 'none',
                color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-muted)',
                background: location.pathname === item.path ? 'var(--primary-light)' : 'transparent',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border-light)' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '12px 16px', 
              borderRadius: '8px',
              border: 'none',
              background: '#fef2f2',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
