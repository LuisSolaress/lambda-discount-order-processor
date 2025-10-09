import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { exampleTable } from '../schemas';
import { logger } from '../common';

/**
 * Example service - Replace with your actual business logic
 */
export const exampleService = async (data: any) => {
  logger.info('[exampleService] Starting example service', { data });

  const db = await getDb();

  // Example query - fetch all records
  const results = await db.select().from(exampleTable);
  
  logger.info('[exampleService] Query results', { count: results.length });

  // Example insert
  // const newRecord = await db.insert(exampleTable).values({
  //   name: data.name,
  //   email: data.email,
  //   isActive: data.isActive ?? true,
  // }).returning();

  // Example update
  // const updated = await db.update(exampleTable)
  //   .set({ name: 'New Name' })
  //   .where(eq(exampleTable.id, 1))
  //   .returning();

  // Example transaction
  // const result = await db.transaction(async (tx) => {
  //   const record = await tx.insert(exampleTable).values({
  //     name: data.name,
  //     email: data.email,
  //   }).returning();
  //   
  //   return record;
  // });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success',
      data: results,
    }),
  };
};
