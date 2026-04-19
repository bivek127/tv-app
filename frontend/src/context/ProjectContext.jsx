import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getProjects } from '../api/projects';

const ProjectContext = createContext(null);

const STORAGE_KEY = 'tv_active_project';

export function ProjectProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProjectState] = useState(null);
    const [loading, setLoading] = useState(false);

    const setActiveProject = useCallback((project) => {
        setActiveProjectState(project);
        if (project?.id) {
            localStorage.setItem(STORAGE_KEY, project.id);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const refetchProjects = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const data = await getProjects();
            setProjects(data);

            // Pick active project: saved id (if valid) → default → first.
            const savedId = localStorage.getItem(STORAGE_KEY);
            const saved = savedId ? data.find((p) => p.id === savedId) : null;
            const fallback = data.find((p) => p.is_default) || data[0] || null;
            const next = saved || fallback;

            setActiveProjectState(next);
            if (next?.id) localStorage.setItem(STORAGE_KEY, next.id);
        } catch {
            // silent — sidebar will render empty
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            refetchProjects();
        } else {
            setProjects([]);
            setActiveProjectState(null);
        }
    }, [isAuthenticated, refetchProjects]);

    return (
        <ProjectContext.Provider value={{ projects, activeProject, setActiveProject, loading, refetchProjects }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const ctx = useContext(ProjectContext);
    if (!ctx) throw new Error('useProject must be used inside <ProjectProvider>');
    return ctx;
}
