"use client";

import { useEffect, useState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UserRow {
  id: string;
  email: string;
  createdAt: string;
}

export function UsuariosPanel({ isAdmin }: { isAdmin: boolean }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(isAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    async function load() {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
      setLoading(false);
    }
    load();
  }, [isAdmin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar usuário");
        return;
      }
      setUsers((prev) => [...prev, data]);
      setEmail("");
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("A confirmação não corresponde à nova senha");
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await fetch("/api/users/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "Erro ao trocar senha");
        return;
      }
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setPasswordSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Usuários</h2>
        <p className="mt-1 text-muted-foreground">
          {isAdmin
            ? "Cadastre novas contas de acesso ao Agenda NC. Cada usuário vê apenas os próprios dados."
            : "Altere a senha da sua própria conta de acesso ao Agenda NC."}
        </p>
      </div>

      {isAdmin && (
        <Card className="w-fit border-none bg-[var(--chart-1)] text-white shadow-lg shadow-[var(--chart-1)]/20">
          <CardContent className="flex flex-col gap-1">
            <span className="ledger-label text-white/70">Contas cadastradas</span>
            <p className="font-mono text-4xl font-bold tracking-tight">
              {String(users.length).padStart(2, "0")}
            </p>
          </CardContent>
        </Card>
      )}

      <div className={isAdmin ? "grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]" : "max-w-sm"}>
        <div className="space-y-6">
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[var(--chart-1)] text-white">
                    <UserPlus className="size-3.5" />
                  </span>
                  Novo usuário
                </CardTitle>
                <CardDescription>Defina e-mail e senha de acesso.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Criando..." : "Criar usuário"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-[var(--chart-3)] text-white">
                  <KeyRound className="size-3.5" />
                </span>
                Trocar minha senha
              </CardTitle>
              <CardDescription>Altere a senha da sua própria conta.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                {passwordSuccess && (
                  <p className="text-sm text-primary">Senha alterada com sucesso.</p>
                )}
                <Button type="submit" disabled={passwordSubmitting} className="w-full">
                  {passwordSubmitting ? "Salvando..." : "Trocar senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Contas existentes</CardTitle>
              <CardDescription>{users.length} usuário(s) cadastrado(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <ul className="divide-y divide-border">
                  {users.map((u) => (
                    <li key={u.id} className="flex items-center justify-between py-3">
                      <span className="text-sm">{u.email}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
