import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import type { PersonaConfig, InvokeResult, Reaction } from './types.js';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const WAR_ROOM_RULES = `
---
WAR ROOM RULES:
- Respond in 2-4 sentences only.
- One clear point: (a) propose a concrete option, (b) ask a specific question, (c) give one number or fact, or (d) suggest a better alternative.
- Do NOT dump everything you know. Stay in your lane.
- If someone already raised the same point, do NOT repeat it.
- PASS RULE: If you have nothing important to add, respond with exactly "[PASS]" and nothing else. Silence is better than filler.
`;

function loadPersonaPrompt(persona: PersonaConfig): string {
  const filePath = path.resolve(persona.file);
  return fs.readFileSync(filePath, 'utf-8');
}

export async function invokeSingle(
  persona: PersonaConfig,
  question: string,
  context?: string,
  previousTurns?: { speaker: string; content: string }[],
  warRoom: boolean = false,
): Promise<InvokeResult> {
  const systemPrompt = loadPersonaPrompt(persona) + (warRoom ? WAR_ROOM_RULES : '');

  let userMessage = '';
  if (previousTurns?.length) {
    userMessage = previousTurns.map((t) => `${t.speaker}: ${t.content}`).join('\n\n');
    userMessage += `\n\n---\n\n${question}`;
  } else {
    userMessage = question;
  }
  if (context) {
    userMessage = `CONTEXT:\n${context}\n\n---\n\n${userMessage}`;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      persona: persona.id,
      name: persona.name,
      shortName: persona.shortName,
      content: `[API key required -- ${persona.name} would respond here]`,
      passed: false,
      timestamp: new Date().toISOString(),
    };
  }

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('');

  return {
    persona: persona.id,
    name: persona.name,
    shortName: persona.shortName,
    content: text,
    passed: text.trim().startsWith('[PASS]'),
    timestamp: new Date().toISOString(),
  };
}

export async function runRoundtable(
  personas: PersonaConfig[],
  topic: string,
  context?: string,
): Promise<InvokeResult[]> {
  const results: InvokeResult[] = [];
  const previousTurns: { speaker: string; content: string }[] = [];

  for (const persona of personas) {
    const turnPrompt =
      `ROUNDTABLE TOPIC: ${topic}\n\n` +
      (previousTurns.length
        ? `What was said so far:\n${previousTurns.map((t) => `${t.speaker}: ${t.content}`).join('\n\n')}\n\nYour turn.`
        : 'You are speaking first.') +
      '\n\nIn 1-3 sentences: propose an option, ask a question, give a fact, or suggest an alternative. Say [PASS] if you have nothing to add.';

    const result = await invokeSingle(persona, turnPrompt, context, undefined, true);
    results.push(result);
    previousTurns.push({
      speaker: persona.shortName,
      content: result.passed ? '(passed)' : result.content,
    });
  }
  return results;
}

export async function generateReactions(
  personas: PersonaConfig[],
  turns: InvokeResult[],
  topic: string,
): Promise<Reaction[]> {
  if (!process.env.ANTHROPIC_API_KEY || turns.length < 2) return [];

  const transcript = turns
    .map((t, i) => `Turn ${i} (${t.shortName}): ${t.content}`)
    .join('\n\n');
  const personaNames = personas.map((p) => `${p.shortName} (${p.id})`).join(', ');

  const prompt = `You are a meeting observer. A roundtable just happened on "${topic}".

${transcript}

Participants: ${personaNames}

Generate 1-3 natural reactions. Rules:
- A persona NEVER reacts to their own turn.
- Only react when genuinely compelling, not out of politeness.
- Types: "agree", "good-point", "important"

Return ONLY a JSON array: [{"fromPersonaId": "pm", "toTurnIndex": 0, "type": "agree"}]
Return [] if nothing stood out.`;

  try {
    const response = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as Reaction[];
    const validIds = new Set(personas.map((p) => p.id));

    return parsed
      .filter(
        (r) =>
          r.fromPersonaId &&
          validIds.has(r.fromPersonaId) &&
          r.toTurnIndex >= 0 &&
          r.toTurnIndex < turns.length &&
          r.fromPersonaId !== turns[r.toTurnIndex]?.persona &&
          ['agree', 'good-point', 'important'].includes(r.type),
      )
      .slice(0, 3);
  } catch {
    return [];
  }
}
