import { useState } from 'react';
import { updateTask, deleteTask } from '../api/tasks';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
const STATUS_LABELS   = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function TaskItem({ task, onRefresh }) {
    const [editing, setEditing]         = useState(false);
    const [title, setTitle]             = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [priority, setPriority]       = useState(task.priority || 'medium');
    const [status, setStatus]           = useState(task.status || 'todo');
    const [dueDate, setDueDate]         = useState(task.due_date ? task.due_date.slice(0, 10) : '');
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');

    const handleSave = async () => {
        if (!title.trim()) { setError('Title is required'); return; }
        setError('');
        setLoading(true);
        try {
            await updateTask(task.id, {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                status,
                due_date: dueDate || null,
            });
            setEditing(false);
            onRefresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority || 'medium');
        setStatus(task.status || 'todo');
        setDueDate(task.due_date ? task.due_date.slice(0, 10) : '');
        setError('');
        setEditing(false);
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${task.title}"?`)) return;
        setLoading(true);
        try {
            await deleteTask(task.id);
            onRefresh();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <li className={`task-item priority-${task.priority}`}>
            {editing ? (
                <div className="task-edit">
                    {error && <p className="error">{error}</p>}
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" />
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description" />
                    <div className="task-form-row">
                        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                    <div className="task-actions">
                        <button onClick={handleSave} disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
                        <button onClick={handleCancel} className="btn-secondary">Cancel</button>
                    </div>
                </div>
            ) : (
                <div className="task-view">
                    <div className="task-content">
                        <strong>{task.title}</strong>
                        {task.description && <p>{task.description}</p>}
                        <div className="task-meta">
                            <span className={`badge priority-badge priority-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
                            <span className={`badge status-badge status-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                            {task.due_date && <span className="badge due-date">Due: {task.due_date.slice(0, 10)}</span>}
                        </div>
                    </div>
                    <div className="task-actions">
                        <button onClick={() => setEditing(true)} className="btn-secondary">Edit</button>
                        <button onClick={handleDelete} className="btn-danger" disabled={loading}>
                            {loading ? '…' : 'Delete'}
                        </button>
                    </div>
                </div>
            )}
        </li>
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
