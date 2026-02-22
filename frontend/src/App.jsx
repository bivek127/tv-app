import { useState, useEffect } from 'react';
import { getTasks } from './api/tasks';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  const refreshTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
      setError('');
    } catch (err) {
      setError('Could not load tasks. Is the backend running?');
    }
  };

  useEffect(() => {
    refreshTasks();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>TaskVault</h1>
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

export default App;
