'use client';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { path: '/dashboard', icon: '⚡', label: 'Home' },
  { path: '/workout', icon: '💪', label: 'Workout' },
  { path: '/', icon: '🥗', label: 'Diet' },
  { path: '/supplements', icon: '💊', label: 'Supps' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
      style={{ background: 'linear-gradient(to top, #000 80%, transparent)' }}>
      <div className="flex justify-around max-w-md mx-auto bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl px-2 py-3">
        {navItems.map(item => {
          const active = pathname === item.path;
          return (
            <button key={item.path} onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-1 px-3 transition">
              <span className="text-xl">{item.icon}</span>
              <span className={`text-xs font-medium transition ${active ? 'text-[#39FF14]' : 'text-gray-600'}`}>
                {item.label}
              </span>
              {active && <div className="w-1 h-1 rounded-full bg-[#39FF14]" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}