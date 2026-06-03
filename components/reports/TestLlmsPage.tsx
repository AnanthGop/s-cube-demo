import React, { useState } from "react";

interface TestLlmsPageProps {
  themeColor?: string;
}

type Provider = "openai" | "ollama";

interface LlmReadResult {
  title?: string | null;
  language?: string | null;
  documentType?: string | null;
  summary?: string | null;
  context?: string | null;
  dateMentions?: string[];
  keyEntities?: string[];
  keyPoints?: string[];
  __provider?: string;
  __model?: string;
  __fileName?: string;
  __extractionMethod?: string;
  __textPreview?: string;
  __textLength?: number;
  __feedbackRulesApplied?: string[];
}

export const TestLlmsPage: React.FC<TestLlmsPageProps> = ({
  themeColor = "brand-600",
}) => {
  const [provider, setProvider] = useState<Provider>("openai");
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<LlmReadResult | null>(null);
  const [feedbackIssueType, setFeedbackIssueType] = useState("missed_content");
  const [feedbackSectionName, setFeedbackSectionName] = useState("");
  const [feedbackExpectedText, setFeedbackExpectedText] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackInstruction, setFeedbackInstruction] = useState("");
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleAnalyze = async () => {
    if (!currentFile || isLoading) return;
    setIsLoading(true);
    setError("");
    setResult(null);
    const controller = new AbortController();
    const timeoutMs = provider === "ollama" ? 105000 : 90000;
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const body = new FormData();
      body.append("file", currentFile);

      const url =
        provider === "ollama" ?
          "http://localhost:3002/api/test-llms/ollama"
        : "/api/test-llms/openai";

      const response = await fetch(url, {
        method: "POST",
        body,
        signal: controller.signal,
      });

      const raw = await response.text();
      let payload: any = {};
      try {
        payload = raw ? JSON.parse(raw) : {};
      } catch (_err) {
        payload = {};
      }

      if (!response.ok) {
        throw new Error(
          payload?.details || payload?.error || raw || "Failed to analyze file",
        );
      }

      setResult(payload as LlmReadResult);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          `Timed out after ${Math.round(timeoutMs / 1000)}s while waiting for ${provider.toUpperCase()} response.`,
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to analyze file");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`bg-${themeColor} px-8 py-6 text-white`}>
          <h1 className="text-2xl font-black tracking-tight uppercase">Test LLMs</h1>
          <p className="text-white/80 text-xs font-medium mt-1">
            Upload PDF, Word, or Excel files and compare context extraction via OpenAI and Ollama.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value === "ollama" ? "ollama" : "openai")}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 font-semibold text-sm">
                <option value="openai">OpenAI API</option>
                <option value="ollama">Ollama (local)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                File
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.xls,.txt,.csv,.json,.md"
                onChange={(e) => setCurrentFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-brand-500 font-semibold text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!currentFile || isLoading}
              className={`px-6 py-2.5 bg-${themeColor} text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}>
              {isLoading ? "Reading..." : "Read File & Build Context"}
            </button>
            {currentFile && (
              <span className="text-xs text-slate-600 font-semibold">{currentFile.name}</span>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold whitespace-pre-wrap">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MetaCard label="Provider" value={result.__provider || "-"} />
                <MetaCard label="Model" value={result.__model || "-"} />
                <MetaCard label="Extraction Method" value={result.__extractionMethod || "-"} />
              </div>

              <Section title="Document Overview">
                <p><strong>Title:</strong> {result.title || "-"}</p>
                <p><strong>Type:</strong> {result.documentType || "-"}</p>
                <p><strong>Language:</strong> {result.language || "-"}</p>
              </Section>

              <Section title="Summary">
                <p>{result.summary || "-"}</p>
              </Section>

              <Section title="Context">
                <p>{result.context || "-"}</p>
              </Section>

              <Section title="Date Mentions">
                <TagList items={result.dateMentions || []} />
              </Section>

              <Section title="Key Entities">
                <TagList items={result.keyEntities || []} />
              </Section>

              <Section title="Key Points">
                <TagList items={result.keyPoints || []} />
              </Section>

              <Section title="Extracted Text Preview">
                <pre className="whitespace-pre-wrap text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-72 overflow-auto">
                  {result.__textPreview || "-"}
                </pre>
              </Section>

              {provider === "ollama" && (
                <Section title="Feedback To Improve Next Runs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Issue Type
                      </label>
                      <select
                        value={feedbackIssueType}
                        onChange={(e) => setFeedbackIssueType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold">
                        <option value="missed_content">Missed content</option>
                        <option value="wrong_value">Wrong value</option>
                        <option value="hallucination">Hallucination</option>
                        <option value="format_issue">Format issue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Section Name
                      </label>
                      <input
                        value={feedbackSectionName}
                        onChange={(e) => setFeedbackSectionName(e.target.value)}
                        placeholder="Example: Challenges"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      Expected Text / Evidence
                    </label>
                    <textarea
                      value={feedbackExpectedText}
                      onChange={(e) => setFeedbackExpectedText(e.target.value)}
                      placeholder="Paste lines that were missed or should be extracted."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      Prompt Instruction (Optional)
                    </label>
                    <textarea
                      value={feedbackInstruction}
                      onChange={(e) => setFeedbackInstruction(e.target.value)}
                      placeholder="Optional direct prompt rule to apply next time."
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      Comments (Optional)
                    </label>
                    <textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Any additional context"
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={
                        feedbackSaving ||
                        (!feedbackSectionName.trim() && !feedbackExpectedText.trim() && !feedbackInstruction.trim())
                      }
                      onClick={async () => {
                        setFeedbackSaving(true);
                        setFeedbackMessage("");
                        try {
                          const response = await fetch("http://localhost:3002/api/test-llms/feedback", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              provider: "ollama",
                              model: result.__model || "llama3.1:8b",
                              fileName: result.__fileName || currentFile?.name || null,
                              issueType: feedbackIssueType,
                              sectionName: feedbackSectionName.trim() || null,
                              expectedText: feedbackExpectedText.trim() || null,
                              comment: feedbackComment.trim() || null,
                              promptInstruction: feedbackInstruction.trim() || null,
                            }),
                          });
                          const raw = await response.text();
                          let payload: any = {};
                          try {
                            payload = raw ? JSON.parse(raw) : {};
                          } catch (_err) {
                            payload = {};
                          }
                          if (!response.ok) {
                            throw new Error(payload?.details || payload?.error || "Failed to save feedback");
                          }
                          setFeedbackMessage("Feedback saved. It will be added to the next Ollama prompt.");
                          setFeedbackInstruction("");
                          setFeedbackComment("");
                        } catch (err) {
                          setFeedbackMessage(
                            err instanceof Error ? err.message : "Failed to save feedback",
                          );
                        } finally {
                          setFeedbackSaving(false);
                        }
                      }}
                      className={`px-4 py-2 bg-${themeColor} text-white rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed`}>
                      {feedbackSaving ? "Saving..." : "Save Feedback"}
                    </button>
                    {feedbackMessage && (
                      <span className="text-xs font-semibold text-slate-700">{feedbackMessage}</span>
                    )}
                  </div>

                  {Array.isArray(result.__feedbackRulesApplied) && result.__feedbackRulesApplied.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">
                        Rules Applied In This Run
                      </div>
                      <ul className="list-disc pl-4 text-xs text-emerald-800 space-y-1">
                        {result.__feedbackRulesApplied.map((rule, idx) => (
                          <li key={`${rule}-${idx}`}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetaCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</div>
    <div className="text-xs font-semibold text-slate-800 break-all">{value}</div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="p-4 border border-slate-200 rounded-2xl bg-white">
    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">{title}</h3>
    <div className="text-sm text-slate-800 leading-relaxed">{children}</div>
  </div>
);

const TagList: React.FC<{ items: string[] }> = ({ items }) => {
  if (items.length === 0) return <span className="text-slate-500">-</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <span
          key={`${item}-${idx}`}
          className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
          {item}
        </span>
      ))}
    </div>
  );
};
