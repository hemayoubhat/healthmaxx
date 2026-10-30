'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export const THEMES = [
  { name: 'Volt',    color: '#39FF14' },
  { name: 'Crimson', color: '#FF3B3B' },
  { name: 'Electric',color: '#00A3FF' },
  { name: 'Teal',    color: '#00E5FF' },
  { name: 'Purple',  color: '#A855F7' },
  { name: 'Gold',    color: '#FFD700' },
  { name: 'Orange',  color: '#FF6B00' },
  { name: 'Rose',    color: '#FF69B4' },
  { name: 'White',   color: '#FFFFFF' },
];

const Ctx = createContext({ color: '#39FF14', setTheme: (_c: string) => {} });
export const useTheme = () => useContext(Ctx);

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState('#39FF14');
  useEffect(() => { const s = localStorage.getItem('hm_accent'); if (s) setColor(s); }, []);
  const setTheme = (c: string) => { setColor(c); localStorage.setItem('hm_accent', c); };
  return <Ctx.Provider value={{ color, setTheme }}>{children}</Ctx.Provider>;
}