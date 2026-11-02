import type {
  Futebol,
  Nivel,
  NovoJogador,
  Posicao,
  ResultadoBanco,
  TipoJogador,
  Vinculo,
} from "@/types";
import {
  normalizarNomeJogador,
  validarNovoJogador,
} from "@/lib/jogadores";
import { getDb } from "./conexao";
import { executarComResultado } from "./resultadoBanco";

const TIPOS_JOGADOR: readonly TipoJogador[] = ["goleiro", "linha"];
const POSICOES: readonly Posicao[] = [
  "goleiro",
  "zagueiro",
  "lateral",
  "volante",
  "meia",
  "atacante",
];
const NIVEIS: readonly Nivel[] = [
  "iniciante",
  "amador",
  "semi_profissional",
  "profissional",
];
const VINCULOS: readonly Vinculo[] = ["mensalista", "avulso"];
const TIPOS_CADASTRO = [
  "mensalistas_e_avulsos",
  "so_mensalistas",
  "basico",
] as const;
const CONTROLES_PAGAMENTO = [
  "nenhum",
  "mensalistas",
  "avulsos",
  "ambos",
] as const;
const FREQUENCIAS = ["semanal", "quinzenal", "mensal"] as const;
const SQL_SALVAR_FUTEBOL = `INSERT INTO futebol
  (id, quantidade_jogadores, quantidade_mensalistas, quantidade_avulsos,
   tipo_cadastro, controla_presenca, controle_pagamento,
   valor_quadra_centavos, mensalidade_centavos,
   mensalidade_sugerida_centavos, avulso_escolhido_centavos,
   avulso_sugerido_centavos, nome_quadra, endereco, dias_semana,
   frequencia, horario, data_criacao)
 VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
 ON CONFLICT(id) DO UPDATE SET
   quantidade_jogadores = excluded.quantidade_jogadores,
   quantidade_mensalistas = excluded.quantidade_mensalistas,
   quantidade_avulsos = excluded.quantidade_avulsos,
   tipo_cadastro = excluded.tipo_cadastro,
   controla_presenca = excluded.controla_presenca,
   controle_pagamento = excluded.controle_pagamento,
   valor_quadra_centavos = excluded.valor_quadra_centavos,
   mensalidade_centavos = excluded.mensalidade_centavos,
   mensalidade_sugerida_centavos = excluded.mensalidade_sugerida_centavos,
   avulso_escolhido_centavos = excluded.avulso_escolhido_centavos,
   avulso_sugerido_centavos = excluded.avulso_sugerido_centavos,
   nome_quadra = excluded.nome_quadra,
   endereco = excluded.endereco,
   dias_semana = excluded.dias_semana,
   frequencia = excluded.frequencia,
   horario = excluded.horario,
   data_criacao = excluded.data_criacao`;
const SQL_SALVAR_JOGADOR = `INSERT INTO jogadores
  (nome, nome_normalizado, tipo, posicao, nivel, vinculo, data_criacao)
 VALUES (?, ?, ?, ?, ?, ?, ?)
 ON CONFLICT(nome_normalizado) DO UPDATE SET
   nome = excluded.nome,
   tipo = excluded.tipo,
   posicao = excluded.posicao,
   nivel = excluded.nivel,
   vinculo = excluded.vinculo`;
const SQL_MARCAR_SETUP_CONCLUIDO =
  "INSERT INTO app_config (key, value) VALUES ('setup_done', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value";

function validarInteiro(
  valor: number,
  nome: string,
  minimo: number,
  maximo: number,
): number {
  if (
    !Number.isSafeInteger(valor) ||
    valor < minimo ||
    valor > maximo
  ) {
    throw new RangeError(`${nome} inválido: ${String(valor)}.`);
  }
  return valor;
}

function validarCentavos(
  valor: number | null | undefined,
  nome: string,
): number | null {
  if (valor == null) return null;
  return validarInteiro(valor, nome, 0, Number.MAX_SAFE_INTEGER);
}

function normalizarTextoOpcional(
  valor: string | null | undefined,
  nome: string,
): string | null {
  if (valor == null) return null;
  if (typeof valor !== "string") {
    throw new TypeError(`${nome} deve ser um texto ou nulo.`);
  }
  return valor.trim() || null;
}

function normalizarFutebol(futebol: Futebol): Futebol {
  if (!TIPOS_CADASTRO.includes(futebol.tipoCadastro)) {
    throw new TypeError("Tipo de cadastro inválido.");
  }
  if (!CONTROLES_PAGAMENTO.includes(futebol.controlePagamento)) {
    throw new TypeError("Controle de pagamento inválido.");
  }
  if (typeof futebol.controlaPresenca !== "boolean") {
    throw new TypeError("Controle de presença inválido.");
  }
  if (
    futebol.frequencia != null &&
    !FREQUENCIAS.includes(futebol.frequencia)
  ) {
    throw new TypeError("Frequência inválida.");
  }
  if (
    !Array.isArray(futebol.diasSemana) ||
    futebol.diasSemana.some(
      (dia) => !Number.isSafeInteger(dia) || dia < 0 || dia > 6,
    ) ||
    new Set(futebol.diasSemana).size !== futebol.diasSemana.length
  ) {
    throw new RangeError("Dias da semana inválidos.");
  }
  if (
    futebol.horario != null &&
    (typeof futebol.horario !== "string" ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(futebol.horario))
  ) {
    throw new TypeError(`Horário inválido: ${String(futebol.horario)}.`);
  }
  if (
    typeof futebol.dataCriacao !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(futebol.dataCriacao)
  ) {
    throw new TypeError("Data de criação inválida.");
  }

  const quantidadeJogadores = validarInteiro(
    futebol.quantidadeJogadores,
    "Quantidade de jogadores",
    1,
    100,
  );
  const quantidadeMensalistas =
    futebol.quantidadeMensalistas == null
      ? null
      : validarInteiro(
          futebol.quantidadeMensalistas,
          "Quantidade de mensalistas",
          1,
          100,
        );
  const quantidadeAvulsos =
    futebol.quantidadeAvulsos == null
      ? null
      : validarInteiro(
          futebol.quantidadeAvulsos,
          "Quantidade de avulsos",
          0,
          100,
        );
  if (
    futebol.tipoCadastro === "basico"
      ? quantidadeJogadores < 2 ||
        quantidadeMensalistas !== null ||
        quantidadeAvulsos !== null
      : quantidadeMensalistas === null ||
        quantidadeAvulsos === null ||
        quantidadeMensalistas + quantidadeAvulsos !== quantidadeJogadores ||
        (futebol.tipoCadastro === "so_mensalistas" &&
          quantidadeAvulsos !== 0)
  ) {
    throw new RangeError("As quantidades de jogadores não correspondem ao cadastro.");
  }

  const normalizado: Futebol = {
    ...futebol,
    quantidadeJogadores,
    quantidadeMensalistas,
    quantidadeAvulsos,
    diasSemana: [...futebol.diasSemana].sort((a, b) => a - b),
    frequencia: futebol.frequencia ?? null,
    horario: futebol.horario ?? null,
    valorQuadraCentavos: validarCentavos(
      futebol.valorQuadraCentavos,
      "Valor da quadra",
    ),
    mensalidadeCentavos: validarCentavos(
      futebol.mensalidadeCentavos,
      "Mensalidade",
    ),
    mensalidadeSugeridaCentavos: validarCentavos(
      futebol.mensalidadeSugeridaCentavos,
      "Mensalidade sugerida",
    ),
    avulsoEscolhidoCentavos: validarCentavos(
      futebol.avulsoEscolhidoCentavos,
      "Valor avulso",
    ),
    avulsoSugeridoCentavos: validarCentavos(
      futebol.avulsoSugeridoCentavos,
      "Valor avulso sugerido",
    ),
    nomeQuadra: normalizarTextoOpcional(futebol.nomeQuadra, "Nome da quadra"),
    endereco: normalizarTextoOpcional(futebol.endereco, "Endereço"),
  };
  const controlaMensalistas =
    normalizado.controlePagamento === "mensalistas" ||
    normalizado.controlePagamento === "ambos";
  const controlaAvulsos =
    normalizado.controlePagamento === "avulsos" ||
    normalizado.controlePagamento === "ambos";
  if (
    (normalizado.tipoCadastro === "basico" &&
      normalizado.controlePagamento !== "nenhum") ||
    (normalizado.tipoCadastro === "so_mensalistas" && controlaAvulsos) ||
    (normalizado.controlePagamento !== "nenhum" &&
      normalizado.valorQuadraCentavos === null) ||
    (controlaMensalistas && normalizado.mensalidadeCentavos === null) ||
    (controlaAvulsos && normalizado.avulsoEscolhidoCentavos === null)
  ) {
    throw new RangeError("Os dados financeiros não correspondem ao cadastro.");
  }
  return normalizado;
}

function normalizarJogadores(
  jogadores: readonly NovoJogador[],
): NovoJogador[] {
  if (jogadores.length < 2 || jogadores.length > 100) {
    throw new RangeError("Cadastre entre 2 e 100 jogadores.");
  }
  const normalizados: NovoJogador[] = [];
  for (const jogador of jogadores) {
    if (typeof jogador.nome !== "string") {
      throw new TypeError("Nome de jogador deve ser um texto.");
    }
    if (!TIPOS_JOGADOR.includes(jogador.tipo)) {
      throw new TypeError(`Tipo de jogador inválido: ${String(jogador.tipo)}.`);
    }
    if (
      jogador.posicao != null &&
      !POSICOES.includes(jogador.posicao)
    ) {
      throw new TypeError(`Posição inválida: ${String(jogador.posicao)}.`);
    }
    if (jogador.nivel != null && !NIVEIS.includes(jogador.nivel)) {
      throw new TypeError(`Nível inválido: ${String(jogador.nivel)}.`);
    }
    if (jogador.vinculo != null && !VINCULOS.includes(jogador.vinculo)) {
      throw new TypeError(`Vínculo inválido: ${String(jogador.vinculo)}.`);
    }

    const candidato: NovoJogador = {
      nome: normalizarNomeJogador(jogador.nome),
      tipo: jogador.tipo,
      ...(jogador.posicao != null ? { posicao: jogador.posicao } : {}),
      ...(jogador.nivel != null ? { nivel: jogador.nivel } : {}),
      ...(jogador.vinculo != null ? { vinculo: jogador.vinculo } : {}),
    };
    const resultado = validarNovoJogador(candidato, normalizados);
    if (!resultado.valido) {
      throw new Error(
        `Jogador inválido (${resultado.motivo}): ${JSON.stringify(candidato)}.`,
      );
    }
    normalizados.push({ ...candidato, nome: resultado.nome });
  }
  return normalizados;
}

async function executarEtapa<T>(
  etapa: string,
  sql: string,
  parametros: readonly unknown[],
  executar: () => Promise<T>,
): Promise<T> {
  try {
    return await executar();
  } catch (erro: unknown) {
    if (__DEV__) {
      console.error(
        `Concluir cadastro: falha na etapa "${etapa}".`,
        { sql, parametros },
        erro,
      );
    }
    throw erro;
  }
}

export function concluirCadastroCompleto(
  futebol: Futebol,
  jogadores: readonly NovoJogador[],
): Promise<ResultadoBanco<void>> {
  return executarComResultado(
    "Concluir cadastro",
    "Não foi possível concluir o cadastro. Tente novamente.",
    async () => {
      const futebolNormalizado = normalizarFutebol(futebol);
      const jogadoresNormalizados = normalizarJogadores(jogadores);
      const db = await getDb();
      await db.withTransactionAsync(async () => {
        const parametrosFutebol = [
          futebolNormalizado.quantidadeJogadores,
          futebolNormalizado.quantidadeMensalistas,
          futebolNormalizado.quantidadeAvulsos,
          futebolNormalizado.tipoCadastro,
          futebolNormalizado.controlaPresenca ? 1 : 0,
          futebolNormalizado.controlePagamento,
          futebolNormalizado.valorQuadraCentavos ?? null,
          futebolNormalizado.mensalidadeCentavos ?? null,
          futebolNormalizado.mensalidadeSugeridaCentavos ?? null,
          futebolNormalizado.avulsoEscolhidoCentavos ?? null,
          futebolNormalizado.avulsoSugeridoCentavos ?? null,
          futebolNormalizado.nomeQuadra ?? null,
          futebolNormalizado.endereco ?? null,
          futebolNormalizado.diasSemana.length > 0
            ? futebolNormalizado.diasSemana.join(",")
            : null,
          futebolNormalizado.frequencia ?? null,
          futebolNormalizado.horario ?? null,
          futebolNormalizado.dataCriacao,
        ] as const;
        await executarEtapa(
          "salvar futebol",
          SQL_SALVAR_FUTEBOL,
          parametrosFutebol,
          () => db.runAsync(SQL_SALVAR_FUTEBOL, ...parametrosFutebol),
        );

        for (const jogador of jogadoresNormalizados) {
          const parametrosJogador = [
            jogador.nome,
            normalizarNomeJogador(jogador.nome).toLowerCase(),
            jogador.tipo,
            jogador.tipo === "goleiro" ? "goleiro" : jogador.posicao ?? null,
            jogador.nivel ?? null,
            jogador.vinculo ?? null,
            futebolNormalizado.dataCriacao,
          ] as const;
          await executarEtapa(
            "salvar jogador",
            SQL_SALVAR_JOGADOR,
            parametrosJogador,
            () => db.runAsync(SQL_SALVAR_JOGADOR, ...parametrosJogador),
          );
        }
        await executarEtapa(
          "marcar configuração concluída",
          SQL_MARCAR_SETUP_CONCLUIDO,
          ["setup_done", "1"],
          () => db.runAsync(SQL_MARCAR_SETUP_CONCLUIDO),
        );
      });
    },
  );
}

export function resetarDados(): Promise<ResultadoBanco<void>> {
  return executarComResultado(
    "Resetar dados de desenvolvimento",
    "Não foi possível resetar os dados.",
    async () => {
      const db = await getDb();
      await db.withTransactionAsync(async () => {
        await db.execAsync(
          "DELETE FROM presencas; DELETE FROM jogadores; DELETE FROM futebol; DELETE FROM app_config;",
        );
      });
    },
  );
}
