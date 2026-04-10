import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import { updateTask } from '../api/tasks';
import TaskCard from './TaskCard';
import './KanbanBoard.css';

const COLUMNS = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'done', label: 'Done' },
];

function KanbanBoard({ tasks, onRefresh }) {
    const [activeTask, setActiveTask] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const tasksByStatus = {};
    COLUMNS.forEach((col) => {
        tasksByStatus[col.id] = tasks.filter((t) => t.status === col.id);
    });

    function findColumnForTask(taskId) {
        for (const col of COLUMNS) {
            if (tasksByStatus[col.id].some((t) => t.id === taskId)) {
                return col.id;
            }
        }
        return null;
    }

    function handleDragStart(event) {
        const task = tasks.find((t) => t.id === event.active.id);
        setActiveTask(task || null);
    }

    async function handleDragEnd(event) {
        setActiveTask(null);
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id;
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        // Determine which column was dropped on
        let newStatus = null;

        // Check if dropped on a column directly
        if (COLUMNS.some((c) => c.id === over.id)) {
            newStatus = over.id;
        } else {
            // Dropped on another task — find that task's column
            const overTask = tasks.find((t) => t.id === over.id);
            if (overTask) newStatus = overTask.status;
        }

        if (!newStatus || newStatus === task.status) return;

        try {
            await updateTask(taskId, {
                title: task.title,
                description: task.description || undefined,
                priority: task.priority,
                status: newStatus,
                due_date: task.due_date ? task.due_date.slice(0, 10) : null,
            });
            onRefresh();
        } catch (err) {
            console.error('Failed to update task status:', err);
        }
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="kanban-board">
                {COLUMNS.map((col) => (
                    <SortableContext
                        key={col.id}
                        id={col.id}
                        items={tasksByStatus[col.id].map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="kanban-column">
                            <div className={`kanban-column-header status-${col.id}`}>
                                <span>{col.label}</span>
                                <span className="kanban-count">{tasksByStatus[col.id].length}</span>
                            </div>
                            <div className="kanban-column-body" data-column-id={col.id}>
                                {tasksByStatus[col.id].length === 0 ? (
                                    <p className="kanban-empty">No tasks</p>
                                ) : (
                                    tasksByStatus[col.id].map((task) => (
                                        <TaskCard key={task.id} task={task} onRefresh={onRefresh} />
                                    ))
                                )}
                            </div>
                        </div>
                    </SortableContext>
                ))}
            </div>
            <DragOverlay>
                {activeTask ? (
                    <div className="kanban-card kanban-card-overlay">
                        <div className="kanban-card-title">{activeTask.title}</div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

export default KanbanBoard;
