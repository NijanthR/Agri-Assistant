import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext(null)

export const themes = {
  light: {
    // Page / root
    pageBg: 'bg-linear-to-b from-white via-teal-50 to-teal-100',
    // Sidebar
    sidebarBg: 'bg-linear-to-b from-white via-teal-50 to-teal-100',
    sidebarBorder: 'border-cyan-200/35',
    sidebarText: 'text-cyan-50',
    sidebarDivider: 'via-cyan-100/45',
    sidebarIconBg: 'bg-slate-900/55',
    sidebarIconText: 'text-cyan-300',
    sidebarChevron: 'text-cyan-300 hover:bg-slate-900/45 hover:text-cyan-100',
    sidebarActive: 'bg-slate-800/78 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.35)]',
    sidebarHover: 'text-cyan-100 hover:bg-slate-900/45 hover:text-white',
    sidebarSettingsHover: 'text-cyan-100 hover:bg-slate-900/45 hover:text-white',
    sidebarUserCard: 'border border-cyan-100/15 bg-slate-900/72 backdrop-blur-sm',
    sidebarUserName: 'text-white',
    sidebarUserEmail: 'text-cyan-300',
    // Chat messages
    userMsgBg: 'bg-slate-900/72',
    userMsgText: 'text-cyan-50',
    assistantText: 'text-cyan-50',
    actionBtn: 'bg-slate-900/45 text-cyan-100 hover:bg-slate-800/75 hover:text-white',
    // Scroll button
    scrollBtnBg: 'bg-slate-900/85 border-cyan-200/50 text-cyan-50',
    // Input
    inputContainer: 'border-cyan-200/70 bg-slate-950/52 backdrop-blur-md',
    inputText: 'text-cyan-50 placeholder:text-cyan-200/80',
    inputBtn: 'text-cyan-100',
    inputBtnBg: 'bg-cyan-500/25 hover:bg-cyan-500/40',
    inputDropdownBg: 'bg-slate-900/95 border-cyan-200/45',
    inputDropdownItem: 'text-cyan-50 hover:bg-slate-800',
    inputDropdownActive: 'text-cyan-300 font-semibold',
    inputDropdownBadge: 'bg-slate-700 text-cyan-100',
  },
  dark: {
    // Page / root
    pageBg: 'bg-linear-to-b from-slate-900 via-slate-800 to-slate-700',
    // Sidebar
    sidebarBg: 'bg-linear-to-b from-slate-900 via-slate-800 to-slate-700',
    sidebarBorder: 'border-teal-900',
    sidebarText: 'text-teal-100',
    sidebarDivider: 'via-teal-800',
    sidebarIconBg: 'bg-slate-700',
    sidebarIconText: 'text-teal-400',
    sidebarChevron: 'text-teal-400 hover:bg-slate-700 hover:text-teal-300',
    sidebarActive: 'bg-slate-700 text-teal-300 shadow-[0_0_0_1px_rgba(20,184,166,0.25)]',
    sidebarHover: 'text-teal-300 hover:bg-slate-700 hover:text-teal-100',
    sidebarSettingsHover: 'text-teal-300 hover:bg-slate-700 hover:text-teal-100',
    sidebarUserCard: 'bg-slate-700',
    sidebarUserName: 'text-teal-100',
    sidebarUserEmail: 'text-teal-400',
    // Chat messages
    userMsgBg: 'bg-slate-700',
    userMsgText: 'text-slate-100',
    assistantText: 'text-slate-200',
    actionBtn: 'text-slate-500 hover:bg-slate-700 hover:text-slate-300',
    // Scroll button
    scrollBtnBg: 'bg-slate-800/90 border-slate-600 text-slate-300',
    // Input
    inputContainer: 'border-slate-600 bg-slate-800/80',
    inputText: 'text-slate-100 placeholder:text-slate-500',
    inputBtn: 'text-teal-300',
    inputBtnBg: 'bg-slate-700 hover:bg-slate-600',
    inputDropdownBg: 'bg-slate-800 border-slate-600',
    inputDropdownItem: 'text-slate-300 hover:bg-slate-700',
    inputDropdownActive: 'text-teal-400 font-semibold',
    inputDropdownBadge: 'bg-slate-700 text-slate-400',
  },
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, t: themes[theme] }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
