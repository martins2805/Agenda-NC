import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Reduz HTML de editor rico a texto pesquisável: remove as tags inteiras —
// inclusive <img src="data:..."> com imagens coladas, que chegam a megabytes
// por atividade — e colapsa espaços. Processar o HTML bruto a cada tecla da
// busca derrubava a aba do navegador (crash reproduzido em produção, S16).
// O texto digitado pelo usuário permanece completo — nada de busca truncada.
export function htmlToSearchText(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
