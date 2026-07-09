import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FilePlus, BookOpen, Users, BarChart3, LogOut, Shield, Star, Menu, X, ListTodo, FileText, Globe, GraduationCap, FlaskConical, CalendarDays, Tag, CreditCard, Award, Bell, Folder, Home, Info, Phone, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const { logout, admin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarNavRef = useRef(null);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('adminSidebarScroll');
    if (savedScroll && sidebarNavRef.current) {
      sidebarNavRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, [location.pathname]);

  const handleScroll = (e) => {
    sessionStorage.setItem('adminSidebarScroll', e.target.scrollTop);
  };

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

  const menuSections = [
    {
      title: 'Overview',
      items: [
        { icon: <LayoutDashboard size={18} />, label: 'Dashboard',       path: '/admin/dashboard' },
      ]
    },
    {
      title: 'Platform',
      items: [
        { icon: <GraduationCap size={18} />, label: 'Courses',        path: '/admin/courses' },
        { icon: <Folder size={18} />,        label: 'Categories',     path: '/admin/categories' },
        { icon: <Home size={18} />,          label: 'Home',           path: '/admin/home' },
        { icon: <Info size={18} />,          label: 'About',          path: '/admin/about' },
        { icon: <Phone size={18} />,         label: 'Contact us',     path: '/admin/contact' },
        { icon: <Image size={18} />,         label: 'Gallery',        path: '/admin/gallery' },
        { icon: <Globe size={18} />,         label: 'Footer',         path: '/admin/footer' },
      ]
    },
    {
      title: 'Exams',
      items: [
        { icon: <FilePlus size={18} />,  label: 'Create Exam',    path: '/admin/create-exam' },
        { icon: <ListTodo size={18} />,  label: 'Manage Exams',   path: '/admin/manage-exams' },
        { icon: <Folder size={18} />,    label: 'Subjects',       path: '/admin/subjects' },
        { icon: <BookOpen size={18} />,  label: 'Question Bank',  path: '/admin/manage-questions' },
        { icon: <FileText size={18} />,  label: 'Instructions',   path: '/admin/instructions' },
      ]
    },
    {
      title: 'People',
      items: [
        { icon: <Users size={18} />,     label: 'Students',       path: '/admin/students' },
        { icon: <BarChart3 size={18} />, label: 'Results',        path: '/admin/results' },
        { icon: <Star size={18} />,      label: 'Ratings',        path: '/admin/ratings' },
      ]
    },
    {
      title: 'Finance',
      items: [
        { icon: <CreditCard size={18} />, label: 'Payments',      path: '/admin/payments-manage' },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: <Bell size={18} />,      label: 'Notifications',  path: '/admin/notifications' },
        { icon: <Shield size={18} />,    label: 'Admin Logs',     path: '/admin/logs' },
      ]
    },
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
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-orange)' }}>
              <Shield color="white" size={24} />
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Admin Panel</span>
          </div>
          {/* Close button inside sidebar for mobile */}
          <button className="toggle-btn close-sidebar-btn" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav 
          ref={sidebarNavRef}
          onScroll={handleScroll}
          style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}
        >
          {menuSections.map((section) => {
            const visibleItems = section.items.filter(item => {
              if (item.path === '/admin/logs' && admin?.role === 'Root Admin') return false;
              return true;
            });
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title} style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 12px 4px' }}>
                  {section.title}
                </div>
                {visibleItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebar}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 14px', borderRadius: '8px', marginBottom: '2px',
                      textDecoration: 'none', fontSize: '0.875rem',
                      color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-secondary)',
                      background: location.pathname === item.path ? 'var(--primary-ultra)' : 'transparent',
                      borderLeft: location.pathname === item.path ? '3px solid var(--primary)' : '3px solid transparent',
                      fontWeight: 600, transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (location.pathname !== item.path) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (location.pathname !== item.path) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: '24px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(239, 68, 68, 0.2)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
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
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
