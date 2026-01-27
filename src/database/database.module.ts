import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DatabaseService } from './database.service';
import { DATABASE_CONNECTION } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: () => {
        const connectionString = process.env.POSTGRES_URL;

        if (!connectionString) {
          throw new Error(
            'POSTGRES_URL is not set in environment variables. ' +
              'Please add your Supabase connection string to .env',
          );
        }

        const client = postgres(connectionString, {
          ssl: {
            rejectUnauthorized: false,
          },
        });

        return drizzle(client);
      },
    },
    DatabaseService,
  ],
  exports: [DATABASE_CONNECTION, DatabaseService],
})
export class DatabaseModule {}
