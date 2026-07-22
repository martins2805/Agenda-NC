import type { Prisma, VinculoTipo } from "@/generated/prisma/client";
import { prisma } from "./prisma";

// Vínculo polimórfico único entre objetos do sistema (regra 5 do CLAUDE.md).
// Toda leitura/escrita de vínculo passa por este arquivo — nenhuma rota grava
// direto na tabela Vinculo.

export interface VinculoPar {
  tipo: VinculoTipo;
  id: string;
}

type Tx = Prisma.TransactionClient | typeof prisma;

// Ordena os dois lados por "${tipo}:${id}" para colapsar A→B e B→A na mesma
// linha. O par normalizado sempre satisfaz origem < destino (reforçado no
// banco pela CHECK constraint vinculo_par_ordenado).
export function normalizarPar(a: VinculoPar, b: VinculoPar): { origem: VinculoPar; destino: VinculoPar } {
  const chaveA = `${a.tipo}:${a.id}`;
  const chaveB = `${b.tipo}:${b.id}`;
  return chaveA < chaveB ? { origem: a, destino: b } : { origem: b, destino: a };
}

export async function criarVinculo(tx: Tx, userId: string, a: VinculoPar, b: VinculoPar) {
  const { origem, destino } = normalizarPar(a, b);
  await tx.vinculo.upsert({
    where: {
      vinculo_par_unico: {
        userId,
        origemTipo: origem.tipo,
        origemId: origem.id,
        destinoTipo: destino.tipo,
        destinoId: destino.id,
      },
    },
    create: {
      userId,
      origemTipo: origem.tipo,
      origemId: origem.id,
      destinoTipo: destino.tipo,
      destinoId: destino.id,
    },
    update: {},
  });
}

export async function removerVinculo(tx: Tx, userId: string, a: VinculoPar, b: VinculoPar) {
  const { origem, destino } = normalizarPar(a, b);
  await tx.vinculo.deleteMany({
    where: {
      userId,
      origemTipo: origem.tipo,
      origemId: origem.id,
      destinoTipo: destino.tipo,
      destinoId: destino.id,
    },
  });
}

// Lista os ids do lado oposto de todo vínculo que envolva o objeto (tipo, id),
// filtrando opcionalmente pelo tipo do lado oposto.
export async function listarVinculados(
  tx: Tx,
  userId: string,
  objeto: VinculoPar,
  tipoOposto: VinculoTipo
): Promise<string[]> {
  const vinculos = await tx.vinculo.findMany({
    where: {
      userId,
      OR: [
        { origemTipo: objeto.tipo, origemId: objeto.id, destinoTipo: tipoOposto },
        { destinoTipo: objeto.tipo, destinoId: objeto.id, origemTipo: tipoOposto },
      ],
    },
  });
  return vinculos.map((v) =>
    v.origemTipo === objeto.tipo && v.origemId === objeto.id ? v.destinoId : v.origemId
  );
}

// Sincroniza os vínculos de um objeto com um tipo oposto específico para
// exatamente o conjunto `novosIds` — insere o que falta, remove o que sumiu.
// Usado pelas rotas de Registro/Planilha ao salvar `atividadeIds`.
export async function syncVinculos(
  tx: Tx,
  userId: string,
  objeto: VinculoPar,
  tipoOposto: VinculoTipo,
  novosIds: string[]
) {
  const atuais = await listarVinculados(tx, userId, objeto, tipoOposto);
  const atuaisSet = new Set(atuais);
  const novosSet = new Set(novosIds);

  const paraAdicionar = novosIds.filter((id) => !atuaisSet.has(id));
  const paraRemover = atuais.filter((id) => !novosSet.has(id));

  for (const id of paraAdicionar) {
    await criarVinculo(tx, userId, objeto, { tipo: tipoOposto, id });
  }
  for (const id of paraRemover) {
    await removerVinculo(tx, userId, objeto, { tipo: tipoOposto, id });
  }
}

// Versão em lote de listarVinculados, para listagens (GET de coleção) sem N+1:
// devolve um Map<idDoObjeto, string[] de ids do lado oposto>.
export async function listarVinculadosEmLote(
  tx: Tx,
  userId: string,
  tipo: VinculoTipo,
  ids: string[],
  tipoOposto: VinculoTipo
): Promise<Map<string, string[]>> {
  const mapa = new Map<string, string[]>(ids.map((id) => [id, []]));
  if (ids.length === 0) return mapa;

  const vinculos = await tx.vinculo.findMany({
    where: {
      userId,
      OR: [
        { origemTipo: tipo, origemId: { in: ids }, destinoTipo: tipoOposto },
        { destinoTipo: tipo, destinoId: { in: ids }, origemTipo: tipoOposto },
      ],
    },
  });

  for (const v of vinculos) {
    if (v.origemTipo === tipo && ids.includes(v.origemId)) {
      mapa.get(v.origemId)?.push(v.destinoId);
    } else if (v.destinoTipo === tipo && ids.includes(v.destinoId)) {
      mapa.get(v.destinoId)?.push(v.origemId);
    }
  }
  return mapa;
}

// Cascade manual de exclusão: apaga toda linha de Vinculo em que o objeto
// apagado participa, de qualquer lado. Chamado só em hard delete (o soft
// delete não deve apagar vínculos — regra 8 do CLAUDE.md).
export async function deleteVinculosDe(tx: Tx, userId: string, tipo: VinculoTipo, id: string) {
  await tx.vinculo.deleteMany({
    where: {
      userId,
      OR: [
        { origemTipo: tipo, origemId: id },
        { destinoTipo: tipo, destinoId: id },
      ],
    },
  });
}

export { prisma };
