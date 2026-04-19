import { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import './AnalyticsPanel.css';

const STATUS_LABELS   = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

function BarChart({ data, labelMap, classPrefix }) {
    const max = Math.max(...Object.values(data), 1);
    return (
        <div className="analytics-bars">
            {Object.entries(data).map(([key, val]) => (
                <div className="bar-row" key={key}>
                    <span className="bar-label">{labelMap[key]}</span>
                    <div className="bar-track">
                        <div
                            className={`bar-fill ${classPrefix}-${key}`}
                            style={{ width: `${(val / max) * 100}%` }}
                        />
                    </div>
                    <span className="bar-value">{val}</span>
                </div>
            ))}
        </div>
    );
}

function AnalyticsPanel({ projectId }) {
    const [open, setOpen]       = useState(false);
    const [stats, setStats]     = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    // Reset cached stats when the active project changes — re-fetch on next open.
    useEffect(() => {
        setStats(null);
        setError('');
    }, [projectId]);

    const handleToggle = async () => {
        const willOpen = !open;
        setOpen(willOpen);

        // Lazy fetch on first expand (or after project change clears stats).
        if (willOpen && !stats) {
            setLoading(true);
            try {
                const qs = projectId ? `?projectId=${projectId}` : '';
                const data = await apiClient(`/tasks/stats${qs}`);
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="analytics-panel">
            <button className="analytics-toggle" onClick={handleToggle}>
                <span>Analytics</span>
                <span className={`chevron ${open ? 'open' : ''}`}>▼</span>
            </button>

            {open && (
                <div className="analytics-body">
                    {loading && <p className="analytics-loading">Loading analytics…</p>}
                    {error && <p className="error">{error}</p>}

                    {stats && (
                        <>
                            <section className="analytics-section">
                                <h3>By Status</h3>
                                <BarChart
                                    data={stats.by_status}
                                    labelMap={STATUS_LABELS}
                                    classPrefix="status"
                                />
                            </section>

                            <section className="analytics-section">
                                <h3>By Priority</h3>
                                <BarChart
                                    data={stats.by_priority}
                                    labelMap={PRIORITY_LABELS}
                                    classPrefix="priority"
                                />
                            </section>

                            <section className="analytics-section">
                                <h3>Key Metrics</h3>
                                <div className="analytics-kpis">
                                    <div className="kpi-box">
                                        <div className="kpi-value">{stats.overdue_count}</div>
                                        <div className="kpi-label">Overdue</div>
                                    </div>
                                    <div className="kpi-box">
                                        <div className="kpi-value">{stats.completed_this_week}</div>
                                        <div className="kpi-label">Done this week</div>
                                    </div>
                                    <div className="kpi-box">
                                        <div className="kpi-value">{stats.avg_completion_days}d</div>
                                        <div className="kpi-label">Avg days</div>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default AnalyticsPanel;
