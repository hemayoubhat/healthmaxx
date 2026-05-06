export function buildPrompt({ goal, macros, restrictions, equipment, weight, age, sex }) {
  return `
You are an expert sports nutritionist and certified strength coach.
Create a detailed 7-day plan for this user:

STATS:
- Age: ${age}, Sex: ${sex}, Weight: ${weight}kg
- Goal: ${goal}
- Daily targets: ${macros.calories} kcal | ${macros.protein}g protein | ${macros.carbs}g carbs | ${macros.fat}g fat
- Dietary restrictions: ${restrictions || 'none'}
- Equipment: ${equipment}

RESPOND IN THIS EXACT FORMAT:

## MEAL PLAN (7 Days)
For each day (Day 1–7):
- Breakfast (with macros)
- Lunch (with macros)
- Dinner (with macros)
- Snack (with macros)

## WORKOUT PLAN (5-Day Split)
For each day:
- Exercise name
- Sets x Reps
- Rest time
- Progression note

## KEY SUPPLEMENTS (evidence-based only, Tier 1 priority)

Keep recommendations practical, science-backed, and specific.
  `;
}