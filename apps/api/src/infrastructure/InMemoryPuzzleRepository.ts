import { IPuzzleRepository } from '../domain/interfaces';
import { PuzzleGrid } from 'shared-types';

export class InMemoryPuzzleRepository implements IPuzzleRepository {
  private db = new Map<string, PuzzleGrid>();

  async save(id: string, grid: PuzzleGrid): Promise<void> {
    this.db.set(id, grid);
  }

  async findById(id: string): Promise<PuzzleGrid | null> {
    return this.db.get(id) || null;
  }
}
