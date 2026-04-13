import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Users, BookOpen, CreditCard, Receipt, LogOut, TrendingUp } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'لوحة القيادة', path: '/', icon: <Home size={20} /> },
    { name: 'العجول', path: '/cows', icon: <BookOpen size={20} /> },

    { name: 'المدفوعات', path: '/payments', icon: <CreditCard size={20} /> },
    { name: 'المصروفات', path: '/expenses', icon: <Receipt size={20} /> },
    { name: 'التقارير', path: '/reports', icon: <TrendingUp size={20} /> },
  ];

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 'bold' }}>إدارة العجول</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>مرحباً {user?.username}</p>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <button 
          onClick={handleLogout} 
          className="nav-item" 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', width: '100%', marginTop: 'auto' }}
        >
          <LogOut size={20} />
          تسجيل الخروج
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
