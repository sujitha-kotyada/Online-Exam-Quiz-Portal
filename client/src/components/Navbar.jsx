import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isTeacher, isStudent, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="nav-brand">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#4f46e5' }}>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          <span>Study</span> Check
        </Link>

        <ul className="nav-links">
          {isAuthenticated ? (
            <>
              {isStudent && (
                <>
                  <li>
                    <NavLink to="/student/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/student/exams" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Exams
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/student/results" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      My Results
                    </NavLink>
                  </li>
                </>
              )}

              {isTeacher && (
                <>
                  <li>
                    <NavLink to="/teacher/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/teacher/exams" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      My Exams
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/teacher/exams/create" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Create Exam
                    </NavLink>
                  </li>
                </>
              )}
            </>
          ) : (
            <>
              <li>
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Register
                </NavLink>
              </li>
            </>
          )}
        </ul>

        {isAuthenticated && (
          <div className="nav-user">
            <div className="user-badge">
              <span className="user-name">{user?.name}</span>
              <span className={`badge ${isTeacher ? 'badge-primary' : 'badge-success'}`}>
                {user?.role}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log out of your account">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
