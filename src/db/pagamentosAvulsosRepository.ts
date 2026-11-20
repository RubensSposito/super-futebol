import type { ResultadoBanco } from "@/types";
import { obterDataLocal } from "@/lib/datas";
import { getDb } from "./conexao";
import { executarComResultado } from "./resultadoBanco";

export function definirPagamentoAvulso(futebolId: number, jogadorId: string, dataJogo: string, valorCentavos: number, pago: boolean): Promise<ResultadoBanco<void>> {
  return executarComResultado("Salvar pagamento avulso", "Não foi possível salvar o pagamento do jogo.", async () => {
    const db = await getDb();
    if (pago) await db.runAsync(
      `INSERT INTO pagamentos_avulso (jogador_id, data_jogo, valor_pago_centavos, data_marcacao)
       SELECT id, ?, ?, ? FROM jogadores WHERE id = ? AND futebol_id = ?
       ON CONFLICT(jogador_id, data_jogo) DO UPDATE SET valor_pago_centavos = excluded.valor_pago_centavos, data_marcacao = excluded.data_marcacao`,
      dataJogo, valorCentavos, obterDataLocal(), Number(jogadorId), futebolId,
    );
    else await db.runAsync("DELETE FROM pagamentos_avulso WHERE jogador_id = ? AND data_jogo = ? AND jogador_id IN (SELECT id FROM jogadores WHERE futebol_id = ?)", Number(jogadorId), dataJogo, futebolId);
  });
}
