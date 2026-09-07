import { PuzzleGrid, Direction } from 'shared-types';

export const STORAGE_KEY = 'crossword_mind_active_game_v1';

export interface SavedGameState {
  version: number;
  puzzle: PuzzleGrid;
  theme: string;
  currentPuzzleTheme: string;
  wordCount: number;
  userLetters: Record<string, string>;
  revealedWordIds: string[];
  focusedCell: { row: number; col: number } | null;
  direction: Direction;
  isVerifying: boolean;
  revealSolutions: boolean;
  elapsedSeconds: number;
  isCompleted: boolean;
  updatedAt: number;
}

/**
 * Carrega com segurança o jogo ativo do localStorage.
 * Retorna null caso não exista ou esteja corrompido/inválido.
 */
export function loadActiveGame(): SavedGameState | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw) as Partial<SavedGameState>;

    // Validações básicas de integridade do modelo salvo
    if (
      !data ||
      typeof data !== 'object' ||
      !data.puzzle ||
      !Array.isArray(data.puzzle.placedWords) ||
      data.puzzle.placedWords.length === 0 ||
      !data.puzzle.bounds
    ) {
      return null;
    }

    return {
      version: data.version ?? 1,
      puzzle: data.puzzle,
      theme: data.theme ?? 'todos',
      currentPuzzleTheme: data.currentPuzzleTheme ?? 'todos',
      wordCount: data.wordCount ?? 8,
      userLetters: data.userLetters && typeof data.userLetters === 'object' ? data.userLetters : {},
      revealedWordIds: Array.isArray(data.revealedWordIds) ? data.revealedWordIds : [],
      focusedCell: data.focusedCell ?? null,
      direction: data.direction === 'vertical' ? 'vertical' : 'horizontal',
      isVerifying: Boolean(data.isVerifying),
      revealSolutions: Boolean(data.revealSolutions),
      elapsedSeconds: typeof data.elapsedSeconds === 'number' ? Math.max(0, data.elapsedSeconds) : 0,
      isCompleted: Boolean(data.isCompleted),
      updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
    };
  } catch (err) {
    console.warn('[gameStorage] Falha ao carregar jogo salvo do localStorage:', err);
    return null;
  }
}

/**
 * Salva o estado atual do jogo no localStorage.
 * Trata exceções como QuotaExceededError de forma silenciosa e segura.
 */
export function saveActiveGame(state: SavedGameState): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const payload = JSON.stringify({
      ...state,
      version: 1,
      updatedAt: Date.now(),
    });
    window.localStorage.setItem(STORAGE_KEY, payload);
    return true;
  } catch (err) {
    console.warn('[gameStorage] Não foi possível salvar o jogo no localStorage:', err);
    return false;
  }
}

/**
 * Remove o jogo ativo do localStorage (ao iniciar um jogo novo ou resetar).
 */
export function clearActiveGame(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[gameStorage] Falha ao remover jogo salvo:', err);
  }
}

/**
 * Verifica rapidamente se há algum jogo ativo salvo com progresso.
 */
export function hasActiveGame(): boolean {
  const game = loadActiveGame();
  return Boolean(game && game.puzzle.placedWords.length > 0);
}
