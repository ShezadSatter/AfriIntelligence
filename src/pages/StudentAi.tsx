import React, { useEffect, useState, useRef, useCallback } from "react";

type MLCEngineInterface = any; // fallback type
type InitProgressReport = any; // fallback type

const StudentAI: React.FC = () => {
  const [status, setStatus] = useState<string>("Loading available models...");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [engine, setEngine] = useState<MLCEngineInterface | null>(null);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [showSessions, setShowSessions] = useState<boolean>(false);
  const [studyMode, setStudyMode] = useState<StudyMode>("general");
  const [fontSize, setFontSize] = useState<number>(16);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [autoScroll] = useState<boolean>(true);
  const [showPromptSuggestions, setShowPromptSuggestions] =
    useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  type StudyMode =
    | "general"
    | "math"
    | "science"
    | "english"
    | "history"
    | "coding"
    | "essay"
    | "exam";

  const studyModes: Record<StudyMode, string> = {
    general: "General Help",
    math: "Mathematics",
    science: "Science",
    english: "English/Literature",
    history: "History",
    coding: "Programming",
    essay: "Essay Writing",
    exam: "Exam Prep",
  };

  interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    isTruncated?: boolean;
    finishReason?: string;
    subject?: string;
  }

  interface StudySession {
    id: string;
    name: string;
    messages: Message[];
    timestamp: Date;
    subject: StudyMode;
  }

  const promptSuggestions: { general: string[] } & Partial<
    Record<StudyMode, string[]>
  > = {
    general: [
      "Explain this concept in simple terms",
      "Help me understand this homework problem",
      "What's the main idea here?",
      "Can you break this down step by step?",
    ],
    math: [
      "Solve this equation step by step",
      "Explain this math concept with examples",
      "Help me with word problems",
      "Show me different ways to approach this",
    ],
    science: [
      "Explain this scientific process",
      "Help me understand this experiment",
      "What's the relationship between these concepts?",
      "Give me real-world examples",
    ],
    english: [
      "Help me analyze this text",
      "Improve my essay structure",
      "Explain this literary device",
      "Help with grammar and style",
    ],
    essay: [
      "Help me brainstorm ideas",
      "Create an outline for my essay",
      "Improve my thesis statement",
      "Help with conclusion paragraph",
    ],
  };

  const scrollToBottom = useCallback(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [autoScroll]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [inputMessage]);

  const getSystemPrompt = (mode: string) => {
    const prompts: Record<string, string> = {
      general:
        "You are a helpful AI tutor for students. Provide clear, educational explanations.",
      math: "You are a math tutor. Break down problems step-by-step, show your work, and explain mathematical concepts clearly.",
      science:
        "You are a science tutor. Explain scientific concepts with examples, use analogies, and connect theory to real-world applications.",
      english:
        "You are an English/Literature tutor. Help with reading comprehension, writing skills, grammar, and literary analysis.",
      history:
        "You are a history tutor. Provide context, explain cause-and-effect relationships, and help students understand historical significance.",
      coding:
        "You are a programming tutor. Explain code concepts clearly, provide examples, and help debug problems step by step.",
      essay:
        "You are a writing tutor specializing in essays. Help with structure, argumentation, evidence, and clear expression of ideas.",
      exam: "You are an exam prep tutor. Create practice questions, explain test-taking strategies, and help review key concepts.",
    };
    return prompts[mode] || prompts.general;
  };

  // Load available models on component mount
  useEffect(() => {
    const loadAvailableModels = async () => {
      try {
        console.log("Loading available models...");
        setStatus("Checking available models...");

        const { prebuiltAppConfig } = await import("@mlc-ai/web-llm");
        const modelList = prebuiltAppConfig.model_list;
        const modelIds = modelList.map(
          (model: any) => model.model_id || model.model
        );

        // Prioritize smaller, faster models for better student experience
        const preferredPatterns = [
         
          /tiny.*llama.*1b/i,
          /qwen.*0\.5b/i,
          /qwen.*1\.8b/i,
          /llama.*3\.2.*1b/i,
           /phi.*3.*mini/i,
          /gemma.*2b/i,
        ];

        // Filter and sort models based on preferences
        const preferredModels: string[] = [];
        const otherModels: string[] = [];

        modelIds.forEach((modelId: string) => {
          const isPreferred = preferredPatterns.some((pattern) =>
            pattern.test(modelId)
          );
          if (isPreferred) {
            preferredModels.push(modelId);
          } else {
            otherModels.push(modelId);
          }
        });

        // Sort preferred models by the order of patterns
        preferredModels.sort((a, b) => {
          const aIndex = preferredPatterns.findIndex((pattern) =>
            pattern.test(a)
          );
          const bIndex = preferredPatterns.findIndex((pattern) =>
            pattern.test(b)
          );
          return aIndex - bIndex;
        });

        const sortedModels = [...preferredModels, ...otherModels];
        setAvailableModels(sortedModels);

        if (sortedModels.length > 0) {
          setSelectedModel(sortedModels[0] ?? "");
          setStatus(`Select a model to begin. Recommended: ${sortedModels[0]}`);
        } else {
          setStatus("No models available in WebLLM configuration");
        }
      } catch (err) {
        console.error("Failed to load models:", err);
        setStatus(
          `Error loading models: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    };

    loadAvailableModels();
  }, []);

  const loadSelectedModel = async (modelId: string) => {
    if (!modelId || isLoadingModel) return;

    try {
      setIsLoadingModel(true);
      setIsModelReady(false);
      setEngine(null);
      setMessages([]);
      setProgressPercent(0);

      console.log(`Loading model: ${modelId}`);
      setStatus(`Initializing ${modelId}...`);

      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");

      const engine = await CreateMLCEngine(modelId, {
        initProgressCallback: (progress: InitProgressReport) => {
          if (progress.progress !== undefined) {
            const percent = progress.progress * 100;
            setProgressPercent(percent);
            setStatus(`Loading ${modelId}... ${percent.toFixed(1)}%`);
          } else if (progress.text) {
            setStatus(`${modelId}: ${progress.text}`);
          }
        },
      });

      setEngine(engine);
      setIsModelReady(true);
      setProgressPercent(100);

      // Create initial session
      const initialSession = createNewSession("Welcome Session", "general");

      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Hello! I'm your Afri Intelligence AI study assistant!

🎓 **Study Modes Available:**
• General Help - For any subject
• Mathematics - Step-by-step problem solving  
• Science - Concepts with examples
• English/Literature - Writing and analysis
• History - Context and connections
• Programming - Code explanations
• Essay Writing - Structure and improvement
• Exam Prep - Practice questions and strategies

📚 **Features:**
• Multiple study sessions - Keep different topics organized
• Smart suggestions - Click the lightbulb for topic-specific prompts
• Customizable interface - Adjust font size and theme
• Continue responses - Get more detailed explanations when needed

💡 **Tip:** Try saying "Explain [topic] like I'm 12" for simpler explanations!

What would you like to study today?`,
        timestamp: new Date(),
      };

      initialSession.messages = [welcomeMessage];
      setStudySessions([initialSession]);
      setMessages([welcomeMessage]);
      setCurrentSessionId(initialSession.id);
      setStatus(`✅ Ready with ${modelId}`);
    } catch (err) {
      console.error("Model loading failed:", err);
      setStatus(
        `Error loading ${modelId}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setIsModelReady(false);
    } finally {
      setIsLoadingModel(false);
    }
  };

  const createNewSession = (
    name?: string,
    subject?: StudyMode
  ): StudySession => {
    const timestamp = new Date();
    const sessionName =
      name || `Study Session ${timestamp.toLocaleTimeString()}`;
    const sessionSubject: StudyMode = subject || studyMode;

    return {
      id: timestamp.getTime().toString(),
      name: sessionName,
      messages: [],
      timestamp,
      subject: sessionSubject,
    };
  };

  const startNewSession = () => {
    const newSession = createNewSession();
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `New ${studyModes[studyMode]} session started! What would you like to work on?`,
      timestamp: new Date(),
    };

    newSession.messages = [welcomeMessage];
    setStudySessions((prev) => [newSession, ...prev]);
    setMessages([welcomeMessage]);
    setCurrentSessionId(newSession.id);
    setShowSessions(false);
  };

  const loadSession = (sessionId: string) => {
    const session = studySessions.find((s) => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
      setStudyMode(session.subject as StudyMode);
      setShowSessions(false);
    }
  };

  const saveCurrentSession = () => {
    if (currentSessionId) {
      setStudySessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId ? { ...session, messages } : session
        )
      );
    }
  };

  useEffect(() => {
    saveCurrentSession();
  }, [messages, currentSessionId]);

  const deleteSession = (sessionId: string) => {
    setStudySessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = studySessions.filter((s) => s.id !== sessionId);
      const next = remaining[0];
      if (next) {
        loadSession(next.id);
      } else {
        startNewSession();
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !engine || isGenerating) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
      subject: studyMode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsGenerating(true);

    try {
      // Determine appropriate response length
      const isLongRequest =
        userMessage.content.toLowerCase().includes("essay") ||
        userMessage.content.toLowerCase().includes("explain in detail") ||
        userMessage.content.toLowerCase().includes("write about") ||
        userMessage.content.length > 100;

      const tokenLimit = isLongRequest ? 1500 : 600;

      const systemMessage = {
        role: "system" as const,
        content: getSystemPrompt(studyMode),
      };

      const conversationHistory = messages.slice(-12).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await engine.chat.completions.create({
        messages: [
          systemMessage,
          ...conversationHistory,
          { role: "user", content: userMessage.content },
        ],
        temperature: 0.7,
        max_tokens: tokenLimit,
        top_p: 0.9,
      });

      const fullResponse = response.choices[0]?.message?.content || "";
      const cleanText = fullResponse.normalize("NFC"); // ensure proper Unicode

      const finishReason = response.choices[0]?.finish_reason || "";
      const isTruncated = finishReason === "length";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: cleanText,
        timestamp: new Date(),
        isTruncated,
        finishReason,
        subject: studyMode,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I encountered an error while generating the response. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const continueGeneration = async (messageId: string) => {
    if (!engine || isGenerating) return;
    setIsGenerating(true);

    try {
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      const conversationHistory = messages
        .slice(0, messageIndex + 1)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const systemMessage = {
        role: "system" as const,
        content: getSystemPrompt(studyMode),
      };
      const continuePrompt =
        "Please continue your previous response with more details and examples.";

      const response = await engine.chat.completions.create({
        messages: [
          systemMessage,
          ...conversationHistory,
          { role: "user", content: continuePrompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
        top_p: 0.9,
      });

      const continuation = response.choices[0]?.message?.content || "";
      const finishReason = response.choices[0]?.finish_reason || "";
      const stillTruncated = finishReason === "length";

      setMessages((prev) => {
        const updated = [...prev];
       const targetIndex = updated.findIndex((m) => m.id === messageId);
if (targetIndex !== -1) {
  const target = updated[targetIndex];
  if (target) {
    updated[targetIndex] = {
      id: target.id,
      role: target.role,
      timestamp: target.timestamp,
      content: target.content + "\n\n" + continuation,
      isTruncated: stillTruncated,
      finishReason,
      ...(target.subject ? { subject: target.subject } : {}),
    };
  }
}

        return updated;
      });
    } catch (err) {
      console.error("Error continuing generation:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const insertSuggestion = (suggestion: string) => {
    setInputMessage(suggestion);
    textareaRef.current?.focus();
  };

  const themeStyles = {
    backgroundColor: darkMode ? "#1e293b" : "#133A1F",
    color: darkMode ? "#f1f5f9" : "black",
    chatBg: darkMode ? "#0f172a" : "#236738",
    userBg: darkMode ? "#2563eb" : "#3b82f6",
    assistantBg: darkMode ? "#374151" : "#f1f5f9",
    border: darkMode ? "#374151" : "#e2e8f0",
    inputBg: darkMode ? "#374151" : "#f9fafb",
    
  };

  return (
    <div
      style={{
        width: "100vw",
        fontFamily: "system-ui, -apple-system, sans-serif",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        backgroundColor: themeStyles.backgroundColor,
        color: themeStyles.color,
        fontSize: `${fontSize}px`,
        transition: "all 0.3s ease",
      }}
    >
      {/* Enhanced Header */}
      <div
        style={{
          borderBottom: `2px solid ${themeStyles.border}`,
          margin: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                margin: "1rem",
                fontSize: "4em",
                fontWeight: "700",
                color: "white",
              }}
            >
              📚 Afri AI
            </h1>
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              onClick={() => setShowSessions(!showSessions)}
              style={{
                padding: "0.5rem 1rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: showSessions ? "#10b981" : themeStyles.border,
                color: showSessions ? "white" : themeStyles.color,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
                width: "max-content",
                overflow: "hidden",

              }}
            >
              📁 Sessions ({studySessions.length})
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                padding: "0.5rem",
                backgroundColor: themeStyles.border,
                color: themeStyles.color,
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                width: 'fit-content',
              }}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{
                padding: "0.5rem",
                backgroundColor: themeStyles.inputBg,
                color: themeStyles.color,
                border: `1px solid ${themeStyles.border}`,
                width: "fit-content",
                borderRadius: "6px",
                fontSize: "0.9rem",
              }}
            >
              <option value={14}>font: Small</option>
              <option value={16}>font: Medium</option>
              <option value={18}>font: Large</option>
              <option value={20}>font: XL</option>
            </select>
          </div>
        </div>

        {/* Model Selection Area */}
        {availableModels.length > 0 && (
          <div
            style={{
              display: "flex",
              margin: "1rem",
              gap: "1rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <label
                style={{
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  color: "white",
                }}
              >
                🤖 Select Model:
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoadingModel}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: themeStyles.inputBg,
                  color: themeStyles.color,
                  border: `1px solid ${themeStyles.border}`,
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  minWidth: "200px",
                }}
              >
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => loadSelectedModel(selectedModel)}
              disabled={!selectedModel || isLoadingModel || isModelReady}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: isModelReady
                  ? "#10b981"
                  : isLoadingModel
                  ? "#9ca3af"
                  : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor:
                  !selectedModel || isLoadingModel || isModelReady
                    ? "not-allowed"
                    : "pointer",
                fontSize: "0.9rem",
                fontWeight: "500",
              }}
            >
              {isLoadingModel
                ? "Loading..."
                : isModelReady
                ? "✅ Loaded"
                : "🚀 Load Model"}
            </button>

            {isModelReady && (
              <button
                onClick={() => {
                  setIsModelReady(false);
                  setEngine(null);
                  setMessages([]);
                  setStudySessions([]);
                  setProgressPercent(0);
                  setStatus("Select a model to begin");
                }}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                🔄 Switch Model
              </button>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {progressPercent > 0 && progressPercent < 100 && (
          <div
            style={{ marginBottom: "1rem", maxWidth: "500px", margin: "1rem" }}
          >
            <div
              style={{
                width: "100%",
                backgroundColor: themeStyles.border,
                borderRadius: "10px",
                overflow: "hidden",
                height: "20px",
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: "#10b981",
                  height: "100%",
                  borderRadius: "10px",
                  transition: "width 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  color: "white",
                }}
              >
                {progressPercent.toFixed(1)}%
              </div>
            </div>
            <div
              style={{
                fontSize: "0.9rem",
                marginTop: "0.5rem",
                color: "white",
              }}
            >
              {status}
            </div>
          </div>
        )}

        {/* Status Display */}
        {!isModelReady && progressPercent === 0 && (
          <div
            style={{
              padding: "1rem",
              margin: "1rem",
              backgroundColor: "#fef3c7",
              color: "#92400e",
              borderRadius: "8px",
              fontSize: "0.9rem",
            }}
          >
            {status}
          </div>
        )}

        {isModelReady && (
          <div
            style={{
              display: "flex",
              margin: "1rem",
              gap: "2rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              value={studyMode}
              onChange={(e) => setStudyMode(e.target.value as StudyMode)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: themeStyles.inputBg,
                color: themeStyles.color,
                border: `1px solid ${themeStyles.border}`,
                borderRadius: "6px",
                fontSize: "0.9rem",
              }}
            >
              {Object.entries(studyModes).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <button
  onClick={() => setShowPromptSuggestions(!showPromptSuggestions)}
  style={{
    padding: "0.5rem",
    backgroundColor: "#fbbf24",
    color: "#92400e",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  }}
>
  💡 Suggestions
</button>


          </div>
        )}
      </div>

      {/* Sessions Panel */}
      {showSessions && (
        <div
          style={{
            backgroundColor: themeStyles.chatBg,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: "8px",
            padding: "0.5rem",
            margin: "1rem",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ margin: "0", fontSize: "1.2rem" }}>Study Sessions</h3>
            <button
              onClick={startNewSession}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              + New Session
            </button>
          </div>

          <div style={{ display: "grid", gap: "0.5rem" }}>
            {studySessions.map((session) => (
              <div
                key={session.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem",
                  backgroundColor:
                    currentSessionId === session.id
                      ? "#3b82f6"
                      : themeStyles.assistantBg,
                  color:
                    currentSessionId === session.id
                      ? "white"
                      : themeStyles.color,
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: `1px solid ${themeStyles.border}`,
                }}
                onClick={() => loadSession(session.id)}
              >
                <div>
                  <div style={{ fontWeight: "500", fontSize: "0.95rem" }}>
                    {session.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                    {studyModes[session.subject] || session.subject} •{" "}
                    {session.messages.length} messages •{" "}
                    {session.timestamp.toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  style={{
                    padding: "0.25rem",
                    backgroundColor: "transparent",
                    color: "inherit",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Suggestions */}
      {showPromptSuggestions &&
        isModelReady &&
        promptSuggestions[studyMode] && (
          <div
            style={{
              backgroundColor: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "8px",
              padding: "1rem",
              marginLeft: "2rem",
              marginRight: "2rem",
              marginBottom: "1rem",
              marginTop: "0",
            }}
          >
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
                color: "#92400e",
              }}
            >
              💡 Try these {studyModes[studyMode]} prompts:
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {promptSuggestions[studyMode].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => insertSuggestion(suggestion)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "white",
                    color: "#92400e",
                    border: "1px solid #f59e0b",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    transition: "all 0.2s",
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
 
      {isModelReady && (
        <>
          {/* Enhanced Chat Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              border: `1px solid ${themeStyles.border}`,
              borderRadius: "12px",
              padding: "1.5rem",
              margin: "0 2rem",
              backgroundColor: themeStyles.chatBg,
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
            }}
          >
            {messages.map((message, index) => (
              <div key={message.id}>
                <div
                  style={{
                    marginBottom: "1.5rem",
                    padding: "1.25rem",
                    borderRadius: "12px",
                    backgroundColor:
                      message.role === "user"
                        ? themeStyles.userBg
                        : themeStyles.assistantBg,
                    color:
                      message.role === "user" ? "white" : themeStyles.color,
                    marginLeft: message.role === "user" ? "30%" : "0",
                    marginRight: message.role === "assistant" ? "30%" : "0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    border: `1px solid ${themeStyles.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.85rem",
                      opacity: 0.9,
                      marginBottom: "0.75rem",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {message.role === "user" ? "👨‍🎓 You" : "🤖 AI Tutor"}
                    <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {message.subject && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: "#10b981",
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {studyModes[message.subject as StudyMode]}
                      </span>
                    )}

                    {message.isTruncated && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: "#fbbf24",
                          color: "#92400e",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        Truncated ({message.finishReason})
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.7",
                    }}
                  >
                    {message.content}
                  </div>
                </div>

                {/* Continue Button */}
                {message.role === "assistant" &&
                  message.isTruncated &&
                  !isGenerating &&
                  index === messages.length - 1 && (
                    <div
                      style={{
                        marginBottom: "1.5rem",
                        marginRight: "10%",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => continueGeneration(message.id)}
                        style={{
                          padding: "0.75rem 1.5rem",
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          fontWeight: "500",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          transition: "all 0.2s",
                        }}
                      >
                        ➕ Continue Response
                      </button>
                    </div>
                  )}
              </div>
            ))}

            {isGenerating && (
              <div
                style={{
                  padding: "1.25rem",
                  marginRight: "10%",
                  backgroundColor: "#fef3c7",
                  border: "2px dashed #f59e0b",
                  borderRadius: "12px",
                  color: "#92400e",
                  textAlign: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ fontWeight: "500", marginBottom: "0.5rem" }}>
                  🧠 Thinking and generating response...
                </div>
                <button
                  onClick={() => {
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort();
                      setIsGenerating(false);
                    }
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  ⏹️ Stop
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div
            style={{
              display: "flex",
              gap: "3rem",
              alignItems: "center",
              padding: "1rem",
              backgroundColor: themeStyles.chatBg,
              borderRadius: "12px",
              border: `1px solid ${themeStyles.border}`,
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
              margin: "1rem 2rem 1rem 2rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask me about ${studyModes[
                  studyMode
                ].toLowerCase()}... Try requesting detailed explanations, examples, or step-by-step solutions!`}
                disabled={isGenerating}
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: `2px solid ${themeStyles.border}`,
                  borderRadius: "10px",
                  fontSize: "1rem",
                  resize: "none",
                  minHeight: "60%",
                  maxHeight: "80%",
                  fontFamily: "inherit",
                  backgroundColor: themeStyles.inputBg,
                  color: themeStyles.color,
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
                rows={1}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isGenerating}
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor:
                    inputMessage.trim() && !isGenerating
                      ? "#10b981"
                      : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor:
                    inputMessage.trim() && !isGenerating
                      ? "pointer"
                      : "not-allowed",
                  fontSize: "1rem",
                  fontWeight: "600",
                  width: "fit-content",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  justifyContent: "center",
                }}
              >
                {isGenerating ? (
                  <>
                    <span>🤔</span>
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Send</span>
                  </>
                )}
              </button>

              <button
               onClick={() => {
  const currentSession = studySessions.find(
    (s) => s.id === currentSessionId
  );

  if (currentSession && currentSession.messages.length > 0) {
    const firstMessage = currentSession.messages[0];
    if (firstMessage) {
      setMessages([
        {
          id: firstMessage.id,
          role: firstMessage.role,
          content: firstMessage.content,
          timestamp: firstMessage.timestamp,
          subject: firstMessage.subject ?? studyMode,
          isTruncated: firstMessage.isTruncated ?? false,
          // omit finishReason if undefined
        },
      ]);
    } else {
      startNewSession(); // fallback if messages array is empty
    }
  } else {
    setMessages([
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `Chat cleared! I'm ready to help you with ${studyModes[studyMode].toLowerCase()}. What would you like to work on?`,
        timestamp: new Date(),
        subject: studyMode,
        isTruncated: false,
      },
    ]);
  }
}}



                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  justifyContent: "center",
                }}
              >
                <span>🧹</span>
                <span>Clear</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAI;
