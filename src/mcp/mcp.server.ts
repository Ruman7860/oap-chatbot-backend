import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { Injectable } from "@nestjs/common";
import { NotesService } from "../notes/notes.service";

@Injectable()
export class McpToolServer {
  private server = new McpServer({
    name: "oap-chatbot-mcp",
    version: "1.0.0",
  });

  constructor(private notesService: NotesService) {
    this.registerTools();
  }

  private async callOapApi(endpoint: string, method: string, options: { payload?: any, params?: any } = {}) {
    const apiUrl = process.env.OAP_BACKEND_URL;
    const apiKey = process.env.OAP_API_KEY; // Explicitly use env var

    let url = `${apiUrl}/${endpoint}`;
    if (options.params) {
      const queryString = new URLSearchParams(options.params).toString();
      if (queryString) {
        url += url.includes("?") ? `&${queryString}` : `?${queryString}`;
      }
    }

    const headers: any = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    console.log(`MCP Tool Calling: ${method} ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options.payload ? JSON.stringify(options.payload) : undefined,
        cache: "no-store",
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error calling OAP API ${endpoint}:`, error);
      throw new Error(`Failed to call OAP API: ${error.message}`);
    }
  }

  private registerTools() {
    (this.server as any).tool(
      "get_lookup_data",
      "Get lookup data by name",
      { name: z.string(), queryParams: z.record(z.any()).optional() },
      async ({ name, queryParams }: { name: string, queryParams?: any }) => {
        const result = await this.callOapApi(name, "GET", { params: queryParams });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_oap_detail",
      "Get OAP details",
      { queryParams: z.record(z.any()).optional() },
      async ({ queryParams }: { queryParams?: any }) => {
        const result = await this.callOapApi("oap", "GET", { params: queryParams });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_oap_form",
      "Get OAP forms",
      { queryParams: z.record(z.any()).optional() },
      async ({ queryParams }: { queryParams?: any }) => {
        const result = await this.callOapApi("oap/forms", "GET", { params: queryParams });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_oap_form_sections",
      "Get OAP form sections",
      { queryParams: z.record(z.any()).optional() },
      async ({ queryParams }: { queryParams?: any }) => {
        const result = await this.callOapApi("oap/form/sections", "GET", { params: queryParams });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_student_details_by_id",
      "Get student details by ID",
      { queryParams: z.record(z.any()).optional() },
      async ({ queryParams }: { queryParams?: any }) => {
        const result = await this.callOapApi("oap/getstudentdetailsbyid", "GET", { params: queryParams });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_student_details",
      "Get student details",
      { oapName: z.string(), email: z.string(), applicationId: z.string() },
      async ({ oapName, email, applicationId }: { oapName: string, email: string, applicationId: string }) => {
        const result = await this.callOapApi("oap/getstudentdetails", "GET", {
          params: { oapName, email, applicationId }
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "save_student_details",
      "Save student details",
      { payload: z.any(), queryParams: z.record(z.any()).optional() },
      async ({ payload, queryParams }: { payload: any, queryParams?: any }) => {
        const result = await this.callOapApi("oap/savestudentdetails", "POST", { payload, params: queryParams });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_presigned_url",
      "Get presigned URL for document upload",
      { payload: z.any() },
      async ({ payload }: { payload: any }) => {
        const result = await this.callOapApi("oap/uploadstudentdocument/getsignedurl", "POST", { payload });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_document_name",
      "Get document name",
      { queryParams: z.record(z.any()).optional() },
      async ({ queryParams }: { queryParams?: any }) => {
        const result = await this.callOapApi("oap/getstudentdocument", "GET", { params: queryParams });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "delete_document",
      "Delete document",
      { queryParams: z.record(z.any()).optional() },
      async ({ queryParams }: { queryParams?: any }) => {
        const result = await this.callOapApi("oap/deletestudentdocument", "DELETE", { params: queryParams });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_updated_doc",
      "Get updated document",
      { payload: z.any() },
      async ({ payload }: { payload: any }) => {
        const result = await this.callOapApi("oap/uploadstudentdocument", "POST", { payload });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_all_section_forms",
      "Get all section forms",
      { queryParams: z.record(z.any()).optional() },
      async ({ queryParams }: { queryParams?: any }) => {
        const result = await this.callOapApi("oap/sections", "GET", { params: queryParams });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_opportunity_details",
      "Get opportunity details",
      { opportunityId: z.string(), queryParams: z.record(z.any()).optional() },
      async ({ opportunityId, queryParams }: { opportunityId: string, queryParams?: any }) => {
        const result = await this.callOapApi(`oap/opportunity/${opportunityId}`, "GET", { params: queryParams });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "submit_change_request",
      "Submit change request",
      { payload: z.any(), queryParams: z.record(z.any()).optional() },
      async ({ payload, queryParams }: { payload: any, queryParams?: any }) => {
        const result = await this.callOapApi("oap/submitchangerequest", "POST", { payload, params: queryParams });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_application_access_info",
      "Get application access info",
      { applicationId: z.string() },
      async ({ applicationId }: { applicationId: string }) => {
        const result = await this.callOapApi(`oap/accessinfo/${applicationId}`, "GET");
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "upsert_application_access_info",
      "Upsert application access info",
      { payload: z.any() },
      async ({ payload }: { payload: any }) => {
        const result = await this.callOapApi("oap/accessinfo", "PATCH", { payload });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "upload_student_ocr_document",
      "Upload student OCR document",
      { payload: z.any() },
      async ({ payload }: { payload: any }) => {
        const result = await this.callOapApi("oap/uploadstudentOcrdocument", "POST", { payload });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "post_ocr",
      "Post OCR",
      { payload: z.any() },
      async ({ payload }: { payload: any }) => {
        const ocrApiUrl = process.env.OCR_API_URL || "https://ocr-api-dev.guseip.io/ocr";
        const apiKey = process.env.OAP_API_KEY;

        try {
          const response = await fetch(ocrApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey || "",
            },
            body: JSON.stringify(payload),
            cache: "no-store",
          });
          const data = await response.json();
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
        } catch (e) {
          return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
        }
      }
    );

    // Keep existing notes tool as an example, or remove ? User asked to "integrate all API used in oap-frontend".
    // I will include listNotes for backward compat if they want, but probably better to focus on OAP.
    // I'll leave listNotes as a simple connectivity test tool.
    (this.server as any).tool(
      "listNotes",
      "List all notes (internal DB)",
      {},
      async () => {
        const notes = await this.notesService.findAll();
        // Return MCP format
        return {
          content: [{ type: "text", text: this.formatNotes(notes) }],
        };
      }
    );
  }

  private formatNotes(notes: any[]) {
    if (notes.length === 0) return "You have no notes.";
    return notes.map((n, i) => `${i + 1}. **${n.title}**\n   ${n.content}`).join("\n\n");
  }

  getServer() {
    return this.server;
  }
}