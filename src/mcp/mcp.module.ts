import { Module } from '@nestjs/common';
import { McpToolServer } from './mcp.server';
import { SseController } from './mcp.controller';
import { NotesModule } from '../notes/notes.module';

@Module({
  imports: [NotesModule],
  providers: [McpToolServer],
  controllers: [SseController],
})
export class McpModule {}
