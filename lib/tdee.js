export function calculateTDEE({ weight, height, age, sex, activityLevel }) {
  // Mifflin-St Jeor equation (most validated formula)
  const BMR = sex === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  };

  return Math.round(BMR * multipliers[activityLevel]);
}

export function getMacros(tdee, goal, weightKg) {
  const protein = Math.round(weightKg * 2.0); // 2g/kg — evidence-based ceiling
  const fat = Math.round((tdee * 0.25) / 9);  // 25% of calories from fat
  
  const targetCals = 
    goal === 'cut'  ? tdee - 400 :
    goal === 'bulk' ? tdee + 300 :
    tdee; // recomp = maintenance

  const carbs = Math.round((targetCals - (protein * 4) - (fat * 9)) / 4);

  return { calories: targetCals, protein, fat, carbs };
}