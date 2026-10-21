import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const formComplete = name.trim() && email.trim() && password && confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setSubmitting(true);
    try {
      await register({ name, email, password, role });
      navigate(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.errors
        ? err.response.data.errors.map((item) => item.message).join('. ')
        : err.response?.data?.message || 'Registration failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <div className="auth-heading">
          <span className="auth-mark">+</span>
          <span className="eyebrow">Join Study Check</span>
          <h1>Create your account</h1>
          <p>Join a focused space built for better assessment.</p>
        </div>
        <div className="role-switcher register-role-switcher" aria-label="Choose account type">
          <button type="button" className={`role-option ${role === 'student' ? 'selected' : ''}`} onClick={() => setRole('student')} aria-pressed={role === 'student'}>
            <span className="role-icon">S</span>
            <span><strong>Student account</strong><small>Take assessments and track your progress</small></span>
            <span className="role-check" aria-hidden="true">✓</span>
          </button>
          <button type="button" className={`role-option ${role === 'teacher' ? 'selected' : ''}`} onClick={() => setRole('teacher')} aria-pressed={role === 'teacher'}>
            <span className="role-icon">F</span>
            <span><strong>Faculty account</strong><small>Create assessments and review results</small></span>
            <span className="role-check" aria-hidden="true">✓</span>
          </button>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label" htmlFor="name">Full name</label><input id="name" type="text" className="form-input" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="form-group"><label className="form-label" htmlFor="email">University email</label><input id="email" type="email" className="form-input" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="form-group"><label className="form-label" htmlFor="password">Password</label><input id="password" type="password" className="form-input" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
          <div className="form-group"><label className="form-label" htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" type="password" className="form-input" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
          <button
            type="submit"
            className={`btn btn-primary btn-block btn-lg auth-submit register-submit ${formComplete ? 'ready' : ''}`}
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : `Create ${role === 'teacher' ? 'faculty' : 'student'} account`} <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in here</Link></p>
      </div>
    </div>
  );
};

export default RegisterPage;
