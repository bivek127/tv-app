import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, updatePassword } from '../api/profile';
import { getPreferences, updatePreferences } from '../api/notifications';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Profile.css';

const REMIND_DAY_OPTIONS = [
    { value: 1, label: '1 day before' },
    { value: 2, label: '2 days before' },
    { value: 3, label: '3 days before' },
    { value: 7, label: '7 days before' },
];

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

    // Notification preferences
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [remindDays, setRemindDays] = useState([1]);
    const [prefsSaving, setPrefsSaving] = useState(false);
    const [prefsLoaded, setPrefsLoaded] = useState(false);

    const {
        isSupported: pushSupported,
        isSubscribed: pushSubscribed,
        isRequesting: pushRequesting,
        permissionState,
        subscribe,
        unsubscribe,
    } = usePushNotifications();

    useEffect(() => {
        getProfile().then((data) => {
            setUser(data.user);
            setName(data.user.name || '');
        }).catch(() => {});

        getPreferences().then((data) => {
            const prefs = data.preferences;
            setEmailEnabled(!!prefs.email_enabled);
            setRemindDays(Array.isArray(prefs.remind_days_before) ? prefs.remind_days_before : [1]);
            setPrefsLoaded(true);
        }).catch(() => setPrefsLoaded(true));
    }, []);

    const toggleRemindDay = (day) => {
        setRemindDays((days) => (
            days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b)
        ));
    };

    const handleTogglePush = async () => {
        try {
            if (pushSubscribed) {
                await unsubscribe();
                await updatePreferences({ push_enabled: false });
                showToast('Browser notifications turned off', 'success');
            } else {
                await subscribe();
                await updatePreferences({ push_enabled: true });
                showToast('Browser notifications enabled on this device', 'success');
            }
        } catch (err) {
            showToast(err.message || 'Could not update push notifications', 'error');
        }
    };

    const handleSavePrefs = async () => {
        setPrefsSaving(true);
        try {
            const patch = {
                email_enabled: emailEnabled,
                remind_days_before: emailEnabled && remindDays.length === 0 ? [1] : remindDays,
            };
            await updatePreferences(patch);
            showToast('Notification settings saved', 'success');
        } catch (err) {
            showToast(err.message || 'Could not save settings', 'error');
        } finally {
            setPrefsSaving(false);
        }
    };

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

                <section className="profile-section">
                    <h2>Notifications</h2>

                    <div className="notif-row">
                        <div>
                            <div className="notif-row-title">Email reminders</div>
                            <div className="notif-row-hint">Get an email each morning when tasks are due.</div>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={emailEnabled}
                                onChange={(e) => setEmailEnabled(e.target.checked)}
                                disabled={!prefsLoaded}
                            />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    {emailEnabled && (
                        <div className="notif-days">
                            <div className="notif-days-label">Send reminders:</div>
                            {REMIND_DAY_OPTIONS.map((opt) => (
                                <label key={opt.value} className="notif-day-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={remindDays.includes(opt.value)}
                                        onChange={() => toggleRemindDay(opt.value)}
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    <div className="notif-row">
                        <div>
                            <div className="notif-row-title">Browser notifications</div>
                            <div className="notif-row-hint">
                                {!pushSupported && 'Your browser does not support push notifications.'}
                                {pushSupported && permissionState === 'denied' && 'Permission is blocked. Enable notifications for this site in your browser settings.'}
                                {pushSupported && permissionState !== 'denied' && (pushSubscribed
                                    ? 'Active on this device.'
                                    : 'Not active on this device.')}
                            </div>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={pushSubscribed}
                                onChange={handleTogglePush}
                                disabled={!pushSupported || pushRequesting || permissionState === 'denied'}
                            />
                            <span className="toggle-slider" />
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={handleSavePrefs}
                        disabled={prefsSaving || !prefsLoaded}
                        className="notif-save-btn"
                    >
                        {prefsSaving ? 'Saving…' : 'Save notification settings'}
                    </button>
                </section>
            </main>
        </div>
    );
}

export default Profile;
