import type { Jogador, NovoJogador, ResultadoLeituraLista, Vinculo } from "@/types";
import {
  normalizarNomeJogador,
  validarNovoJogador,
} from "@/lib/jogadores";

type Secao = "goleiros" | "jogadores" | null;

/**
 * Limpa o nome removendo numeração no início (ex: "1.", "01 -", "1)"),
 * prefixos de lista ("-", "*", "•") e emojis comuns.
 */
function limparNomeLinha(linha: string): { nomeLimpo: string; ehGoleiroPeloNome: boolean } {
  let texto = linha.trim();

  // Verifica se há marcação de goleiro no nome: (G), (GL), (Goleiro), 🧤
  const ehGoleiroPeloNome = /\b(g|gl|goleiro|gol)\b/i.test(texto) || texto.includes("🧤");

  // Remove marcações de goleiro
  texto = texto.replace(/\s*\((?:g|gl|goleiro|gol)\)/gi, "");
  texto = texto.replace(/\s*-(?:g|gl|goleiro|gol)/gi, "");
  texto = texto.replace(/🧤/g, "");

  // Remove numeração no início: "1.", "1 -", "01)", "1:", etc.
  texto = texto.replace(/^\s*\d+[\.\-\)\:\s]+\s*/, "");

  // Remove bullets: "-", "–", "•", "*", "⚽"
  texto = texto.replace(/^\s*[-–•*⚽]+\s*/, "");

  return { nomeLimpo: texto.trim(), ehGoleiroPeloNome };
}

export function lerListaJogadores(
  texto: string,
  jogadoresExistentes: readonly Jogador[] = [],
  vinculo?: Vinculo,
): ResultadoLeituraLista {
  const resultado: ResultadoLeituraLista = {
    goleiros: [],
    jogadores: [],
    ordem: [],
    repetidos: 0,
    linhasIgnoradas: 0,
  };
  let secao: Secao = null;

  for (const linha of texto.split(/\r?\n/)) {
    const conteudo = linha.trim();
    if (!conteudo) continue;

    const cabecalho = conteudo.toLowerCase().replace(/[:：]/g, "").trim();

    if (
      cabecalho === "goleiros" ||
      cabecalho === "goleiro" ||
      cabecalho.startsWith("goleiro") ||
      cabecalho.includes("🧤")
    ) {
      secao = "goleiros";
      continue;
    }
    if (
      cabecalho === "jogadores" ||
      cabecalho === "jogador" ||
      cabecalho === "linha" ||
      cabecalho.startsWith("jogadores") ||
      cabecalho.startsWith("linha") ||
      cabecalho.includes("⚽")
    ) {
      secao = "jogadores";
      continue;
    }

    // Ignora linhas de cabeçalho comuns como "Lista de confirmação", "Jogo de quarta", etc.
    if (
      /^(lista|confirmad|jogo|futebol|data|hor[aá]rio|local|quadra|campo|mensalistas|avulsos)/i.test(
        conteudo,
      ) &&
      !/^\d+/.test(conteudo) &&
      !/^[-–•*]/.test(conteudo)
    ) {
      resultado.linhasIgnoradas += 1;
      continue;
    }

    const { nomeLimpo, ehGoleiroPeloNome } = limparNomeLinha(conteudo);
    const nome = normalizarNomeJogador(nomeLimpo);

    if (!nome || nome.length < 2) {
      resultado.linhasIgnoradas += 1;
      continue;
    }

    // Se estiver na seção de goleiros ou o nome tiver (G), define como goleiro
    const tipoFinal = (secao === "goleiros" || ehGoleiroPeloNome) ? "goleiro" : "linha";

    const jogador: NovoJogador = {
      nome,
      tipo: tipoFinal,
      ...(tipoFinal === "goleiro" ? { posicao: "goleiro" as const } : {}),
      ...(vinculo ? { vinculo } : {}),
    };

    const validacao = validarNovoJogador(jogador, [
      ...jogadoresExistentes,
      ...resultado.ordem,
    ]);
    if (!validacao.valido) {
      resultado.repetidos += 1;
      continue;
    }

    const jogadorNormalizado: NovoJogador = {
      ...jogador,
      nome: validacao.nome,
    };
    resultado.ordem.push(jogadorNormalizado);
    if (tipoFinal === "goleiro") {
      resultado.goleiros.push(jogadorNormalizado);
    } else {
      resultado.jogadores.push(jogadorNormalizado);
    }
  }

  return resultado;
}
