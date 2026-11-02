import type { DadosHome, ResultadoBanco } from "@/types";
import { getDb } from "./conexao";
import {
  mapearFutebol,
  mapearJogador,
  type LinhaFutebol,
  type LinhaJogador,
} from "./mapeadores";
import { executarComResultado } from "./resultadoBanco";

type LinhaPresenca = {
  jogador_id: number;
  presente: number;
};

export function carregarDadosHome(
  data: string,
): Promise<ResultadoBanco<DadosHome>> {
  return executarComResultado(
    "Carregar tela inicial",
    "Não foi possível carregar os dados salvos.",
    async () => {
      const db = await getDb();
      const futebolRow = await db.getFirstAsync<LinhaFutebol>(
        `SELECT quantidade_jogadores, quantidade_mensalistas, quantidade_avulsos,
          tipo_cadastro, controla_presenca, controle_pagamento,
          valor_quadra_centavos, mensalidade_centavos,
          mensalidade_sugerida_centavos, avulso_escolhido_centavos,
          avulso_sugerido_centavos, nome_quadra, endereco, dias_semana,
          frequencia, horario, data_criacao
         FROM futebol WHERE id = 1`,
      );
      const jogadoresRows = await db.getAllAsync<LinhaJogador>(
        "SELECT id, nome, tipo, posicao, nivel, vinculo FROM jogadores ORDER BY id ASC",
      );
      const presencasRows = await db.getAllAsync<LinhaPresenca>(
        "SELECT jogador_id, presente FROM presencas WHERE data = ?",
        data,
      );
      return {
        futebol: futebolRow ? mapearFutebol(futebolRow) : null,
        jogadores: jogadoresRows.map(mapearJogador),
        presencas: Object.fromEntries(
          presencasRows.map((linha) => [
            String(linha.jogador_id),
            linha.presente === 1,
          ]),
        ),
      };
    },
  );
}
