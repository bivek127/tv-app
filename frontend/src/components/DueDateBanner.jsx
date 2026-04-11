import { useState } from 'react';
import TaskModal from './TaskModal';
import './DueDateBanner.css';

function DueDateBanner({ tasks, onRefresh }) {
    const [selectedTask, setSelectedTask] = useState(null);
    const [collapsed, setCollapsed] = useState(false);

    const today = new Date().toISOString().slice(0, 10);

    const overdue = tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) < today && t.status !== 'done');
    const dueToday = tasks.filter((t) => t.due_date && t.due_date.slice(0, 10) === today && t.status !== 'done');

    if (overdue.length === 0 && dueToday.length === 0) return null;

    return (
        <>
            <div className="due-banner">
                <div className="due-banner-header" onClick={() => setCollapsed((c) => !c)}>
                    <span className="due-banner-title">
                        {overdue.length > 0 && <span className="due-pill overdue">{overdue.length} Overdue</span>}
                        {dueToday.length > 0 && <span className="due-pill today">{dueToday.length} Due Today</span>}
                    </span>
                    <button className="due-banner-toggle">{collapsed ? 'Show' : 'Hide'}</button>
                </div>

                {!collapsed && (
                    <div className="due-banner-list">
                        {overdue.map((t) => (
                            <button key={t.id} className="due-task-chip overdue" onClick={() => setSelectedTask(t)}>
                                <span className="due-chip-dot" />
                                <span className="due-chip-title">{t.title}</span>
                                <span className="due-chip-date">{t.due_date.slice(0, 10)}</span>
                            </button>
                        ))}
                        {dueToday.map((t) => (
                            <button key={t.id} className="due-task-chip today" onClick={() => setSelectedTask(t)}>
                                <span className="due-chip-dot" />
                                <span className="due-chip-title">{t.title}</span>
                                <span className="due-chip-date">Today</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onRefresh={() => { onRefresh(); setSelectedTask(null); }}
                />
            )}
        </>
    );
}

export default DueDateBanner;
