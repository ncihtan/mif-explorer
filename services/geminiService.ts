import { GoogleGenAI, FunctionDeclaration, Type, Tool, Part } from "@google/genai";
import { filterFiles, getStats, searchLibrary, findPanelsByTargets } from './searchService';
import type { FilterState } from '../types';

// Ensure API key is accessed safely
const API_KEY = process.env.API_KEY || ''; 

// Tool Definitions
const filterFilesTool: FunctionDeclaration = {
  name: 'filter_files',
  description: 'Filter the biological file manifest based on criteria like diagnosis, center, or specific antibodies.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      diagnosis: { type: Type.STRING, description: 'Disease diagnosis (e.g., "Melanoma")' },
      antibody: { type: Type.STRING, description: 'Antibody target name (e.g., "CD8A")' },
      center: { type: Type.STRING, description: 'Research center name' }
    }
  }
};

const searchLibraryTool: FunctionDeclaration = {
  name: 'search_library',
  description: 'Search the biological target library for protein names, descriptions, or categories. Use this to find available markers for cell types (e.g., "NK cell", "Tumor", "Cytokeratin").',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'Search term' }
    },
    required: ['query']
  }
};

const findPanelsTool: FunctionDeclaration = {
  name: 'find_panels',
  description: 'Find panels that contain specific antibody targets. Use this to see which panels are suitable for defining specific cell types or states.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      targets: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: 'List of antibody targets to look for (e.g., ["CD8A", "PD-L1"])'
      }
    },
    required: ['targets']
  }
};

const tools: Tool[] = [{ functionDeclarations: [filterFilesTool, searchLibraryTool, findPanelsTool] }];

export class ChatService {
  private ai: GoogleGenAI;
  private chatSession: any;
  private model = 'gemini-2.5-flash';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
    this.createSession();
  }

  createSession() {
    this.chatSession = this.ai.chats.create({
      model: this.model,
      config: {
        tools: tools,
        systemInstruction: `You are an expert assistant for the mIF Explorer. 
        
        Key Roles:
        1. **Biology Expert**: You possess deep general knowledge of immunology, oncology, and cell biology. You can define cell types, explain marker functions, and describe pathways using your internal knowledge.
        2. **Dataset Expert**: You have access to a specific biological dataset (Files, Panels, Antibodies) via tools.
        
        Workflow for Biological Queries:
        - If a user asks about a cell type or concept (e.g., "Which panels allow me to see NK cells?"):
          - **First**, use your general knowledge to identify standard markers for that cell type (e.g., NK cells -> CD56, CD16, NCR1).
          - **Second**, use 'find_panels' or 'search_library' to check which of those markers exist *in this specific dataset*.
          - **Third**, answer by combining your general knowledge with the specific dataset findings (e.g., "NK cells are typically defined by CD56 and CD16. In this dataset, we have Panel X which contains CD56...").
        
        - If the user asks a purely educational question ("What does FoxP3 do?"), answer directly using your internal knowledge.
        
        - Always prefer data-backed answers when possible.
        - Keep answers concise and scientific.`
      }
    });
  }

  resetSession() {
    this.createSession();
  }

  async sendMessage(message: string): Promise<string> {
    try {
      let result = await this.chatSession.sendMessage({ message });
      
      // Handle Function Calls (Loop for multiple turns)
      let loopCount = 0;
      const MAX_LOOPS = 5;

      while (result.functionCalls && result.functionCalls.length > 0 && loopCount < MAX_LOOPS) {
        loopCount++;
        const parts: Part[] = [];

        for (const call of result.functionCalls) {
          
          if (call.name === 'filter_files') {
            const args = call.args as any;
            console.log(`[AI] Filtering files:`, args);

            const filters: FilterState = {
              searchQuery: '',
              diagnoses: args.diagnosis ? [args.diagnosis] : [],
              centers: args.center ? [args.center] : [],
              antibodies: args.antibody ? [args.antibody] : [],
              assayTypes: [],
              categories: [],
              panelIds: []
            };
            
            const files = filterFiles(filters);
            const stats = getStats(files);
            
            parts.push({
              functionResponse: {
                name: 'filter_files',
                id: call.id,
                response: { result: `Found ${files.length} files. Stats: ${JSON.stringify(stats)}` }
              }
            });

          } else if (call.name === 'search_library') {
            const args = call.args as any;
            console.log(`[AI] Searching library:`, args);
            
            const entries = searchLibrary(args.query);
            parts.push({
              functionResponse: {
                name: 'search_library',
                id: call.id,
                response: { result: JSON.stringify(entries) }
              }
            });

          } else if (call.name === 'find_panels') {
            const args = call.args as any;
            console.log(`[AI] Finding panels:`, args);
            
            const panels = findPanelsByTargets(args.targets || []);
            parts.push({
              functionResponse: {
                name: 'find_panels',
                id: call.id,
                response: { result: JSON.stringify(panels) }
              }
            });
          }
        }

        // Send tool results back to the model
        if (parts.length > 0) {
          result = await this.chatSession.sendMessage({ message: parts });
        } else {
          break; // No valid tool calls processed
        }
      }

      return result.text || "I processed that request but had nothing to say.";
    } catch (e) {
      console.error("Gemini Error:", e);
      return "Sorry, I encountered an error communicating with the AI service.";
    }
  }
}

export const chatService = new ChatService();