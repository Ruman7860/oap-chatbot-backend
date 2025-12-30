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

    console.log(`MCP Tool Calling: ${method} ${url} ${apiKey} ${JSON.stringify(options.payload)}`);

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
      "get_oap_details",
      "Get OAP configuration details",
      {
        name: z.string().describe("Name of the OAP"),
        mode: z.string().describe("Mode (e.g., 'STUDENT', 'AGENT')"),
        language: z.string().describe("Language code (e.g., 'en')")
      },
      async ({ name, mode, language }: { name: string, mode: string, language: string }) => {
        const result = await this.callOapApi("oap", "GET", { params: { name: name.toUpperCase(), mode: mode.toUpperCase(), language } });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_oap_form_details",
      "Get specific form details for an OAP",
      {
        oap: z.string().describe("OAP Name"),
        mode: z.string().describe("Mode"),
        form: z.string().describe("Form Name"),
        language: z.string().describe("Language code")
      },
      async ({ oap, mode, form, language }: { oap: string, mode: string, form: string, language: string }) => {
        const result = await this.callOapApi("oap/forms", "GET", { params: { oap, mode, form, language } });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_oap_section_details",
      "Get specific section details for a form",
      {
        oap: z.string().describe("OAP Name"),
        mode: z.string().describe("Mode"),
        formName: z.string().describe("Form Name"),
        sectionName: z.string().describe("Section Name"),
        language: z.string().describe("Language code")
      },
      async ({ oap, mode, formName, sectionName, language }: { oap: string, mode: string, formName: string, sectionName: string, language: string }) => {
        const result = await this.callOapApi("oap/form/sections", "GET", { params: { oap, mode, formName, sectionName, language } });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_section_config",
      "Get list of sections for a form",
      {
        oapName: z.string().describe("OAP Name"),
        formName: z.string().describe("Form Name"),
        mode: z.string().describe("Mode"),
        language: z.string().describe("Language code")
      },
      async ({ oapName, formName, mode, language }: { oapName: string, formName: string, mode: string, language: string }) => {
        const result = await this.callOapApi("oap/sections", "GET", { params: { oapName, formName, mode, language } });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_student_details",
      "Get student details",
      {
        oapName: z.string().describe("OAP Name"),
        email: z.string().describe("Student Email"),
        applicationId: z.string().describe("Application ID")
      },
      async ({ oapName, email, applicationId }: { oapName: string, email: string, applicationId: string }) => {
        const result = await this.callOapApi("oap/getstudentdetails", "GET", {
          params: { oapName, email, applicationId }
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "save_student_details",
      "Save student details and automatically fetch next form config",
      {
        oapName: z.string().describe("OAP Name"),
        mode: z.string().describe("Mode currently used"),
        oapDetail: z.any().describe("OAP Detail Object")
      },
      async ({ oapName, mode, oapDetail }: { oapName: string, mode: string, oapDetail: any }) => {
        // 1. Save Student Details
        const saveResult = await this.callOapApi("oap/savestudentdetails", "POST", {
          payload: oapDetail,
          params: { oapName, mode }
        });

        // 2. Chained Fetch: Get Next Form Configuration (APPLICATION form)
        // This eliminates the need for the frontend/AI to guess and make another call
        const nextFormConfig = await this.callOapApi("oap/forms", "GET", {
          params: {
            oap: oapName.toUpperCase(),
            form: "APPLICATION",
            mode: mode.toUpperCase(),
            language: "en" // Defaulting to en for now, or could pass from args if added
          }
        });

        // Return composite result
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              saveResult,
              nextFormConfig
            }, null, 2)
          }]
        };
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

    (this.server as any).tool(
      "start_new_application",
      "Start a new application and get the first section configuration",
      {
        oap: z.string().describe("OAP Name (e.g., UCW)"),
        mode: z.string().optional().describe("Mode (default: AGENT)")
      },
      async ({ oap, mode }: { oap: string, mode?: string }) => {
        const defaultMode = mode || "AGENT";
        // Hardcoded start flow: BASIC_INFO / STUDENT_INFO
        const result = await this.callOapApi("oap/form/sections", "GET", {
          params: {
            oap: oap.toUpperCase(),
            mode: defaultMode.toUpperCase(),
            formName: "BASIC_INFO",
            sectionName: "STUDENT_INFO",
            language: "en"
          }
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    (this.server as any).tool(
      "get_application_form_config",
      "Get Application Form Configuration (returns list of sections)",
      {
        oap: z.string().describe("OAP Name"),
        mode: z.string().optional().describe("Mode (default: AGENT)"),
        language: z.string().optional().describe("Language (default: en)")
      },
      async ({ oap, mode, language = "en" }: { oap: string, mode?: string, language?: string }) => {
        const defaultMode = mode || "AGENT";

        // 1. Get Form Details (list of sections)
        // This returns the "Map" of the application (ordered sections)
        const formDetails = await this.callOapApi("oap/forms", "GET", {
          params: { oap: oap.toUpperCase(), form: "APPLICATION", mode: defaultMode.toUpperCase(), language }
        });

        // Return ONLY the form details. The frontend/AI must iterate through formDetails.section[]
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ formDetails }, null, 2)
          }]
        };
      }
    );

    (this.server as any).tool(
      "save_application_progress",
      "Save application progress (Fetch -> Merge -> Save)",
      {
        oapName: z.string(),
        email: z.string(),
        applicationId: z.string(),
        sectionData: z.any().describe("Data to merge and save")
      },
      async ({ oapName, email, applicationId, sectionData }: { oapName: string, email: string, applicationId: string, sectionData: any }) => {
        // 1. Fetch current student details
        const currentDetails = await this.callOapApi("oap/getstudentdetails", "GET", {
          params: { oapName, email, applicationId }
        });

        // 2. Merge new section data
        const mergedDetails = { ...currentDetails, ...sectionData };

        // 3. Save updated details
        // Note: The save endpoint usually needs `mode`. We might need to infer it or ask for it.
        // Based on user request "call ... /oap/getstudentdetails ... and then u need to save".
        // We'll assume 'AGENT' if not present in currentDetails, or extract from it if possible. 
        // However, the save ENDPOINT requires `mode` as a query param.
        // Let's try to find mode in currentDetails or default to AGENT.

        const modeToUse = (currentDetails.mode || "AGENT").toUpperCase(); // Defensive coding

        const saveResult = await this.callOapApi("oap/savestudentdetails", "POST", {
          payload: mergedDetails,
          params: { oapName, mode: modeToUse }
        });

        return { content: [{ type: "text", text: JSON.stringify(saveResult, null, 2) }] };
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