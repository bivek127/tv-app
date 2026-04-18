import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getSubtasks } from '../api/subtasks';
import TaskModal from './TaskModal';

const PRIORITY_COLORS = {
    urgent: '#bf2600',
    high: '#ff5630',
    medium: '#ffab00',
    low: '#97a0af',
};

const PRIORITY_LABELS = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
};

function isOverdue(task) {
    if (!task.due_date || task.status === 'done') return false;
    return new Date(task.due_date) < new Date(new Date().toDateString());
}

function TaskCard({ task, onRefresh, allTasks = [] }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [subtaskStats, setSubtaskStats] = useState({ total: 0, completed: 0 });

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { task } });

    const isBlocked = task.blocked_by_count > 0 && task.status !== 'done';

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : (isBlocked ? 0.75 : 1),
    };

    const loadStats = () => {
        getSubtasks(task.id).then((data) => {
            setSubtaskStats({
                total: data.length,
                completed: data.filter((s) => s.completed).length,
            });
        }).catch(() => {});
    };

    useEffect(() => { loadStats(); }, [task.id]);

    const percent = subtaskStats.total === 0 ? 0 : Math.round((subtaskStats.completed / subtaskStats.total) * 100);

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className="kanban-card"
                {...attributes}
                {...listeners}
                onClick={() => setModalOpen(true)}
            >
                <div className="kanban-card-title">{task.title}</div>
                {task.description && (
                    <div className="kanban-card-desc">{task.description}</div>
                )}
                {subtaskStats.total > 0 && (
                    <div className="kanban-subtask-progress">
                        <div className="kanban-subtask-bar">
                            <div className="kanban-subtask-fill" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="kanban-subtask-count">{subtaskStats.completed}/{subtaskStats.total}</span>
                    </div>
                )}
                {task.labels && task.labels.length > 0 && (
                    <div className="kanban-card-labels">
                        {task.labels.slice(0, 2).map((l) => (
                            <span key={l.id} className="kanban-label-chip">
                                <span className="kanban-label-dot" style={{ background: l.color }} />
                                {l.name}
                            </span>
                        ))}
                        {task.labels.length > 2 && (
                            <span className="kanban-label-more">+{task.labels.length - 2}</span>
                        )}
                    </div>
                )}
                <div className="kanban-card-meta">
                    <span
                        className="kanban-priority-badge"
                        style={{ background: PRIORITY_COLORS[task.priority] }}
                    >
                        {PRIORITY_LABELS[task.priority]}
                    </span>
                    {task.due_date && (
                        <span className="kanban-due-date">
                            {task.due_date.slice(0, 10)}
                        </span>
                    )}
                    {isOverdue(task) && (
                        <span className="kanban-overdue">Overdue</span>
                    )}
                    {isBlocked && (
                        <span className="kanban-blocked" title={`${task.blocked_by_count} incomplete blocker${task.blocked_by_count === 1 ? '' : 's'}`}>
                            🔒 Blocked
                        </span>
                    )}
                </div>
            </div>

            {modalOpen && (
                <TaskModal
                    task={task}
                    allTasks={allTasks}
                    onClose={() => { setModalOpen(false); loadStats(); }}
                    onRefresh={() => { onRefresh(); loadStats(); }}
                />
            )}
        </>
    );
}

export default TaskCard;
