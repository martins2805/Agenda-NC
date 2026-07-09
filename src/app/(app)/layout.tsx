import { AppShell } from "@/components/app-shell";
import { AppDataProvider } from "@/lib/app-data-context";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppDataProvider>
      <AppShell>{children}</AppShell>
    </AppDataProvider>
  );
}
