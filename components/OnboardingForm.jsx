'use client';
import { useState } from 'react';

const inputClass = "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500";
const labelClass = "block text-sm text-gray-400 mb-1";

export default function OnboardingForm({ onSubmit }) {
  const [form, setForm] = useState({
    age: '', weight: '', height: '', sex: 'male',
    activityLevel: 'moderate', goal: 'cut', restrictions: '', equipment: 'full gym'
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4 w-full max-w-md">
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Age</label>
          <input name="age" type="number" placeholder="25" onChange={handle}
            className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Weight (kg)</label>
          <input name="weight" type="number" placeholder="75" onChange={handle}
            className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Height (cm)</label>
          <input name="height" type="number" placeholder="175" onChange={handle}
            className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Sex</label>
          <select name="sex" onChange={handle} className={inputClass}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Activity Level</label>
        <select name="activityLevel" onChange={handle} className={inputClass}>
          <option value="sedentary">Sedentary (desk job, no exercise)</option>
          <option value="light">Light (1–3x/week)</option>
          <option value="moderate">Moderate (3–5x/week)</option>
          <option value="active">Active (6–7x/week)</option>
          <option value="veryActive">Very Active (athlete/physical job)</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Goal</label>
        <select name="goal" onChange={handle} className={inputClass}>
          <option value="cut">Cut (lose fat)</option>
          <option value="bulk">Bulk (gain muscle)</option>
          <option value="recomp">Recomp (maintain weight)</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Dietary Restrictions</label>
        <input name="restrictions" placeholder="e.g. vegetarian, no dairy"
          onChange={handle} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Equipment Access</label>
        <select name="equipment" onChange={handle} className={inputClass}>
          <option value="full gym">Full Gym</option>
          <option value="home with dumbbells">Home + Dumbbells</option>
          <option value="bodyweight only">Bodyweight Only</option>
        </select>
      </div>

      <button type="submit"
        className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition">
        Calculate & Generate Plan →
      </button>
    </form>
  );
}