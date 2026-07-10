"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatMessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

const HELP_TEXT = [
  "Comandos disponíveis:",
  "/limpar — apaga a conversa de hoje (some daqui e do banco)",
  "/ajuda — mostra esta lista",
].join("\n");

function localMessage(role: "user" | "assistant", content: string): ChatMessageRow {
  return { id: `local-${role}-${Date.now()}-${Math.random()}`, role, content, createdAt: new Date().toISOString() };
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadHistory() {
      setLoadingHistory(true);
      try {
        const res = await fetch("/api/chat");
        const data = res.ok ? await res.json() : [];
        if (!cancelled) setMessages(data);
      } catch (error) {
        console.error("Falha ao carregar histórico do chat", error);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function runCommand(command: string): Promise<boolean> {
    const cmd = command.trim().toLowerCase();

    if (cmd === "/ajuda" || cmd === "/help") {
      setMessages((prev) => [...prev, localMessage("assistant", HELP_TEXT)]);
      return true;
    }

    if (cmd === "/limpar" || cmd === "/clear") {
      setMessages([]);
      try {
        await fetch("/api/chat", { method: "DELETE" });
      } catch (error) {
        console.error("Falha ao limpar conversa", error);
      }
      setMessages([localMessage("assistant", "Conversa de hoje apagada.")]);
      return true;
    }

    return false;
  }

  async function send() {
    const text = draft.trim();
    if (!text || loading) return;

    setDraft("");

    if (text.startsWith("/")) {
      setMessages((prev) => [...prev, localMessage("user", text)]);
      const handled = await runCommand(text);
      if (handled) return;
      setMessages((prev) => [
        ...prev,
        localMessage("assistant", `Comando desconhecido. ${HELP_TEXT}`),
      ]);
      return;
    }

    setMessages((prev) => [...prev, localMessage("user", text)]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, localMessage("assistant", data.reply as string)]);
      } else {
        setMessages((prev) => [
          ...prev,
          localMessage("assistant", "Não consegui responder agora. Tente de novo em instantes."),
        ]);
      }
    } catch (error) {
      console.error("Falha ao enviar mensagem", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen((v) => !v)}
        size="icon"
        className="fixed right-4 bottom-20 z-50 size-12 rounded-full shadow-lg sm:right-6 sm:bottom-6"
        aria-label={open ? "Fechar assistente" : "Abrir assistente"}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>

      {open && (
        <div className="fixed inset-x-4 bottom-36 z-50 flex h-[60vh] max-h-[520px] flex-col rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-display text-sm italic leading-none">Assistente Agenda NC</p>
              <p className="ledger-label mt-1">pergunte sobre seus dados</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {loadingHistory && (
              <p className="text-xs text-muted-foreground">Carregando conversa de hoje...</p>
            )}
            {!loadingHistory && messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Pergunte algo sobre suas atividades, registros ou planilhas.
                Digite <span className="font-mono">/ajuda</span> para ver os comandos.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Pensando...
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 border-t border-border p-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Escreva sua pergunta..."
              rows={1}
              className="min-h-9 resize-none"
            />
            <Button
              size="icon"
              onClick={send}
              disabled={loading || !draft.trim()}
              aria-label="Enviar"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
