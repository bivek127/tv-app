import './FilterBar.css';

function FilterBar({ search, onSearchChange, priority, onPriorityChange, status, onStatusChange, onClear, taskCount }) {
    return (
        <div className="filter-bar">
            <input
                type="text"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="filter-search"
            />
            <select value={priority} onChange={(e) => onPriorityChange(e.target.value)} className="filter-select">
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
            </select>
            <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="filter-select">
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
            </select>
            {(search || priority || status) && (
                <button onClick={onClear} className="filter-clear">Clear</button>
            )}
            <span className="filter-count">{taskCount} tasks found</span>
        </div>
    );
}

export default FilterBar;
