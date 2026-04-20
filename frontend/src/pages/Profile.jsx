import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, updatePassword } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Profile.css';

function Profile() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [nameSaving, setNameSaving] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwSaving, setPwSaving] = useState(false);

    useEffect(() => {
        getProfile().then((data) => {
            setUser(data.user);
            setName(data.user.name || '');
        }).catch(() => {});
    }, []);

    const handleSaveName = async (e) => {
        e.preventDefault();
        setNameSaving(true);
        try {
            const data = await updateProfile({ name: name.trim() || null });
            setUser(data.user);
            showToast('Name updated', 'success');
        } catch (err) {
            showToast(err.message || 'Could not update name', 'error');
        } finally {
            setNameSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { showToast('Passwords do not match', 'warning'); return; }
        if (newPassword.length < 8) { showToast('New password must be at least 8 characters', 'warning'); return; }
        setPwSaving(true);
        try {
            await updatePassword({ currentPassword, newPassword });
            showToast('Password updated', 'success');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err) {
            showToast(err.message || 'Could not update password', 'error');
        } finally {
            setPwSaving(false);
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    if (!user) return <div className="profile-loading">Loading…</div>;

    return (
        <div className="profile-page">
            <header className="profile-header">
                <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
                <h1>Profile</h1>
                <button className="btn-logout" onClick={handleLogout}>Sign out</button>
            </header>

            <main className="profile-main">
                <div className="profile-card">
                    <div className="profile-avatar">{(user.name || user.email)[0].toUpperCase()}</div>
                    <div className="profile-email">{user.email}</div>
                    <div className="profile-meta">
                        Member since {new Date(user.created_at).toLocaleDateString()}
                        {user.provider !== 'local' && <span className="profile-provider"> · {user.provider}</span>}
                    </div>
                </div>

                <section className="profile-section">
                    <h2>Display Name</h2>
                    <form onSubmit={handleSaveName}>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            maxLength={80}
                        />
                        <button type="submit" disabled={nameSaving}>
                            {nameSaving ? 'Saving…' : 'Save name'}
                        </button>
                    </form>
                </section>

                {user.provider === 'local' && (
                    <section className="profile-section">
                        <h2>Change Password</h2>
                        <form onSubmit={handleChangePassword}>
                            <label>Current password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                            <label>New password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <label>Confirm new password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <button type="submit" disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}>
                                {pwSaving ? 'Updating…' : 'Update password'}
                            </button>
                        </form>
                    </section>
                )}
            </main>
        </div>
    );
}

export default Profile;
