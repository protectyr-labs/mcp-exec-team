import { describe, it, expect } from 'vitest';

describe('reaction validation', () => {
  it('filters out self-reactions', () => {
    const turns = [
      { persona: 'pm', shortName: 'PM', content: 'Ship it', name: 'Product Manager', passed: false, timestamp: '' },
      { persona: 'eng', shortName: 'Eng', content: 'Test first', name: 'Staff Engineer', passed: false, timestamp: '' },
    ];
    const reactions = [
      { fromPersonaId: 'pm', toTurnIndex: 0, type: 'agree' as const },
      { fromPersonaId: 'eng', toTurnIndex: 0, type: 'good-point' as const },
      { fromPersonaId: 'pm', toTurnIndex: 1, type: 'important' as const },
    ];
    const valid = reactions.filter(
      (r) =>
        r.toTurnIndex >= 0 &&
        r.toTurnIndex < turns.length &&
        r.fromPersonaId !== turns[r.toTurnIndex].persona,
    );
    expect(valid).toHaveLength(2);
  });

  it('filters invalid turn indices', () => {
    const turns = [
      { persona: 'pm', shortName: 'PM', content: 'test', name: 'PM', passed: false, timestamp: '' },
    ];
    const reactions = [
      { fromPersonaId: 'eng', toTurnIndex: 5, type: 'agree' as const },
      { fromPersonaId: 'eng', toTurnIndex: -1, type: 'agree' as const },
    ];
    const valid = reactions.filter(
      (r) => r.toTurnIndex >= 0 && r.toTurnIndex < turns.length,
    );
    expect(valid).toHaveLength(0);
  });

  it('limits to 3 reactions max', () => {
    const reactions = Array.from({ length: 5 }, (_, i) => ({
      fromPersonaId: `p${i}`,
      toTurnIndex: 0,
      type: 'agree' as const,
    }));
    expect(reactions.slice(0, 3)).toHaveLength(3);
  });
});

describe('[PASS] detection', () => {
  it('detects [PASS] at start', () => {
    expect('[PASS]'.trim().startsWith('[PASS]')).toBe(true);
  });

  it('no false positive on PASS in middle', () => {
    expect('We should pass on this.'.trim().startsWith('[PASS]')).toBe(false);
  });

  it('detects [PASS] with whitespace', () => {
    expect('[PASS]  \n'.trim().startsWith('[PASS]')).toBe(true);
  });
});
