import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getTasks } from './api/tasks';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import KanbanBoard from './components/KanbanBoard';
import StatsBar from './components/StatsBar';
import FilterBar from './components/FilterBar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
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
        <button onClick={handleLogout} className="btn-logout">Sign out</button>
      </header>
      <main className="app-main">
        {error && <p className="error banner">{error}</p>}
        <StatsBar tasks={tasks} />
        <TaskForm onCreated={refreshTasks} />
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

// ── Handle OAuth token from redirect ──────────────────────────────
function OAuthHandler() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      loginWithToken(token);
      window.history.replaceState({}, '', '/');
      navigate('/', { replace: true });
    }
  }, []);

  return null;
}

// ── Root app with routing ──────────────────────────────────────────
function App() {
  return (
    <>
      <OAuthHandler />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
    </>
  );
}

export default App;
