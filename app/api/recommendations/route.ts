import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { name, age, weight, height, goal } = await req.json();
    const bmi = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(1) : 'unknown';

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are a sports scientist. Give concise evidence-based recommendations for:
Name: ${name}, Age: ${age}, Weight: ${weight}kg, Height: ${height}cm, BMI: ${bmi}, Goal: ${goal}

Format exactly like this:
🥗 DIET
- [2-3 specific points]

💪 TRAINING
- [2-3 specific points]

💊 SUPPLEMENTS (Tier 1 only)
- [max 3]

😴 RECOVERY
- [1-2 points]

⚡ DO THIS TODAY
[one specific action]

Be direct. No fluff. Specific to their BMI and goal.`
      }]
    });

    return NextResponse.json({ recommendations: completion.choices[0]?.message?.content || '' });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}