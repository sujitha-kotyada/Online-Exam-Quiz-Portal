import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roles = [
  { id: 'student', label: 'Student', description: 'Take assessments and track your progress', icon: 'S' },
  { id: 'teacher', label: 'Faculty', description: 'Create assessments and review results', icon: 'F' }
];

const LoginPage = () => {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired = new URLSearchParams(location.search).get('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await login({ email, password });
      if (user.role !== role) {
        await logout();
        setError(`These credentials belong to a ${user.role === 'teacher' ? 'faculty' : 'student'} account. Please select the correct login.`);
        return;
      }
      const from = location.state?.from?.pathname;
      navigate(from || (user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-heading">
          <span className="auth-mark">↗</span>
          <span className="eyebrow">Welcome back</span>
          <h1>Sign in to continue</h1>
          <p>Choose your portal and enter your account details.</p>
        </div>

        <div className="role-switcher" aria-label="Select portal">
          {roles.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`role-option ${role === item.id ? 'selected' : ''}`}
              onClick={() => setRole(item.id)}
              aria-pressed={role === item.id}
            >
              <span className="role-icon">{item.icon}</span>
              <span><strong>{item.label}</strong><small>{item.description}</small></span>
              <span className="role-check" aria-hidden="true">✓</span>
            </button>
          ))}
        </div>

        {sessionExpired && <div className="alert alert-warning">Your session expired. Please sign in again.</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input id="email" type="email" className="form-input" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <div className="form-label-row"><label className="form-label" htmlFor="password">Password</label><button type="button" className="text-button">Forgot password?</button></div>
            <input id="password" type="password" className="form-input" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button
            type="submit"
            className={`btn btn-primary btn-block btn-lg auth-submit ${email.trim() && password ? 'ready' : ''}`}
            disabled={submitting || !email.trim() || !password}
          >
            {submitting ? 'Signing in...' : `Sign in as ${role === 'teacher' ? 'faculty' : 'student'}`}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <p className="auth-footer">New to Study Check? <Link to="/register">Create a student account</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;
