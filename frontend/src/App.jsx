import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { getTasks } from './api/tasks';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import KanbanBoard from './components/KanbanBoard';
import StatsBar from './components/StatsBar';
import DueDateBanner from './components/DueDateBanner';
import FilterBar from './components/FilterBar';
import AnalyticsPanel from './components/AnalyticsPanel';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './App.css';

// ── Task dashboard (only rendered when authenticated) ──────────────
function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [view, setView] = useState('board');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sort, setSort] = useState('');
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const refreshTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load tasks.');
    }
  };

  useEffect(() => { refreshTasks(); }, []);

  const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
  const STATUS_ORDER = { todo: 0, in_progress: 1, done: 2 };

  const filteredTasks = tasks.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.description || '').toLowerCase().includes(q)) return false;
    }
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterStatus && t.status !== filterStatus) return false;
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

  const clearFilters = () => { setSearch(''); setFilterPriority(''); setFilterStatus(''); };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>TaskVault</h1>
        <nav style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={toggleTheme} className="btn-theme" title="Toggle theme" aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button onClick={handleLogout} className="btn-logout">Sign out</button>
        </nav>
      </header>
      <main className="app-main">
        {error && <p className="error banner">{error}</p>}
        <StatsBar tasks={tasks} />
        <DueDateBanner tasks={tasks} onRefresh={refreshTasks} />
        <TaskForm onCreated={refreshTasks} />
        <AnalyticsPanel />
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          priority={filterPriority}
          onPriorityChange={setFilterPriority}
          status={filterStatus}
          onStatusChange={setFilterStatus}
          sort={sort}
          onSortChange={setSort}
          onClear={clearFilters}
          taskCount={filteredTasks.length}
        />
        <section className="task-section">
          <div className="task-section-header">
            <h2>Tasks ({filteredTasks.length})</h2>
            <div className="view-toggle">
              <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>Board</button>
              <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>List</button>
            </div>
          </div>
          {view === 'board' ? (
            <KanbanBoard tasks={filteredTasks} onRefresh={refreshTasks} />
          ) : (
            <TaskList tasks={filteredTasks} onRefresh={refreshTasks} />
          )}
        </section>
      </main>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}

export default App;
