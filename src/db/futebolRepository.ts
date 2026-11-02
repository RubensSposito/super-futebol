import type {
  Futebol,
  RascunhoFutebol,
  ResultadoBanco,
  TipoCadastro,
} from "@/types";
import { getDb } from "./conexao";
import { mapearFutebol, type LinhaFutebol } from "./mapeadores";
import { executarComResultado } from "./resultadoBanco";

export function obterFutebol(): Promise<ResultadoBanco<Futebol | null>> {
  return executarComResultado(
    "Carregar dados do futebol",
    "Não foi possível carregar os dados do futebol.",
    async () => {
      const db = await getDb();
      const linha = await db.getFirstAsync<LinhaFutebol>(
        `SELECT quantidade_jogadores, quantidade_mensalistas, quantidade_avulsos,
          tipo_cadastro, controla_presenca, controle_pagamento,
          valor_quadra_centavos, mensalidade_centavos,
          mensalidade_sugerida_centavos, avulso_escolhido_centavos,
          avulso_sugerido_centavos, nome_quadra, endereco, dias_semana,
          frequencia, horario, data_criacao
         FROM futebol WHERE id = 1`,
      );
      return linha ? mapearFutebol(linha) : null;
    },
  );
}

export function salvarFutebol(
  futebol: Futebol,
): Promise<ResultadoBanco<void>> {
  return executarComResultado(
    "Salvar dados do futebol",
    "Não foi possível salvar os dados do futebol.",
    async () => {
      const db = await getDb();
      const diasSemana = [...futebol.diasSemana].sort((a, b) => a - b);
      await db.runAsync(
        `INSERT OR REPLACE INTO futebol
          (id, quantidade_jogadores, quantidade_mensalistas, quantidade_avulsos,
           tipo_cadastro, controla_presenca, controle_pagamento,
           valor_quadra_centavos, mensalidade_centavos,
           mensalidade_sugerida_centavos, avulso_escolhido_centavos,
           avulso_sugerido_centavos, nome_quadra, endereco, dias_semana,
           frequencia, horario, data_criacao)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        futebol.quantidadeJogadores,
        futebol.quantidadeMensalistas,
        futebol.quantidadeAvulsos,
        futebol.tipoCadastro,
        futebol.controlaPresenca ? 1 : 0,
        futebol.controlePagamento,
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
        futebol.dataCriacao,
      );
    },
  );
}

export function atualizarFutebol(
  futebol: RascunhoFutebol,
  tipoAnterior: TipoCadastro,
): Promise<ResultadoBanco<void>> {
  return executarComResultado(
    "Atualizar configuração do futebol",
    "Não foi possível salvar as alterações do futebol.",
    async () => {
      const db = await getDb();
      const diasSemana = [...futebol.diasSemana].sort((a, b) => a - b);
      await db.withTransactionAsync(async () => {
        const resultado = await db.runAsync(
          `UPDATE futebol
           SET quantidade_jogadores = ?, quantidade_mensalistas = ?,
               quantidade_avulsos = ?, tipo_cadastro = ?,
               controla_presenca = ?, controle_pagamento = ?,
               valor_quadra_centavos = ?, mensalidade_centavos = ?,
               mensalidade_sugerida_centavos = ?,
               avulso_escolhido_centavos = ?, avulso_sugerido_centavos = ?,
               nome_quadra = ?, endereco = ?, dias_semana = ?,
               frequencia = ?, horario = ?
           WHERE id = 1`,
          futebol.quantidadeJogadores,
          futebol.quantidadeMensalistas,
          futebol.quantidadeAvulsos,
          futebol.tipoCadastro,
          futebol.controlaPresenca ? 1 : 0,
          futebol.controlePagamento,
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
        );
        if (resultado.changes === 0) {
          throw new Error("A configuração do futebol não foi encontrada.");
        }

        if (futebol.tipoCadastro === "basico") {
          await db.runAsync("UPDATE jogadores SET vinculo = NULL");
        } else if (
          futebol.tipoCadastro === "so_mensalistas" &&
          tipoAnterior === "mensalistas_e_avulsos"
        ) {
          await db.runAsync(
            "UPDATE jogadores SET vinculo = 'mensalista' WHERE vinculo = 'avulso'",
          );
        } else if (
          futebol.tipoCadastro === "so_mensalistas" ||
          (futebol.tipoCadastro === "mensalistas_e_avulsos" &&
            tipoAnterior !== "mensalistas_e_avulsos")
        ) {
          await db.runAsync(
            "UPDATE jogadores SET vinculo = 'mensalista'",
          );
        }
      });
    },
  );
}
