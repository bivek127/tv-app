import { useState, useEffect, useRef } from 'react';
import { getLabels, createLabel, deleteLabel, addLabelToTask, removeLabelFromTask } from '../api/labels';
import ColorWheelPicker from './ColorWheelPicker';
import './LabelManager.css';

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#ec4899', '#f43f5e', '#64748b',
];

function LabelManager({ taskId, taskLabels, onLabelsChange }) {
    const [allLabels, setAllLabels] = useState([]);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#6366f1');
    const [creating, setCreating] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [wheelOpen, setWheelOpen] = useState(false);
    const pickerRef = useRef(null);

    useEffect(() => {
        if (!pickerOpen) return;
        const handleClick = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [pickerOpen]);

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
                <div className="label-create-row">
                    <div className="label-picker-anchor" ref={pickerRef}>
                        <button
                            className="label-color-trigger"
                            style={{ background: newColor }}
                            onClick={() => setPickerOpen((o) => !o)}
                            title="Pick a color"
                            type="button"
                        />
                        {pickerOpen && (
                            <div className="label-color-popover">
                                <div className="label-preset-grid">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            className={`label-preset-swatch ${newColor === c ? 'selected' : ''}`}
                                            style={{ background: c }}
                                            onClick={() => { setNewColor(c); setPickerOpen(false); setWheelOpen(false); }}
                                            type="button"
                                        >
                                            {newColor === c && <span className="label-swatch-check">✓</span>}
                                        </button>
                                    ))}
                                </div>
                                <div className="label-custom-row">
                                    <button
                                        className="label-custom-btn"
                                        type="button"
                                        onClick={() => setWheelOpen((o) => !o)}
                                    >
                                        <span className="label-custom-icon">⬤</span>
                                        Custom {wheelOpen ? '▲' : '▼'}
                                    </button>
                                </div>
                                {wheelOpen && (
                                    <ColorWheelPicker
                                        color={newColor}
                                        onColorChange={setNewColor}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="New label..."
                        className="label-create-input"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                    />
                    <button onClick={handleCreate} disabled={creating || !newName.trim()} className="label-create-btn">
                        {creating ? 'Adding…' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LabelManager;
