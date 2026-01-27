import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database.constants';
import {
  comparisonRecords,
  NewComparisonRecord,
} from '../schema/comparison-records.schema';

@Injectable()
export class ComparisonRepository {
  constructor(@Inject(DATABASE_CONNECTION) private db: any) {}

  async save(record: NewComparisonRecord) {
    return this.db.insert(comparisonRecords).values(record).returning();
  }

  async findAll() {
    return this.db.select().from(comparisonRecords);
  }

  async findById(id: string) {
    return this.db
      .select()
      .from(comparisonRecords)
      .where(eq(comparisonRecords.id, id))
      .limit(1);
  }
}
