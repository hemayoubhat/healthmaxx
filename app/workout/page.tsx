'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Nav from '../../components/Nav';

type SetData = { reps: string; weight: string };
type Exercise = { id: string; name: string; type: 'strength' | 'cardio'; sets: SetData[]; duration: string; distance: string };

const MUSCLES: Record<string, string[]> = {
  Chest: ['Bench Press', 'Incline Bench', 'Cable Flyes', 'Push Ups', 'Dumbbell Press'],
  Back: ['Pull Ups', 'Barbell Row', 'Lat Pulldown', 'Seated Row', 'Deadlift'],
  Legs: ['Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl', 'Calf Raises'],
  Shoulders: ['OHP', 'Lateral Raises', 'Front Raises', 'Face Pulls', 'Shrugs'],
  Arms: ['Bicep Curl', 'Tricep Pushdown', 'Hammer Curl', 'Skull Crushers'],
  Cardio: ['Running', 'Cycling', 'Rowing', 'Jump Rope', 'HIIT', 'Stair Climber'],
};

export default function WorkoutPage() {
  const [user, setUser] = useState<any>(null);
  const [active, setActive] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [muscle, setMuscle] = useState('Chest');
  const [exType, setExType] = useState<'strength' | 'cardio'>('strength');
  const [custom, setCustom] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/auth'); return; }
      setUser(data.user);
      const { data: s } = await supabase.from('workout_sessions')
        .select('*, workout_exercises(*)')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false }).limit(5);
      setSessions(s || []);
    });
  }, []);

  useEffect(() => {
    if (!active || !startTime) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000);
    return () => clearInterval(t);
  }, [active, startTime]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const addEx = (name: string, type: 'strength' | 'cardio') => {
    setExercises(p => [...p, { id: Date.now().toString(), name, type, sets: type === 'strength' ? [{ reps: '', weight: '' }] : [], duration: '', distance: '' }]);
    setShowAdd(false);
  };

  const addSet = (id: string) => setExercises(p => p.map(e => e.id === id ? { ...e, sets: [...e.sets, { reps: '', weight: '' }] } : e));

  const updSet = (id: string, i: number, f: 'reps' | 'weight', v: string) =>
    setExercises(p => p.map(e => { if (e.id !== id) return e; const s = [...e.sets]; s[i] = { ...s[i], [f]: v }; return { ...e, sets: s }; }));

  const updCardio = (id: string, f: 'duration' | 'distance', v: string) =>
    setExercises(p => p.map(e => e.id === id ? { ...e, [f]: v } : e));

  const save = async () => {
    if (!user || exercises.length === 0) return;
    setSaving(true);
    const { data: session } = await supabase.from('workout_sessions')
      .insert({ user_id: user.id, duration: elapsed }).select().single();
    if (session) {
      await supabase.from('workout_exercises').insert(
        exercises.map(e => ({ session_id: session.id, user_id: user.id, name: e.name, type: e.type, sets: e.type === 'strength' ? e.sets : [{ duration: e.duration, distance: e.distance }] }))
      );
    }
    setActive(false); setExercises([]); setElapsed(0); setSaving(false);
    const { data: s } = await supabase.from('workout_sessions').select('*, workout_exercises(*)')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
    setSessions(s || []);
    alert('✅ Workout saved!');
  };

  const ic = "bg-[#1A1A1A] rounded-xl px-3 py-2 text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#39FF14] w-full";

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      <div className="px-4 pt-14 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Workout</h1>
          {active && <p className="text-[#39FF14] font-mono text-sm mt-1">⏱ {fmt(elapsed)}</p>}
        </div>
        {active
          ? <button onClick={save} disabled={saving} className="bg-[#39FF14] text-black font-bold px-5 py-2 rounded-xl text-sm" style={{ boxShadow: '0 0 16px #39FF1460' }}>{saving ? 'Saving…' : 'Finish ✓'}</button>
          : <button onClick={() => { setActive(true); setStartTime(new Date()); }} className="bg-[#39FF14] text-black font-bold px-5 py-2 rounded-xl text-sm" style={{ boxShadow: '0 0 16px #39FF1460' }}>Start</button>
        }
      </div>

      <div className="px-4 space-y-4">
        {active && exercises.map(ex => (
          <div key={ex.id} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-white font-bold">{ex.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ex.type === 'cardio' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'bg-[#39FF14]/15 text-[#39FF14]'}`}>{ex.type}</span>
              </div>
              <button onClick={() => setExercises(p => p.filter(e => e.id !== ex.id))} className="text-gray-700 hover:text-red-400 text-xl">×</button>
            </div>
            {ex.type === 'strength' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 px-1"><span>SET</span><span>kg</span><span>REPS</span></div>
                {ex.sets.map((s, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-400 text-sm font-bold pl-2">{i + 1}</span>
                    <input type="number" placeholder="0" value={s.weight} onChange={e => updSet(ex.id, i, 'weight', e.target.value)} className={ic} />
                    <input type="number" placeholder="0" value={s.reps} onChange={e => updSet(ex.id, i, 'reps', e.target.value)} className={ic} />
                  </div>
                ))}
                <button onClick={() => addSet(ex.id)} className="w-full text-[#39FF14] text-sm py-2 border border-[#39FF14]/20 rounded-xl hover:bg-[#39FF14]/5 mt-1">+ Add Set</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-gray-600 text-xs mb-1">Duration (min)</p><input type="number" placeholder="30" value={ex.duration} onChange={e => updCardio(ex.id, 'duration', e.target.value)} className={ic} /></div>
                <div><p className="text-gray-600 text-xs mb-1">Distance (km)</p><input type="number" step="0.1" placeholder="5.0" value={ex.distance} onChange={e => updCardio(ex.id, 'distance', e.target.value)} className={ic} /></div>
              </div>
            )}
          </div>
        ))}

        {active && (
          <button onClick={() => setShowAdd(true)} className="w-full border border-dashed border-[#1A1A1A] hover:border-[#39FF14]/40 rounded-2xl py-4 text-gray-600 hover:text-[#39FF14] transition text-sm">+ Add Exercise</button>
        )}

        {!active && (
          <>
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-3xl p-8 text-center">
              <p className="text-4xl mb-3">💪</p>
              <p className="text-white font-semibold mb-1">Ready to train?</p>
              <p className="text-gray-600 text-sm">Hit Start to begin logging your session</p>
            </div>
            {sessions.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs font-semibold tracking-widest mb-3">RECENT SESSIONS</p>
                <div className="space-y-3">
                  {sessions.map((s: any) => (
                    <div key={s.id} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium text-sm">{new Date(s.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                          <p className="text-gray-600 text-xs mt-1">{s.workout_exercises?.length || 0} exercises · {s.duration ? fmt(s.duration) : '--'}</p>
                        </div>
                        <span className="text-[#39FF14] text-xs bg-[#39FF14]/10 px-2 py-1 rounded-full">Done ✓</span>
                      </div>
                      {s.workout_exercises?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {s.workout_exercises.slice(0, 4).map((e: any) => <span key={e.id} className="text-xs bg-[#1A1A1A] text-gray-500 px-2 py-1 rounded-lg">{e.name}</span>)}
                          {s.workout_exercises.length > 4 && <span className="text-xs bg-[#1A1A1A] text-gray-600 px-2 py-1 rounded-lg">+{s.workout_exercises.length - 4}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Exercise Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-t-3xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">Add Exercise</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 text-2xl">×</button>
            </div>
            <div className="flex gap-2 mb-4">
              {(['strength', 'cardio'] as const).map(t => (
                <button key={t} onClick={() => { setExType(t); if (t === 'cardio') setMuscle('Cardio'); else setMuscle('Chest'); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${exType === t ? (t === 'cardio' ? 'bg-[#00E5FF] text-black' : 'bg-[#39FF14] text-black') : 'bg-[#1A1A1A] text-gray-500'}`}>
                  {t === 'strength' ? '💪 Strength' : '🏃 Cardio'}
                </button>
              ))}
            </div>
            {exType === 'strength' && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {Object.keys(MUSCLES).filter(k => k !== 'Cardio').map(m => (
                  <button key={m} onClick={() => setMuscle(m)}
                    className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap font-medium transition ${muscle === m ? 'bg-[#39FF14] text-black' : 'bg-[#1A1A1A] text-gray-400'}`}>
                    {m}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2 mb-4">
              {(MUSCLES[muscle] || []).map(n => (
                <button key={n} onClick={() => addEx(n, exType)} className="w-full text-left bg-[#1A1A1A] hover:bg-[#252525] rounded-xl px-4 py-3 text-white text-sm transition">{n}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input placeholder="Custom exercise…" value={custom} onChange={e => setCustom(e.target.value)}
                className="flex-1 bg-[#1A1A1A] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#39FF14]" />
              <button onClick={() => { if (custom) { addEx(custom, exType); setCustom(''); } }}
                className="bg-[#39FF14] text-black font-bold px-4 rounded-xl">Add</button>
            </div>
          </div>
        </div>
      )}
      <Nav />
    </main>
  );
}