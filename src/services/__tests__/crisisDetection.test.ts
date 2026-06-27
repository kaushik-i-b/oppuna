import { detectCrisis } from '@/services/offlineAI';

describe('detectCrisis', () => {
  it('detects suicidal statements', () => {
    expect(detectCrisis('I want to die')).toBe('suicide');
    expect(detectCrisis('I am going to kill myself')).toBe('suicide');
    expect(detectCrisis("I don't want to live anymore")).toBe('suicide');
    expect(detectCrisis('there is no reason to live')).toBe('suicide');
  });

  it('detects self-harm', () => {
    expect(detectCrisis('I have been cutting myself')).toBe('self_harm');
    expect(detectCrisis('I want to hurt myself')).toBe('self_harm');
  });

  it('detects medical emergencies', () => {
    expect(detectCrisis('I think I am having a heart attack')).toBe('medical_emergency');
    expect(detectCrisis('I took too many pills')).toBe('medical_emergency');
    expect(detectCrisis("I can't breathe")).toBe('medical_emergency');
  });

  it('detects abuse', () => {
    expect(detectCrisis('I am being abused at home')).toBe('abuse');
  });

  it('detects violence toward others', () => {
    expect(detectCrisis('I want to hurt someone')).toBe('violence');
  });

  it('detects panic emergencies', () => {
    expect(detectCrisis('I am having a panic attack right now')).toBe('panic_emergency');
  });

  it('prioritises suicide over other categories', () => {
    expect(detectCrisis('I want to kill myself and hurt someone')).toBe('suicide');
  });

  it('does not flag ordinary difficult feelings', () => {
    expect(detectCrisis('I feel anxious and a little sad today')).toBeNull();
    expect(detectCrisis('work is stressful and I am tired')).toBeNull();
  });
});
