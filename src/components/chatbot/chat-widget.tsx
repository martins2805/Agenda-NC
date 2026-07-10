"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAppData } from "@/lib/app-data-context";

interface ChatMessageRow {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Position {
  right: number;
  bottom: number;
}

const DEFAULT_POSITION: Position = { right: 24, bottom: 24 };
const STORAGE_KEY = "agenda-nc-chat-position";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function loadPosition(): Position {
  if (typeof window === "undefined") return DEFAULT_POSITION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_POSITION;
    const parsed = JSON.parse(raw);
    if (typeof parsed.right === "number" && typeof parsed.bottom === "number") return parsed;
  } catch {
    // ignore malformed storage
  }
  return DEFAULT_POSITION;
}

const HELP_TEXT = [
  "Comandos disponíveis:",
  "/limpar — apaga a conversa de hoje (some daqui e do banco)",
  "/ajuda — mostra esta lista",
].join("\n");

function localMessage(role: "user" | "assistant", content: string): ChatMessageRow {
  return { id: `local-${role}-${Date.now()}-${Math.random()}`, role, content, createdAt: new Date().toISOString() };
}

interface DragInfo {
  startX: number;
  startY: number;
  startRight: number;
  startBottom: number;
  moved: boolean;
}

export function ChatWidget() {
  const { refetch } = useAppData();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<DragInfo | null>(null);

  useEffect(() => {
    function hydratePosition() {
      setPosition(loadPosition());
    }
    hydratePosition();
  }, []);

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

  function beginDrag(e: React.PointerEvent<HTMLElement>) {
    dragInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRight: position.right,
      startBottom: position.bottom,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // alguns ambientes (touch/simuladores) podem não suportar; o drag
      // ainda funciona via pointermove no elemento, só sem captura.
    }
  }

  function onDragMove(e: React.PointerEvent<HTMLElement>) {
    const info = dragInfo.current;
    if (!info) return;
    const dx = e.clientX - info.startX;
    const dy = e.clientY - info.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) info.moved = true;
    if (!info.moved) return;

    const next: Position = {
      right: clamp(info.startRight - dx, 8, window.innerWidth - 56),
      bottom: clamp(info.startBottom - dy, 8, window.innerHeight - 56),
    };
    setPosition(next);
  }

  function endDrag() {
    if (dragInfo.current?.moved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    }
  }

  function onButtonClick() {
    if (dragInfo.current?.moved) {
      dragInfo.current = null;
      return;
    }
    dragInfo.current = null;
    setOpen((v) => !v);
  }

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
        refetch().catch((error) => console.error("Falha ao atualizar tela após o chat", error));
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
    <div
      className="fixed z-50 flex flex-col items-end gap-3"
      style={{ right: position.right, bottom: position.bottom }}
    >
      {open && (
        <div className="flex h-[60vh] max-h-[520px] w-[calc(100vw-2rem)] flex-col rounded-2xl border border-border bg-card shadow-2xl sm:w-96">
          <div
            onPointerDown={beginDrag}
            onPointerMove={onDragMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="flex cursor-grab items-center justify-between border-b border-border px-4 py-3 touch-none active:cursor-grabbing"
          >
            <div>
              <p className="font-display text-base italic leading-none">Assistente Agenda NC</p>
              <p className="ledger-label mt-1">pergunte sobre seus dados</p>
            </div>
            <GripVertical className="size-4 shrink-0 text-muted-foreground" />
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

      <Button
        onPointerDown={beginDrag}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={onButtonClick}
        size="icon"
        className="size-12 touch-none rounded-full shadow-lg active:cursor-grabbing"
        aria-label={open ? "Fechar assistente" : "Abrir assistente"}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </div>
  );
}
