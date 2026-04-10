import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'theme';

function getInitialTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    // Fallback to OS preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    // Apply data-theme attribute whenever theme changes
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = () =>
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
    return ctx;
}
