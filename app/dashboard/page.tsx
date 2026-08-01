'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Nav from '../../components/Nav';

function Ring({ pct, color, size = 90, stroke = 8, label, value }: any) {
  const r = (size - stroke) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} stroke="#1A1A1A" strokeWidth={stroke} fill="none" />
          <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 8px ${color})` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white font-bold text-sm">{value}</span>
          <span className="text-gray-600 text-xs">{Math.round(pct)}%</span>
        </div>
      </div>
      <span className="text-gray-500 text-xs text-center">{label}</span>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ workouts: 0, suppsTaken: 0, suppsTotal: 0, streak: 0 });
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth'); return; }
      setUser(data.user);
      const [{ data: p }, { data: sessions }, { data: supps }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', data.user.id).single(),
        supabase.from('workout_sessions').select('id').eq('user_id', data.user.id)
          .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
        supabase.from('supplement_logs').select('*').eq('user_id', data.user.id)
          .eq('date', new Date().toISOString().split('T')[0]),
      ]);
      setProfile(p);
      setStats({
        workouts: sessions?.length || 0,
        suppsTaken: supps?.filter((s: any) => s.taken).length || 0,
        suppsTotal: supps?.length || 0,
        streak: sessions?.length || 0,
      });
    });
  }, []);

  const quickActions = [
    { icon: '💪', label: 'Log Workout', sub: 'Track exercises & cardio', path: '/workout', color: '#39FF14' },
    { icon: '💊', label: 'Supplements', sub: 'Check your daily stack', path: '/supplements', color: '#00E5FF' },
    { icon: '🥗', label: 'Diet Plan', sub: 'Generate meal plan', path: '/', color: '#FFE66D' },
    { icon: '👤', label: 'Profile', sub: 'Stats & AI advice', path: '/profile', color: '#A855F7' },
  ];

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      {/* Header */}
      <div className="px-4 pt-14 pb-6">
        <p className="text-gray-500 text-sm">{getGreeting()}</p>
        <h1 className="text-3xl font-bold mt-1">
          {profile?.name || user?.email?.split('@')[0] || 'Athlete'} 👋
        </h1>
      </div>

      {/* Rings */}
      <div className="px-4 mb-5">
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-3xl p-6">
          <p className="text-gray-500 text-xs font-semibold tracking-widest mb-6">THIS WEEK</p>
          <div className="flex justify-around">
            <Ring pct={(stats.workouts / 5) * 100} color="#39FF14" label="Workouts" value={`${stats.workouts}/5`} />
            <Ring pct={stats.suppsTotal > 0 ? (stats.suppsTaken / stats.suppsTotal) * 100 : 0}
              color="#00E5FF" label="Supplements" value={`${stats.suppsTaken}/${stats.suppsTotal}`} />
            <Ring pct={Math.min((stats.streak / 7) * 100, 100)} color="#A855F7" label="Streak" value={`${stats.streak}d`} />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {profile && (
        <div className="px-4 mb-5">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-3xl px-6 py-4 flex justify-around">
            <div className="text-center">
              <p className="text-[#39FF14] font-bold text-xl">{profile.weight}kg</p>
              <p className="text-gray-600 text-xs">Weight</p>
            </div>
            <div className="w-px bg-[#1A1A1A]" />
            <div className="text-center">
              <p className="text-[#00E5FF] font-bold text-xl">{profile.height}cm</p>
              <p className="text-gray-600 text-xs">Height</p>
            </div>
            <div className="w-px bg-[#1A1A1A]" />
            <div className="text-center">
              <p className="text-[#FFE66D] font-bold text-xl capitalize">{profile.goal}</p>
              <p className="text-gray-600 text-xs">Goal</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-4">
        <p className="text-gray-500 text-xs font-semibold tracking-widest mb-3">QUICK ACTIONS</p>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(a => (
            <button key={a.path} onClick={() => router.push(a.path)}
              className="bg-[#0D0D0D] border border-[#1A1A1A] hover:border-opacity-50 rounded-2xl p-4 text-left transition"
              style={{ '--hover-color': a.color } as any}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${a.color}50`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1A1A1A')}>
              <div className="text-2xl mb-2">{a.icon}</div>
              <p className="text-white font-semibold text-sm">{a.label}</p>
              <p className="text-gray-600 text-xs mt-1">{a.sub}</p>
            </button>
          ))}
        </div>
      </div>
      <Nav />
    </main>
  );
}