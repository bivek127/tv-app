import { useState, useEffect } from 'react';
import { getLabels, createLabel, deleteLabel, addLabelToTask, removeLabelFromTask } from '../api/labels';
import './LabelManager.css';

const PRESET_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

function LabelManager({ taskId, taskLabels, onLabelsChange }) {
    const [allLabels, setAllLabels] = useState([]);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
    const [creating, setCreating] = useState(false);

    const loadLabels = () => {
        getLabels().then(setAllLabels).catch(() => {});
    };

    useEffect(() => { loadLabels(); }, []);

    const assignedIds = new Set((taskLabels || []).map((l) => l.id));

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            await createLabel(newName.trim(), newColor);
            setNewName('');
            loadLabels();
        } catch {
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (labelId) => {
        try {
            await deleteLabel(labelId);
            loadLabels();
            onLabelsChange();
        } catch {}
    };

    const handleToggle = async (labelId) => {
        try {
            if (assignedIds.has(labelId)) {
                await removeLabelFromTask(taskId, labelId);
            } else {
                await addLabelToTask(taskId, labelId);
            }
            onLabelsChange();
        } catch {}
    };

    return (
        <div className="label-manager">
            <h3 className="label-manager-title">Labels</h3>

            {/* Assigned labels */}
            {taskLabels && taskLabels.length > 0 && (
                <div className="label-chips">
                    {taskLabels.map((l) => (
                        <span key={l.id} className="label-chip" style={{ background: l.color }}>
                            {l.name}
                        </span>
                    ))}
                </div>
            )}

            {/* All labels — toggle assignment */}
            <div className="label-list">
                {allLabels.map((l) => (
                    <div key={l.id} className={`label-row ${assignedIds.has(l.id) ? 'assigned' : ''}`}>
                        <button className="label-toggle" onClick={() => handleToggle(l.id)}>
                            <span className="label-dot" style={{ background: l.color }} />
                            <span className="label-name">{l.name}</span>
                            {assignedIds.has(l.id) && <span className="label-check">&#10003;</span>}
                        </button>
                        <button className="label-delete" onClick={() => handleDelete(l.id)} title="Delete label">&times;</button>
                    </div>
                ))}
            </div>

            {/* Create new label */}
            <div className="label-create">
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New label..."
                    className="label-create-input"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                />
                <div className="label-color-picker">
                    {PRESET_COLORS.map((c) => (
                        <button
                            key={c}
                            className={`label-color-swatch ${newColor === c ? 'selected' : ''}`}
                            style={{ background: c }}
                            onClick={() => setNewColor(c)}
                        />
                    ))}
                </div>
                <button onClick={handleCreate} disabled={creating || !newName.trim()} className="label-create-btn">
                    {creating ? 'Adding…' : 'Add'}
                </button>
            </div>
        </div>
    );
}

export default LabelManager;
