import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../lib/apiClient';

function ForgotPassword() {
    const [email, setEmail]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [submitted, setSubmitted] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await apiClient('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            setSubmitted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <button onClick={toggleTheme} className="auth-theme-toggle" title="Toggle theme" aria-label="Toggle theme">
                {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="auth-card">
                <h1 className="auth-logo">TaskVault</h1>
                <h2>Reset password</h2>
                {submitted ? (
                    <p style={{ textAlign: 'center', lineHeight: 1.6 }}>
                        If an account with that email exists, you'll receive a reset link shortly.
                        <br /><br />
                        <Link to="/login">Back to sign in</Link>
                    </p>
                ) : (
                    <>
                        <p style={{ marginBottom: '1rem', opacity: 0.8, fontSize: '0.9rem' }}>
                            Enter your email and we'll send you a reset link.
                        </p>
                        {error && <p className="error">{error}</p>}
                        <form onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="Email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <button type="submit" disabled={loading}>
                                {loading ? 'Sending…' : 'Send reset link'}
                            </button>
                        </form>
                        <p className="auth-switch">
                            <Link to="/login">Back to sign in</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
