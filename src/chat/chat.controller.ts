import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chats')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post()
    createChat(@Body() body: { title?: string }) {
        return this.chatService.createChat(body);
    }

    @Get()
    getChats() {
        return this.chatService.getChats();
    }

    @Get(':id')
    getChat(@Param('id') id: string) {
        return this.chatService.getChat(id);
    }

    @Post(':id/messages')
    addMessage(
        @Param('id') id: string,
        @Body() body: { role: string; content: string },
    ) {
        return this.chatService.addMessage(id, body.role, body.content);
    }

    @Patch(':id')
    updateChat(@Param('id') id: string, @Body() body: { title: string }) {
        return this.chatService.updateChatTitle(id, body.title);
    }

    @Delete(':id')
    deleteChat(@Param('id') id: string) {
        return this.chatService.deleteChat(id);
    }
}
