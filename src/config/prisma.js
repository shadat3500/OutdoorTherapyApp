const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

// Middleware to log query time
prisma.$on('query', (e) => {
  console.log(`[Prisma Query] Duration: ${e.duration}ms | Query: ${e.query}`);
});

module.exports = prisma;  
