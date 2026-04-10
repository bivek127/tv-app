import './StatsBar.css';

function StatsBar({ tasks }) {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const today = new Date(new Date().toDateString());
    const overdue = tasks.filter(
        (t) => t.due_date && t.status !== 'done' && new Date(t.due_date) < today
    ).length;

    return (
        <div className="stats-bar">
            <div className="stat-card stat-total">
                <span className="stat-number">{total}</span>
                <span className="stat-label">Total Tasks</span>
            </div>
            <div className="stat-card stat-completed">
                <span className="stat-number">{completed}</span>
                <span className="stat-label">Completed</span>
            </div>
            <div className="stat-card stat-progress">
                <span className="stat-number">{inProgress}</span>
                <span className="stat-label">In Progress</span>
            </div>
            <div className="stat-card stat-overdue">
                <span className="stat-number">{overdue}</span>
                <span className="stat-label">Overdue</span>
            </div>
        </div>
    );
}

export default StatsBar;
