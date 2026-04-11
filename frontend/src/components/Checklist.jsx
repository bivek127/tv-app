import { useState, useEffect } from 'react';
import { getSubtasks, createSubtask, updateSubtask, deleteSubtask } from '../api/subtasks';
import './Checklist.css';

function Checklist({ taskId }) {
    const [subtasks, setSubtasks] = useState([]);
    const [newTitle, setNewTitle] = useState('');
    const [adding, setAdding] = useState(false);

    const load = async () => {
        try {
            const data = await getSubtasks(taskId);
            setSubtasks(data);
        } catch { /* silent */ }
    };

    useEffect(() => { load(); }, [taskId]);

    const handleToggle = async (subtask) => {
        await updateSubtask(taskId, subtask.id, { completed: !subtask.completed });
        load();
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        setAdding(true);
        try {
            await createSubtask(taskId, newTitle.trim());
            setNewTitle('');
            load();
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (subtaskId) => {
        await deleteSubtask(taskId, subtaskId);
        load();
    };

    const completed = subtasks.filter((s) => s.completed).length;
    const total = subtasks.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
        <div className="checklist">
            <div className="checklist-header">
                <span className="checklist-label">Checklist</span>
                <span className="checklist-count">{completed}/{total}</span>
            </div>

            {total > 0 && (
                <div className="checklist-progress-bar">
                    <div
                        className="checklist-progress-fill"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            )}

            <ul className="checklist-items">
                {subtasks.map((s) => (
                    <li key={s.id} className="checklist-item">
                        <input
                            type="checkbox"
                            checked={s.completed}
                            onChange={() => handleToggle(s)}
                        />
                        <span className={s.completed ? 'checklist-item-done' : ''}>
                            {s.title}
                        </span>
                        <button
                            className="checklist-delete"
                            onClick={() => handleDelete(s.id)}
                            title="Remove"
                        >×</button>
                    </li>
                ))}
            </ul>

            <form className="checklist-add" onSubmit={handleAdd}>
                <input
                    type="text"
                    placeholder="Add item..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                />
                <button type="submit" disabled={adding || !newTitle.trim()}>Add</button>
            </form>
        </div>
    );
}

export default Checklist;
