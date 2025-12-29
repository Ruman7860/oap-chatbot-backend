import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Chat, Message } from '@prisma/client';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async createChat(data: { title?: string }): Promise<Chat> {
        return this.prisma.chat.create({
            data: {
                title: data.title || 'New Chat',
            },
        });
    }

    async getChats(): Promise<Chat[]> {
        return this.prisma.chat.findMany({
            orderBy: { updatedAt: 'desc' },
            take: 50, // Limit to recent 50 chats for now
        });
    }

    async getChat(id: string): Promise<Chat & { messages: Message[] }> {
        const chat = await this.prisma.chat.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            },
        });

        if (!chat) {
            throw new NotFoundException(`Chat with ID ${id} not found`);
        }

        return chat;
    }

    async addMessage(chatId: string, role: string, content: string): Promise<Message> {
        // Ensure chat exists
        const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat) {
            throw new NotFoundException(`Chat with ID ${chatId} not found`);
        }

        // Update chat timestamp
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
        });

        return this.prisma.message.create({
            data: {
                content,
                role,
                chatId,
            },
        });
    }

    async updateChatTitle(id: string, title: string): Promise<Chat> {
        return this.prisma.chat.update({
            where: { id },
            data: { title }
        });
    }

    async deleteChat(id: string): Promise<Chat> {
        return this.prisma.chat.delete({
            where: { id },
        });
    }
}
