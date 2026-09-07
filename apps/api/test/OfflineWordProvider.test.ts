import { describe, it, expect } from 'vitest';
import { OfflineWordProvider, THEME_LABELS } from 'shared-types';

describe('OfflineWordProvider and Curated Dataset', () => {
  const provider = new OfflineWordProvider();

  it('deve disponibilizar todos os temas canônicos com vocabulário rico', () => {
    const availableThemes = provider.getAvailableThemes();
    expect(availableThemes).toContain('todos');
    expect(availableThemes).toContain('tecnologia');
    expect(availableThemes).toContain('ciencia');
    expect(availableThemes).toContain('natureza');
    expect(availableThemes).toContain('geografia');
    expect(availableThemes).toContain('historia');
    expect(availableThemes).toContain('geral');
  });

  it('todas as categorias devem ter pelo menos 70 palavras curadas', () => {
    const themes = ['tecnologia', 'ciencia', 'natureza', 'geografia', 'historia', 'geral'];
    for (const theme of themes) {
      const words = provider.fetchThematicWords(theme, 200);
      expect(words.length).toBeGreaterThanOrEqual(70);
    }
  });

  it('categoria "todos" deve reunir mais de 500 palavras únicas', () => {
    const allWords = provider.fetchThematicWords('todos', 1000);
    expect(allWords.length).toBeGreaterThanOrEqual(500);

    const wordsSet = new Set(allWords.map((w) => w.word));
    expect(wordsSet.size).toBe(allWords.length);
  });

  it('todas as palavras e dicas do dataset devem atender rigorosamente ao padrão cruciverbalista de qualidade', () => {
    const allWords = provider.fetchThematicWords('todos', 1000);

    for (const item of allWords) {
      // 1. Palavra apenas maiúsculas A-Z sem caracteres especiais
      expect(item.word).toMatch(/^[A-Z]+$/);
      expect(item.word.length).toBeGreaterThanOrEqual(3);
      expect(item.word.length).toBeLessThanOrEqual(14);

      // 2. Dica deve ser elaborada e expressiva (>= 20 caracteres)
      expect(item.clue.trim().length).toBeGreaterThanOrEqual(20);

      // 3. A dica NÃO pode conter a própria palavra (não pode dar a resposta de bandeja)
      const clueNormalized = item.clue
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const clueWords = clueNormalized.split(/[^A-Z0-9]+/);
      expect(clueWords).not.toContain(item.word);

      // 4. Sem jargões e definições secas de dicionário antigo
      expect(item.clue).not.toMatch(/^o mesmo que/i);
      expect(item.clue).not.toMatch(/^adj\./i);
      expect(item.clue).not.toMatch(/^diz-se/i);
      expect(item.clue).not.toMatch(/^planta, o mesmo/i);
    }
  });

  it('deve filtrar adequadamente por nível de dificuldade para cada tema', () => {
    const themes = ['tecnologia', 'ciencia', 'natureza', 'geografia', 'historia', 'geral'];

    for (const theme of themes) {
      const easyWords = provider.fetchThematicWords(theme, 8, 'facil');
      expect(easyWords.length).toBe(8);
      for (const w of easyWords) {
        expect(w.word.length).toBeLessThanOrEqual(6);
      }

      const mediumWords = provider.fetchThematicWords(theme, 8, 'medio');
      expect(mediumWords.length).toBe(8);
      for (const w of mediumWords) {
        expect(w.word.length).toBeGreaterThanOrEqual(5);
        expect(w.word.length).toBeLessThanOrEqual(9);
      }

      const hardWords = provider.fetchThematicWords(theme, 8, 'dificil');
      expect(hardWords.length).toBe(8);
      for (const w of hardWords) {
        expect(w.word.length).toBeGreaterThanOrEqual(7);
      }
    }
  });

  it('deve mapear corretamente os rótulos visuais dos temas em THEME_LABELS', () => {
    expect(THEME_LABELS.tecnologia).toBe('Tecnologia');
    expect(THEME_LABELS.ciencia).toBe('Ciência');
    expect(THEME_LABELS.natureza).toBe('Natureza');
    expect(THEME_LABELS.geografia).toBe('Geografia');
    expect(THEME_LABELS.historia).toBe('História');
    expect(THEME_LABELS.geral).toBe('Geral');
    expect(THEME_LABELS.todos).toBe('Todos');
  });
});
