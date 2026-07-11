import { auth } from "@/lib/auth";
import { UsuariosPanel } from "@/components/usuarios/usuarios-panel";

export default async function UsuariosPage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  return <UsuariosPanel isAdmin={isAdmin} />;
}
