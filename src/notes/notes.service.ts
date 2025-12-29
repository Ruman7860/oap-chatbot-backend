import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Note } from '@prisma/client';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string): Promise<Note[]> {
    return this.prisma.note.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Note | null> {
    return this.prisma.note.findUnique({ where: { id } });
  }

  async create(data: { title: string; content?: string; userId: string }): Promise<Note> {
    return this.prisma.note.create({
      data: {
        title: data.title,
        content: data.content || '',
        userId: data.userId,
      },
    });
  }

  async update(id: string, data: { title?: string; content?: string }): Promise<Note> {
    return this.prisma.note.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Note> {
    return this.prisma.note.delete({ where: { id } });
  }

  // Helper for MCP tools
  formatNotes(notes: Note[]): string {
    if (notes.length === 0) return 'You have no notes yet.';

    return notes
      .map((note, i) => {
        const title = note.title || 'Untitled';
        const content = note.content || '(no content)';
        const created = note.createdAt.toLocaleDateString();
        return `${i + 1}. **${title}**\n   ${content}\n   Created: ${created}`;
      })
      .join('\n\n');
  }
}