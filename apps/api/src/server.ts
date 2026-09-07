import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { GeneratePuzzleUseCase } from './application/useCases/GeneratePuzzleUseCase';
import { InMemoryPuzzleRepository } from './infrastructure/InMemoryPuzzleRepository';
import { AgentWordProvider } from './infrastructure/AgentWordProvider';
import { CrosswordEngine } from './domain/CrosswordEngine';

const fastify = Fastify({ logger: true });

// Registrar CORS para comunicação aberta com o frontend
fastify.register(cors, {
  origin: '*',
});

// Suporte a servir o frontend PWA na mesma imagem Docker (Single-Container Fullstack)
const staticRoot = process.env.STATIC_ROOT || path.join(__dirname, '../../web/dist');
if (fs.existsSync(staticRoot)) {
  fastify.register(fastifyStatic, {
    root: staticRoot,
    prefix: '/',
  });

  fastify.setNotFoundHandler((req, reply) => {
    if (req.raw.url?.startsWith('/puzzles') || req.raw.url?.startsWith('/health') || req.raw.url?.startsWith('/api')) {
      reply.status(404).send({ error: 'Endpoint not found' });
    } else {
      reply.sendFile('index.html');
    }
  });
}

// Composição de Dependências (Clean Architecture)
const puzzleRepo = new InMemoryPuzzleRepository();
const wordProvider = new AgentWordProvider();
const crosswordEngine = new CrosswordEngine(30);
const generatePuzzleUseCase = new GeneratePuzzleUseCase(puzzleRepo, wordProvider, crosswordEngine);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', service: 'crossword-api' };
});

// Buscar puzzle existente por ID
fastify.get<{ Params: { id: string } }>('/puzzles/:id', async (request, reply) => {
  const { id } = request.params;
  const grid = await puzzleRepo.findById(id);

  if (!grid) {
    return reply.status(404).send({ error: 'Puzzle não encontrado' });
  }

  return reply.send({ id, grid });
});

// Gerar novo puzzle
interface GenerateBody {
  theme?: string;
  wordCount?: number;
}

fastify.post<{ Body: GenerateBody }>('/puzzles/generate', async (request, reply) => {
  const { theme = 'tecnologia', wordCount = 8 } = request.body || {};

  try {
    const result = await generatePuzzleUseCase.execute(theme, wordCount);
    return reply.status(201).send(result);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Falha ao gerar puzzle' });
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3333;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Servidor backend rodando em http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
