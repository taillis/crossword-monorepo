import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  loadActiveGame,
  saveActiveGame,
  clearActiveGame,
  hasActiveGame,
  SavedGameState,
  STORAGE_KEY,
} from '../src/services/gameStorage';

describe('gameStorage service', () => {
  let store: Record<string, string> = {};

  beforeAll(() => {
    // Mock leve do localStorage para ambiente Node/Vitest
    const mockLocalStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = String(value);
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockLocalStorage },
      writable: true,
    });
  });

  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  const sampleState: SavedGameState = {
    version: 1,
    puzzle: {
      bounds: { rows: 10, cols: 10 },
      placedWords: [
        {
          id: 'w1',
          word: 'TESTE',
          clue: 'Exemplo de teste',
          row: 0,
          col: 0,
          direction: 'horizontal',
          length: 5,
        },
      ],
    },
    theme: 'tecnologia',
    currentPuzzleTheme: 'tecnologia',
    difficulty: 'medio',
    wordCount: 8,
    userLetters: { '0,0': 'T', '0,1': 'E' },
    revealedWordIds: ['w1'],
    focusedCell: { row: 0, col: 2 },
    direction: 'horizontal',
    isVerifying: true,
    revealSolutions: false,
    elapsedSeconds: 42,
    isCompleted: false,
    updatedAt: Date.now(),
  };

  it('should return null when no game is saved', () => {
    expect(loadActiveGame()).toBeNull();
    expect(hasActiveGame()).toBe(false);
  });

  it('should save and reload the active game state', () => {
    const success = saveActiveGame(sampleState);
    expect(success).toBe(true);

    const loaded = loadActiveGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.theme).toBe('tecnologia');
    expect(loaded?.difficulty).toBe('medio');
    expect(loaded?.elapsedSeconds).toBe(42);
    expect(loaded?.userLetters).toEqual({ '0,0': 'T', '0,1': 'E' });
    expect(loaded?.revealedWordIds).toEqual(['w1']);
    expect(loaded?.puzzle.placedWords.length).toBe(1);
    expect(hasActiveGame()).toBe(true);
  });

  it('should clear active game', () => {
    saveActiveGame(sampleState);
    expect(hasActiveGame()).toBe(true);

    clearActiveGame();
    expect(loadActiveGame()).toBeNull();
    expect(hasActiveGame()).toBe(false);
  });

  it('should handle corrupted JSON gracefully without crashing', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, '{ invalid_json :::: 123');
    expect(loadActiveGame()).toBeNull();
    expect(hasActiveGame()).toBe(false);
  });

  it('should reject invalid or incomplete puzzle models', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, theme: 'geral' }));
    expect(loadActiveGame()).toBeNull();

    globalThis.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, puzzle: { bounds: { rows: 0, cols: 0 }, placedWords: [] } })
    );
    expect(loadActiveGame()).toBeNull();
  });
});
