import type { ChecklistTemplate, ChecklistTemplateItem } from "./types";

// Recria a hierarquia de um modelo de checklist usando o construtor de item
// fornecido pelo chamador (que sabe gerar o id e o formato do item alvo,
// seja ChecklistItem de Atividade ou ChecklistGeralItem de Atividade Geral).
export function applyChecklistTemplate<T extends { id: string; parentId?: string | null }>(
  template: ChecklistTemplate,
  makeItem: (texto: string, parentId: string | null) => T
): T[] {
  const idMap = new Map<string, string>();
  const result: T[] = [];
  const remaining = [...template.itens];
  let guard = 0;
  while (remaining.length > 0 && guard++ < 2000) {
    const idx = remaining.findIndex((i) => i.parentId === null || idMap.has(i.parentId));
    if (idx === -1) break;
    const item = remaining[idx];
    const newParentId = item.parentId ? (idMap.get(item.parentId) ?? null) : null;
    const created = makeItem(item.texto, newParentId);
    idMap.set(item.id, created.id);
    result.push(created);
    remaining.splice(idx, 1);
  }
  return result;
}

export function templateFromItems(
  id: string,
  nome: string,
  items: { id: string; texto: string; parentId?: string | null }[]
): ChecklistTemplate {
  const itens: ChecklistTemplateItem[] = items.map((i) => ({
    id: i.id,
    texto: i.texto,
    parentId: i.parentId ?? null,
  }));
  return { id, nome, itens };
}
