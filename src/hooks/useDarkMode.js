import  React, {useEffect, useState } from 'react'

export default function useDarkMode() {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === "light" ? "dark" : "light");
        root.classList.add(theme);
        localStorage.setItem("theme", theme);
    }, [theme]);
    
    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
    };
    
    return [theme, toggleTheme];
}
