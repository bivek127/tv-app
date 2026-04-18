import { useState } from 'react';
import TaskModal from './TaskModal';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const STATUS_LABELS   = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function TaskItem({ task, onRefresh }) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            <li className={`task-item priority-${task.priority}`}>
                <div className="task-view">
                    <div className="task-content">
                        <strong>{task.title}</strong>
                        {task.description && <p>{task.description}</p>}
                        <div className="task-meta">
                            <span className={`badge priority-badge priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
                            <span className={`badge status-badge status-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                            {task.due_date && <span className="badge due-date">Due: {task.due_date.slice(0, 10)}</span>}
                            {task.labels && task.labels.length > 0 && task.labels.slice(0, 2).map((l) => (
                                <span key={l.id} className="badge label-chip">
                                    <span className="label-dot" style={{ background: l.color }} />
                                    {l.name}
                                </span>
                            ))}
                            {task.labels && task.labels.length > 2 && (
                                <span className="badge label-more">+{task.labels.length - 2}</span>
                            )}
                        </div>
                    </div>
                    <div className="task-actions">
                        <button onClick={() => setModalOpen(true)} className="btn-secondary">Edit</button>
                    </div>
                </div>
            </li>

            {modalOpen && (
                <TaskModal
                    task={task}
                    onClose={() => setModalOpen(false)}
                    onRefresh={() => { onRefresh(); setModalOpen(false); }}
                />
            )}
        </>
    );
}

function TaskList({ tasks, onRefresh }) {
    if (tasks.length === 0) return <p className="empty">No tasks yet. Add one above!</p>;
    return (
        <ul className="task-list">
            {tasks.map((task) => <TaskItem key={task.id} task={task} onRefresh={onRefresh} />)}
        </ul>
    );
}

export default TaskList;
