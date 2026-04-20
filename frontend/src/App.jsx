import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useProject } from './context/ProjectContext';
import { getTasks } from './api/tasks';
import { useSSE } from './hooks/useSSE';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import KanbanBoard from './components/KanbanBoard';
import StatsBar from './components/StatsBar';
import DueDateBanner from './components/DueDateBanner';
import FilterBar from './components/FilterBar';
import AnalyticsPanel from './components/AnalyticsPanel';
import ActivityFeed from './components/ActivityFeed';
import ProjectsSidebar from './components/ProjectsSidebar';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import CommandPalette from './components/CommandPalette';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import TaskModal from './components/TaskModal';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import './App.css';

// ── Task dashboard (only rendered when authenticated) ──────────────
function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('board');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sort, setSort] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  const [paletteTask, setPaletteTask] = useState(null);
  const titleInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { activeProject } = useProject();
  const navigate = useNavigate();

  const projectId = activeProject?.id || null;

  const refreshTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await getTasks({ projectId });
      setTasks(data.tasks);
      setNextCursor(data.nextCursor);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load tasks.');
    }
  }, [projectId]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore || !projectId) return;
    setLoadingMore(true);
    try {
      const data = await getTasks({ projectId, cursor: nextCursor });
      setTasks((prev) => [...prev, ...data.tasks]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err.message || 'Could not load more tasks.');
    } finally {
      setLoadingMore(false);
    }
  };

  // Reset + refetch whenever the active project changes.
  useEffect(() => {
    setTasks([]);
    setNextCursor(null);
    refreshTasks();
  }, [projectId, refreshTasks]);

  const handleSSE = useCallback((event) => {
    if (event.type === 'task_created') {
      // Only show tasks for the currently active project.
      if (event.payload.project_id && event.payload.project_id !== projectId) return;
      setTasks((prev) => prev.some((t) => t.id === event.payload.id) ? prev : [event.payload, ...prev]);
    } else if (event.type === 'task_updated') {
      if (event.payload.project_id && event.payload.project_id !== projectId) return;
      setTasks((prev) => prev.map((t) => t.id === event.payload.id ? { ...t, ...event.payload } : t));
    } else if (event.type === 'task_deleted') {
      setTasks((prev) => prev.filter((t) => t.id !== event.payload.id));
    }
  }, [projectId]);

  const { isConnected } = useSSE(handleSSE);

  // Cmd/Ctrl+K opens the command palette. Keep this in its own listener so
  // it fires even while the user is typing inside an input.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useKeyboardShortcuts({
    onNewTask:     () => titleInputRef.current?.focus(),
    onFocusSearch: () => searchInputRef.current?.focus(),
    onBoardView:   () => setView('board'),
    onListView:    () => setView('list'),
    onHelp:        () => setShortcutsHelpOpen(true),
    onEscape:      () => {
      if (paletteOpen) setPaletteOpen(false);
      else if (shortcutsHelpOpen) setShortcutsHelpOpen(false);
      else if (paletteTask) setPaletteTask(null);
    },
  });

  const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
  const STATUS_ORDER = { todo: 0, in_progress: 1, done: 2 };

  const filteredTasks = tasks.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.description || '').toLowerCase().includes(q)) return false;
    }
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (labelFilter && !(t.labels || []).some((l) => l.id === Number(labelFilter))) return false;
    if (blockedOnly && !(t.blocked_by_count > 0)) return false;
    return true;
  }).sort((a, b) => {
    if (sort === 'due_asc') {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    }
    if (sort === 'priority_desc') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (sort === 'title_asc') return a.title.localeCompare(b.title);
    if (sort === 'status') return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const clearFilters = () => { setSearch(''); setFilterPriority(''); setFilterStatus(''); setLabelFilter(''); setBlockedOnly(false); };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <ProjectsSidebar />
      <div className="app-main-wrapper">
        <div className="app">
          <header className="app-header">
            <h1 className="active-project-title">
              {activeProject && (
                <>
                  <span className="active-project-icon">{activeProject.icon || '📋'}</span>
                  <span>{activeProject.name}</span>
                </>
              )}
              {!activeProject && <span>TaskVault</span>}
            </h1>
            <nav style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button onClick={toggleTheme} className="btn-theme" title="Toggle theme" aria-label="Toggle theme">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button onClick={() => navigate('/profile')} className="btn-secondary" style={{ fontSize: '0.85rem' }}>Profile</button>
              <button onClick={handleLogout} className="btn-logout">Sign out</button>
            </nav>
          </header>
          <main className="app-main">
            {error && <p className="error banner">{error}</p>}
            <StatsBar tasks={tasks} />
            <DueDateBanner tasks={tasks} onRefresh={refreshTasks} />
            <TaskForm ref={titleInputRef} onCreated={refreshTasks} projectId={projectId} />
            <ErrorBoundary title="Analytics failed to load">
              <AnalyticsPanel projectId={projectId} tasks={tasks} />
            </ErrorBoundary>
            <ErrorBoundary title="Activity feed failed to load">
              <ActivityFeed />
            </ErrorBoundary>
            <FilterBar
              ref={searchInputRef}
              search={search}
              onSearchChange={setSearch}
              priority={filterPriority}
              onPriorityChange={setFilterPriority}
              status={filterStatus}
              onStatusChange={setFilterStatus}
              sort={sort}
              onSortChange={setSort}
              labelFilter={labelFilter}
              onLabelFilterChange={setLabelFilter}
              blockedOnly={blockedOnly}
              onBlockedFilterChange={setBlockedOnly}
              onClear={clearFilters}
              taskCount={filteredTasks.length}
              projectId={projectId}
            />
            <section className="task-section">
              <div className="task-section-header">
                <h2>Tasks ({filteredTasks.length})</h2>
                <div className="task-section-right">
                  <span className={`live-indicator ${isConnected ? 'on' : 'off'}`} title={isConnected ? 'Real-time updates active' : 'Reconnecting…'}>
                    <span className="live-dot" />
                    {isConnected ? 'Live' : 'Reconnecting…'}
                  </span>
                  <div className="view-toggle">
                    <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>Board</button>
                    <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>List</button>
                  </div>
                </div>
              </div>
              <ErrorBoundary title="Task view failed to load">
                {view === 'board' ? (
                  <KanbanBoard tasks={filteredTasks} onRefresh={refreshTasks} allTasks={tasks} />
                ) : (
                  <TaskList tasks={filteredTasks} onRefresh={refreshTasks} allTasks={tasks} />
                )}
              </ErrorBoundary>
            </section>
            {nextCursor && (
              <div className="load-more-wrapper">
                <button className="btn-load-more" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading...' : 'Load more tasks'}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        tasks={tasks}
        onOpenTask={setPaletteTask}
        onFocusNewTask={() => titleInputRef.current?.focus()}
        onSetView={setView}
      />
      {shortcutsHelpOpen && (
        <KeyboardShortcutsModal onClose={() => setShortcutsHelpOpen(false)} />
      )}
      {paletteTask && (
        <TaskModal
          task={paletteTask}
          onClose={() => setPaletteTask(null)}
          onRefresh={refreshTasks}
          allTasks={tasks}
        />
      )}
    </div>
  );
}

// ── Root app with routing ──────────────────────────────────────────
function App() {
  return (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}

export default App;
