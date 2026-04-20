import { useState, forwardRef } from 'react';
import { createTask } from '../api/tasks';
import { useToast } from '../context/ToastContext';

const TaskForm = forwardRef(function TaskForm({ onCreated, projectId }, ref) {
    const [title, setTitle]           = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority]     = useState('medium');
    const [status, setStatus]         = useState('todo');
    const [dueDate, setDueDate]       = useState('');
    const [loading, setLoading]       = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) { showToast('Title is required', 'warning'); return; }
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
            showToast('Task created', 'success');
            onCreated();
        } catch (err) {
            showToast(err.message || 'Could not create task', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <h2>New Task</h2>
            <input
                ref={ref}
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
});

export default TaskForm;
