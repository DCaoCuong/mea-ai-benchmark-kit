import { Module } from '@nestjs/common';
import { VectorStoreService } from './vectorstore.service';

@Module({
    providers: [VectorStoreService],
    exports: [VectorStoreService],
})
export class RagModule { }
