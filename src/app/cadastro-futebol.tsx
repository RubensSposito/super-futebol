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
import { CampoComRotulo, SeletorDeOpcoes } from "@/components/molecules";
import {
  AgendaFutebolSheet,
  CartaoSaldoDoMes,
  ResumoFinanceiro,
} from "@/components/organisms";
import { TelaBase } from "@/components/templates";
import {
  CONTROLES_PAGAMENTO_MENSALISTAS,
  CONTROLES_PAGAMENTO_MISTO,
  DIAS_SEMANA,
  FREQUENCIAS,
  TIPOS_CADASTRO,
} from "@/constants";
import {
  calcularResumoFinanceiro,
  formatarMoedaPtBr,
  lerMoedaPtBr,
} from "@/lib/financeiro";
import { obterDataLocal, obterJogoAtivo } from "@/lib/datas";
import { useDadosPersistidosStore, useRascunhoCadastroStore } from "@/store";
import { atualizarFutebol, carregarDadosHome } from "@/db";
import {
  borders,
  colors,
  dimensions,
  radii,
  spacing,
} from "@/theme";
import type {
  ControlePagamento,
  FrequenciaFutebol,
  RascunhoFutebol,
  TipoCadastro,
  Futebol,
  Jogador,
} from "@/types";

const PADRAO: RascunhoFutebol = {
  quantidadeJogadores: 14,
  quantidadeMensalistas: null,
  quantidadeAvulsos: null,
  tipoCadastro: "basico",
  controlaPresenca: true,
  controlePagamento: "nenhum",
  valorQuadraCentavos: null,
  mensalidadeSugeridaCentavos: null,
  mensalidadeCentavos: null,
  avulsoEscolhidoCentavos: null,
  avulsoSugeridoCentavos: null,
  nomeQuadra: null,
  endereco: null,
  diasSemana: [],
  frequencia: null,
  horario: null,
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
  return lerMoedaPtBr(valor) === null ? "Informe um valor válido em reais." : null;
}

function formatarResumoAgenda(
  diasSemana: readonly number[],
  frequencia: FrequenciaFutebol | null,
  horario: string | null,
): string {
  const dias = diasSemana
    .map((valor) => DIAS_SEMANA.find((opcao) => opcao.value === valor)?.label)
    .filter((dia) => dia !== undefined)
    .join(" e ");
  const frequenciaLabel = FREQUENCIAS.find(
    (opcao) => opcao.value === frequencia,
  )?.label;
  return [
    dias || null,
    frequenciaLabel ?? null,
    horario,
  ]
    .filter((parte): parte is string => parte !== null)
    .join(" · ");
}

function assinaturaFormulario(
  tipoCadastro: TipoCadastro,
  quantidadeBasica: string,
  mensalistas: string,
  avulsos: string,
  controlaPresenca: boolean,
  controlePagamento: ControlePagamento,
  valorQuadra: string,
  mensalidade: string,
  avulso: string,
  nomeQuadra: string,
  endereco: string,
  diasSemana: readonly number[],
  frequencia: FrequenciaFutebol | null,
  horario: string | null,
): string {
  return JSON.stringify([
    tipoCadastro,
    quantidadeBasica,
    mensalistas,
    avulsos,
    controlaPresenca,
    controlePagamento,
    valorQuadra,
    mensalidade,
    avulso,
    nomeQuadra.trim(),
    endereco.trim(),
    [...diasSemana].sort((a, b) => a - b),
    frequencia,
    horario,
  ]);
}

function assinaturaFutebol(futebol: Futebol): string {
  return assinaturaFormulario(
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
    valorTexto(futebol.valorQuadraCentavos),
    valorTexto(futebol.mensalidadeCentavos),
    valorTexto(futebol.avulsoEscolhidoCentavos),
    futebol.nomeQuadra ?? "",
    futebol.endereco ?? "",
    futebol.diasSemana,
    futebol.frequencia,
    futebol.horario,
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
  const rascunhoSalvo = useRascunhoCadastroStore((state) => state.futebol);
  const salvarFutebol = useRascunhoCadastroStore((state) => state.salvarFutebol);
  const inicial = rascunhoSalvo ?? PADRAO;
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
  const [diasSemana, setDiasSemana] = useState<number[]>(
    inicial.diasSemana,
  );
  const [frequencia, setFrequencia] = useState<FrequenciaFutebol | null>(
    inicial.frequencia,
  );
  const [horario, setHorario] = useState<string | null>(inicial.horario);
  const [agendaVisivel, setAgendaVisivel] = useState(false);
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
      const resultado = await carregarDadosHome(obterDataLocal());
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
      setValorQuadraTexto(valorTexto(futebol.valorQuadraCentavos));
      setMensalidadeTexto(valorTexto(futebol.mensalidadeCentavos));
      setAvulsoTexto(valorTexto(futebol.avulsoEscolhidoCentavos));
      setMensalidadeCustomizada(
        futebol.mensalidadeCentavos !== null &&
          futebol.mensalidadeCentavos !==
            futebol.mensalidadeSugeridaCentavos,
      );
      setAvulsoCustomizado(
        futebol.avulsoEscolhidoCentavos !== null &&
          futebol.avulsoEscolhidoCentavos !==
            futebol.avulsoSugeridoCentavos,
      );
      setNomeQuadra(futebol.nomeQuadra ?? "");
      setEndereco(futebol.endereco ?? "");
      setDiasSemana([...futebol.diasSemana]);
      setFrequencia(futebol.frequencia);
      setHorario(futebol.horario);
      setJogadoresSalvos(resultado.dados.jogadores);
      assinaturaInicialRef.current = assinaturaFutebol(futebol);
      tipoInicialRef.current = futebol.tipoCadastro;
      setCarregandoEdicao(false);
    })();

    return () => {
      ativo = false;
    };
  }, [carregarDadosHome, modoEdicao]);

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
    );
  }, [
    quantidadeAvulsos,
    quantidadeMensalistas,
    totalJogadores,
    valorQuadraCentavos,
  ]);

  const sugestaoAvulso =
    controlarAvulsos ? resumoBase?.avulsoSugeridoCentavos ?? null : null;
  const sugestaoMensalidade =
    controlarMensalidade
      ? resumoBase?.mensalidadeSugeridaCentavos ?? null
      : null;
  const mensalidadeCalculadaCentavos =
    mensalidadeEscolhidaCentavos ??
    (!mensalidadeCustomizada ? sugestaoMensalidade : null);
  const avulsoCalculadoCentavos =
    avulsoEscolhidoCentavos ??
    (!avulsoCustomizado ? sugestaoAvulso : null);
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
      mensalidadeCalculadaCentavos,
      avulsoCalculadoCentavos,
    );
  }, [
    avulsoCalculadoCentavos,
    mensalidadeCalculadaCentavos,
    quantidadeAvulsos,
    quantidadeMensalistas,
    resumoBase,
    valorQuadraCentavos,
  ]);

  useEffect(() => {
    if (
      !mensalidadeCustomizada &&
      sugestaoMensalidade !== null &&
      mensalidadeTexto !== valorTexto(sugestaoMensalidade)
    ) {
      setMensalidadeTexto(valorTexto(sugestaoMensalidade));
    }
  }, [mensalidadeCustomizada, mensalidadeTexto, sugestaoMensalidade]);

  useEffect(() => {
    if (
      !avulsoCustomizado &&
      sugestaoAvulso !== null &&
      avulsoTexto !== valorTexto(sugestaoAvulso)
    ) {
      setAvulsoTexto(valorTexto(sugestaoAvulso));
    }
  }, [avulsoCustomizado, avulsoTexto, sugestaoAvulso]);

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
    controlePagamento !== "nenhum" && valorQuadraCentavos === null
      ? erroMoeda(valorQuadraTexto)
      : null;
  const mensalidadeErro =
    controlarMensalidade && mensalidadeCalculadaCentavos === null
      ? erroMoeda(mensalidadeTexto)
      : null;
  const avulsoErro =
    controlarAvulsos && avulsoCalculadoCentavos === null
      ? erroMoeda(avulsoTexto)
      : null;

  const valido =
    contagensValidas &&
    (tipoCadastro !== "mensalistas_e_avulsos" || totalErro === null) &&
    (controlePagamento === "nenhum" ||
      (valorQuadraCentavos !== null &&
      (!controlarMensalidade || mensalidadeCalculadaCentavos !== null) &&
      (!controlarAvulsos || avulsoCalculadoCentavos !== null)));
  const assinaturaAtual = assinaturaFormulario(
    tipoCadastro,
    quantidadeBasicaTexto,
    mensalistasTexto,
    avulsosTexto,
    controlaPresenca,
    controlePagamento,
    valorQuadraTexto,
    mensalidadeTexto,
    avulsoTexto,
    nomeQuadra,
    endereco,
    diasSemana,
    frequencia,
    horario,
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
      quantidadeJogadores: totalJogadores,
      quantidadeMensalistas:
        tipoCadastro === "basico" ? null : quantidadeMensalistas,
      quantidadeAvulsos:
        tipoCadastro === "basico" ? null : quantidadeAvulsos,
      tipoCadastro,
      controlaPresenca,
      controlePagamento,
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
      diasSemana,
      frequencia,
      horario,
    };
  }

  async function salvarEdicao(futebol: RascunhoFutebol) {
    const tipoAnterior = tipoInicialRef.current;
    if (!tipoAnterior) return;
    setSalvandoEdicao(true);
    setErroEdicao(null);
    const resultado = await atualizarFutebol(futebol, tipoAnterior);
    setSalvandoEdicao(false);
    if (!resultado.sucesso) {
      setErroEdicao(resultado.mensagem);
      return;
    }

    assinaturaInicialRef.current = assinaturaAtual;
    tipoInicialRef.current = futebol.tipoCadastro;
    edicaoConcluidaRef.current = true;
    const dataJogoAtivo = obterJogoAtivo(obterDataLocal(), futebol.diasSemana);
    await carregarDadosSalvos(dataJogoAtivo);
    desabilitarProtecaoRemocao();
    router.back();
  }

  function continuar() {
    const futebol = criarRascunhoAtual();
    if (!futebol) return;
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

    salvarFutebol(futebol);
    router.push("/cadastro-jogadores");
  }

  const resumoAgenda = formatarResumoAgenda(diasSemana, frequencia, horario);
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
            rotulo="Quantos avulsos?"
            accessibilityLabel="Quantidade de avulsos"
            valor={avulsosTexto}
            keyboardType="number-pad"
            mensagemErro={quantidadeAvulsosErro}
            onChangeText={setAvulsosTexto}
          />
          <Texto variante="corpo">
            Total de jogadores: {totalJogadores ?? "—"}
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
      {controlePagamento !== "nenhum" &&
      tipoCadastro !== "basico" ? (
        <View style={styles.financeiro}>
          <CampoComRotulo
            rotulo="Valor da quadra (R$ por mês)"
            accessibilityLabel="Valor da quadra por mês em reais"
            valor={valorQuadraTexto}
            placeholder="Ex.: R$ 1.000,00"
            keyboardType="decimal-pad"
            mensagemErro={valorQuadraErro}
            onChangeText={setValorQuadraTexto}
          />
          {controlarMensalidade ? (
            <>
              <View style={styles.sugestao}>
                <View style={styles.textoSugestao}>
                  <Texto variante="legenda">Valor sugerido por mês</Texto>
                  <Texto variante="corpo">
                    {sugestaoMensalidade === null
                      ? "Preencha a quadra e as quantidades."
                      : formatarMoedaPtBr(sugestaoMensalidade)}
                  </Texto>
                </View>
                <Botao
                  variante="secundario"
                  accessibilityLabel="Usar mensalidade sugerida"
                  desabilitado={sugestaoMensalidade === null}
                  onPress={() => {
                    if (sugestaoMensalidade !== null) {
                      setMensalidadeTexto(valorTexto(sugestaoMensalidade));
                      setMensalidadeCustomizada(false);
                    }
                  }}
                >
                  Usar sugerido
                </Botao>
              </View>
              <CampoComRotulo
                rotulo="Valor que vou cobrar (mensalidade)"
                accessibilityLabel="Valor escolhido da mensalidade em reais"
                valor={mensalidadeTexto}
                placeholder="Ex.: R$ 100,00"
                keyboardType="decimal-pad"
                mensagemErro={mensalidadeErro}
                onChangeText={(valor) => {
                  setMensalidadeTexto(valor);
                  setMensalidadeCustomizada(true);
                }}
              />
            </>
          ) : null}
          {controlarAvulsos ? (
            <>
              <Texto variante="legenda">
                O avulso por jogo costuma custar mais do que a parte mensal de
                cada jogador, incentivando o fechamento mensal.
              </Texto>
              <View style={styles.sugestao}>
                <View style={styles.textoSugestao}>
                  <Texto variante="legenda">Valor sugerido por jogo</Texto>
                  <Texto variante="corpo">
                    {sugestaoAvulso === null
                      ? "Preencha a quadra e as quantidades."
                      : formatarMoedaPtBr(sugestaoAvulso)}
                  </Texto>
                </View>
                <Botao
                  variante="secundario"
                  accessibilityLabel="Usar valor avulso sugerido"
                  desabilitado={sugestaoAvulso === null}
                  onPress={() => {
                    if (sugestaoAvulso !== null) {
                      setAvulsoTexto(valorTexto(sugestaoAvulso));
                      setAvulsoCustomizado(false);
                    }
                  }}
                >
                  Usar sugerido
                </Botao>
              </View>
              <CampoComRotulo
                rotulo="Valor que vou cobrar (avulso por jogo)"
                accessibilityLabel="Valor escolhido do avulso por jogo em reais"
                valor={avulsoTexto}
                placeholder="Ex.: R$ 67,00"
                keyboardType="decimal-pad"
                mensagemErro={avulsoErro}
                onChangeText={(valor) => {
                  setAvulsoTexto(valor);
                  setAvulsoCustomizado(true);
                }}
              />
            </>
          ) : null}
          {resumoFinanceiro &&
          valorQuadraCentavos !== null &&
          (!controlarMensalidade ||
            mensalidadeCalculadaCentavos !== null) &&
          (!controlarAvulsos || avulsoCalculadoCentavos !== null) ? (
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
                  controlarMensalidade ? mensalidadeCalculadaCentavos : null
                }
                valorAvulsoCentavos={
                  controlarAvulsos ? avulsoCalculadoCentavos : null
                }
                valorQuadraCentavos={valorQuadraCentavos}
                diasSemana={diasSemana}
                frequencia={frequencia}
                mostrarMensalistas={controlarMensalidade}
                mostrarAvulsos={controlarAvulsos}
              />
            </>
          ) : null}
        </View>
      ) : null}
      <View style={styles.opcionais}>
        <Texto variante="secao">Dados do futebol (opcional)</Texto>
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
        <Botao
          variante="secundario"
          accessibilityLabel={
            resumoAgenda
              ? `Editar agenda: ${resumoAgenda}`
              : "Definir dia, frequência e horário"
          }
          onPress={() => setAgendaVisivel(true)}
        >
          {resumoAgenda || "Definir dia, frequência e horário"}
        </Botao>
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
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.edicaoLayout}
          >
            <ScrollView
              contentContainerStyle={styles.edicaoConteudo}
              keyboardShouldPersistTaps="handled"
            >
              {formulario}
            </ScrollView>
            <View style={styles.rodape}>
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
            <Botao
              variante="primario"
              accessibilityLabel="Continuar para cadastro de jogadores"
              desabilitado={!valido}
              onPress={continuar}
            >
              Continuar
            </Botao>
          </>
        )}
      <AgendaFutebolSheet
        visivel={agendaVisivel}
        diasSemana={diasSemana}
        frequencia={frequencia}
        horario={horario}
        onSalvar={(dias, frequenciaNova, horarioNovo) => {
          setDiasSemana(dias);
          setFrequencia(frequenciaNova);
          setHorario(horarioNovo);
          setAgendaVisivel(false);
        }}
        onCancelar={() => setAgendaVisivel(false)}
      />
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
  grupo: {
    gap: spacing.md,
  },
  financeiro: {
    gap: spacing.lg,
  },
  sugestao: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  textoSugestao: {
    flex: 1,
    gap: spacing.xs,
    minWidth: dimensions.optionMinWidth,
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
