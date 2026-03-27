import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import spiderSvg from '../assets/spider.svg';

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('user@example.com');
  const [userPicture, setUserPicture] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem('userName') || 'User';
    const email = sessionStorage.getItem('userEmail') || 'user@example.com';
    const picture = sessionStorage.getItem('userPicture') || '';

    setUserName(name);
    setUserEmail(email);
    setUserPicture(picture);

    const handleAuthChange = () => {
      const updatedName = sessionStorage.getItem('userName') || 'User';
      const updatedEmail = sessionStorage.getItem('userEmail') || 'user@example.com';
      const updatedPicture = sessionStorage.getItem('userPicture') || '';

      setUserName(updatedName);
      setUserEmail(updatedEmail);
      setUserPicture(updatedPicture);
    };

    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  const menuItems = [
    { name: 'Assistant', icon: 'assistant', path: '/assistant' },
    { name: 'Marketing', icon: 'marketing', path: '/marketing' },
  ];

  const isActive = (path) => location.pathname === path;

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'assistant':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16h6M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case 'marketing':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5.882A1 1 0 0112.447 5l6.382 3.191A1 1 0 0119.382 10h-7.618a1 1 0 01-.764-.354l-2.5-2.882zM5 14h14M7 14v5a1 1 0 001 1h8a1 1 0 001-1v-5"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        <div className="brand-wrap">
          {isCollapsed ? (
            <img src={spiderSvg} alt="Agri Assistant Logo" className="brand-logo" />
          ) : (
            <>
              <img src={spiderSvg} alt="Agri Assistant Logo" className="brand-logo" />
              <h1 className="brand-name">Agri Assistant</h1>
            </>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="sidebar-toggle"
          aria-label="Toggle sidebar"
        >
          <svg
            className={`toggle-arrow ${isCollapsed ? 'rotated' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`nav-item ${active ? 'active' : ''}`}
              title={isCollapsed ? item.name : ''}
            >
              <span className="nav-icon">{getIcon(item.icon)}</span>
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className={`profile ${isActive('/profile') ? 'active' : ''}`}>
          <div className="avatar">
            {userPicture ? (
              <img src={userPicture} alt={userName} className="avatar-img" />
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>

          {!isCollapsed && (
            <div className="profile-text">
              <p className="profile-name">{userName}</p>
              <p className="profile-email">{userEmail}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
