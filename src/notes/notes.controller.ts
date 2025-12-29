import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get()
  async getMyNotes(@Request() req) {
    const notes = await this.notesService.findAll(req.user.id);
    return { data: notes };
  }

  @Get(':id')
  async getNote(@Param('id') id: string) {
    const note = await this.notesService.findOne(id);
    return { data: note };
  }

  @Post()
  async createNote(@Request() req, @Body() body: { title: string; content?: string }) {
    const note = await this.notesService.create({
      title: body.title,
      content: body.content,
      userId: req.user.id,
    });
    return { data: note, message: 'Note created successfully' };
  }

  @Patch(':id')
  async updateNote(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string },
  ) {
    const note = await this.notesService.update(id, body);
    return { data: note, message: 'Note updated' };
  }

  @Delete(':id')
  async deleteNote(@Param('id') id: string) {
    await this.notesService.delete(id);
    return { message: 'Note deleted' };
  }
}