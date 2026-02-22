import { useState } from 'react';
import { updateTask, deleteTask } from '../api/tasks';

function TaskItem({ task, onRefresh }) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!title.trim()) { setError('Title is required'); return; }
        setError('');
        setLoading(true);
        try {
            await updateTask(task.id, { title: title.trim(), description: description.trim() });
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
        <li className="task-item">
            {editing ? (
                <div className="task-edit">
                    {error && <p className="error">{error}</p>}
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" />
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description" />
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
