import { db, initSchema, seedIfEmpty } from './schema.js';

initSchema();
seedIfEmpty();

export default db;
