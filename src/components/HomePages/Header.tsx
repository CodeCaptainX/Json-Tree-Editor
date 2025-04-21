import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

const Header = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  };

    console.log("🚀 ~ Header ~ 2:", 2)
  return (
    <div className="p-2 border-b border-border bg-white dark:bg-primary shadow-sm flex items-center justify-between transition-colors duration-300">
      <h1 className="text-[20px] font-bold text-gray-800 flex items-center transition-colors duration-300 dark:text-primay-accent ">
        <Icon 
          icon="mdi:code-json" 
          className="h-5 w-5 mr-2 text-blue-500" 
        />
        JSON Tree Editor
      </h1>
      
      <div className="space-x-2 flex item-center justify-center">
        <button
          onClick={toggleTheme}
          className="relative inline-flex h-6 w-12 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-pressed={darkMode}
        >
          <span className="sr-only">Toggle dark mode</span>
          <span 
            className={`${
              darkMode ? "bg-blue-600" : "bg-gray-200"
            } absolute h-6 w-12 mx-auto rounded-full transition-colors duration-300 ease-in-out`}
          ></span>
          <span
            className={`${
              darkMode ? "translate-x-6 bg-gray-800" : "translate-x-0 bg-white"
            } pointer-events-none absolute mx-0.5 h-5 w-5 transform rounded-full shadow-lg ring-0 transition-transform duration-300 ease-in-out flex items-center justify-center`}
          >
            {darkMode ? (
              <Icon icon="ph:moon-fill" className="h-3 w-3 text-blue-200" />
            ) : (
              <Icon icon="ph:sun-fill" className="h-3 w-3 text-yellow-500" />
            )}
          </span>
        </button>
      </div>
    </div>
  );
};

export default Header;