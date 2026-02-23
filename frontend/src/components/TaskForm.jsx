import { useState } from 'react';
import { createTask } from '../api/tasks';

function TaskForm({ onCreated }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) { setError('Title is required'); return; }
        setError('');
        setLoading(true);
        try {
            await createTask({ title: title.trim(), description: description.trim() });
            setTitle('');
            setDescription('');
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
            <button type="submit" disabled={loading}>
                {loading ? 'Adding…' : 'Add Task'}
            </button>
        </form>
    );
}

export default TaskForm;
