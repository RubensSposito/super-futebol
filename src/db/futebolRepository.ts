import type {
  Futebol,
  FutebolSemDataCriacao,
  ResultadoBanco,
  TipoCadastro,
} from "@/types";
import { nomeNormalizadoFutebol, normalizarNomeFutebol } from "@/lib/futebols";
import { getDb } from "./conexao";
import { mapearFutebol, type LinhaFutebol } from "./mapeadores";
import { executarComResultado } from "./resultadoBanco";
import { calcularCicloMensal } from "@/lib/ciclos";
import { obterDataLocal } from "@/lib/datas";

export function obterFutebol(futebolId: number): Promise<ResultadoBanco<Futebol | null>> {
  return executarComResultado(
    "Carregar dados do futebol",
    "Não foi possível carregar os dados do futebol.",
    async () => {
      const db = await getDb();
      const linha = await db.getFirstAsync<LinhaFutebol>(
        `SELECT id, nome, quantidade_jogadores, quantidade_mensalistas, quantidade_avulsos,
          tipo_cadastro, controla_presenca, controle_pagamento,
          vencimento_quadra, jogadores_por_time, quantidade_times,
          valor_quadra_centavos, mensalidade_centavos,
          mensalidade_sugerida_centavos, avulso_escolhido_centavos,
          avulso_sugerido_centavos, nome_quadra, endereco, dias_semana,
          frequencia, horario, data_criacao
         FROM futebol WHERE id = ?`,
        futebolId,
      );
      return linha ? mapearFutebol(linha) : null;
    },
  );
}

export async function nomeFutebolDisponivel(nome: string, ignorarId?: number): Promise<boolean> {
  const db = await getDb();
  const normalizado = nomeNormalizadoFutebol(nome);
  if (ignorarId === undefined) {
    const row = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM futebol WHERE nome_normalizado = ?",
      normalizado,
    );
    return row === null;
  }
  const row = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM futebol WHERE nome_normalizado = ? AND id <> ?",
    normalizado,
    ignorarId,
  );
  return row === null;
}

export function atualizarFutebol(
  futebolId: number,
  futebol: FutebolSemDataCriacao,
  tipoAnterior: TipoCadastro,
): Promise<ResultadoBanco<void>> {
  return executarComResultado(
    "Atualizar configuração do futebol",
    "Não foi possível salvar as alterações do futebol.",
    async () => {
      if (!Number.isSafeInteger(futebolId) || futebolId < 1) throw new RangeError("Identificador de futebol inválido.");
      const nome = normalizarNomeFutebol(futebol.nome);
      if (nome.length < 2 || nome.length > 40) throw new RangeError("O nome deve ter entre 2 e 40 caracteres.");
      const db = await getDb();
      const diasSemana = [...futebol.diasSemana].sort((a, b) => a - b);
      await db.withTransactionAsync(async () => {
        const atual = await db.getFirstAsync<{ vencimento_quadra: string | null }>(
          "SELECT vencimento_quadra FROM futebol WHERE id = ?",
          futebolId,
        );
        if (!atual) throw new Error("A configuração do futebol não foi encontrada.");
        const vencimentoAnterior = atual.vencimento_quadra ?? "";
        await db.runAsync(
          `UPDATE futebol
           SET nome = ?, nome_normalizado = ?, quantidade_jogadores = ?,
               quantidade_mensalistas = ?, quantidade_avulsos = ?, tipo_cadastro = ?,
               controla_presenca = ?, controle_pagamento = ?,
               vencimento_quadra = ?, jogadores_por_time = ?, quantidade_times = ?,
               valor_quadra_centavos = ?, mensalidade_centavos = ?,
               mensalidade_sugerida_centavos = ?, avulso_escolhido_centavos = ?,
               avulso_sugerido_centavos = ?, nome_quadra = ?, endereco = ?,
               dias_semana = ?, frequencia = ?, horario = ?
           WHERE id = ?`,
          nome,
          nomeNormalizadoFutebol(nome),
          futebol.quantidadeJogadores,
          futebol.quantidadeMensalistas,
          futebol.quantidadeAvulsos,
          futebol.tipoCadastro,
          futebol.controlaPresenca ? 1 : 0,
          futebol.controlePagamento,
          futebol.vencimentoQuadra || null,
          futebol.jogadoresPorTime,
          futebol.quantidadeTimes,
          futebol.valorQuadraCentavos,
          futebol.mensalidadeCentavos,
          futebol.mensalidadeSugeridaCentavos,
          futebol.avulsoEscolhidoCentavos,
          futebol.avulsoSugeridoCentavos,
          futebol.nomeQuadra,
          futebol.endereco,
          diasSemana.length > 0 ? diasSemana.join(",") : null,
          futebol.frequencia,
          futebol.horario,
          futebolId,
        );

        if (vencimentoAnterior && futebol.vencimentoQuadra && vencimentoAnterior !== futebol.vencimentoQuadra) {
          const hoje = obterDataLocal();
          const cicloAnterior = calcularCicloMensal(Number(vencimentoAnterior.slice(8, 10)), hoje).inicio;
          const cicloNovo = calcularCicloMensal(Number(futebol.vencimentoQuadra.slice(8, 10)), hoje).inicio;
          if (cicloAnterior !== cicloNovo) {
            await db.runAsync(
              `INSERT INTO pagamentos_mensalidade
                 (jogador_id, ciclo_inicio, valor_pago_centavos, data_marcacao)
               SELECT p.jogador_id, ?, p.valor_pago_centavos, p.data_marcacao
               FROM pagamentos_mensalidade p
               JOIN jogadores j ON j.id = p.jogador_id
               WHERE j.futebol_id = ? AND p.ciclo_inicio = ?
               ON CONFLICT(jogador_id, ciclo_inicio) DO UPDATE SET
                 valor_pago_centavos = excluded.valor_pago_centavos,
                 data_marcacao = excluded.data_marcacao`,
              cicloNovo,
              futebolId,
              cicloAnterior,
            );
            await db.runAsync(
              `DELETE FROM pagamentos_mensalidade
               WHERE ciclo_inicio = ? AND jogador_id IN
                 (SELECT id FROM jogadores WHERE futebol_id = ?)`,
              cicloAnterior,
              futebolId,
            );
          }
        }

        if (futebol.tipoCadastro === "basico") {
          await db.runAsync("UPDATE jogadores SET vinculo = NULL WHERE futebol_id = ?", futebolId);
        } else if (futebol.tipoCadastro === "so_mensalistas" && tipoAnterior === "mensalistas_e_avulsos") {
          await db.runAsync("UPDATE jogadores SET vinculo = 'mensalista' WHERE futebol_id = ? AND vinculo = 'avulso'", futebolId);
        } else if (futebol.tipoCadastro === "so_mensalistas" || (futebol.tipoCadastro === "mensalistas_e_avulsos" && tipoAnterior !== "mensalistas_e_avulsos")) {
          await db.runAsync("UPDATE jogadores SET vinculo = 'mensalista' WHERE futebol_id = ?", futebolId);
        }
      });
    },
  );
}
