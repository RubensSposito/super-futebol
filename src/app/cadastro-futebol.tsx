/* eslint-disable react-hooks/refs -- Existing navigation/animation refs or derived UI state are intentionally read in render/effects. */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Stack,
  useLocalSearchParams,
  usePreventRemove,
  useRouter,
} from "expo-router";
import { Botao, Texto } from "@/components/atoms";
import { CampoComRotulo, CampoMoeda, SeletorDeOpcoes } from "@/components/molecules";
import {
  CartaoQuadraEAgenda,
  CampoValorComSugestao,
  CartaoSaldoDoMes,
  ResumoFinanceiro,
} from "@/components/organisms";
import { TelaBase } from "@/components/templates";
import {
  CONTROLES_PAGAMENTO_MENSALISTAS,
  CONTROLES_PAGAMENTO_MISTO,
  TIPOS_CADASTRO,
} from "@/constants";
import {
  calcularResumoFinanceiro,
  calcularJogosPorMes,
  formatarMoedaPtBr,
  lerMoedaPtBr,
} from "@/lib/financeiro";
import { obterDataLocal, obterJogoAtivo } from "@/lib/datas";
import { useDadosPersistidosStore, useRascunhoCadastroStore, expandirRascunhoFutebol } from "@/store";
import { atualizarFutebol, carregarDadosHome, nomeFutebolDisponivel } from "@/db";
import { borders, colors, radii, spacing } from "@/theme";
import { normalizarNomeFutebol } from "@/lib/futebols";
import type {
  ControlePagamento,
  AgendaFutebol,
  RascunhoFutebol,
  TipoCadastro,
  Futebol,
  Jogador,
} from "@/types";

const PADRAO: RascunhoFutebol = {
  nome: "",
  quantidadeJogadores: 14,
  quantidadeMensalistas: null,
  quantidadeAvulsos: null,
  tipoCadastro: "basico",
  controlaPresenca: true,
  controlePagamento: "nenhum",
  agenda: {
    diasSemana: [],
    frequencia: null,
    horario: null,
    vencimentoQuadra: "",
  },
  jogadoresPorTime: null,
  quantidadeTimes: null,
  valorQuadraCentavos: null,
  mensalidadeSugeridaCentavos: null,
  mensalidadeCentavos: null,
  avulsoEscolhidoCentavos: null,
  avulsoSugeridoCentavos: null,
  nomeQuadra: null,
  endereco: null,
};

const OPCOES_PRESENCA = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
] as const;

function inteiro(valor: string): number | null {
  if (!/^\d+$/.test(valor.trim())) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) ? numero : null;
}

function valorTexto(centavos: number | null): string {
  return centavos === null ? "" : formatarMoedaPtBr(centavos);
}

function erroQuantidade(valor: number | null, minimo: number): string | null {
  if (valor === null || valor < minimo) {
    return minimo === 0 ? "Informe zero ou mais." : `Informe pelo menos ${minimo}.`;
  }
  if (valor > 100) return "O limite é 100 jogadores.";
  return null;
}

function erroMoeda(valor: string): string | null {
  const centavos = lerMoedaPtBr(valor);
  return centavos === null || centavos <= 0 || centavos > 9_999_999
    ? "Informe um valor maior que zero."
    : null;
}

function assinaturaFormulario(
  nomeFutebol: string,
  tipoCadastro: TipoCadastro,
  quantidadeBasica: string,
  mensalistas: string,
  avulsos: string,
  controlaPresenca: boolean,
  controlePagamento: ControlePagamento,
  agenda: AgendaFutebol,
  valorQuadra: string,
  mensalidade: string,
  avulso: string,
  nomeQuadra: string,
  endereco: string,
  jogadoresPorTime = "",
  quantidadeTimes = "",
): string {
  return JSON.stringify([
    nomeFutebol.trim(),
    tipoCadastro,
    quantidadeBasica,
    mensalistas,
    avulsos,
    controlaPresenca,
    controlePagamento,
    agenda.vencimentoQuadra,
    valorQuadra,
    mensalidade,
    avulso,
    nomeQuadra.trim(),
    endereco.trim(),
    [...agenda.diasSemana].sort((a, b) => a - b),
    agenda.frequencia,
    agenda.horario,
    jogadoresPorTime,
    quantidadeTimes,
  ]);
}

function assinaturaFutebol(futebol: Futebol): string {
  return assinaturaFormulario(
    futebol.nome,
    futebol.tipoCadastro,
    futebol.tipoCadastro === "basico"
      ? String(futebol.quantidadeJogadores)
      : "",
    futebol.quantidadeMensalistas === null
      ? ""
      : String(futebol.quantidadeMensalistas),
    futebol.quantidadeAvulsos === null
      ? ""
      : String(futebol.quantidadeAvulsos),
    futebol.controlaPresenca,
    futebol.controlePagamento,
    {
      diasSemana: futebol.diasSemana,
      frequencia: futebol.frequencia,
      horario: futebol.horario,
      vencimentoQuadra: futebol.vencimentoQuadra,
    },
    valorTexto(futebol.valorQuadraCentavos),
    valorTexto(futebol.mensalidadeCentavos),
    valorTexto(futebol.avulsoEscolhidoCentavos),
    futebol.nomeQuadra ?? "",
    futebol.endereco ?? "",
    futebol.jogadoresPorTime === null ? "" : String(futebol.jogadoresPorTime),
    futebol.quantidadeTimes === null ? "" : String(futebol.quantidadeTimes),
  );
}

function resumoConversaoVinculos(
  tipoAnterior: TipoCadastro,
  tipoNovo: TipoCadastro,
  jogadores: readonly Jogador[],
): string {
  if (tipoAnterior === "mensalistas_e_avulsos" && tipoNovo === "so_mensalistas") {
    const avulsos = jogadores.filter(
      (jogador) => jogador.vinculo === "avulso",
    ).length;
    return `${avulsos} ${avulsos === 1 ? "avulso será convertido" : "avulsos serão convertidos"} em mensalistas.`;
  }
  if (tipoNovo === "basico") {
    const vinculados = jogadores.filter(
      (jogador) => jogador.vinculo !== undefined,
    ).length;
    return `${vinculados} ${vinculados === 1 ? "vínculo será removido" : "vínculos serão removidos"} dos jogadores.`;
  }
  const semVinculo = jogadores.filter(
    (jogador) => jogador.vinculo === undefined,
  ).length;
  return `${semVinculo} ${semVinculo === 1 ? "jogador sem vínculo passará" : "jogadores sem vínculo passarão"} a mensalistas.`;
}

export default function CadastroFutebol() {
  const router = useRouter();
  const parametros = useLocalSearchParams<{ modo?: string }>();
  const modoEdicao = parametros.modo === "edicao";
  const carregarDadosSalvos = useDadosPersistidosStore(
    (state) => state.carregar,
  );
  const futebolAtivoId = useDadosPersistidosStore((state) => state.futebolAtivoId);
  const rascunhoSalvo = useRascunhoCadastroStore((state) => state.futebol);
  const salvarFutebol = useRascunhoCadastroStore((state) => state.salvarFutebol);
  const inicial = rascunhoSalvo ?? PADRAO;
  const [nomeFutebol, setNomeFutebol] = useState(inicial.nome);
  const [erroNomeFutebol, setErroNomeFutebol] = useState<string | null>(null);
  const [tipoCadastro, setTipoCadastro] = useState<TipoCadastro>(
    inicial.tipoCadastro,
  );
  const [quantidadeBasicaTexto, setQuantidadeBasicaTexto] = useState(
    inicial.tipoCadastro === "basico"
      ? String(inicial.quantidadeJogadores)
      : "",
  );
  const [mensalistasTexto, setMensalistasTexto] = useState(
    inicial.quantidadeMensalistas === null
      ? ""
      : String(inicial.quantidadeMensalistas),
  );
  const [avulsosTexto, setAvulsosTexto] = useState(
    inicial.quantidadeAvulsos === null
      ? ""
      : String(inicial.quantidadeAvulsos),
  );
  const [controlaPresenca, setControlaPresenca] = useState(
    inicial.controlaPresenca,
  );
  const [controlePagamento, setControlePagamento] =
    useState<ControlePagamento>(inicial.controlePagamento);
  const [jogadoresPorTimeTexto, setJogadoresPorTimeTexto] = useState(inicial.jogadoresPorTime ? String(inicial.jogadoresPorTime) : "");
  const [quantidadeTimesTexto, setQuantidadeTimesTexto] = useState(inicial.quantidadeTimes ? String(inicial.quantidadeTimes) : "");
  const [valorQuadraTexto, setValorQuadraTexto] = useState(
    valorTexto(inicial.valorQuadraCentavos),
  );
  const [mensalidadeTexto, setMensalidadeTexto] = useState(
    valorTexto(inicial.mensalidadeCentavos),
  );
  const [avulsoTexto, setAvulsoTexto] = useState(
    valorTexto(inicial.avulsoEscolhidoCentavos),
  );
  const [mensalidadeCustomizada, setMensalidadeCustomizada] = useState(
    inicial.mensalidadeCentavos !== null &&
      inicial.mensalidadeCentavos !== inicial.mensalidadeSugeridaCentavos,
  );
  const [avulsoCustomizado, setAvulsoCustomizado] = useState(
    inicial.avulsoEscolhidoCentavos !== null &&
      inicial.avulsoEscolhidoCentavos !== inicial.avulsoSugeridoCentavos,
  );
  const [nomeQuadra, setNomeQuadra] = useState(inicial.nomeQuadra ?? "");
  const [endereco, setEndereco] = useState(inicial.endereco ?? "");
  const [agenda, setAgenda] = useState<AgendaFutebol>(inicial.agenda);
  const [carregandoEdicao, setCarregandoEdicao] = useState(modoEdicao);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);
  const [jogadoresSalvos, setJogadoresSalvos] = useState<Jogador[]>([]);
  const assinaturaInicialRef = useRef<string | null>(null);
  const tipoInicialRef = useRef<TipoCadastro | null>(null);
  const edicaoConcluidaRef = useRef(false);
  const desabilitarProtecaoRemocaoRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!modoEdicao) return;
    edicaoConcluidaRef.current = false;
    let ativo = true;
    void (async () => {
      if (futebolAtivoId === null) { setErroEdicao("Não foi possível encontrar o futebol ativo."); setCarregandoEdicao(false); return; }
      const resultado = await carregarDadosHome(futebolAtivoId, obterDataLocal());
      if (!ativo) return;
      if (!resultado.sucesso || !resultado.dados.futebol) {
        setErroEdicao(
          resultado.sucesso
            ? "Não foi possível encontrar as informações do futebol."
            : resultado.mensagem,
        );
        setCarregandoEdicao(false);
        return;
      }

      const futebol = resultado.dados.futebol;
      setNomeFutebol(futebol.nome);
      setTipoCadastro(futebol.tipoCadastro);
      setQuantidadeBasicaTexto(
        futebol.tipoCadastro === "basico"
          ? String(futebol.quantidadeJogadores)
          : "",
      );
      setMensalistasTexto(
        futebol.quantidadeMensalistas === null
          ? ""
          : String(futebol.quantidadeMensalistas),
      );
      setAvulsosTexto(
        futebol.quantidadeAvulsos === null
          ? ""
          : String(futebol.quantidadeAvulsos),
      );
      setControlaPresenca(futebol.controlaPresenca);
      setControlePagamento(futebol.controlePagamento);
      setJogadoresPorTimeTexto(futebol.jogadoresPorTime ? String(futebol.jogadoresPorTime) : "");
      setQuantidadeTimesTexto(futebol.quantidadeTimes ? String(futebol.quantidadeTimes) : "");
      setValorQuadraTexto(valorTexto(futebol.valorQuadraCentavos));
      setMensalidadeTexto(valorTexto(futebol.mensalidadeCentavos));
      setAvulsoTexto(valorTexto(futebol.avulsoEscolhidoCentavos));
      const resumoCalculado = futebol.valorQuadraCentavos !== null &&
        futebol.quantidadeMensalistas !== null &&
        futebol.quantidadeMensalistas > 0 &&
        futebol.quantidadeAvulsos !== null &&
        futebol.quantidadeAvulsos >= 0
        ? calcularResumoFinanceiro(
            futebol.valorQuadraCentavos,
            futebol.quantidadeMensalistas,
            futebol.quantidadeAvulsos,
            null,
            null,
            calcularJogosPorMes(futebol.frequencia, futebol.diasSemana),
          )
        : null;
      setMensalidadeCustomizada(
        futebol.mensalidadeCentavos !== null &&
          futebol.mensalidadeCentavos !==
            resumoCalculado?.mensalidadeSugeridaCentavos,
      );
      setAvulsoCustomizado(
        futebol.avulsoEscolhidoCentavos !== null &&
          futebol.avulsoEscolhidoCentavos !==
            resumoCalculado?.avulsoSugeridoCentavos,
      );
      setNomeQuadra(futebol.nomeQuadra ?? "");
      setEndereco(futebol.endereco ?? "");
      setAgenda({
        diasSemana: [...futebol.diasSemana],
        frequencia: futebol.frequencia,
        horario: futebol.horario,
        vencimentoQuadra: futebol.vencimentoQuadra,
      });
      setJogadoresSalvos(resultado.dados.jogadores);
      assinaturaInicialRef.current = assinaturaFutebol(futebol);
      tipoInicialRef.current = futebol.tipoCadastro;
      setCarregandoEdicao(false);
    })();

    return () => {
      ativo = false;
    };
  }, [modoEdicao, futebolAtivoId]);

  const quantidadeBasica = inteiro(quantidadeBasicaTexto);
  const quantidadeMensalistas =
    tipoCadastro === "mensalistas_e_avulsos"
      ? inteiro(mensalistasTexto)
      : tipoCadastro === "so_mensalistas"
        ? inteiro(mensalistasTexto)
        : null;
  const quantidadeAvulsos =
    tipoCadastro === "mensalistas_e_avulsos" ? inteiro(avulsosTexto) : 0;
  const totalJogadores =
    tipoCadastro === "basico"
      ? quantidadeBasica
      : (quantidadeMensalistas ?? 0) + (quantidadeAvulsos ?? 0);

  const controlarMensalidade =
    controlePagamento === "mensalistas" || controlePagamento === "ambos";
  const controlarAvulsos =
    tipoCadastro === "mensalistas_e_avulsos" &&
    (controlePagamento === "avulsos" || controlePagamento === "ambos");
  const valorQuadraCentavos = lerMoedaPtBr(valorQuadraTexto);
  const mensalidadeEscolhidaCentavos = lerMoedaPtBr(mensalidadeTexto);
  const avulsoEscolhidoCentavos = lerMoedaPtBr(avulsoTexto);
  const erroVencimento = controlarMensalidade && !agenda.vencimentoQuadra
    ? "Defina o vencimento da quadra"
    : null;
  const contagensValidas =
    tipoCadastro === "basico"
      ? quantidadeBasica !== null &&
        quantidadeBasica >= 2 &&
        quantidadeBasica <= 100
      : quantidadeMensalistas !== null &&
        quantidadeMensalistas >= 1 &&
        quantidadeAvulsos !== null &&
        quantidadeAvulsos >= 0 &&
        (totalJogadores ?? 0) <= 100;

  const jogosPorMesCalculado = calcularJogosPorMes(
    agenda.frequencia,
    agenda.diasSemana,
  );

  const resumoBase = useMemo(() => {
    if (
      valorQuadraCentavos === null ||
      quantidadeMensalistas === null ||
      quantidadeMensalistas < 1 ||
      quantidadeAvulsos === null ||
      quantidadeAvulsos < 0 ||
      totalJogadores === null ||
      totalJogadores < 1
    ) {
      return null;
    }
    return calcularResumoFinanceiro(
      valorQuadraCentavos,
      quantidadeMensalistas,
      quantidadeAvulsos,
      null,
      null,
      jogosPorMesCalculado,
    );
  }, [
    jogosPorMesCalculado,
    quantidadeAvulsos,
    quantidadeMensalistas,
    totalJogadores,
    valorQuadraCentavos,
  ]);

  const avulsoSugeridoCalculado = resumoBase?.avulsoSugeridoCentavos ?? null;
  const mensalidadeSugeridaCalculada =
    resumoBase?.mensalidadeSugeridaCentavos ?? null;
  const sugestaoAvulso = controlarAvulsos &&
    avulsoSugeridoCalculado !== null &&
    avulsoSugeridoCalculado > 0 &&
    avulsoSugeridoCalculado <= 9_999_999
    ? avulsoSugeridoCalculado
    : null;
  const sugestaoMensalidade = controlarMensalidade &&
    mensalidadeSugeridaCalculada !== null &&
    mensalidadeSugeridaCalculada > 0 &&
    mensalidadeSugeridaCalculada <= 9_999_999
    ? mensalidadeSugeridaCalculada
    : null;
  const mensalidadeCalculadaCentavos =
    mensalidadeCustomizada ? mensalidadeEscolhidaCentavos : sugestaoMensalidade;
  const avulsoCalculadoCentavos =
    avulsoCustomizado ? avulsoEscolhidoCentavos : sugestaoAvulso;
  const resumoFinanceiro = useMemo(() => {
    if (
      !resumoBase ||
      quantidadeMensalistas === null ||
      quantidadeAvulsos === null ||
      valorQuadraCentavos === null
    ) {
      return null;
    }
    return calcularResumoFinanceiro(
      valorQuadraCentavos,
      quantidadeMensalistas,
      quantidadeAvulsos,
      mensalidadeCalculadaCentavos ?? 0,
      avulsoCalculadoCentavos ?? 0,
      jogosPorMesCalculado,
    );
  }, [
    avulsoCalculadoCentavos,
    jogosPorMesCalculado,
    mensalidadeCalculadaCentavos,
    quantidadeAvulsos,
    quantidadeMensalistas,
    resumoBase,
    valorQuadraCentavos,
  ]);

  const quantidadeMensalistasErro =
    tipoCadastro === "mensalistas_e_avulsos" ||
    tipoCadastro === "so_mensalistas"
      ? erroQuantidade(quantidadeMensalistas, 1)
      : null;
  const quantidadeAvulsosErro =
    tipoCadastro === "mensalistas_e_avulsos"
      ? erroQuantidade(quantidadeAvulsos, 0)
      : null;
  const quantidadeBasicaErro =
    tipoCadastro === "basico" ? erroQuantidade(quantidadeBasica, 2) : null;
  const totalErro =
    tipoCadastro === "mensalistas_e_avulsos" &&
    totalJogadores !== null &&
    totalJogadores > 100
      ? "O total não pode passar de 100 jogadores."
      : null;
  const valorQuadraErro =
    controlePagamento !== "nenhum" && (valorQuadraCentavos === null || valorQuadraCentavos <= 0 || valorQuadraCentavos > 9_999_999)
      ? valorQuadraTexto === "" ? "Informe um valor maior que zero." : erroMoeda(valorQuadraTexto)
      : null;
  const mensalidadeErro =
    controlarMensalidade && (mensalidadeCalculadaCentavos === null || mensalidadeCalculadaCentavos <= 0)
      ? "Informe um valor maior que zero."
      : null;
  const avulsoErro =
    controlarAvulsos && (avulsoCalculadoCentavos === null || avulsoCalculadoCentavos <= 0)
      ? "Informe um valor maior que zero."
      : null;

  const nomeNormalizado = normalizarNomeFutebol(nomeFutebol);
  const valido =
    nomeNormalizado.length >= 2 && nomeNormalizado.length <= 40 &&
    contagensValidas &&
    (tipoCadastro !== "mensalistas_e_avulsos" || totalErro === null) &&
    (controlePagamento === "nenhum" ||
      (valorQuadraCentavos !== null && valorQuadraCentavos > 0 && valorQuadraCentavos <= 9_999_999 &&
      (!controlarMensalidade || (mensalidadeCalculadaCentavos !== null && mensalidadeCalculadaCentavos > 0 && mensalidadeCalculadaCentavos <= 9_999_999)) &&
      (!controlarAvulsos || (avulsoCalculadoCentavos !== null && avulsoCalculadoCentavos > 0 && avulsoCalculadoCentavos <= 9_999_999)))) &&
    erroVencimento === null &&
    (jogadoresPorTimeTexto.trim() === "" || (inteiro(jogadoresPorTimeTexto) !== null && inteiro(jogadoresPorTimeTexto)! >= 2 && inteiro(jogadoresPorTimeTexto)! <= 22)) &&
    (quantidadeTimesTexto.trim() === "" || (inteiro(quantidadeTimesTexto) !== null && inteiro(quantidadeTimesTexto)! >= 2 && inteiro(quantidadeTimesTexto)! <= 12));
  const assinaturaAtual = assinaturaFormulario(
    nomeFutebol,
    tipoCadastro,
    quantidadeBasicaTexto,
    mensalistasTexto,
    avulsosTexto,
    controlaPresenca,
    controlePagamento,
    agenda,
    valorQuadraTexto,
    mensalidadeCalculadaCentavos === null ? "" : valorTexto(mensalidadeCalculadaCentavos),
    avulsoCalculadoCentavos === null ? "" : valorTexto(avulsoCalculadoCentavos),
    nomeQuadra,
    endereco,
    jogadoresPorTimeTexto,
    quantidadeTimesTexto,
  );
  const alteracoesPendentes =
    modoEdicao &&
    assinaturaInicialRef.current !== null &&
    assinaturaInicialRef.current !== assinaturaAtual;

  const desabilitarProtecaoRemocao = usePreventRemove(
    alteracoesPendentes && !edicaoConcluidaRef.current,
    ({ repeat }) => {
      Alert.alert(
        "Descartar alterações?",
        "As alterações feitas nas informações do futebol serão descartadas.",
        [
          { text: "Continuar editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => {
              edicaoConcluidaRef.current = true;
              desabilitarProtecaoRemocaoRef.current();
              repeat();
            },
          },
        ],
      );
    },
  );
  desabilitarProtecaoRemocaoRef.current = desabilitarProtecaoRemocao;

  const opcoesPagamento =
    tipoCadastro === "mensalistas_e_avulsos"
      ? CONTROLES_PAGAMENTO_MISTO
      : CONTROLES_PAGAMENTO_MENSALISTAS;

  function alterarTipoCadastro(valor: TipoCadastro | null) {
    if (!valor || valor === tipoCadastro) return;
    setTipoCadastro(valor);
    setControlePagamento("nenhum");
    setValorQuadraTexto("");
    setMensalidadeTexto("");
    setAvulsoTexto("");
    setMensalidadeCustomizada(false);
    setAvulsoCustomizado(false);
    if (valor === "basico") {
      const atual = totalJogadores;
      setQuantidadeBasicaTexto(
        atual !== null && atual >= 2 && atual <= 100 ? String(atual) : "14",
      );
      setMensalistasTexto("");
      setAvulsosTexto("");
    } else if (valor === "so_mensalistas") {
      const atual = quantidadeBasica ?? totalJogadores;
      setMensalistasTexto(
        atual !== null && atual >= 1 && atual <= 100 ? String(atual) : "14",
      );
      setQuantidadeBasicaTexto("");
      setAvulsosTexto("");
    } else {
      const mensalistas = quantidadeMensalistas ?? quantidadeBasica ?? 10;
      const total = totalJogadores ?? 14;
      const mensalistasFinal = Math.min(99, Math.max(1, mensalistas));
      setMensalistasTexto(String(mensalistasFinal));
      setAvulsosTexto(String(Math.max(0, Math.min(100 - mensalistasFinal, total - mensalistasFinal))));
      setQuantidadeBasicaTexto("");
    }
  }

  function alterarControlePagamento(valor: ControlePagamento | null) {
    if (!valor) return;
    setControlePagamento(valor);
    if (valor === "nenhum") {
      setValorQuadraTexto("");
      setMensalidadeTexto("");
      setAvulsoTexto("");
      setMensalidadeCustomizada(false);
      setAvulsoCustomizado(false);
      return;
    }
    const mensalidadeAgora =
      valor === "mensalistas" || valor === "ambos";
    const avulsoAgora =
      tipoCadastro === "mensalistas_e_avulsos" &&
      (valor === "avulsos" || valor === "ambos");
    if (!mensalidadeAgora) {
      setMensalidadeTexto("");
      setMensalidadeCustomizada(false);
    }
    if (!avulsoAgora) {
      setAvulsoTexto("");
      setAvulsoCustomizado(false);
    }
  }

  function criarRascunhoAtual(): RascunhoFutebol | null {
    if (!valido || totalJogadores === null) return null;
    const usarMensalidade =
      controlarMensalidade && mensalidadeCalculadaCentavos !== null;
    const usarAvulso = controlarAvulsos && avulsoCalculadoCentavos !== null;
    return {
      nome: normalizarNomeFutebol(nomeFutebol),
      quantidadeJogadores: totalJogadores,
      quantidadeMensalistas:
        tipoCadastro === "basico" ? null : quantidadeMensalistas,
      quantidadeAvulsos:
        tipoCadastro === "basico" ? null : quantidadeAvulsos,
      tipoCadastro,
      controlaPresenca,
      controlePagamento,
      agenda,
      jogadoresPorTime: inteiro(jogadoresPorTimeTexto),
      quantidadeTimes: inteiro(quantidadeTimesTexto),
      valorQuadraCentavos:
        controlePagamento === "nenhum" ? null : valorQuadraCentavos,
      mensalidadeSugeridaCentavos: usarMensalidade
        ? sugestaoMensalidade
        : null,
      mensalidadeCentavos: usarMensalidade
        ? mensalidadeCalculadaCentavos
        : null,
      avulsoEscolhidoCentavos: usarAvulso
        ? avulsoCalculadoCentavos
        : null,
      avulsoSugeridoCentavos:
        tipoCadastro === "mensalistas_e_avulsos" &&
        controlePagamento !== "nenhum"
          ? resumoFinanceiro?.avulsoSugeridoCentavos ?? null
          : null,
      nomeQuadra: nomeQuadra.trim() || null,
      endereco: endereco.trim() || null,
    };
  }

  async function salvarEdicao(futebol: RascunhoFutebol) {
    const tipoAnterior = tipoInicialRef.current;
    if (!tipoAnterior || futebolAtivoId === null) return;
    setSalvandoEdicao(true);
    setErroEdicao(null);
    const resultado = await atualizarFutebol(
      futebolAtivoId,
      expandirRascunhoFutebol(futebol),
      tipoAnterior,
    );
    setSalvandoEdicao(false);
    if (!resultado.sucesso) {
      setErroEdicao(resultado.mensagem);
      return;
    }

    assinaturaInicialRef.current = assinaturaAtual;
    tipoInicialRef.current = futebol.tipoCadastro;
    edicaoConcluidaRef.current = true;
    const dataJogoAtivo = obterJogoAtivo(
      obterDataLocal(),
      futebol.agenda.diasSemana,
    );
    await carregarDadosSalvos(dataJogoAtivo, futebolAtivoId);
    desabilitarProtecaoRemocao();
    router.back();
  }

  async function continuar() {
    const futebol = criarRascunhoAtual();
    if (!futebol) return;
    if (!(await nomeFutebolDisponivel(futebol.nome, modoEdicao ? futebolAtivoId ?? undefined : undefined))) { setErroNomeFutebol("Já existe um futebol com esse nome."); return; }
    if (modoEdicao) {
      const tipoAnterior = tipoInicialRef.current;
      if (tipoAnterior && tipoAnterior !== futebol.tipoCadastro) {
        Alert.alert(
          "Confirmar mudança no cadastro",
          resumoConversaoVinculos(
            tipoAnterior,
            futebol.tipoCadastro,
            jogadoresSalvos,
          ),
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Salvar alterações",
              onPress: () => void salvarEdicao(futebol),
            },
          ],
        );
      } else {
        void salvarEdicao(futebol);
      }
      return;
    }

    // Salva no rascunho em memória
    salvarFutebol(futebol);

    router.push("/cadastro-jogadores");
  }

  const formulario = (
    <>
      <View style={styles.introducao}>
        <Texto variante="titulo">
          {modoEdicao ? "Informações do futebol" : "Configurar futebol"}
        </Texto>
        <Texto variante="corpo">
          {modoEdicao
            ? "Atualize os dados do futebol sem alterar os jogadores já cadastrados."
            : "Defina como seu grupo será organizado. Você poderá cadastrar os jogadores na próxima etapa."}
        </Texto>
      </View>
      <CampoComRotulo
        rotulo="Nome do futebol"
        accessibilityLabel="Nome do futebol"
        placeholder="Exemplo: Pelada de quarta"
        valor={nomeFutebol}
        mensagemErro={erroNomeFutebol ?? (nomeNormalizado.length === 0 ? "Informe o nome do futebol." : nomeNormalizado.length < 2 ? "Use pelo menos 2 caracteres." : nomeNormalizado.length > 40 ? "Use até 40 caracteres." : null)}
        onChangeText={(valor) => { setNomeFutebol(valor); setErroNomeFutebol(null); }}
      />
      <SeletorDeOpcoes
        rotulo="Tipo de cadastro"
        opcoes={TIPOS_CADASTRO}
        valor={tipoCadastro}
        onChange={alterarTipoCadastro}
      />
      {tipoCadastro === "mensalistas_e_avulsos" ? (
        <View style={styles.grupo}>
          <CampoComRotulo
            rotulo="Quantos mensalistas?"
            accessibilityLabel="Quantidade de mensalistas"
            valor={mensalistasTexto}
            keyboardType="number-pad"
            mensagemErro={quantidadeMensalistasErro}
            onChangeText={setMensalistasTexto}
          />
          <CampoComRotulo
            rotulo="Avulsos por partida"
            accessibilityLabel="Avulsos por partida"
            valor={avulsosTexto}
            keyboardType="number-pad"
            mensagemErro={quantidadeAvulsosErro}
            onChangeText={setAvulsosTexto}
          />
          <Texto variante="legenda">
            Quantidade prevista por jogo; usada na previsão.
          </Texto>
          <Texto variante="corpo">
            Jogadores por partida (estimativa): {totalJogadores ?? "—"}
          </Texto>
          {totalErro ? (
            <Texto variante="legenda" cor="error">
              {totalErro}
            </Texto>
          ) : null}
        </View>
      ) : tipoCadastro === "so_mensalistas" ? (
        <CampoComRotulo
          rotulo="Quantidade de mensalistas"
          accessibilityLabel="Quantidade de mensalistas"
          valor={mensalistasTexto}
          keyboardType="number-pad"
          mensagemErro={quantidadeMensalistasErro}
          onChangeText={setMensalistasTexto}
        />
      ) : (
        <CampoComRotulo
          rotulo="Quantidade de jogadores"
          accessibilityLabel="Quantidade de jogadores"
          valor={quantidadeBasicaTexto}
          keyboardType="number-pad"
          mensagemErro={quantidadeBasicaErro}
          onChangeText={setQuantidadeBasicaTexto}
        />
      )}
      <SeletorDeOpcoes
        rotulo="Vai controlar presença?"
        opcoes={OPCOES_PRESENCA}
        valor={controlaPresenca ? "sim" : "nao"}
        onChange={(valor) => {
          if (valor) setControlaPresenca(valor === "sim");
        }}
      />
      {tipoCadastro !== "basico" ? (
        <SeletorDeOpcoes
          rotulo="Vai marcar quem pagou?"
          opcoes={opcoesPagamento}
          valor={controlePagamento}
          onChange={alterarControlePagamento}
        />
      ) : null}
      <View style={styles.quadraEAgenda}>
        <Texto variante="secao">Quadra e agenda</Texto>
        <CampoComRotulo
          rotulo="Nome da quadra"
          accessibilityLabel="Nome da quadra"
          valor={nomeQuadra}
          onChangeText={setNomeQuadra}
        />
        <CampoComRotulo
          rotulo="Endereço"
          accessibilityLabel="Endereço da quadra"
          valor={endereco}
          onChangeText={setEndereco}
        />
        <CartaoQuadraEAgenda
          agenda={agenda}
          temDadosQuadra={Boolean(nomeQuadra.trim() || endereco.trim())}
          vencimentoObrigatorio={controlarMensalidade}
          erroVencimento={erroVencimento}
          onSalvar={setAgenda}
        />
      </View>
      {controlePagamento !== "nenhum" &&
      tipoCadastro !== "basico" ? (
        <View style={styles.financeiro}>
          <CampoMoeda
            rotulo="Valor da quadra ou campo (R$ por mês)"
            accessibilityLabel="Valor da quadra ou campo por mês em reais"
            valorCentavos={valorQuadraCentavos}
            mensagemErro={valorQuadraErro}
            onChange={(valor) => setValorQuadraTexto(valor === null ? "" : formatarMoedaPtBr(valor))}
          />
          {controlarMensalidade ? (
            <>
              <CampoValorComSugestao
                rotulo="Mensalidade por mensalista (R$)"
                accessibilityLabel="Mensalidade por mensalista em reais"
                nomeValor="mensalidade"
                accessibilityLabelZerar="Zerar valor da mensalidade"
                valorCentavos={mensalidadeCalculadaCentavos}
                valorSugeridoCentavos={sugestaoMensalidade}
                textoApoio="Preencha o valor da quadra e as quantidades para ver a sugestão."
                mensagemErro={mensalidadeErro}
                onChange={(valor, digitado) => {
                  setMensalidadeTexto(valor === null ? "" : formatarMoedaPtBr(valor));
                  if (digitado) setMensalidadeCustomizada(true);
                }}
                onUsarSugestao={() => {
                  if (sugestaoMensalidade !== null) {
                    setMensalidadeTexto(valorTexto(sugestaoMensalidade));
                    setMensalidadeCustomizada(false);
                  }
                }}
              />
            </>
          ) : null}
          {controlarAvulsos ? (
            <>
              <Texto variante="legenda">
                O valor do avulso é calculado por jogo a partir do custo da quadra e da quantidade de participantes.
              </Texto>
              <CampoValorComSugestao
                rotulo="Valor do avulso por jogo (R$)"
                accessibilityLabel="Valor do avulso por jogo em reais"
                nomeValor="o valor do avulso por jogo"
                accessibilityLabelZerar="Zerar valor do avulso por jogo"
                valorCentavos={avulsoCalculadoCentavos}
                valorSugeridoCentavos={sugestaoAvulso}
                textoApoio="Preencha o valor da quadra e as quantidades para ver a sugestão."
                mensagemErro={avulsoErro}
                onChange={(valor, digitado) => {
                  setAvulsoTexto(valor === null ? "" : formatarMoedaPtBr(valor));
                  if (digitado) setAvulsoCustomizado(true);
                }}
                onUsarSugestao={() => {
                  if (sugestaoAvulso !== null) {
                    setAvulsoTexto(valorTexto(sugestaoAvulso));
                    setAvulsoCustomizado(false);
                  }
                }}
              />
            </>
          ) : null}
          {resumoFinanceiro && valorQuadraCentavos !== null ? (
            <>
              <ResumoFinanceiro
                resumo={resumoFinanceiro}
                mostrarMensalistas={controlarMensalidade}
                mostrarAvulsos={controlarAvulsos}
              />
              <CartaoSaldoDoMes
                modo="previsao"
                mensalistasCadastrados={quantidadeMensalistas ?? 0}
                mensalistasMeta={quantidadeMensalistas ?? 0}
                avulsosInformados={quantidadeAvulsos ?? 0}
                mensalidadeCentavos={
                  controlarMensalidade ? mensalidadeCalculadaCentavos ?? 0 : null
                }
                valorAvulsoCentavos={
                  controlarAvulsos ? avulsoCalculadoCentavos ?? 0 : null
                }
                valorQuadraCentavos={valorQuadraCentavos}
                diasSemana={agenda.diasSemana}
                frequencia={agenda.frequencia}
                mostrarMensalistas={controlarMensalidade}
                mostrarAvulsos={controlarAvulsos}
              />
            </>
          ) : null}
        </View>
      ) : null}
      <View style={styles.opcionais}>
        <View style={styles.grupo}>
          <Texto variante="secao">Sorteio dos times (opcional)</Texto>
          <CampoComRotulo rotulo="Jogadores por time" accessibilityLabel="Jogadores por time" valor={jogadoresPorTimeTexto} keyboardType="number-pad" mensagemErro={jogadoresPorTimeTexto.trim() && (inteiro(jogadoresPorTimeTexto) === null || inteiro(jogadoresPorTimeTexto)! < 2 || inteiro(jogadoresPorTimeTexto)! > 22) ? "Use um número de 2 a 22." : null} onChangeText={setJogadoresPorTimeTexto} />
          <CampoComRotulo rotulo="Quantidade de times" accessibilityLabel="Quantidade de times" valor={quantidadeTimesTexto} keyboardType="number-pad" mensagemErro={quantidadeTimesTexto.trim() && (inteiro(quantidadeTimesTexto) === null || inteiro(quantidadeTimesTexto)! < 2 || inteiro(quantidadeTimesTexto)! > 12) ? "Use um número de 2 a 12." : null} onChangeText={setQuantidadeTimesTexto} />
          <Texto variante="legenda">Se preencher, o sorteio da tela Seu futebol já abre com esses valores.</Texto>
        </View>
      </View>
      {erroEdicao ? (
        <Texto variante="legenda" cor="error">
          {erroEdicao}
        </Texto>
      ) : null}
    </>
  );

  if (modoEdicao && carregandoEdicao) {
    return (
      <>
        <Stack.Screen options={{ title: "Informações do futebol" }} />
        <TelaBase centralizada>
          <Texto variante="corpo">Carregando informações do futebol...</Texto>
        </TelaBase>
      </>
    );
  }

  if (modoEdicao && erroEdicao && assinaturaInicialRef.current === null) {
    return (
      <>
        <Stack.Screen options={{ title: "Informações do futebol" }} />
        <TelaBase centralizada>
          <Texto variante="corpo">{erroEdicao}</Texto>
          <Botao
            variante="secundario"
            accessibilityLabel="Voltar para a home"
            onPress={() => router.back()}
          >
            Voltar
          </Botao>
        </TelaBase>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: modoEdicao
            ? "Informações do futebol"
            : "Configurar futebol",
        }}
      />
      <TelaBase
        rolavel={!modoEdicao}
        contentStyle={modoEdicao ? styles.edicaoPage : undefined}
      >
        {modoEdicao ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.edicaoLayout}
          >
            <ScrollView
              contentContainerStyle={[styles.edicaoConteudo, { paddingBottom: spacing.xxxl * 2 }]}
              keyboardShouldPersistTaps="handled"
            >
              {formulario}
            </ScrollView>
            <View style={styles.rodape}>
              {erroVencimento ? (
                <Texto variante="legenda" cor="error">
                  {erroVencimento}
                </Texto>
              ) : null}
              <Botao
                variante="primario"
                accessibilityLabel="Salvar alterações das informações do futebol"
                desabilitado={!valido || salvandoEdicao}
                onPress={continuar}
              >
                {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
              </Botao>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <>
            {formulario}
            <View style={styles.rodapeCriacao}>
              {erroVencimento ? (
                <Texto variante="legenda" cor="error">
                  {erroVencimento}
                </Texto>
              ) : null}
              <Botao
                variante="primario"
                accessibilityLabel="Continuar para cadastro de jogadores"
                desabilitado={!valido}
                onPress={continuar}
              >
                Continuar
              </Botao>
            </View>
          </>
        )}
      </TelaBase>
    </>
  );
}

const styles = StyleSheet.create({
  introducao: {
    gap: spacing.sm,
  },
  edicaoPage: {
    flex: 1,
    gap: spacing.none,
    padding: spacing.none,
  },
  edicaoLayout: {
    flex: 1,
  },
  edicaoConteudo: {
    gap: spacing.xl,
    padding: spacing.screen,
  },
  rodape: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  rodapeCriacao: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  grupo: {
    gap: spacing.md,
  },
  financeiro: {
    gap: spacing.lg,
  },
  quadraEAgenda: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  opcionais: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    gap: spacing.lg,
    padding: spacing.lg,
  },
});
