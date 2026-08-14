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

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(ref: Date): Date[] {
  const d = new Date(ref);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon);
    dd.setDate(mon.getDate() + i);
    return dd;
  });
}

function toStr(d: Date) { return d.toISOString().split('T')[0]; }
function fmtTime(s: number) { return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; }

export default function WorkoutPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>(getWeekDates(new Date()));
  const [sessionsMap, setSessionsMap] = useState<Record<string, any[]>>({});
  const [daySessions, setDaySessions] = useState<any[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Logging state
  const [logging, setLogging] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [muscle, setMuscle] = useState('Chest');
  const [exType, setExType] = useState<'strength' | 'cardio'>('strength');
  const [custom, setCustom] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const todayStr = toStr(new Date());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return; }
      setUser(data.user);
      loadWeek(data.user.id, getWeekDates(new Date()));
    });
  }, []);

  useEffect(() => {
    if (!logging || !startTime) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000)), 1000);
    return () => clearInterval(t);
  }, [logging, startTime]);

  const loadWeek = async (uid: string, dates: Date[]) => {
    const { data } = await supabase
      .from('workout_sessions')
      .select('*, workout_exercises(*)')
      .eq('user_id', uid)
      .gte('date', toStr(dates[0]))
      .lte('date', toStr(dates[6]))
      .order('created_at', { ascending: false });
    const map: Record<string, any[]> = {};
    (data || []).forEach((s: any) => { const k = s.date; if (!map[k]) map[k] = []; map[k].push(s); });
    setSessionsMap(map);
    setDaySessions(map[toStr(selectedDate)] || []);
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setDaySessions(sessionsMap[toStr(date)] || []);
    setExpandedSession(null);
  };

  const shiftWeek = (dir: number) => {
    const newDates = weekDates.map(d => { const n = new Date(d); n.setDate(d.getDate() + dir * 7); return n; });
    setWeekDates(newDates);
    if (user) loadWeek(user.id, newDates);
  };

  // Exercise CRUD
  const addEx = (name: string, type: 'strength' | 'cardio') => {
    setExercises(p => [...p, { id: Date.now().toString(), name, type, sets: type === 'strength' ? [{ reps: '', weight: '' }] : [], duration: '', distance: '' }]);
    setShowAdd(false);
  };
  const addSet = (id: string) => setExercises(p => p.map(e => e.id === id ? { ...e, sets: [...e.sets, { reps: '', weight: '' }] } : e));
  const removeSet = (id: string, i: number) => setExercises(p => p.map(e => e.id === id ? { ...e, sets: e.sets.filter((_, idx) => idx !== i) } : e));
  const updSet = (id: string, i: number, f: 'reps' | 'weight', v: string) =>
    setExercises(p => p.map(e => { if (e.id !== id) return e; const s = [...e.sets]; s[i] = { ...s[i], [f]: v }; return { ...e, sets: s }; }));
  const updCardio = (id: string, f: 'duration' | 'distance', v: string) =>
    setExercises(p => p.map(e => e.id === id ? { ...e, [f]: v } : e));
  const removeEx = (id: string) => setExercises(p => p.filter(e => e.id !== id));

  const startSession = () => { setLogging(true); setStartTime(new Date()); setExercises([]); };
  const cancelSession = () => { setLogging(false); setExercises([]); setElapsed(0); };

  const saveSession = async () => {
    if (!user || exercises.length === 0) { alert('Add at least one exercise'); return; }
    setSaving(true);
    const { data: session } = await supabase
      .from('workout_sessions')
      .insert({ user_id: user.id, duration: elapsed, date: toStr(selectedDate) })
      .select().single();
    if (session) {
      await supabase.from('workout_exercises').insert(
        exercises.map(e => ({ session_id: session.id, user_id: user.id, name: e.name, type: e.type, sets: e.type === 'strength' ? e.sets : [{ duration: e.duration, distance: e.distance }] }))
      );
    }
    setLogging(false); setExercises([]); setElapsed(0); setSaving(false);
    await loadWeek(user.id, weekDates);
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete this workout session?')) return;
    await supabase.from('workout_exercises').delete().eq('session_id', sessionId);
    await supabase.from('workout_sessions').delete().eq('id', sessionId);
    await loadWeek(user.id, weekDates);
    setExpandedSession(null);
  };

  const deleteExercise = async (exId: string, sessionId: string) => {
    await supabase.from('workout_exercises').delete().eq('id', exId);
    const updated = daySessions.map(s => s.id === sessionId
      ? { ...s, workout_exercises: s.workout_exercises.filter((e: any) => e.id !== exId) }
      : s);
    setDaySessions(updated);
    setSessionsMap(p => ({ ...p, [toStr(selectedDate)]: updated }));
  };

  const ic = "bg-[#1A1A1A] rounded-xl px-3 py-2 text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#39FF14] w-full";

  return (
    <main className="min-h-screen bg-black text-white pb-28">
      {/* Header */}
      <div className="px-4 pt-14 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Workout</h1>
          {logging && <p className="text-[#39FF14] font-mono text-sm mt-0.5">⏱ {fmtTime(elapsed)}</p>}
        </div>
        {logging
          ? <div className="flex gap-2">
              <button onClick={cancelSession} className="border border-[#1A1A1A] text-gray-500 px-4 py-2 rounded-xl text-sm">Cancel</button>
              <button onClick={saveSession} disabled={saving} className="bg-[#39FF14] text-black font-bold px-5 py-2 rounded-xl text-sm" style={{ boxShadow: '0 0 16px #39FF1460' }}>
                {saving ? 'Saving…' : 'Finish ✓'}
              </button>
            </div>
          : <button onClick={startSession} className="bg-[#39FF14] text-black font-bold px-5 py-2 rounded-xl text-sm" style={{ boxShadow: '0 0 16px #39FF1460' }}>+ Log</button>
        }
      </div>

      {/* Week Calendar */}
      {!logging && (
        <div className="px-4 mb-5">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-3xl p-4">
            <div className="flex justify-between items-center mb-4 px-1">
              <button onClick={() => shiftWeek(-1)} className="text-gray-500 hover:text-white text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1A1A1A] transition">‹</button>
              <p className="text-white text-sm font-semibold">
                {weekDates[0]?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              <button onClick={() => shiftWeek(1)} className="text-gray-500 hover:text-white text-lg w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1A1A1A] transition">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((date, i) => {
                const ds = toStr(date);
                const isSel = ds === toStr(selectedDate);
                const isToday = ds === todayStr;
                const hasW = !!(sessionsMap[ds]?.length);
                return (
                  <button key={i} onClick={() => selectDate(date)}
                    className={`flex flex-col items-center py-2.5 rounded-2xl transition ${isSel ? 'bg-[#39FF14]' : isToday ? 'border border-[#39FF14]/40 bg-[#39FF14]/5' : 'hover:bg-[#1A1A1A]'}`}>
                    <span className={`text-xs font-medium mb-1 ${isSel ? 'text-black' : 'text-gray-500'}`}>{DAY_LABELS[i]}</span>
                    <span className={`text-sm font-bold ${isSel ? 'text-black' : isToday ? 'text-[#39FF14]' : 'text-white'}`}>{date.getDate()}</span>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${hasW ? (isSel ? 'bg-black' : 'bg-[#39FF14]') : 'bg-transparent'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Logging */}
      {logging && (
        <div className="px-4 space-y-4">
          {exercises.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              <p className="text-4xl mb-2">🏋️</p>
              <p className="text-sm">Add your first exercise below</p>
            </div>
          )}
          {exercises.map(ex => (
            <div key={ex.id} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-white font-bold">{ex.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ex.type === 'cardio' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'bg-[#39FF14]/15 text-[#39FF14]'}`}>{ex.type}</span>
                </div>
                <button onClick={() => removeEx(ex.id)} className="text-gray-700 hover:text-red-400 text-xl w-8 h-8 flex items-center justify-center hover:bg-red-400/10 rounded-lg transition">×</button>
              </div>
              {ex.type === 'strength' ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-600 px-1"><span>SET</span><span>kg</span><span>REPS</span><span></span></div>
                  {ex.sets.map((s, i) => (
                    <div key={i} className="grid grid-cols-4 gap-2 items-center">
                      <span className="text-gray-400 text-sm font-bold pl-2">{i + 1}</span>
                      <input type="number" placeholder="0" value={s.weight} onChange={e => updSet(ex.id, i, 'weight', e.target.value)} className={ic} />
                      <input type="number" placeholder="0" value={s.reps} onChange={e => updSet(ex.id, i, 'reps', e.target.value)} className={ic} />
                      <button onClick={() => removeSet(ex.id, i)} className="text-gray-700 hover:text-red-400 text-lg flex items-center justify-center w-full transition">×</button>
                    </div>
                  ))}
                  <button onClick={() => addSet(ex.id)} className="w-full text-[#39FF14] text-sm py-2 border border-[#39FF14]/20 rounded-xl hover:bg-[#39FF14]/5 mt-1">+ Set</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-gray-600 text-xs mb-1">Duration (min)</p><input type="number" placeholder="30" value={ex.duration} onChange={e => updCardio(ex.id, 'duration', e.target.value)} className={ic} /></div>
                  <div><p className="text-gray-600 text-xs mb-1">Distance (km)</p><input type="number" step="0.1" placeholder="5" value={ex.distance} onChange={e => updCardio(ex.id, 'distance', e.target.value)} className={ic} /></div>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => setShowAdd(true)} className="w-full border border-dashed border-[#1A1A1A] hover:border-[#39FF14]/40 rounded-2xl py-4 text-gray-600 hover:text-[#39FF14] transition text-sm">+ Add Exercise</button>
        </div>
      )}

      {/* Day Sessions */}
      {!logging && (
        <div className="px-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-white font-semibold text-sm">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            {toStr(selectedDate) === todayStr && <span className="text-[#39FF14] text-xs bg-[#39FF14]/10 px-2 py-1 rounded-full">Today</span>}
          </div>

          {daySessions.length === 0 ? (
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-3xl p-8 text-center">
              <p className="text-3xl mb-2">🏋️</p>
              <p className="text-gray-500 text-sm font-medium">No workout logged</p>
              <p className="text-gray-600 text-xs mt-1">Tap + Log to add a session</p>
            </div>
          ) : (
            <div className="space-y-3">
              {daySessions.map((session: any) => (
                <div key={session.id} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl overflow-hidden">
                  {/* Session header */}
                  <div className="px-4 py-3 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#39FF14] text-xs bg-[#39FF14]/10 px-2 py-0.5 rounded-full">Done ✓</span>
                        <p className="text-gray-500 text-xs">
                          {new Date(session.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          {session.duration ? ` · ${fmtTime(session.duration)}` : ''}
                        </p>
                      </div>
                      <p className="text-white text-sm font-medium mt-1">{session.workout_exercises?.length || 0} exercises</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                        className="text-gray-400 hover:text-white text-xs bg-[#1A1A1A] hover:bg-[#252525] px-3 py-1.5 rounded-lg transition">
                        {expandedSession === session.id ? 'Hide ↑' : 'View ↓'}
                      </button>
                      <button onClick={() => deleteSession(session.id)}
                        className="text-red-400/70 hover:text-red-400 text-xs bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition">
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Collapsed chips */}
                  {expandedSession !== session.id && session.workout_exercises?.length > 0 && (
                    <div className="px-4 pb-3 flex flex-wrap gap-1">
                      {session.workout_exercises.map((e: any) => (
                        <span key={e.id} className="text-xs bg-[#1A1A1A] text-gray-500 px-2 py-1 rounded-lg">{e.name}</span>
                      ))}
                    </div>
                  )}

                  {/* Expanded detail */}
                  {expandedSession === session.id && (
                    <div className="border-t border-[#1A1A1A] px-4 py-3 space-y-3">
                      {session.workout_exercises?.length === 0 && (
                        <p className="text-gray-600 text-sm text-center py-2">No exercises recorded</p>
                      )}
                      {session.workout_exercises?.map((ex: any) => (
                        <div key={ex.id} className="bg-[#141414] rounded-xl p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-white text-sm font-semibold">{ex.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${ex.type === 'cardio' ? 'bg-[#00E5FF]/10 text-[#00E5FF]' : 'bg-[#39FF14]/10 text-[#39FF14]'}`}>{ex.type}</span>
                            </div>
                            <button onClick={() => deleteExercise(ex.id, session.id)}
                              className="text-red-400/60 hover:text-red-400 text-xs bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-lg transition">
                              Remove
                            </button>
                          </div>
                          {ex.type === 'strength' && ex.sets?.length > 0 && (
                            <div className="space-y-1 mt-2">
                              <div className="grid grid-cols-3 text-xs text-gray-600 px-1"><span>Set</span><span>Weight</span><span>Reps</span></div>
                              {ex.sets.map((s: any, i: number) => (
                                <div key={i} className="grid grid-cols-3 text-xs text-gray-400 bg-[#1A1A1A] rounded-lg px-3 py-1.5">
                                  <span>{i + 1}</span>
                                  <span>{s.weight || '—'}kg</span>
                                  <span>{s.reps || '—'} reps</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {ex.type === 'cardio' && ex.sets?.[0] && (
                            <div className="flex gap-4 text-xs text-gray-400 mt-2 bg-[#1A1A1A] rounded-lg px-3 py-1.5">
                              {ex.sets[0].duration && <span>⏱ {ex.sets[0].duration} min</span>}
                              {ex.sets[0].distance && <span>📍 {ex.sets[0].distance} km</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Exercise Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-t-3xl w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-bold text-lg">Add Exercise</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 w-8 h-8 flex items-center justify-center text-2xl">×</button>
            </div>
            <div className="flex gap-2 mb-4">
              {(['strength', 'cardio'] as const).map(t => (
                <button key={t} onClick={() => { setExType(t); setMuscle(t === 'cardio' ? 'Cardio' : 'Chest'); }}
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
                <button key={n} onClick={() => addEx(n, exType)}
                  className="w-full text-left bg-[#1A1A1A] hover:bg-[#1F1F1F] rounded-xl px-4 py-3 text-white text-sm transition">{n}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input placeholder="Custom exercise…" value={custom} onChange={e => setCustom(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && custom) { addEx(custom, exType); setCustom(''); } }}
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