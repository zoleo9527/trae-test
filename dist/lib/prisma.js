"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
    ],
});
prisma.$on('query', (e) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`Query: ${e.query}`);
        console.log(`Params: ${e.params}`);
    }
});
prisma.$on('error', (e) => {
    console.error(`Prisma Error: ${e.message}`);
});
exports.default = prisma;
