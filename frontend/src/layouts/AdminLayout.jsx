import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FilePlus, BookOpen, Users, BarChart3, LogOut, Shield, Star, Menu, X, ListTodo } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: <FilePlus size={20} />, label: 'Create Exam', path: '/admin/create-exam' },
    { icon: <ListTodo size={20} />, label: 'Manage Exams', path: '/admin/manage-exams' },
    { icon: <BookOpen size={20} />, label: 'Manage Questions', path: '/admin/manage-questions' },
    { icon: <Users size={20} />, label: 'Students', path: '/admin/students' },
    { icon: <BarChart3 size={20} />, label: 'Results', path: '/admin/results' },
    { icon: <Star size={20} />, label: 'Ratings', path: '/admin/ratings' },
    { icon: <Shield size={20} />, label: 'Admin Logs', path: '/admin/logs' },
  ];

  return (
    <div className="admin-layout-container">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield color="white" size={24} />
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Admin Panel</span>
          </div>
          {/* Close button inside sidebar for mobile */}
          <button className="toggle-btn close-sidebar-btn" onClick={closeSidebar}>
             <X size={24} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '24px 16px', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={closeSidebar} // Close on navigation in mobile
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                borderRadius: '8px',
                marginBottom: '4px',
                textDecoration: 'none',
                color: location.pathname === item.path ? 'var(--primary, #2563eb)' : 'var(--text-muted, #64748b)',
                background: location.pathname === item.path ? 'var(--primary-light, #eff6ff)' : 'transparent',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border-light, #e2e8f0)' }}>
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

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile Header */}
        <header className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--primary, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield color="white" size={18} />
            </div>
            <span className="mobile-header-title">Admin Panel</span>
          </div>
          <button className="toggle-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
        </header>

        <main className="admin-main-content">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
