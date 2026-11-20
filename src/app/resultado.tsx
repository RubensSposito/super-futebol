import { useEffect, useMemo, useState } from "react";
import { Alert, Share } from "react-native";
import { useRouter } from "expo-router";
import { ImportarTimesSheet, ResultadoPartida } from "@/components/organisms";
import { TelaBase } from "@/components/templates";
import { salvarSorteioBanco } from "@/db";
import { formatarCabecalhoData, obterDataLocal } from "@/lib/datas";
import { dividirTimes, sugerirTamanhoTime } from "@/lib/times";
import { useSorteioStore } from "@/store";
import type { Jogador, ResultadoDivisaoTimes, TimeFormado } from "@/types";

export default function Resultado() {
  const router = useRouter();
  const jogadores = useSorteioStore((state) => state.jogadores);
  const rotuloOrigem = useSorteioStore((state) => state.rotulo);
  const tamanhoSalvo = useSorteioStore((state) => state.jogadoresPorTime);
  const timesSalvos = useSorteioStore((state) => state.quantidadeTimes);
  const futebolId = useSorteioStore((state) => state.futebolId);
  const dataJogo = useSorteioStore((state) => state.dataJogo);
  const sorteioSalvoStore = useSorteioStore((state) => state.sorteioSalvo);
  const definirSorteioSalvo = useSorteioStore((state) => state.definirSorteioSalvo);

  const tamanhoAutomatico = Math.max(
    2,
    Math.min(jogadores.length || 2, sugerirTamanhoTime(jogadores.length)),
  );
  const tamanhoInicialValido =
    tamanhoSalvo !== null &&
    tamanhoSalvo >= 2 &&
    tamanhoSalvo <= jogadores.length;
  const timesInicialValido =
    timesSalvos !== null &&
    timesSalvos >= 2 &&
    timesSalvos <= jogadores.length;

  const [sementeSorteio] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [contadorSorteios, setContadorSorteios] = useState(0);
  const [modoAutomatico, setModoAutomatico] = useState(
    tamanhoSalvo === null && timesSalvos === null,
  );
  const [tamanhoDigitado, setTamanhoDigitado] = useState(
    String(tamanhoSalvo ?? tamanhoAutomatico),
  );
  const [tamanhoValido, setTamanhoValido] = useState(
    tamanhoInicialValido ? tamanhoSalvo : tamanhoAutomatico,
  );
  const [tamanhoInformado, setTamanhoInformado] = useState(tamanhoInicialValido);
  const [textoTimes, setTextoTimes] = useState(
    timesSalvos === null ? "" : String(timesSalvos),
  );
  const [timesValido, setTimesValido] = useState<number | undefined>(
    timesInicialValido ? timesSalvos : undefined,
  );
  const [timesInformados, setTimesInformados] = useState(timesInicialValido);
  const [erroTamanho, setErroTamanho] = useState<string | null>(
    tamanhoSalvo !== null && !tamanhoInicialValido
      ? `Informe um número entre 2 e ${jogadores.length}.`
      : null,
  );
  const [erroTimes, setErroTimes] = useState<string | null>(
    timesSalvos !== null && !timesInicialValido
      ? `Informe um número entre 2 e ${jogadores.length}.`
      : null,
  );
  const [equilibrarPorNivel, setEquilibrarPorNivel] = useState(true);
  const temNivel = jogadores.some((jogador) => jogador.nivel !== undefined);

  // Armazena customizações manuais (trocas de jogadores ou importação de times)
  const [resultadoCustomizado, setResultadoCustomizado] =
    useState<ResultadoDivisaoTimes | null>(sorteioSalvoStore ?? null);
  const [jogadorSelecionado, setJogadorSelecionado] = useState<Jogador | null>(
    null,
  );
  const [importarVisivel, setImportarVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  useEffect(() => {
    if (sorteioSalvoStore) {
      setResultadoCustomizado(sorteioSalvoStore);
    }
  }, [sorteioSalvoStore]);

  const resultadoCalculado = useMemo(
    () =>
      dividirTimes(
        jogadores,
        modoAutomatico || !tamanhoInformado ? null : tamanhoValido,
        criarGeradorAleatorio(sementeSorteio + contadorSorteios),
        modoAutomatico || !timesInformados ? undefined : timesValido,
        equilibrarPorNivel,
      ),
    [
      jogadores,
      modoAutomatico,
      tamanhoInformado,
      tamanhoValido,
      timesInformados,
      timesValido,
      equilibrarPorNivel,
      contadorSorteios,
      sementeSorteio,
    ],
  );

  const resultadoAtual = resultadoCustomizado ?? resultadoCalculado;
  const rotulo = `${rotuloOrigem} · ${resultadoAtual.totais.jogadores} jogadores`;

  function alterarTamanho(valor: string) {
    setResultadoCustomizado(null);
    setMensagemSucesso(null);
    setTamanhoDigitado(valor);
    if (valor.trim() === "") {
      setTamanhoInformado(false);
      setErroTamanho(null);
      setTextoTimes("");
      setTimesValido(undefined);
      setTimesInformados(false);
      setErroTimes(null);
      setContadorSorteios((contador) => contador + 1);
      return;
    }
    const tamanho = Number(valor);
    if (
      !/^\d+$/.test(valor) ||
      !Number.isInteger(tamanho) ||
      tamanho < 2 ||
      tamanho > jogadores.length
    ) {
      setErroTamanho(`Use um número de 2 a ${jogadores.length}.`);
      return;
    }
    setErroTamanho(null);
    setTamanhoValido(tamanho);
    setTamanhoInformado(true);
    setTextoTimes("");
    setTimesValido(undefined);
    setTimesInformados(false);
    setErroTimes(null);
    setContadorSorteios((contador) => contador + 1);
  }

  function alterarTimes(valor: string) {
    setResultadoCustomizado(null);
    setMensagemSucesso(null);
    setTextoTimes(valor);
    if (valor.trim() === "") {
      setTimesValido(undefined);
      setTimesInformados(false);
      setErroTimes(null);
      setContadorSorteios((contador) => contador + 1);
      return;
    }
    const quantidade = Number(valor);
    if (
      !/^\d+$/.test(valor) ||
      !Number.isInteger(quantidade) ||
      quantidade < 2 ||
      quantidade > jogadores.length
    ) {
      setErroTimes(`Use um número de 2 a ${jogadores.length}.`);
      return;
    }
    setErroTimes(null);
    setTimesValido(quantidade);
    setTimesInformados(true);
    setContadorSorteios((contador) => contador + 1);
  }

  function alterarModoAutomatico(ativado: boolean) {
    setResultadoCustomizado(null);
    setMensagemSucesso(null);
    setModoAutomatico(ativado);
    setErroTamanho(null);
    setErroTimes(null);
    if (ativado) {
      setTamanhoDigitado(String(tamanhoAutomatico));
      setTamanhoValido(tamanhoAutomatico);
      setTamanhoInformado(false);
      setTextoTimes("");
      setTimesValido(undefined);
      setTimesInformados(false);
    } else {
      setTamanhoDigitado(String(tamanhoValido));
      setTamanhoInformado(false);
      setTextoTimes("");
      setTimesValido(undefined);
      setTimesInformados(false);
    }
    setContadorSorteios((contador) => contador + 1);
  }

  function realizarNovoSorteio() {
    setResultadoCustomizado(null);
    setJogadorSelecionado(null);
    setMensagemSucesso(null);
    setContadorSorteios((c) => c + 1);
  }

  // Lógica de Swap / Troca manual entre jogadores
  function selecionarOuTrocarJogador(jogadorTocado: Jogador) {
    if (!jogadorSelecionado) {
      setJogadorSelecionado(jogadorTocado);
      return;
    }

    if (jogadorSelecionado.id === jogadorTocado.id) {
      setJogadorSelecionado(null);
      return;
    }

    const jogadorA = jogadorSelecionado;
    const jogadorB = jogadorTocado;

    // Clona os times e reservas atuais
    const novosTimes: TimeFormado[] = resultadoAtual.times.map((t) => ({
      numero: t.numero,
      goleiro: t.goleiro ? { ...t.goleiro } : undefined,
      jogadoresLinha: t.jogadoresLinha.map((j) => ({ ...j })),
      vagaExtraGoleiro: t.vagaExtraGoleiro,
    }));
    const novasReservas: Jogador[] = resultadoAtual.reservas.map((r) => ({ ...r }));

    // Localiza e substitui o jogador A por B e vice-versa
    function substituirEmTime(jAntigo: Jogador, jNovo: Jogador) {
      for (const time of novosTimes) {
        if (time.goleiro && time.goleiro.id === jAntigo.id) {
          time.goleiro = jNovo;
          return;
        }
        const indexLinha = time.jogadoresLinha.findIndex((j) => j.id === jAntigo.id);
        if (indexLinha >= 0) {
          time.jogadoresLinha[indexLinha] = jNovo;
          return;
        }
      }
      const indexReserva = novasReservas.findIndex((j) => j.id === jAntigo.id);
      if (indexReserva >= 0) {
        novasReservas[indexReserva] = jNovo;
      }
    }

    substituirEmTime(jogadorA, jogadorB);
    substituirEmTime(jogadorB, jogadorA);

    const novoResultado: ResultadoDivisaoTimes = {
      ...resultadoAtual,
      times: novosTimes,
      reservas: novasReservas,
    };

    setResultadoCustomizado(novoResultado);
    setJogadorSelecionado(null);
    setMensagemSucesso(`⇄ ${jogadorA.nome} trocado com ${jogadorB.nome}!`);
  }

  async function salvarTimes() {
    if (!futebolId || !dataJogo) {
      Alert.alert(
        "Aviso",
        "Este sorteio é de partida rápida (avulsa) e não está vinculado a um futebol salvo.",
      );
      return;
    }
    setSalvando(true);
    setMensagemSucesso(null);
    const resultado = await salvarSorteioBanco(futebolId, dataJogo, resultadoAtual);
    setSalvando(false);
    if (!resultado.sucesso) {
      Alert.alert("Erro ao salvar", resultado.mensagem);
      return;
    }
    definirSorteioSalvo(resultadoAtual);
    setMensagemSucesso(`✅ Times salvos para o jogo de ${formatarCabecalhoData(dataJogo)}!`);
  }

  async function compartilharTimes() {
    const dataTexto = dataJogo ? formatarCabecalhoData(dataJogo) : obterDataLocal();
    let texto = `⚽ *TIMES SORTEADOS* - ${dataTexto}\n${rotuloOrigem}\n\n`;

    resultadoAtual.times.forEach((time) => {
      texto += `🟢 *TIME ${time.numero}*\n`;
      if (time.goleiro) {
        texto += `🧤 Goleiro: ${time.goleiro.nome}\n`;
      }
      time.jogadoresLinha.forEach((j) => {
        texto += `• ${j.nome}\n`;
      });
      texto += "\n";
    });

    if (resultadoAtual.reservas.length > 0) {
      texto += `👥 *RESERVAS*\n`;
      resultadoAtual.reservas.forEach((r, idx) => {
        texto += `${idx + 1}. ${r.nome}\n`;
      });
      texto += "\n";
    }

    texto += `Gerado pelo Super Futebol ⚽`;

    try {
      await Share.share({ message: texto });
    } catch {
      Alert.alert("Erro", "Não foi possível abrir o compartilhamento.");
    }
  }

  return (
    <TelaBase>
      <ResultadoPartida
        rotulo={rotulo}
        onVoltar={() => router.back()}
        resultado={resultadoAtual}
        modoAutomatico={modoAutomatico}
        tamanhoEmUso={tamanhoValido}
        timesEmUso={resultadoAtual.N}
        textoTimes={textoTimes}
        onTextoTimesChange={alterarTimes}
        onLimparTimes={() => alterarTimes("")}
        erroTimes={erroTimes}
        tamanhoDigitado={tamanhoDigitado}
        erroTamanho={erroTamanho}
        onTamanhoChange={alterarTamanho}
        onLimparTamanho={() => alterarTamanho("")}
        onModoAutomaticoChange={alterarModoAutomatico}
        onSortearNovamente={realizarNovoSorteio}
        temNivel={temNivel}
        equilibrarPorNivel={equilibrarPorNivel}
        onEquilibrarPorNivelChange={(valor) => {
          setEquilibrarPorNivel(valor);
          setContadorSorteios((contador) => contador + 1);
        }}
        jogadorSelecionadoId={jogadorSelecionado?.id}
        onSelecionarJogador={selecionarOuTrocarJogador}
        onCancelarTroca={() => setJogadorSelecionado(null)}
        onSalvarTimes={() => void salvarTimes()}
        salvandoTimes={salvando}
        podeSalvar={Boolean(futebolId && dataJogo)}
        onCompartilhar={() => void compartilharTimes()}
        onAbrirImportar={() => setImportarVisivel(true)}
        mensagemSucesso={mensagemSucesso}
      />

      <ImportarTimesSheet
        visivel={importarVisivel}
        jogadoresExistentes={jogadores}
        onCancelar={() => setImportarVisivel(false)}
        onImportado={(resultadoImportado) => {
          setResultadoCustomizado(resultadoImportado);
          setMensagemSucesso("✅ Times importados com sucesso!");
        }}
      />
    </TelaBase>
  );
}

function criarGeradorAleatorio(sementeInicial: number): () => number {
  let semente = sementeInicial >>> 0;
  return () => {
    semente = (semente * 1_664_525 + 1_013_904_223) >>> 0;
    return semente / 0x1_0000_0000;
  };
}

