import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getTasks } from './api/tasks';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import KanbanBoard from './components/KanbanBoard';
import StatsBar from './components/StatsBar';
import FilterBar from './components/FilterBar';
import AnalyticsPanel from './components/AnalyticsPanel';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ActivityPage from './pages/ActivityPage';
import './App.css';

// ── Task dashboard (only rendered when authenticated) ──────────────
function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [view, setView] = useState('board');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { logout } = useAuth();
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

  const filteredTasks = tasks.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !(t.description || '').toLowerCase().includes(q)) return false;
    }
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
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
          <Link to="/activity" style={{ color: '#fff', fontSize: '0.875rem', textDecoration: 'none', opacity: 0.85 }}>Activity</Link>
          <button onClick={handleLogout} className="btn-logout">Sign out</button>
        </nav>
      </header>
      <main className="app-main">
        {error && <p className="error banner">{error}</p>}
        <StatsBar tasks={tasks} />
        <TaskForm onCreated={refreshTasks} />
        <AnalyticsPanel />
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          priority={filterPriority}
          onPriorityChange={setFilterPriority}
          status={filterStatus}
          onStatusChange={setFilterStatus}
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
          path="/activity"
          element={
            <ProtectedRoute>
              <ActivityPage />
            </ProtectedRoute>
          }
        />
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
