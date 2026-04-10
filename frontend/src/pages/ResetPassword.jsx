import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';

function ResetPassword() {
    const [searchParams]              = useSearchParams();
    const navigate                    = useNavigate();
    const token                       = searchParams.get('token') || '';

    const [newPassword, setNewPassword]       = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading]               = useState(false);
    const [error, setError]                   = useState('');
    const [success, setSuccess]               = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!token) {
            setError('Missing reset token. Please use the link from your email.');
            return;
        }

        setLoading(true);
        try {
            await apiClient('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, newPassword }),
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <h1 className="auth-logo">TaskVault</h1>
                    <h2>Password updated</h2>
                    <p style={{ textAlign: 'center', lineHeight: 1.6 }}>
                        Your password has been changed successfully.
                        <br />
                        Redirecting to sign in…
                    </p>
                    <p className="auth-switch">
                        <Link to="/login">Sign in now</Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1 className="auth-logo">TaskVault</h1>
                <h2>Choose new password</h2>
                {!token && (
                    <p className="error">
                        Invalid reset link. Please request a new one.{' '}
                        <Link to="/forgot-password">Try again</Link>
                    </p>
                )}
                {error && <p className="error">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="New password (min 8 characters)"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="submit" disabled={loading || !token}>
                        {loading ? 'Updating…' : 'Update password'}
                    </button>
                </form>
                <p className="auth-switch">
                    <Link to="/login">Back to sign in</Link>
                </p>
            </div>
        </div>
    );
}

export default ResetPassword;
