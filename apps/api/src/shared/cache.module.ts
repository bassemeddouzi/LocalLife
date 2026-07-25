import { Module, Global } from '@nestjs/common';
import { MemoryCacheService } from './memory-cache.service';

@Global()
@Module({
  providers: [MemoryCacheService],
  exports: [MemoryCacheService],
})
export class CacheModule {}
