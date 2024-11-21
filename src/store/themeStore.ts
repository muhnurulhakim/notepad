import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
}

export const useThemeStore = create<ThemeStore>(() => ({
  isDark: false, // Selalu light mode
}));
