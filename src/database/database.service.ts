import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from './database.constants';

@Injectable()
export class DatabaseService {
    constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) { }

    getDatabase() {
        return this.db;
    }
}
