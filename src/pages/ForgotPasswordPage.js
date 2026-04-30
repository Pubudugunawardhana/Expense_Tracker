import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiForgotPassword } from '../api/auth';
import '../styles/auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await apiForgotPassword(email);
      setSuccess(
        'If an account with that email exists, a password reset link has been sent. Please check your inbox.'
      );
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-card">
        {/* Back link */}
        <Link to="/login" id="back-to-login" className="auth-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Sign In
        </Link>

        {/* Brand */}
        <div className="auth-brand auth-brand-sm">
          <div className="auth-brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <p className="auth-eyebrow">Account Recovery</p>
            <h1 className="auth-title">Forgot Password?</h1>
          </div>
        </div>

        <p className="auth-subtitle">
          Enter your registered email address and we'll send you a link to reset your password.
        </p>

        {!success ? (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="forgot-email" className="auth-label">Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="forgot-email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              id="forgot-submit-btn"
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? <span className="auth-spinner" /> : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="auth-success">
            <div className="auth-success-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="auth-success-title">Check Your Email</h2>
            <p className="auth-success-text">
              If an account with <strong>{email}</strong> exists, a reset link has been sent.
              Please check your inbox (and spam folder).
            </p>
            <Link to="/login" id="back-to-login-success" className="auth-submit-btn auth-submit-link">
              Return to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
