import { AppShell } from "@/components/app-shell";
import { AppDataProvider } from "@/lib/app-data-context";
import { ChatWidget } from "@/components/chatbot/chat-widget";
import { auth } from "@/lib/auth";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <AppDataProvider>
      <AppShell isAdmin={isAdmin}>{children}</AppShell>
      <ChatWidget />
    </AppDataProvider>
  );
}
