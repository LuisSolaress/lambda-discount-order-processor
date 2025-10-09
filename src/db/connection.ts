import { logger, getSecretValues } from '../common';

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schemas';
import { config } from 'dotenv';

config();

let db: ReturnType<typeof drizzle>;
let client: ReturnType<typeof postgres>;
let secrets = null;

export const getDb = async () => {
  logger.info('[connection] Starting database initialization');

  if (!secrets) {
    try {
      secrets = await getSecretValues();
      logger.debug('[connection] Secrets fetched successfully');
    } catch (error) {
      logger.error('[connection] Failed to retrieve secrets', error);
      throw new Error('Could not retrieve database secrets');
    }
  }

  if (
      !secrets.host ||
      !secrets.port ||
      !secrets.username ||
      !secrets.password ||
      !secrets.dbname
  ) {
    throw new Error('Incomplete database secrets');
  }

  const dbHost = secrets.hostProxy || secrets.host;

  const DATABASE_URL = `postgres://${secrets.username}:${encodeURIComponent(
      secrets.password
  )}@${dbHost}:${secrets.port}/${secrets.dbname}`;

  if (!client) {
    logger.info('[connection] Creating postgres client');
    client = postgres(DATABASE_URL, {
      ssl: true, // required by RDS Proxy
    });

    db = drizzle(client, { schema });
  }

  return db;
};
