import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function authenticate(formData: FormData) {
  "use server";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/atividades",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4">
      <div className="w-full max-w-sm border border-border bg-card p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center border border-primary font-mono text-xs font-bold text-primary">
            NC
          </div>
          <div>
            <p className="font-display text-xl italic leading-none">Agenda NC</p>
            <p className="ledger-label mt-1">Acesso restrito</p>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          Entre para acessar suas atividades, registros e planilhas.
        </p>

        <form action={authenticate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="ledger-label">
              E-mail
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              className="rounded-none border-border font-mono text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="ledger-label">
              Senha
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="rounded-none border-border font-mono text-sm"
            />
          </div>
          {error && (
            <p className="font-mono text-xs text-destructive">
              E-mail ou senha inválidos.
            </p>
          )}
          <Button type="submit" className="mt-2 rounded-none font-mono text-xs tracking-wide uppercase">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
