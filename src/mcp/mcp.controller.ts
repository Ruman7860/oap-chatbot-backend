// src/mcp/sse.controller.ts
import { Controller, Get, Req, Res, Post, Query } from "@nestjs/common";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { McpToolServer } from "./mcp.server";
import { Request, Response } from "express";

const transports = new Map<string, any>();

@Controller()
export class SseController {
  constructor(private mcpServer: McpToolServer) { }

  @Get("sse")
  async sse(@Req() req: Request, @Res() res: Response) {
    console.log("SSE Connection requested");
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    console.log("SSE Connection established");

    res.on("close", () => {
      transports.delete(transport.sessionId);
    });

    await this.mcpServer.getServer().connect(transport);
  }

  @Post("messages")
  async messages(@Query("sessionId") sessionId: string, @Req() req: Request, @Res() res: Response) {
    const transport = transports.get(sessionId);
    if (!transport) return res.status(400).send("Invalid session");
    await transport.handlePostMessage(req, res, req.body);
  }
}