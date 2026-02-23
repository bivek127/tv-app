import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getToken, logout } from './api/auth';
import { getTasks } from './api/tasks';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

// ── Protected route wrapper ────────────────────────────────────────
function RequireAuth({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

// ── Main dashboard ─────────────────────────────────────────────────
function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const refreshTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
      setError('');
    } catch {
      setError('Could not load tasks. Is the backend running?');
    }
  };

  useEffect(() => { refreshTasks(); }, []);

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
        <TaskForm onCreated={refreshTasks} />
        <section className="task-section">
          <h2>Tasks ({tasks.length})</h2>
          <TaskList tasks={tasks} onRefresh={refreshTasks} />
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
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      {/* Catch-all: redirect unknown paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
