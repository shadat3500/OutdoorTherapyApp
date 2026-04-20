const { PrismaClient } = require("@prisma/client");
const app = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");
const socketIO = require("./utils/socketIO");
const socketIo = require("socket.io");
require("./config/redis"); // Initialize Redis connection

const prisma = new PrismaClient();

let server;

async function main() {
  try {
    // Database connection check
    await prisma.$connect();
    logger.info("Connected to PostgreSQL via Prisma");

    global.prisma = prisma;

    const myIp = process.env.BACKEND_IP || "127.0.0.1";
    
    server = app.listen(config.port, myIp, () => {
      logger.info(`Listening to ip http://${myIp}:${config.port}`);
    });

    // Initialize socket.io
    const io = socketIo(server, {
      cors: {
        origin: "*"
      },
    });

    socketIO(io);
    global.io = io;

  } catch (error) {
    logger.error("Database connection failed", error);
    process.exit(1);
  }
}

main();

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      prisma.$disconnect();
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
    prisma.$disconnect();
  }
});
