import type { DadosHome, ResultadoBanco } from "@/types";
import { getDb } from "./conexao";
import {
  mapearFutebol,
  mapearJogador,
  type LinhaFutebol,
  type LinhaJogador,
} from "./mapeadores";
import { executarComResultado } from "./resultadoBanco";
import { calcularCicloMensal } from "@/lib/ciclos";
import { obterDataLocal } from "@/lib/datas";

type LinhaPresenca = {
  jogador_id: number;
  presente: number;
};

type LinhaPagamento = {
  jogador_id: number;
  valor_pago_centavos: number;
};
type LinhaAvulso = { jogador_id: number; valor_pago_centavos: number };

export function carregarDadosHome(
  futebolId: number,
  data: string,
): Promise<ResultadoBanco<DadosHome>> {
  return executarComResultado(
    "Carregar tela inicial",
    "Não foi possível carregar os dados salvos.",
    async () => {
      const db = await getDb();
      const futebolRow = await db.getFirstAsync<LinhaFutebol>(
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
      const jogadoresRows = await db.getAllAsync<LinhaJogador>(
        "SELECT id, nome, tipo, posicao, nivel, vinculo FROM jogadores WHERE futebol_id = ? ORDER BY id ASC",
        futebolId,
      );
      const presencasRows = await db.getAllAsync<LinhaPresenca>(
        `SELECT p.jogador_id, p.presente FROM presencas p
         JOIN jogadores j ON j.id = p.jogador_id
         WHERE j.futebol_id = ? AND p.data = ?`,
        futebolId,
        data,
      );
      const controlaMensalistas =
        futebolRow?.controle_pagamento === "mensalistas" ||
        futebolRow?.controle_pagamento === "ambos";
      const controlarAvulsos = futebolRow?.controle_pagamento === "avulsos" || futebolRow?.controle_pagamento === "ambos";
      const ciclo = (controlaMensalistas || controlarAvulsos) && futebolRow
        ? calcularCicloMensal(futebolRow.vencimento_quadra ? Number(futebolRow.vencimento_quadra.slice(8, 10)) : 1, obterDataLocal())
        : null;
      const cicloInicio = ciclo?.inicio ?? null;
      const pagamentosRows = cicloInicio
        ? await db.getAllAsync<LinhaPagamento>(
            `SELECT p.jogador_id, p.valor_pago_centavos
             FROM pagamentos_mensalidade p
             JOIN jogadores j ON j.id = p.jogador_id
             JOIN futebol f ON f.id = j.futebol_id
             WHERE j.futebol_id = ? AND p.ciclo_inicio = ?
               AND (f.tipo_cadastro = 'so_mensalistas' OR j.vinculo = 'mensalista')`,
            futebolId,
            cicloInicio,
          )
        : [];
      const avulsosCiclo = ciclo && controlarAvulsos ? await db.getAllAsync<LinhaAvulso>(
        `SELECT p.jogador_id, p.valor_pago_centavos FROM pagamentos_avulso p
         JOIN jogadores j ON j.id = p.jogador_id
         WHERE j.futebol_id = ? AND p.data_jogo BETWEEN ? AND ?`,
        futebolId,
        ciclo.inicio, ciclo.fim,
      ) : [];
      const avulsosJogo = controlarAvulsos ? await db.getAllAsync<LinhaAvulso>(
        `SELECT p.jogador_id, p.valor_pago_centavos FROM pagamentos_avulso p
         JOIN jogadores j ON j.id = p.jogador_id
         WHERE j.futebol_id = ? AND p.data_jogo = ?`, futebolId, data,
      ) : [];
      return {
        futebol: futebolRow ? mapearFutebol(futebolRow) : null,
        jogadores: jogadoresRows.map(mapearJogador),
        presencas: Object.fromEntries(
          presencasRows.map((linha) => [
            String(linha.jogador_id),
            linha.presente === 1,
          ]),
        ),
        pagamentosCiclo: Object.fromEntries(
          pagamentosRows.map((linha) => [String(linha.jogador_id), linha.valor_pago_centavos]),
        ),
        cicloInicio,
        pagamentosAvulsosJogo: Object.fromEntries(avulsosJogo.map((p) => [String(p.jogador_id), p.valor_pago_centavos])),
        arrecadacaoAvulsosCicloCentavos: avulsosCiclo.reduce((n, p) => n + p.valor_pago_centavos, 0),
        quantidadePagamentosAvulsosCiclo: avulsosCiclo.length,
      };
    },
  );
}
