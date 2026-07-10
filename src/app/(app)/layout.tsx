import { AppShell } from "@/components/app-shell";
import { AppDataProvider } from "@/lib/app-data-context";
import { ChatWidget } from "@/components/chatbot/chat-widget";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppDataProvider>
      <AppShell>{children}</AppShell>
      <ChatWidget />
    </AppDataProvider>
  );
}
