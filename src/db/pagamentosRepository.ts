import type { ResultadoBanco } from "@/types";
import { obterDataLocal } from "@/lib/datas";
import { getDb } from "./conexao";
import { executarComResultado } from "./resultadoBanco";

export function definirPagamentoMensalidade(
  futebolId: number,
  jogadorId: string,
  cicloInicio: string,
  valorPagoCentavos: number,
  pago: boolean,
): Promise<ResultadoBanco<void>> {
  return executarComResultado(
    pago ? "Marcar mensalidade paga" : "Desmarcar mensalidade paga",
    "Não foi possível salvar o pagamento da mensalidade.",
    async () => {
      if (pago && (!Number.isSafeInteger(valorPagoCentavos) || valorPagoCentavos < 0)) {
        throw new RangeError("Valor da mensalidade inválido.");
      }
      const db = await getDb();
      if (!pago) {
        await db.runAsync(
          `DELETE FROM pagamentos_mensalidade
           WHERE jogador_id = ? AND ciclo_inicio = ?
             AND jogador_id IN (SELECT id FROM jogadores WHERE futebol_id = ?)`,
          Number(jogadorId),
          cicloInicio,
          futebolId,
        );
        return;
      }
      const jogador = await db.getFirstAsync<{ vinculo: string | null }>(
        `SELECT jogadores.vinculo FROM jogadores
         JOIN futebol ON futebol.id = jogadores.futebol_id
         WHERE jogadores.id = ? AND jogadores.futebol_id = ?
           AND (jogadores.vinculo = 'mensalista' OR futebol.tipo_cadastro = 'so_mensalistas')`,
        Number(jogadorId),
        futebolId,
      );
      if (!jogador) throw new Error("Somente mensalistas podem registrar pagamento.");
      await db.runAsync(
        `INSERT INTO pagamentos_mensalidade
           (jogador_id, ciclo_inicio, valor_pago_centavos, data_marcacao)
         SELECT id, ?, ?, ? FROM jogadores WHERE id = ? AND futebol_id = ?
         ON CONFLICT(jogador_id, ciclo_inicio) DO UPDATE SET
           valor_pago_centavos = excluded.valor_pago_centavos,
           data_marcacao = excluded.data_marcacao`,
        cicloInicio,
        valorPagoCentavos,
        obterDataLocal(),
        Number(jogadorId),
        futebolId,
      );
    },
  );
}
