declare module "@mlc-ai/web-llm" {
  export interface InitProgressReport {
    progress?: number;
    text?: string;
  }

  export interface MLCEngineInterface {
    chat: {
      completions: {
        create(opts: {
          messages: { role: "system" | "user" | "assistant"; content: string }[];
          temperature?: number;
          max_tokens?: number;
          top_p?: number;
        }): Promise<any>;
      };
    };
  }

  export function CreateMLCEngine(
    modelId: string,
    opts: { initProgressCallback?: (p: InitProgressReport) => void }
  ): Promise<MLCEngineInterface>;

  export const prebuiltAppConfig: {
    model_list: { model_id?: string; model?: string }[];
  };
}
