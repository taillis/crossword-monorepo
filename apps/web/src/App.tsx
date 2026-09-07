import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  PuzzleGrid,
  OfflineWordProvider,
  CrosswordEngine,
  WordPlacement,
  Direction,
  THEME_LABELS,
  DifficultyLevel,
} from 'shared-types';
import {
  RefreshCw,
  Trophy,
  HelpCircle,
  Layers,
  Sparkles,
  WifiOff,
  BookOpen,
  Check,
  Trash2,
  CheckCircle2,
  Tag,
  AlertCircle,
  Clock,
  Save,
} from 'lucide-react';
import { loadActiveGame, saveActiveGame } from './services/gameStorage';

const offlineProvider = new OfflineWordProvider();
const localEngine = new CrosswordEngine(28);

const DIFFICULTY_CONFIG: Record<
  DifficultyLevel,
  { label: string; icon: string; defaultWords: number; desc: string; color: string }
> = {
  facil: {
    label: 'Fácil',
    icon: '🟢',
    defaultWords: 6,
    desc: 'Palavras curtas (3-6 letras) e alta densidade de cruzamentos',
    color: '#10b981',
  },
  medio: {
    label: 'Médio',
    icon: '🟡',
    defaultWords: 8,
    desc: 'Vocabulário balanceado (5-9 letras) e cruzamentos dinâmicos',
    color: '#f59e0b',
  },
  dificil: {
    label: 'Difícil',
    icon: '🔴',
    defaultWords: 12,
    desc: 'Palavras longas (7+ letras) e grade mais desafiadora',
    color: '#ef4444',
  },
};

export default function App() {
  const [puzzle, setPuzzle] = useState<PuzzleGrid>({
    bounds: { rows: 0, cols: 0 },
    placedWords: [],
  });
  const [theme, setTheme] = useState<string>('todos');
  const [currentPuzzleTheme, setCurrentPuzzleTheme] = useState<string>('todos');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medio');
  const [wordCount, setWordCount] = useState<number>(8);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasLoadedSavedGame, setHasLoadedSavedGame] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Estados de Digitação e Foco
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<Direction>('horizontal');
  const [userLetters, setUserLetters] = useState<Record<string, string>>({});
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [revealSolutions, setRevealSolutions] = useState<boolean>(false);

  const availableThemes = useMemo(() => offlineProvider.getAvailableThemes(), []);
  const boardRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const lastBackspaceTimeRef = useRef<number>(0);

  const focusHiddenInput = useCallback(() => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = ' ';
      hiddenInputRef.current.focus({ preventScroll: true });
    }
  }, []);

  const themeRef = useRef(theme);
  const wordCountRef = useRef(wordCount);
  const difficultyRef = useRef(difficulty);

  useEffect(() => {
    themeRef.current = theme;
    wordCountRef.current = wordCount;
    difficultyRef.current = difficulty;
  }, [theme, wordCount, difficulty]);

  // Monitorar largura da janela para calcular exatamente o tamanho da célula sem scroll
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 390
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Mapeamento de células do grid para renderização rápida
  const gridData = useMemo(() => {
    const { rows, cols } = puzzle.bounds;
    const map: Record<string, { char: string; wordIds: string[]; num?: number }> = {};
    let clueCounter = 1;
    const numberedCoords = new Map<string, number>();

    puzzle.placedWords.forEach((pw) => {
      const coordKey = `${pw.row},${pw.col}`;
      if (!numberedCoords.has(coordKey)) {
        numberedCoords.set(coordKey, clueCounter++);
      }

      for (let i = 0; i < pw.length; i++) {
        const r = pw.direction === 'horizontal' ? pw.row : pw.row + i;
        const c = pw.direction === 'horizontal' ? pw.col + i : pw.col;
        const cellKey = `${r},${c}`;

        if (!map[cellKey]) {
          map[cellKey] = {
            char: pw.word[i],
            wordIds: [pw.id],
            num: i === 0 ? numberedCoords.get(coordKey) : undefined,
          };
        } else {
          map[cellKey].wordIds.push(pw.id);
          if (i === 0 && !map[cellKey].num) {
            map[cellKey].num = numberedCoords.get(coordKey);
          }
        }
      }
    });

    return { map, rows, cols };
  }, [puzzle]);

  // Cálculo matemático exato do tamanho da célula para NUNCA estourar a tela do celular
  const cellSize = useMemo(() => {
    const cols = gridData.cols || 10;
    if (windowWidth <= 768) {
      // Margem lateral total de 36px (container, board e padding do grid)
      const availableWidth = windowWidth - 36;
      const gaps = (cols - 1) * 2;
      const computed = Math.floor((availableWidth - gaps) / cols);
      return Math.max(18, Math.min(computed, 40));
    }
    return 44;
  }, [gridData.cols, windowWidth]);

  // Geração 100% autônoma e offline no próprio navegador
  const generateOfflinePuzzle = useCallback(
    (selectedTheme?: string, count?: number, selectedDifficulty?: DifficultyLevel) => {
      const targetTheme = selectedTheme ?? themeRef.current;
      const targetDifficulty = selectedDifficulty ?? difficultyRef.current;
      const targetCount =
        count ?? (DIFFICULTY_CONFIG[targetDifficulty]?.defaultWords || wordCountRef.current);

      setLoading(true);
      setIsVerifying(false);
      setUserLetters({});
      setRevealedWords(new Set());
      setElapsedSeconds(0);

      // Executa assíncrono para garantir repaint imediato do botão com spinner
      setTimeout(() => {
        try {
          const words = offlineProvider.fetchThematicWords(
            targetTheme,
            targetCount,
            targetDifficulty
          );
          const generatedGrid = localEngine.generate(words, 30, targetDifficulty);
          setPuzzle(generatedGrid);
          setCurrentPuzzleTheme(targetTheme);
          setDifficulty(targetDifficulty);
          setWordCount(targetCount);

          if (generatedGrid.placedWords.length > 0) {
            const firstWord = generatedGrid.placedWords[0];
            setFocusedCell({ row: firstWord.row, col: firstWord.col });
            setDirection(firstWord.direction);
          } else {
            setFocusedCell(null);
          }
        } catch (err) {
          console.error('Erro ao gerar tabuleiro offline:', err);
        } finally {
          setLoading(false);
        }
      }, 15);
    },
    []
  );

  // Inicializa restaurando o jogo salvo no localStorage ou gerando um novo tabuleiro
  useEffect(() => {
    const saved = loadActiveGame();
    if (saved && saved.puzzle && saved.puzzle.placedWords && saved.puzzle.placedWords.length > 0) {
      setPuzzle(saved.puzzle);
      setTheme(saved.theme || 'todos');
      setCurrentPuzzleTheme(saved.currentPuzzleTheme || saved.theme || 'todos');
      setDifficulty(saved.difficulty || saved.puzzle.difficulty || 'medio');
      setWordCount(saved.wordCount || 8);
      setUserLetters(saved.userLetters || {});
      setRevealedWords(new Set(saved.revealedWordIds || []));
      if (saved.focusedCell) {
        setFocusedCell(saved.focusedCell);
      } else if (saved.puzzle.placedWords.length > 0) {
        setFocusedCell({
          row: saved.puzzle.placedWords[0].row,
          col: saved.puzzle.placedWords[0].col,
        });
      }
      setDirection(saved.direction || 'horizontal');
      setIsVerifying(Boolean(saved.isVerifying));
      setRevealSolutions(Boolean(saved.revealSolutions));
      setElapsedSeconds(saved.elapsedSeconds || 0);
      setHasLoadedSavedGame(true);
    } else {
      generateOfflinePuzzle('todos', 8, 'medio');
      setHasLoadedSavedGame(true);
    }
  }, [generateOfflinePuzzle]);

  // Palavra ativa baseada no foco e na direção atual
  const activeWord: WordPlacement | undefined = useMemo(() => {
    if (!focusedCell) return undefined;
    const cellKey = `${focusedCell.row},${focusedCell.col}`;
    const cell = gridData.map[cellKey];
    if (!cell) return undefined;

    // Procura uma palavra que passe pela célula na direção ativa
    const match = puzzle.placedWords.find((pw) => {
      if (pw.direction !== direction) return false;
      if (direction === 'horizontal') {
        return (
          pw.row === focusedCell.row &&
          focusedCell.col >= pw.col &&
          focusedCell.col < pw.col + pw.length
        );
      } else {
        return (
          pw.col === focusedCell.col &&
          focusedCell.row >= pw.row &&
          focusedCell.row < pw.row + pw.length
        );
      }
    });

    if (!match && cell.wordIds.length > 0) {
      return puzzle.placedWords.find((pw) => pw.id === cell.wordIds[0]);
    }

    return match;
  }, [focusedCell, direction, gridData.map, puzzle.placedWords]);

  // Verifica se uma palavra específica foi totalmente preenchida de forma correta pelo usuário
  const isWordCompleted = useCallback(
    (pw: WordPlacement): boolean => {
      if (revealedWords.has(pw.id)) return true;
      for (let i = 0; i < pw.length; i++) {
        const r = pw.direction === 'horizontal' ? pw.row : pw.row + i;
        const c = pw.direction === 'horizontal' ? pw.col + i : pw.col;
        const key = `${r},${c}`;
        if (userLetters[key] !== pw.word[i]) {
          return false;
        }
      }
      return true;
    },
    [revealedWords, userLetters]
  );

  // Verifica se todas as letras da palavra foram digitadas pelo usuário
  const isWordFilled = useCallback(
    (pw: WordPlacement): boolean => {
      for (let i = 0; i < pw.length; i++) {
        const r = pw.direction === 'horizontal' ? pw.row : pw.row + i;
        const c = pw.direction === 'horizontal' ? pw.col + i : pw.col;
        const key = `${r},${c}`;
        if (!userLetters[key]) {
          return false;
        }
      }
      return true;
    },
    [userLetters]
  );

  // Verifica se o usuário terminou de digitar a palavra E ela está errada
  const isWordWrong = useCallback(
    (pw: WordPlacement): boolean => {
      return isWordFilled(pw) && !isWordCompleted(pw);
    },
    [isWordFilled, isWordCompleted]
  );

  // Avançar foco dentro da palavra ativa
  const advanceFocus = useCallback(
    (step: number = 1) => {
      if (!focusedCell || !activeWord) return;

      if (activeWord.direction === 'horizontal') {
        const nextCol = focusedCell.col + step;
        if (nextCol >= activeWord.col && nextCol < activeWord.col + activeWord.length) {
          setFocusedCell({ row: focusedCell.row, col: nextCol });
        }
      } else {
        const nextRow = focusedCell.row + step;
        if (nextRow >= activeWord.row && nextRow < activeWord.row + activeWord.length) {
          setFocusedCell({ row: nextRow, col: focusedCell.col });
        }
      }
    },
    [focusedCell, activeWord]
  );

  // Inserção de caractere
  const handleInputChar = useCallback(
    (rawChar: string) => {
      if (!focusedCell) return;
      const char = rawChar
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z]/g, '');
      if (!char) return;

      const cellKey = `${focusedCell.row},${focusedCell.col}`;
      if (!gridData.map[cellKey]) return;

      setUserLetters((prev) => ({
        ...prev,
        [cellKey]: char,
      }));

      advanceFocus(1);
    },
    [focusedCell, gridData.map, advanceFocus]
  );

  // Ação de Backspace
  const handleBackspace = useCallback(() => {
    if (!focusedCell) return;
    const cellKey = `${focusedCell.row},${focusedCell.col}`;

    if (userLetters[cellKey]) {
      setUserLetters((prev) => {
        const copy = { ...prev };
        delete copy[cellKey];
        return copy;
      });
    } else {
      advanceFocus(-1);
    }
  }, [focusedCell, userLetters, advanceFocus]);

  // Pular para a próxima palavra
  const nextWord = useCallback(() => {
    if (puzzle.placedWords.length === 0) return;
    const currentIndex = puzzle.placedWords.findIndex((w) => w.id === activeWord?.id);
    const nextIdx = (currentIndex + 1) % puzzle.placedWords.length;
    const nextW = puzzle.placedWords[nextIdx];
    setFocusedCell({ row: nextW.row, col: nextW.col });
    setDirection(nextW.direction);
  }, [puzzle.placedWords, activeWord]);

  // Ouvinte de teclado físico global
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        nextWord();
      } else if (e.key === ' ') {
        e.preventDefault();
        setDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
      } else if (e.key === 'ArrowRight' && focusedCell) {
        e.preventDefault();
        const nextCol = focusedCell.col + 1;
        if (gridData.map[`${focusedCell.row},${nextCol}`]) {
          setFocusedCell({ row: focusedCell.row, col: nextCol });
        }
      } else if (e.key === 'ArrowLeft' && focusedCell) {
        e.preventDefault();
        const prevCol = focusedCell.col - 1;
        if (gridData.map[`${focusedCell.row},${prevCol}`]) {
          setFocusedCell({ row: focusedCell.row, col: prevCol });
        }
      } else if (e.key === 'ArrowDown' && focusedCell) {
        e.preventDefault();
        const nextRow = focusedCell.row + 1;
        if (gridData.map[`${nextRow},${focusedCell.col}`]) {
          setFocusedCell({ row: nextRow, col: focusedCell.col });
        }
      } else if (e.key === 'ArrowUp' && focusedCell) {
        e.preventDefault();
        const prevRow = focusedCell.row - 1;
        if (gridData.map[`${prevRow},${focusedCell.col}`]) {
          setFocusedCell({ row: prevRow, col: focusedCell.col });
        }
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleInputChar(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedCell, gridData.map, handleBackspace, nextWord, handleInputChar]);

  // Clique em uma célula
  const handleCellClick = (r: number, c: number) => {
    const cellKey = `${r},${c}`;
    const cell = gridData.map[cellKey];
    if (!cell) return;

    if (focusedCell?.row === r && focusedCell?.col === c) {
      setDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
    } else {
      setFocusedCell({ row: r, col: c });
      const wordsAtCell = puzzle.placedWords.filter((w) => cell.wordIds.includes(w.id));
      if (wordsAtCell.length === 1) {
        setDirection(wordsAtCell[0].direction);
      }
    }
    focusHiddenInput();
  };

  // Clique em uma pista na lista lateral
  const handleClueClick = (pw: WordPlacement) => {
    setFocusedCell({ row: pw.row, col: pw.col });
    setDirection(pw.direction);
    focusHiddenInput();
  };

  // Handler para capturar digitação e backspace no teclado do iOS e Android
  const handleMobileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length === 0) {
      // O usuário pressionou backspace no teclado virtual móvel
      const now = Date.now();
      if (now - lastBackspaceTimeRef.current > 50) {
        lastBackspaceTimeRef.current = now;
        handleBackspace();
      }
    } else if (val.length > 1) {
      const char = val.replace(' ', '').slice(-1);
      if (char) {
        handleInputChar(char);
      }
    }
    e.target.value = ' ';
  };

  const handleMobileInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const now = Date.now();
      if (now - lastBackspaceTimeRef.current > 50) {
        lastBackspaceTimeRef.current = now;
        handleBackspace();
      }
      e.currentTarget.value = ' ';
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      nextWord();
    } else if (e.key === ' ') {
      e.preventDefault();
      setDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
    } else if (e.key === 'ArrowRight' && focusedCell) {
      e.preventDefault();
      const nextCol = focusedCell.col + 1;
      if (gridData.map[`${focusedCell.row},${nextCol}`]) {
        setFocusedCell({ row: focusedCell.row, col: nextCol });
      }
    } else if (e.key === 'ArrowLeft' && focusedCell) {
      e.preventDefault();
      const prevCol = focusedCell.col - 1;
      if (gridData.map[`${focusedCell.row},${prevCol}`]) {
        setFocusedCell({ row: focusedCell.row, col: prevCol });
      }
    } else if (e.key === 'ArrowDown' && focusedCell) {
      e.preventDefault();
      const nextRow = focusedCell.row + 1;
      if (gridData.map[`${nextRow},${focusedCell.col}`]) {
        setFocusedCell({ row: nextRow, col: focusedCell.col });
      }
    } else if (e.key === 'ArrowUp' && focusedCell) {
      e.preventDefault();
      const prevRow = focusedCell.row - 1;
      if (gridData.map[`${prevRow},${focusedCell.col}`]) {
        setFocusedCell({ row: prevRow, col: focusedCell.col });
      }
    }
  };

  // Revelar a palavra ativa
  const revealActiveWord = () => {
    if (!activeWord) return;
    setUserLetters((prev) => {
      const copy = { ...prev };
      for (let i = 0; i < activeWord.length; i++) {
        const r = activeWord.direction === 'horizontal' ? activeWord.row : activeWord.row + i;
        const c = activeWord.direction === 'horizontal' ? activeWord.col + i : activeWord.col;
        copy[`${r},${c}`] = activeWord.word[i];
      }
      return copy;
    });
    setRevealedWords((prev) => new Set([...prev, activeWord.id]));
  };

  // Quantidade de palavras concluídas no total
  const completedWordsCount = useMemo(() => {
    return puzzle.placedWords.filter((pw) => isWordCompleted(pw)).length;
  }, [puzzle.placedWords, isWordCompleted]);

  // Verificar se o tabuleiro está totalmente completo e correto
  const isPuzzleCompleted = useMemo(() => {
    if (puzzle.placedWords.length === 0) return false;
    for (const [coord, cell] of Object.entries(gridData.map)) {
      if (userLetters[coord] !== cell.char) {
        return false;
      }
    }
    return true;
  }, [puzzle, gridData.map, userLetters]);

  const horizontalWords = puzzle.placedWords.filter((w) => w.direction === 'horizontal');
  const verticalWords = puzzle.placedWords.filter((w) => w.direction === 'vertical');

  const isActiveWordCompleted = activeWord ? isWordCompleted(activeWord) : false;
  const isActiveWordWrong = activeWord ? isWordWrong(activeWord) : false;

  // Conjuntos reativos de IDs para renderização veloz do tabuleiro e lista de pistas
  const { completedWordIds, wrongWordIds } = useMemo(() => {
    const completed = new Set<string>();
    const wrong = new Set<string>();
    puzzle.placedWords.forEach((pw) => {
      if (isWordCompleted(pw)) {
        completed.add(pw.id);
      } else if (isWordWrong(pw)) {
        wrong.add(pw.id);
      }
    });
    return { completedWordIds: completed, wrongWordIds: wrong };
  }, [puzzle.placedWords, isWordCompleted, isWordWrong]);

  // Cronômetro do jogo: incrementa a cada segundo enquanto o jogo estiver em andamento
  useEffect(() => {
    if (!hasLoadedSavedGame || loading || isPuzzleCompleted || puzzle.placedWords.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [hasLoadedSavedGame, loading, isPuzzleCompleted, puzzle.placedWords.length]);

  // Formatação legível do tempo decorrido (MM:SS)
  const formattedTime = useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [elapsedSeconds]);

  // Auto-Save: persiste qualquer progresso no localStorage automaticamente
  useEffect(() => {
    if (!hasLoadedSavedGame || loading || puzzle.placedWords.length === 0) {
      return;
    }

    saveActiveGame({
      version: 1,
      puzzle,
      theme,
      currentPuzzleTheme,
      difficulty,
      wordCount,
      userLetters,
      revealedWordIds: Array.from(revealedWords),
      focusedCell,
      direction,
      isVerifying,
      revealSolutions,
      elapsedSeconds,
      isCompleted: isPuzzleCompleted,
      updatedAt: Date.now(),
    });
  }, [
    hasLoadedSavedGame,
    loading,
    puzzle,
    theme,
    currentPuzzleTheme,
    difficulty,
    wordCount,
    userLetters,
    revealedWords,
    focusedCell,
    direction,
    isVerifying,
    revealSolutions,
    elapsedSeconds,
    isPuzzleCompleted,
  ]);

  // Proteção contra início acidental de novo jogo com progresso não salvo
  const requestNewPuzzle = useCallback(
    (targetTheme?: string, targetCount?: number, targetDifficulty?: DifficultyLevel) => {
      const hasUserInput = Object.keys(userLetters).length > 0 && !isPuzzleCompleted;
      if (hasUserInput) {
        const confirmed = window.confirm(
          'Deseja iniciar um novo jogo? O progresso da cruzadinha atual será substituído.'
        );
        if (!confirmed) return;
      }
      generateOfflinePuzzle(targetTheme, targetCount, targetDifficulty);
    },
    [userLetters, isPuzzleCompleted, generateOfflinePuzzle]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-title">
          <Layers size={26} color="#6366f1" />
          <span>Crossword Mind</span>
          <span
            className="brand-badge"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <WifiOff size={11} /> 100% Offline (6.800+ Palavras)
          </span>
        </div>
        <div className="header-actions">
          <span className="stats-badge" title="Tempo decorrido nesta cruzadinha">
            <Clock size={14} color="#38bdf8" />
            {formattedTime}
          </span>
          <span className="stats-badge" title="Palavras corretas">
            <Trophy size={14} color="#fbbf24" />
            {completedWordsCount} / {puzzle.placedWords.length}
          </span>
          <button
            onClick={() => setIsVerifying(!isVerifying)}
            className={`btn-action ${isVerifying ? 'active' : ''}`}
            title="Destaca em verde os acertos e em vermelho os erros"
          >
            <Check size={14} />
            {isVerifying ? 'Ocultar' : 'Verificar'}
          </button>
          <button onClick={() => setRevealSolutions(!revealSolutions)} className="btn-action">
            <HelpCircle size={14} />
            {revealSolutions ? 'Ocultar' : 'Gabarito'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-container">
        {/* Controls Bar */}
        <section className="glass-panel control-bar">
          {/* Difficulty Selector */}
          <div
            className="difficulty-selector"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              flexWrap: 'wrap',
              width: '100%',
              marginBottom: '0.6rem',
            }}
          >
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-dim)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
                marginBottom: '2px',
              }}
            >
              <Sparkles size={14} /> Dificuldade do Tabuleiro:
            </span>
            {(['facil', 'medio', 'dificil'] as DifficultyLevel[]).map((d) => {
              const cfg = DIFFICULTY_CONFIG[d];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    if (difficulty === d) return;
                    setDifficulty(d);
                    const defaultCount = cfg.defaultWords;
                    setWordCount(defaultCount);
                    requestNewPuzzle(theme, defaultCount, d);
                  }}
                  className={`theme-button difficulty-badge-${d} ${difficulty === d ? 'active' : ''}`}
                  title={cfg.desc}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{cfg.icon}</span> {cfg.label}
                </button>
              );
            })}
          </div>

          <div className="theme-selector">
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-dim)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: '100%',
                marginBottom: '2px',
              }}
            >
              <BookOpen size={14} /> Tema:
            </span>
            {availableThemes.map((t) => (
              <button
                key={t}
                onClick={() => {
                  if (theme === t) return;
                  setTheme(t);
                  requestNewPuzzle(t, wordCount, difficulty);
                }}
                className={`theme-button ${theme === t ? 'active' : ''}`}
              >
                {THEME_LABELS[t] || t}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              <span>Palavras:</span>
              <select
                value={wordCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setWordCount(val);
                  requestNewPuzzle(theme, val, difficulty);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-main)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <option value={6} style={{ background: '#1e293b' }}>
                  6 palavras
                </option>
                <option value={8} style={{ background: '#1e293b' }}>
                  8 palavras
                </option>
                <option value={10} style={{ background: '#1e293b' }}>
                  10 palavras
                </option>
                <option value={12} style={{ background: '#1e293b' }}>
                  12 palavras
                </option>
              </select>
            </div>

            <button
              className="btn-generate"
              disabled={loading}
              onClick={() => requestNewPuzzle(theme, wordCount, difficulty)}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              {loading ? 'Gerando...' : 'Novo Tabuleiro'}
            </button>
          </div>
        </section>

        {/* Tabuleiro Central */}
        <section
          className="glass-panel board-container"
          ref={boardRef}
          style={{ position: 'relative' }}
        >
          {/* Input invisível para acionar o teclado nativo no iOS e Android */}
          <input
            ref={hiddenInputRef}
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-label="Digitação de palavras cruzadas"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0,
              width: '1px',
              height: '1px',
              fontSize: '16px',
              border: 'none',
              padding: 0,
              margin: 0,
              outline: 'none',
              pointerEvents: 'none',
            }}
            defaultValue=" "
            onChange={handleMobileInputChange}
            onKeyDown={handleMobileInputKeyDown}
          />

          {/* Indicador do tema ativo e status de salvamento */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginBottom: '0.75rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                color: 'var(--accent-secondary)',
                fontWeight: 700,
                flexWrap: 'wrap',
              }}
            >
              <Tag size={13} />
              <span>Tema: {THEME_LABELS[currentPuzzleTheme] || currentPuzzleTheme}</span>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  color: DIFFICULTY_CONFIG[puzzle.difficulty || difficulty]?.color || '#f59e0b',
                  border: `1px solid ${DIFFICULTY_CONFIG[puzzle.difficulty || difficulty]?.color || '#f59e0b'}44`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title={
                  puzzle.metrics
                    ? `Score: ${puzzle.metrics.score}/100 • Cruzamentos: ${Math.round(puzzle.metrics.interlockingRatio * 100)}% • Tam. Médio: ${puzzle.metrics.averageWordLength} letras`
                    : undefined
                }
              >
                <span>{DIFFICULTY_CONFIG[puzzle.difficulty || difficulty]?.icon}</span>
                <span>{DIFFICULTY_CONFIG[puzzle.difficulty || difficulty]?.label}</span>
                {puzzle.metrics && <span>({puzzle.metrics.score} pts)</span>}
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                • {puzzle.placedWords.length} palavras
              </span>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                color: '#10b981',
                fontWeight: 500,
              }}
              title="Todas as suas respostas são salvas automaticamente no aparelho"
            >
              <Save size={12} />
              <span>Salvo automaticamente</span>
            </div>
          </div>

          {isPuzzleCompleted && (
            <div className="congrats-modal">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={24} color="#10b981" />
                <div>
                  <h4 style={{ margin: 0, color: '#10b981', fontWeight: 800 }}>
                    Parabéns! Cruzadinha Concluída!
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Você preencheu todas as palavras em <strong>{formattedTime}</strong>.
                  </p>
                </div>
              </div>
              <button
                className="btn-generate"
                onClick={() => generateOfflinePuzzle(theme, wordCount, difficulty)}
              >
                Jogar Próxima
              </button>
            </div>
          )}

          {activeWord && (
            <div
              className="active-word-card"
              style={{
                background: isActiveWordWrong
                  ? 'rgba(239, 68, 68, 0.15)'
                  : isActiveWordCompleted
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(99, 102, 241, 0.12)',
                border: `1px solid ${
                  isActiveWordWrong
                    ? 'rgba(239, 68, 68, 0.5)'
                    : isActiveWordCompleted
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(99, 102, 241, 0.25)'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {isActiveWordWrong ? (
                  <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />
                ) : (
                  <Sparkles
                    size={18}
                    color={isActiveWordCompleted ? '#34d399' : '#818cf8'}
                    style={{ flexShrink: 0 }}
                  />
                )}
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: isActiveWordWrong
                        ? '#f87171'
                        : isActiveWordCompleted
                          ? '#34d399'
                          : '#818cf8',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Pista ({activeWord.direction === 'horizontal' ? 'Horizontal' : 'Vertical'} -{' '}
                    {activeWord.length} letras)
                    {isActiveWordWrong
                      ? ' • Palavra Incorreta'
                      : isActiveWordCompleted
                        ? ' • Concluída'
                        : ''}
                    :
                  </span>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: '#f8fafc',
                      fontWeight: 500,
                      margin: '1px 0 0 0',
                    }}
                  >
                    {activeWord.clue}
                  </p>
                </div>
              </div>

              {/* Botão de Revelar: desabilitado e indicando conclusão quando a palavra já foi acertada ou revelada */}
              <button
                onClick={revealActiveWord}
                disabled={isActiveWordCompleted}
                className="btn-action"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  flexShrink: 0,
                  color: isActiveWordCompleted ? '#34d399' : 'var(--text-main)',
                }}
                title={
                  isActiveWordCompleted
                    ? 'Esta palavra já foi concluída'
                    : 'Preenche a palavra ativa no tabuleiro'
                }
              >
                {isActiveWordCompleted ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={13} color="#10b981" /> Concluída
                  </span>
                ) : (
                  'Revelar Palavra'
                )}
              </button>
            </div>
          )}

          {gridData.rows > 0 ? (
            <div
              className="crossword-grid"
              style={
                {
                  '--cell-size': `${cellSize}px`,
                  gridTemplateColumns: `repeat(${gridData.cols}, ${cellSize}px)`,
                  gridTemplateRows: `repeat(${gridData.rows}, ${cellSize}px)`,
                } as React.CSSProperties
              }
            >
              {Array.from({ length: gridData.rows }).map((_, r) =>
                Array.from({ length: gridData.cols }).map((_, c) => {
                  const key = `${r},${c}`;
                  const cell = gridData.map[key];

                  if (!cell) {
                    return (
                      <div
                        key={key}
                        className="crossword-cell empty"
                        style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                      />
                    );
                  }

                  const isFocused = focusedCell?.row === r && focusedCell?.col === c;

                  let isPartOfActiveWord = false;
                  if (activeWord) {
                    if (activeWord.direction === 'horizontal') {
                      isPartOfActiveWord =
                        activeWord.row === r &&
                        c >= activeWord.col &&
                        c < activeWord.col + activeWord.length;
                    } else {
                      isPartOfActiveWord =
                        activeWord.col === c &&
                        r >= activeWord.row &&
                        r < activeWord.row + activeWord.length;
                    }
                  }

                  const userChar = userLetters[key] || '';
                  const isCorrect = userChar === cell.char;
                  const showVerification = isVerifying && userChar.length > 0;

                  const cellInWrongWord = cell.wordIds.some((id) => wrongWordIds.has(id));
                  const cellInCompletedWord = cell.wordIds.some((id) => completedWordIds.has(id));

                  let cellHighlightClass = '';
                  if (isFocused) {
                    if (isActiveWordWrong) {
                      cellHighlightClass = 'cell-focused cell-focused-wrong';
                    } else if (isActiveWordCompleted) {
                      cellHighlightClass = 'cell-focused cell-focused-correct';
                    } else {
                      cellHighlightClass = 'cell-focused';
                    }
                  } else if (isPartOfActiveWord) {
                    if (isActiveWordWrong) {
                      cellHighlightClass = 'word-highlight-wrong';
                    } else if (isActiveWordCompleted) {
                      cellHighlightClass = 'word-highlight-correct';
                    } else {
                      cellHighlightClass = 'word-highlight';
                    }
                  } else if (cellInWrongWord) {
                    cellHighlightClass = 'cell-wrong-completed';
                  } else if (cellInCompletedWord) {
                    cellHighlightClass = 'cell-correct-completed';
                  }

                  return (
                    <div
                      key={key}
                      onClick={() => handleCellClick(r, c)}
                      className={`crossword-cell ${cellHighlightClass} ${
                        showVerification ? (isCorrect ? 'cell-correct' : 'cell-wrong') : ''
                      }`}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        fontSize: `${Math.round(cellSize * 0.54)}px`,
                      }}
                    >
                      {cell.num && (
                        <span
                          className="crossword-cell-number"
                          style={{
                            fontSize: `${Math.max(7, Math.round(cellSize * 0.28))}px`,
                          }}
                        >
                          {cell.num}
                        </span>
                      )}
                      {revealSolutions ? cell.char : userChar}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>
              Carregando palavras cruzadas...
            </div>
          )}

          <div className="board-actions-bar">
            <button
              onClick={() => {
                setDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
                focusHiddenInput();
              }}
              className="btn-action"
              style={{ fontSize: '0.82rem' }}
              title="Alterna entre digitação horizontal e vertical"
            >
              ⇄ {direction === 'horizontal' ? 'Horizontal' : 'Vertical'}
            </button>
            <button
              onClick={() => {
                handleBackspace();
                focusHiddenInput();
              }}
              className="btn-action"
              style={{ fontSize: '0.82rem' }}
              title="Apaga a letra da célula anterior"
            >
              ⌫ Apagar
            </button>
            <button
              onClick={() => {
                nextWord();
                focusHiddenInput();
              }}
              className="btn-action"
              style={{ fontSize: '0.82rem' }}
              title="Avança para a próxima palavra"
            >
              ➔ Próxima
            </button>
            <button
              onClick={() => {
                if (Object.keys(userLetters).length > 0) {
                  const confirmed = window.confirm(
                    'Deseja apagar todas as respostas digitadas nesta cruzadinha?'
                  );
                  if (!confirmed) return;
                }
                setUserLetters({});
                setRevealedWords(new Set());
                focusHiddenInput();
              }}
              className="btn-action"
              style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}
            >
              <Trash2 size={13} /> Limpar
            </button>
          </div>
        </section>

        {/* Painel Lateral de Pistas */}
        <aside className="glass-panel clues-panel">
          {/* Horizontais */}
          <div className="clues-section">
            <div className="clues-header">
              <span>Palavras Horizontais ({horizontalWords.length})</span>
            </div>
            {horizontalWords.map((pw, idx) => {
              const isActive = activeWord?.id === pw.id;
              const completed = isWordCompleted(pw);
              const wrong = isWordWrong(pw);
              return (
                <div
                  key={pw.id}
                  onClick={() => handleClueClick(pw)}
                  className={`clue-item ${isActive ? 'active' : ''} ${
                    completed ? 'completed' : wrong ? 'wrong' : ''
                  }`}
                >
                  <span
                    className="clue-badge"
                    style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    {completed ? (
                      <Check size={13} color="#10b981" />
                    ) : wrong ? (
                      <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span>
                    ) : (
                      `${idx + 1}.`
                    )}
                  </span>
                  <div style={{ flex: '1 1 0%', minWidth: 0 }}>
                    <p style={{ margin: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {pw.clue}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginTop: '2px',
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        ({pw.length} letras)
                      </span>
                      {wrong && (
                        <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 700 }}>
                          • Incorreta
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verticais */}
          <div className="clues-section">
            <div className="clues-header">
              <span>Palavras Verticais ({verticalWords.length})</span>
            </div>
            {verticalWords.map((pw, idx) => {
              const isActive = activeWord?.id === pw.id;
              const completed = isWordCompleted(pw);
              const wrong = isWordWrong(pw);
              return (
                <div
                  key={pw.id}
                  onClick={() => handleClueClick(pw)}
                  className={`clue-item ${isActive ? 'active' : ''} ${
                    completed ? 'completed' : wrong ? 'wrong' : ''
                  }`}
                >
                  <span
                    className="clue-badge"
                    style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    {completed ? (
                      <Check size={13} color="#10b981" />
                    ) : wrong ? (
                      <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span>
                    ) : (
                      `${idx + 1}.`
                    )}
                  </span>
                  <div style={{ flex: '1 1 0%', minWidth: 0 }}>
                    <p style={{ margin: 0, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {pw.clue}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        marginTop: '2px',
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        ({pw.length} letras)
                      </span>
                      {wrong && (
                        <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 700 }}>
                          • Incorreta
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </main>
    </div>
  );
}
