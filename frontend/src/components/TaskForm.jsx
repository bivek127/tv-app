import { useState } from 'react';
import { createTask } from '../api/tasks';

function TaskForm({ onCreated, projectId }) {
    const [title, setTitle]           = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority]     = useState('medium');
    const [status, setStatus]         = useState('todo');
    const [dueDate, setDueDate]       = useState('');
    const [error, setError]           = useState('');
    const [loading, setLoading]       = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) { setError('Title is required'); return; }
        setError('');
        setLoading(true);
        try {
            await createTask({
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                status,
                due_date: dueDate || null,
                projectId: projectId || undefined,
            });
            setTitle('');
            setDescription('');
            setPriority('medium');
            setStatus('todo');
            setDueDate('');
            onCreated();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <h2>New Task</h2>
            {error && <p className="error">{error}</p>}
            <input
                type="text"
                placeholder="Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
            />
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
                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />
            </div>
            <button type="submit" disabled={loading}>
                {loading ? 'Adding…' : 'Add Task'}
            </button>
        </form>
    );
}

export default TaskForm;
