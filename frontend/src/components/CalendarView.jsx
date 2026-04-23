import { useMemo, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { createTask, updateTask } from '../api/tasks';
import { useToast } from '../context/ToastContext';
import TaskModal from './TaskModal';
import './CalendarView.css';

const WEEKDAYS_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Date helpers (all in local time) ──────────────────────────────

function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function parseISODate(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function startOfWeekMonday(date) {
    const d = startOfDay(date);
    const day = d.getDay();               // 0=Sun, 1=Mon, …
    const diff = (day + 6) % 7;           // how many days back to Monday
    d.setDate(d.getDate() - diff);
    return d;
}

/** 42-cell grid (6 weeks) for the given month, starting on Sunday. */
function buildMonthGrid(year, month) {
    const first = new Date(year, month, 1);
    const gridStart = new Date(first);
    gridStart.setDate(gridStart.getDate() - first.getDay());
    const days = [];
    for (let i = 0; i < 42; i++) {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        days.push(d);
    }
    return days;
}

function buildWeekDays(anchor) {
    const start = startOfWeekMonday(anchor);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
    }
    return days;
}

// ── Draggable chip / card ─────────────────────────────────────────

function TaskChip({ task, compact, onOpen }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `task-${task.id}`,
        data: { task },
    });

    const [hover, setHover] = useState(false);

    const style = {
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
    };

    const progress = task.subtasks_total > 0
        ? `${task.subtasks_done}/${task.subtasks_total}`
        : null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`cal-chip priority-${task.priority || 'medium'} ${compact ? 'cal-chip-compact' : 'cal-chip-full'}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={(e) => {
                e.stopPropagation();
                if (!isDragging) onOpen?.(task);
            }}
        >
            <span className="cal-chip-title">{task.title}</span>
            {!compact && (
                <div className="cal-chip-meta">
                    <span className={`cal-chip-badge badge-${task.priority || 'medium'}`}>
                        {task.priority || 'medium'}
                    </span>
                    {progress && <span className="cal-chip-progress">{progress}</span>}
                </div>
            )}
            {hover && !isDragging && <TaskHoverCard task={task} />}
        </div>
    );
}

function TaskHoverCard({ task }) {
    return (
        <div className="cal-popover" onMouseDown={(e) => e.stopPropagation()}>
            <div className="cal-popover-title">{task.title}</div>
            {task.description && (
                <div className="cal-popover-desc">
                    {task.description.length > 140
                        ? task.description.slice(0, 140) + '…'
                        : task.description}
                </div>
            )}
            <div className="cal-popover-row">
                <span className={`cal-chip-badge badge-${task.priority || 'medium'}`}>
                    {task.priority || 'medium'}
                </span>
                <span className={`cal-status status-${task.status}`}>
                    {task.status?.replace('_', ' ') || 'todo'}
                </span>
            </div>
            {task.subtasks_total > 0 && (
                <div className="cal-popover-progress">
                    Subtasks: {task.subtasks_done}/{task.subtasks_total}
                </div>
            )}
            {Array.isArray(task.labels) && task.labels.length > 0 && (
                <div className="cal-popover-labels">
                    {task.labels.map((l) => (
                        <span
                            key={l.id}
                            className="cal-popover-label"
                            style={{ background: l.color || 'var(--surface)' }}
                        >
                            {l.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Day cell (droppable) ──────────────────────────────────────────

function DayCell({
    date,
    isOtherMonth,
    isToday,
    isPast,
    tasks,
    expanded,
    onToggleExpand,
    onQuickAddClick,
    onOpenTask,
    subView,
}) {
    const iso = toISODate(date);
    const { setNodeRef, isOver } = useDroppable({
        id: `day-${iso}`,
        data: { iso, isPast },
        disabled: isPast,
    });

    const classes = [
        'cal-day',
        isOtherMonth && 'cal-day-other',
        isToday && 'cal-day-today',
        isPast && 'cal-day-past',
        isOver && !isPast && 'cal-day-dragover',
        subView === 'week' && 'cal-day-week',
    ].filter(Boolean).join(' ');

    const visibleTasks = subView === 'month' && !expanded
        ? tasks.slice(0, 2)
        : tasks;

    const hiddenCount = subView === 'month' && !expanded
        ? Math.max(0, tasks.length - 2)
        : 0;

    return (
        <div
            ref={setNodeRef}
            className={classes}
            onClick={(e) => {
                if (e.target === e.currentTarget || e.target.classList.contains('cal-day-body')) {
                    onQuickAddClick(iso);
                }
            }}
        >
            <div className="cal-day-header">
                <span className="cal-day-num">
                    {subView === 'week'
                        ? `${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)}`
                        : date.getDate()}
                </span>
                {isToday && <span className="cal-today-pill">Today</span>}
            </div>
            <div className="cal-day-body">
                {visibleTasks.map((t) => (
                    <TaskChip key={t.id} task={t} compact={subView === 'month'} onOpen={onOpenTask} />
                ))}
                {hiddenCount > 0 && (
                    <button
                        type="button"
                        className="cal-more"
                        onClick={(e) => { e.stopPropagation(); onToggleExpand(iso); }}
                    >
                        +{hiddenCount} more
                    </button>
                )}
                {expanded && subView === 'month' && tasks.length > 2 && (
                    <button
                        type="button"
                        className="cal-more"
                        onClick={(e) => { e.stopPropagation(); onToggleExpand(iso); }}
                    >
                        Show less
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────

function CalendarView({ tasks, activeProjectId, onTaskUpdate, onTaskCreate, onRefresh }) {
    const [subView, setSubView] = useState('month');
    const [cursor, setCursor] = useState(() => startOfDay(new Date()));
    const [expandedDay, setExpandedDay] = useState(null);
    const [quickAddDay, setQuickAddDay] = useState(null);
    const [quickAddText, setQuickAddText] = useState('');
    const [openTask, setOpenTask] = useState(null);
    const [activeDragTask, setActiveDragTask] = useState(null);
    const { showToast } = useToast();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    // Group tasks by due date (YYYY-MM-DD, local time).
    const tasksByDay = useMemo(() => {
        const map = new Map();
        for (const t of tasks) {
            if (!t.due_date) continue;
            const d = parseISODate(t.due_date);
            if (!d) continue;
            const key = toISODate(d);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(t);
        }
        return map;
    }, [tasks]);

    // Navigation
    const goPrev = () => {
        const d = new Date(cursor);
        if (subView === 'month') d.setMonth(d.getMonth() - 1);
        else                     d.setDate(d.getDate() - 7);
        setCursor(d);
        setExpandedDay(null);
    };
    const goNext = () => {
        const d = new Date(cursor);
        if (subView === 'month') d.setMonth(d.getMonth() + 1);
        else                     d.setDate(d.getDate() + 7);
        setCursor(d);
        setExpandedDay(null);
    };
    const goToday = () => {
        setCursor(startOfDay(new Date()));
        setExpandedDay(null);
    };

    // Drag & drop → reschedule
    const handleDragStart = (event) => {
        const task = event.active.data.current?.task;
        setActiveDragTask(task || null);
    };

    const handleDragEnd = async (event) => {
        setActiveDragTask(null);
        const { active, over } = event;
        if (!over) return;

        const task = active.data.current?.task;
        const newIso = over.data.current?.iso;
        const isPast = over.data.current?.isPast;
        if (!task || !newIso || isPast) return;

        const oldIso = task.due_date ? task.due_date.slice(0, 10) : null;
        if (oldIso === newIso) return;

        // Optimistic update
        onTaskUpdate?.({ ...task, due_date: newIso });

        try {
            const updated = await updateTask(task.id, {
                title: task.title,
                description: task.description || undefined,
                priority: task.priority,
                status: task.status,
                due_date: newIso,
                reminder_at: task.reminder_at || null,
            });
            onTaskUpdate?.(updated);
        } catch (err) {
            showToast(err.message || 'Failed to reschedule task', 'error');
            onTaskUpdate?.(task); // revert
        }
    };

    // Quick-add on empty day click
    const handleQuickAddClick = (iso) => {
        const day = parseISODate(iso);
        if (day && day < startOfDay(new Date())) return; // no past adds
        setQuickAddDay(iso);
        setQuickAddText('');
    };

    const submitQuickAdd = async () => {
        const text = quickAddText.trim();
        if (!text || !quickAddDay) { setQuickAddDay(null); return; }
        try {
            const created = await createTask({
                title: text,
                priority: 'medium',
                status: 'todo',
                due_date: quickAddDay,
                projectId: activeProjectId || undefined,
            });
            onTaskCreate?.(created);
            setQuickAddDay(null);
            setQuickAddText('');
        } catch (err) {
            showToast(err.message || 'Could not create task', 'error');
        }
    };

    // ── Render ────────────────────────────────────────────────────
    const today = startOfDay(new Date());
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const monthDays = buildMonthGrid(year, month);
    const weekDays = buildWeekDays(cursor);

    const headerText = subView === 'month'
        ? `${MONTH_NAMES[month]} ${year}`
        : (() => {
            const first = weekDays[0];
            const last = weekDays[6];
            const sameMonth = first.getMonth() === last.getMonth();
            return sameMonth
                ? `${MONTH_NAMES[first.getMonth()]} ${first.getDate()}–${last.getDate()}, ${first.getFullYear()}`
                : `${MONTH_NAMES[first.getMonth()].slice(0, 3)} ${first.getDate()} – ${MONTH_NAMES[last.getMonth()].slice(0, 3)} ${last.getDate()}, ${last.getFullYear()}`;
        })();

    return (
        <div className="cal-wrapper">
            <div className="cal-header">
                <div className="cal-nav">
                    <button className="cal-nav-btn" onClick={goPrev} aria-label="Previous">‹</button>
                    <button className="cal-today-btn" onClick={goToday}>Today</button>
                    <button className="cal-nav-btn" onClick={goNext} aria-label="Next">›</button>
                </div>
                <h3 className="cal-title">{headerText}</h3>
                <div className="cal-subview-toggle view-toggle">
                    <button className={subView === 'month' ? 'active' : ''} onClick={() => setSubView('month')}>Month</button>
                    <button className={subView === 'week'  ? 'active' : ''} onClick={() => setSubView('week')}>Week</button>
                </div>
            </div>

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {subView === 'month' ? (
                    <div className="cal-month">
                        <div className="cal-weekday-row">
                            {WEEKDAYS_SUN.map((w) => (
                                <div key={w} className="cal-weekday">{w}</div>
                            ))}
                        </div>
                        <div className="cal-grid">
                            {monthDays.map((d) => {
                                const iso = toISODate(d);
                                const tasksForDay = tasksByDay.get(iso) || [];
                                return (
                                    <div key={iso} className="cal-grid-cell-wrap">
                                        <DayCell
                                            date={d}
                                            isOtherMonth={d.getMonth() !== month}
                                            isToday={isSameDay(d, today)}
                                            isPast={d < today}
                                            tasks={tasksForDay}
                                            expanded={expandedDay === iso}
                                            onToggleExpand={(key) =>
                                                setExpandedDay((cur) => cur === key ? null : key)
                                            }
                                            onQuickAddClick={handleQuickAddClick}
                                            onOpenTask={setOpenTask}
                                            subView="month"
                                        />
                                        {quickAddDay === iso && (
                                            <QuickAddInput
                                                value={quickAddText}
                                                onChange={setQuickAddText}
                                                onSubmit={submitQuickAdd}
                                                onCancel={() => setQuickAddDay(null)}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="cal-week">
                        <div className="cal-week-row">
                            {weekDays.map((d, i) => (
                                <div key={i} className="cal-weekday cal-weekday-week">{WEEKDAYS_MON[i]}</div>
                            ))}
                        </div>
                        <div className="cal-week-grid">
                            {weekDays.map((d) => {
                                const iso = toISODate(d);
                                const tasksForDay = tasksByDay.get(iso) || [];
                                return (
                                    <div key={iso} className="cal-grid-cell-wrap">
                                        <DayCell
                                            date={d}
                                            isOtherMonth={false}
                                            isToday={isSameDay(d, today)}
                                            isPast={d < today}
                                            tasks={tasksForDay}
                                            expanded
                                            onToggleExpand={() => {}}
                                            onQuickAddClick={handleQuickAddClick}
                                            onOpenTask={setOpenTask}
                                            subView="week"
                                        />
                                        {quickAddDay === iso && (
                                            <QuickAddInput
                                                value={quickAddText}
                                                onChange={setQuickAddText}
                                                onSubmit={submitQuickAdd}
                                                onCancel={() => setQuickAddDay(null)}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <DragOverlay>
                    {activeDragTask ? (
                        <div className={`cal-chip cal-chip-overlay priority-${activeDragTask.priority || 'medium'}`}>
                            <span className="cal-chip-title">{activeDragTask.title}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {openTask && (
                <TaskModal
                    task={openTask}
                    onClose={() => setOpenTask(null)}
                    onRefresh={() => {
                        setOpenTask(null);
                        onRefresh?.();
                    }}
                    allTasks={tasks}
                />
            )}
        </div>
    );
}

function QuickAddInput({ value, onChange, onSubmit, onCancel }) {
    return (
        <div className="cal-quickadd" onClick={(e) => e.stopPropagation()}>
            <input
                autoFocus
                type="text"
                placeholder="New task…"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onSubmit();
                    else if (e.key === 'Escape') onCancel();
                }}
                onBlur={() => {
                    if (!value.trim()) onCancel();
                    else onSubmit();
                }}
            />
        </div>
    );
}

export default CalendarView;
