// Re-export dari ThemeContext agar bisa diimport dari dua path:
// import { useTheme } from '@/hooks/useTheme'     (pattern module)
// import { useTheme } from '@/context/ThemeContext' (pattern context)
export { useTheme } from '../context/ThemeContext.jsx';
