import { useState, useEffect } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getSubtasks, createSubtask, updateSubtask, deleteSubtask } from '../api/subtasks';
import './Checklist.css';

function SortableItem({ subtask, onToggle, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: subtask.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <li ref={setNodeRef} style={style} className="checklist-item" {...attributes}>
            <span className="checklist-drag-handle" {...listeners}>⠿</span>
            <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => onToggle(subtask)}
            />
            <span className={subtask.completed ? 'checklist-item-done' : ''}>
                {subtask.title}
            </span>
            <button
                className="checklist-delete"
                onClick={() => onDelete(subtask.id)}
                title="Remove"
            >×</button>
        </li>
    );
}

function Checklist({ taskId }) {
    const [subtasks, setSubtasks] = useState([]);
    const [newTitle, setNewTitle] = useState('');
    const [adding, setAdding] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

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

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = subtasks.findIndex((s) => s.id === active.id);
        const newIndex = subtasks.findIndex((s) => s.id === over.id);
        const reordered = arrayMove(subtasks, oldIndex, newIndex);

        // Optimistic update
        setSubtasks(reordered);

        // Persist only the items whose position actually changed
        const updates = [];
        reordered.forEach((s, i) => {
            if (s.position !== i) {
                updates.push(updateSubtask(taskId, s.id, { position: i }));
            }
        });
        await Promise.all(updates);
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

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={subtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <ul className="checklist-items">
                        {subtasks.map((s) => (
                            <SortableItem
                                key={s.id}
                                subtask={s}
                                onToggle={handleToggle}
                                onDelete={handleDelete}
                            />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>

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
