import { useState, useEffect, useRef } from 'react';
import {
    Chart,
    ArcElement,
    BarElement,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import apiClient from '../lib/apiClient';
import './AnalyticsPanel.css';

Chart.register(ArcElement, BarElement, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const STATUS_LABELS   = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

const STATUS_COLORS   = { todo: '#6366f1', in_progress: '#f59e0b', done: '#22c55e' };
const PRIORITY_COLORS = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };

function cssVar(name, fallback) {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return val || fallback;
}

/**
 * Compute per-day completion counts for the last 7 days from the loaded task set.
 * Derived client-side because the stats endpoint doesn't expose a time series.
 * Note: if tasks are paginated and older completions aren't loaded, this under-
 * reports. Good enough for a snapshot view.
 */
function weeklyCompletions(tasks) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = [];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        buckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
        labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
    }

    const byDate = Object.fromEntries(buckets.map((b) => [b.date, b]));
    for (const t of tasks) {
        if (t.status !== 'done' || !t.updated_at) continue;
        const key = new Date(t.updated_at).toISOString().slice(0, 10);
        if (byDate[key]) byDate[key].count++;
    }

    return { labels, data: buckets.map((b) => b.count) };
}

function StatusDoughnut({ data, theme }) {
    const ref = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!ref.current) return;
        chartRef.current?.destroy();
        chartRef.current = new Chart(ref.current, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data).map((k) => STATUS_LABELS[k]),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: Object.keys(data).map((k) => STATUS_COLORS[k]),
                    borderColor: cssVar('--card-bg', '#fff'),
                    borderWidth: 2,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: cssVar('--text-primary', '#111'), font: { size: 11 } },
                    },
                },
            },
        });
        return () => chartRef.current?.destroy();
    }, [data, theme]);

    return <canvas ref={ref} />;
}

function PriorityBar({ data, theme }) {
    const ref = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!ref.current) return;
        chartRef.current?.destroy();
        const gridColor = cssVar('--border', '#e5e7eb');
        const labelColor = cssVar('--text-primary', '#111');

        chartRef.current = new Chart(ref.current, {
            type: 'bar',
            data: {
                labels: Object.keys(data).map((k) => PRIORITY_LABELS[k]),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: Object.keys(data).map((k) => PRIORITY_COLORS[k]),
                    borderRadius: 4,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        ticks: { color: labelColor },
                        grid: { color: gridColor, display: false },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: labelColor, stepSize: 1 },
                        grid: { color: gridColor },
                    },
                },
            },
        });
        return () => chartRef.current?.destroy();
    }, [data, theme]);

    return <canvas ref={ref} />;
}

function CompletionLine({ labels, data, theme }) {
    const ref = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!ref.current) return;
        chartRef.current?.destroy();
        const gridColor = cssVar('--border', '#e5e7eb');
        const labelColor = cssVar('--text-primary', '#111');

        chartRef.current = new Chart(ref.current, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#22c55e',
                    pointRadius: 3,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        ticks: { color: labelColor },
                        grid: { color: gridColor, display: false },
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: labelColor, stepSize: 1, precision: 0 },
                        grid: { color: gridColor },
                    },
                },
            },
        });
        return () => chartRef.current?.destroy();
    }, [labels, data, theme]);

    return <canvas ref={ref} />;
}

function AnalyticsPanel({ projectId, tasks = [] }) {
    const [open, setOpen]       = useState(false);
    const [stats, setStats]     = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    // Observe theme changes so charts recolor themselves when the user toggles.
    const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light');
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setTheme(document.documentElement.getAttribute('data-theme') || 'light');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    // Reset cached stats when the active project changes — re-fetch on next open.
    useEffect(() => {
        setStats(null);
        setError('');
    }, [projectId]);

    const handleToggle = async () => {
        const willOpen = !open;
        setOpen(willOpen);

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

    const weekly = stats ? weeklyCompletions(tasks) : null;

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
                                <div className="chart-wrapper">
                                    <StatusDoughnut data={stats.by_status} theme={theme} />
                                </div>
                            </section>

                            <section className="analytics-section">
                                <h3>By Priority</h3>
                                <div className="chart-wrapper">
                                    <PriorityBar data={stats.by_priority} theme={theme} />
                                </div>
                            </section>

                            <section className="analytics-section">
                                <h3>Completed — last 7 days</h3>
                                <div className="chart-wrapper">
                                    {weekly && <CompletionLine labels={weekly.labels} data={weekly.data} theme={theme} />}
                                </div>
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
