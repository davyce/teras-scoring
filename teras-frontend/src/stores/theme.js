import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useTheme = create()(persist((set) => ({
    isDarkMode: false,
    toggleTheme: () => set((state) => {
        const newMode = !state.isDarkMode;
        // Appliquer la classe 'dark' sur le document
        if (newMode) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: newMode };
    }),
    setTheme: (isDark) => set(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: isDark };
    }),
}), {
    name: 'teras-theme-storage',
    onRehydrateStorage: () => (state) => {
        // Appliquer le thème au chargement
        if (state?.isDarkMode) {
            document.documentElement.classList.add('dark');
        }
    },
}));
