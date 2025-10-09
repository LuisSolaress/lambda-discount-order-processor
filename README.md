# Lambda Drizzle Template

A production-ready AWS Lambda template with Drizzle ORM, TypeScript, and comprehensive error handling.

## Features

- ✅ **Drizzle ORM** - Modern TypeScript ORM with type safety
- ✅ **PostgreSQL** - Database connection with RDS Proxy support
- ✅ **AWS Secrets Manager** - Secure credential management
- ✅ **SQS Integration** - Event processing with DLQ support
- ✅ **Winston Logger** - Structured logging with timestamps
- ✅ **Class Validator** - Request validation with DTOs
- ✅ **Error Handling** - Centralized error management
- ✅ **TypeScript** - Full type safety

## Project Structure

```
lambda-drizzle-template/
├── app.ts                      # Lambda handler entry point
├── src/
│   ├── common/                 # Shared utilities
│   │   ├── config.ts          # Environment configuration
│   │   ├── logger.ts          # Winston logger setup
│   │   ├── get-secrets.ts     # AWS Secrets Manager client
│   │   ├── error-handler.ts   # Centralized error handling
│   │   ├── validate-request.ts # DTO validation
│   │   └── index.ts           # Common exports
│   ├── db/
│   │   └── connection.ts      # Drizzle database connection
│   ├── schemas/               # Drizzle schema definitions
│   │   ├── example.schema.ts  # Example table schema
│   │   └── index.ts           # Schema exports
│   ├── dto/                   # Data Transfer Objects
│   │   └── example-request.dto.ts
│   ├── services/              # Business logic
│   │   ├── example.service.ts
│   │   ├── get-account-id.service.ts
│   │   └── sqs.service.ts
│   ├── enums/                 # Enumerations
│   │   ├── http-status.code.enum.ts
│   │   └── index.ts
│   └── errors/                # Error classes
│       ├── base.error.ts
│       └── business-errors.ts
├── package.json
├── tsconfig.json
├── .env.template
└── .gitignore
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.template` to `.env` and fill in your values:

```bash
cp .env.template .env
```

Required variables:
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `SECRET_NAME` - AWS Secrets Manager secret name
- `SQS_QUEUES` - JSON object with SQS queue configurations

### 3. Configure AWS Secrets

Your AWS Secrets Manager secret should contain:
```json
{
  "host": "your-db-host",
  "port": 5432,
  "username": "your-username",
  "password": "your-password",
  "dbname": "your-database",
  "hostProxy": "optional-rds-proxy-endpoint"
}
```

### 4. Define Your Schema

Edit `src/schemas/example.schema.ts` or create new schema files:

```typescript
import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 5. Create Your Service

Edit `src/services/example.service.ts` with your business logic:

```typescript
import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { users } from '../schemas';

export const createUser = async (data: any) => {
  const db = await getDb();
  
  const newUser = await db.insert(users).values({
    name: data.name,
    email: data.email,
  }).returning();
  
  return newUser[0];
};
```

### 6. Update the Lambda Handler

Modify `app.ts` to use your service and DTO.

## Usage Examples

### Database Queries

```typescript
// Select
const users = await db.select().from(usersTable);

// Select with condition
const user = await db.select()
  .from(usersTable)
  .where(eq(usersTable.id, 1));

// Insert
const newUser = await db.insert(usersTable)
  .values({ name: 'John', email: 'john@example.com' })
  .returning();

// Update
const updated = await db.update(usersTable)
  .set({ name: 'Jane' })
  .where(eq(usersTable.id, 1))
  .returning();

// Delete
await db.delete(usersTable)
  .where(eq(usersTable.id, 1));
```

### Transactions

```typescript
const result = await db.transaction(async (tx) => {
  const user = await tx.insert(usersTable)
    .values({ name: 'John', email: 'john@example.com' })
    .returning();
  
  await tx.insert(ordersTable)
    .values({ userId: user[0].id, total: 100 });
  
  return user[0];
});
```

### Request Validation

```typescript
import { IsString, IsEmail } from "class-validator";

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;
}

// In handler
const validatedDto = await validateRequest(CreateUserDto, parsedEvent);
```

## Development

### Run Locally

```bash
npm start
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Deployment

1. Build the project: `npm run build`
2. Package the lambda: Create a zip with `dist/`, `node_modules/`, and `package.json`
3. Deploy to AWS Lambda

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_REGION` | AWS region | `us-east-1` |
| `SECRET_NAME` | Secrets Manager secret name | `prod/db/credentials` |
| `SQS_QUEUES` | SQS queue configuration | `{"prod-myLambda": {"dlq_queue": "prod-myLambda-dlq"}}` |
| `NODE_ENV` | Environment name | `production` |

## Best Practices

1. **Always use transactions** for operations that modify multiple tables
2. **Validate all inputs** using DTOs and class-validator
3. **Log important steps** for debugging and monitoring
4. **Handle errors gracefully** using the error handler
5. **Use type-safe queries** with Drizzle's query builder
6. **Keep secrets in AWS Secrets Manager** never in code
7. **Use DLQ** for failed message processing

## License

ISC
