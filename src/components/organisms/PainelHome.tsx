import { useMemo } from "react";
import {
  Pressable,
  SectionList,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type {
  AvisoImportacao as AvisoImportacaoTipo,
  DadosHome,
  Jogador,
  ResultadoDivisaoTimes,
  TipoJogador,
} from "@/types";
import { Botao, Texto } from "@/components/atoms";
import {
  CabecalhoSecaoJogadores,
  FaixaCicloMensalidade,
  FaixaStatusJogo,
  ItemDeJogador,
  SeletorDeOpcoes,
  AvisoImportacao,
} from "@/components/molecules";
import { CartaoSaldoDoMes } from "./CartaoSaldoDoMes";
import { ResumoDePresenca } from "./ResumoDePresenca";
import { formatarMoedaPtBr } from "@/lib/financeiro";
import { calcularCicloMensal } from "@/lib/ciclos";
import { DIAS_SEMANA, FREQUENCIAS } from "@/constants";
import {
  borders,
  colors,
  dimensions,
  radii,
  spacing,
  typography,
} from "@/theme";

export type FiltroPresenca = "todos" | "presentes" | "ausentes";
export type FiltroVinculo = "todos" | "mensalistas" | "avulsos" | "pendentes";

const FILTROS_PRESENCA = [
  { value: "todos", label: "Todos" },
  { value: "presentes", label: "Presentes" },
  { value: "ausentes", label: "Ausentes" },
] as const;

const FILTROS_VINCULO = [
  { value: "todos", label: "Todos os vínculos" },
  { value: "mensalistas", label: "Mensalistas" },
  { value: "avulsos", label: "Avulsos" },
] as const;
const FILTROS_VINCULO_COM_PENDENTES = [
  ...FILTROS_VINCULO,
  { value: "pendentes", label: "Pendentes" },
] as const;
const FILTROS_SO_MENSALISTAS = [
  { value: "todos", label: "Todos" },
  { value: "pendentes", label: "Pendentes" },
] as const;

type PropsSecaoHome = {
  data: readonly Jogador[];
  tipo: TipoJogador;
  quantidadeTotal: number;
  confirmados?: number;
};

type PainelHomeProps = {
  dados: DadosHome;
  avisoImportacao?: AvisoImportacaoTipo | null;
  dataLabel: string;
  situacaoData: string;
  statusJogoTexto: string;
  rotuloHoje: string;
  mostrarAvisoHojeNaoEhJogo: boolean;
  presencasCarregando: boolean;
  podeIrAnterior: boolean;
  podeIrSeguinte: boolean;
  filtro: FiltroPresenca;
  filtroVinculo: FiltroVinculo;
  jogadoresVisiveis: readonly Jogador[];
  totalPresentes: number;
  dataReferencia: string;
  onDataChange: (deslocamentoDias: number) => void;
  onHoje: () => void;
  onFiltroChange: (filtro: FiltroPresenca) => void;
  onFiltroVinculoChange: (filtro: FiltroVinculo) => void;
  onPresencaChange: (jogadorId: string, presente: boolean) => void;
  onPagamentoChange: (jogadorId: string, pago: boolean) => void;
  onEditarJogador: (jogador: Jogador) => void;
  onEditarFutebol: () => void;
  onSair: () => void;
  sorteioSalvo?: ResultadoDivisaoTimes | null;
  onAbrirTimes?: () => void;
};

export function PainelHome({
  dados,
  avisoImportacao = null,
  dataLabel,
  situacaoData,
  statusJogoTexto,
  rotuloHoje,
  mostrarAvisoHojeNaoEhJogo,
  presencasCarregando,
  podeIrAnterior,
  podeIrSeguinte,
  filtro,
  filtroVinculo,
  jogadoresVisiveis,
  totalPresentes,
  dataReferencia,
  onDataChange,
  onHoje,
  onFiltroChange,
  onFiltroVinculoChange,
  onPresencaChange,
  onPagamentoChange,
  onEditarJogador,
  onEditarFutebol,
  onSair,
  sorteioSalvo,
  onAbrirTimes,
}: PainelHomeProps) {
  const futebol = dados.futebol;
  const mostrarMensalistas =
    futebol?.controlePagamento === "mensalistas" ||
    futebol?.controlePagamento === "ambos";
  const mostrarAvulsos =
    futebol?.controlePagamento === "avulsos" ||
    futebol?.controlePagamento === "ambos";
  const mensalistas = dados.jogadores.filter((jogador) =>
    futebol?.tipoCadastro === "so_mensalistas" || jogador.vinculo === "mensalista",
  );
  const cicloMensal = mostrarMensalistas && futebol?.vencimentoQuadra
    ? calcularCicloMensal(Number(futebol.vencimentoQuadra.slice(8, 10)), dataReferencia)
    : null;
  const dias = futebol?.diasSemana
    .map((valor) => DIAS_SEMANA.find((opcao) => opcao.value === valor)?.label)
    .filter((dia) => dia !== undefined)
    .join(" e ");
  const frequencia = FREQUENCIAS.find(
    (opcao) => opcao.value === futebol?.frequencia,
  );
  const resumoJogos = [
    dias || null,
    frequencia?.label ?? null,
    futebol?.horario ?? null,
  ]
    .filter((parte): parte is string => parte !== null)
    .join(" · ");
  const linhaJogos = resumoJogos ? `Jogos: ${resumoJogos}` : null;
  const linhaVencimento = futebol?.vencimentoQuadra
    ? `Vencimento da quadra: todo dia ${futebol.vencimentoQuadra.slice(8, 10)}`
    : null;

  const jogadoresDoVinculo = useMemo(() => {
    if (filtroVinculo === "todos") return dados.jogadores;
    if (filtroVinculo === "pendentes") {
      return dados.jogadores.filter((jogador) =>
        ((mostrarMensalistas && (futebol?.tipoCadastro === "so_mensalistas" || jogador.vinculo === "mensalista")) && dados.pagamentosCiclo[jogador.id] === undefined) ||
        (jogador.vinculo === "avulso" && dados.presencas[jogador.id] === true && dados.pagamentosAvulsosJogo[jogador.id] === undefined),
      );
    }
    return dados.jogadores.filter(
      (jogador) => jogador.vinculo ===
        (filtroVinculo === "mensalistas" ? "mensalista" : "avulso"),
    );
  }, [dados.jogadores, dados.pagamentosCiclo, dados.pagamentosAvulsosJogo, dados.presencas, filtroVinculo, futebol?.tipoCadastro, mostrarMensalistas]);
  const idsVisiveis = useMemo(
    () => new Set(jogadoresVisiveis.map((jogador) => jogador.id)),
    [jogadoresVisiveis],
  );

  const secaoComTipo = (
    tipo: TipoJogador,
  ): { total: number; confirmados: number; visiveis: Jogador[] } => {
    const todos = jogadoresDoVinculo.filter((jogador) => {
      if (jogador.tipo !== tipo) return false;
      return true;
    });
    const visiveis = todos.filter((jogador) => idsVisiveis.has(jogador.id));
    return {
      total: todos.length,
      confirmados: todos.filter(
        (jogador) => dados.presencas[jogador.id] === true,
      ).length,
      visiveis: [...visiveis],
    };
  };
  const goleiros = secaoComTipo("goleiro");
  const jogadores = secaoComTipo("linha");
  const goleirosConfirmados =
    dados.jogadores.filter(
      (jogador) =>
        jogador.tipo === "goleiro" &&
        dados.presencas[jogador.id] === true,
    ).length;
  const goleirosCadastrados = dados.jogadores.filter(
    (jogador) => jogador.tipo === "goleiro",
  ).length;
  const jogadoresConfirmados =
    dados.jogadores.filter(
      (jogador) =>
        jogador.tipo === "linha" &&
        dados.presencas[jogador.id] === true,
    ).length;
  const jogadoresCadastrados = dados.jogadores.filter(
    (jogador) => jogador.tipo === "linha",
  ).length;
  const secoes: Array<{
    tipo: TipoJogador;
    quantidadeTotal: number;
    confirmados?: number;
    data: readonly Jogador[];
  }> = [
    {
      tipo: "goleiro",
      quantidadeTotal: goleiros.total,
      ...(futebol?.controlaPresenca
        ? { confirmados: goleiros.confirmados }
        : {}),
      data: goleiros.visiveis,
    },
    {
      tipo: "linha",
      quantidadeTotal: jogadores.total,
      ...(futebol?.controlaPresenca
        ? { confirmados: jogadores.confirmados }
        : {}),
      data: jogadores.visiveis,
    },
  ];

  const resumoLista = (
    <View style={styles.cabecalhoLista}>
      {avisoImportacao ? (
        <AvisoImportacao aviso={avisoImportacao} />
      ) : null}
      <View style={styles.topo}>
        <View style={styles.tituloHome}>
          <Texto variante="titulo">{futebol?.nome ?? "Seu futebol"}</Texto>
          <Texto variante="legenda">
            {dados.jogadores.length} jogadores cadastrados
          </Texto>
        </View>
        <View style={styles.acoesTopo}>
        <Pressable accessibilityRole="button" accessibilityLabel="Sair deste futebol e voltar para a lista" onPress={onSair} style={styles.botaoSair}><Ionicons name="exit-outline" color={colors.primaryText} size={dimensions.editIconSize} /><Texto variante="corpo" style={styles.textoEditarFutebol}>Sair</Texto></Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar informações do futebol"
          onPress={onEditarFutebol}
          style={({ pressed }) => [
            styles.botaoEditarFutebol,
            pressed ? styles.botaoEditarPressionado : null,
          ]}
        >
          <Ionicons
            name="pencil"
            color={colors.primaryText}
            size={dimensions.editIconSize}
          />
          <Texto variante="corpo" style={styles.textoEditarFutebol}>
            Editar futebol
          </Texto>
        </Pressable>
        </View>
      </View>

      {cicloMensal ? (
        <FaixaCicloMensalidade
          inicio={cicloMensal.inicio}
          fim={cicloMensal.fim}
          vencimento={cicloMensal.proximoVencimento}
          diasAteVencimento={cicloMensal.diasAteVencimento}
        />
      ) : null}

      {/* Card compacto com info do futebol e resumo do cadastro */}
      {futebol ? (
        <View style={styles.cartao}>
          {(futebol.nomeQuadra || futebol.endereco || linhaJogos || linhaVencimento) ? (
            <View style={styles.infoLinha}>
              {futebol.nomeQuadra || futebol.endereco ? (
                <Texto variante="legenda">
                  📍{" "}
                  {[futebol.nomeQuadra, futebol.endereco]
                    .filter((parte): parte is string => Boolean(parte))
                    .join(" · ")}
                </Texto>
              ) : null}
              {linhaJogos ? (
                <Texto variante="legenda">🗓️ {linhaJogos}</Texto>
              ) : null}
              {linhaVencimento ? (
                <Texto variante="legenda">{linhaVencimento}</Texto>
              ) : null}
            </View>
          ) : null}
          <View style={styles.infoLinha}>
            <Texto variante="legenda">
              {futebol.tipoCadastro === "basico"
                ? "Cadastro básico"
                : futebol.tipoCadastro === "so_mensalistas"
                  ? "Só mensalistas"
                  : "Mensalistas e avulsos"}
            </Texto>
            {futebol.quantidadeMensalistas !== null &&
            futebol.quantidadeMensalistas !== undefined ? (
              <Texto variante="legenda">
                {futebol.tipoCadastro === "so_mensalistas"
                  ? dados.jogadores.length
                  : dados.jogadores.filter(
                      (jogador) => jogador.vinculo === "mensalista",
                    ).length}{" "}
                / {futebol.quantidadeMensalistas} mensalistas
              </Texto>
            ) : null}
            {futebol.controlePagamento !== "nenhum" &&
            futebol.mensalidadeCentavos !== null &&
            futebol.mensalidadeCentavos !== undefined ? (
              <Texto variante="legenda">
                Mensalidade: {formatarMoedaPtBr(futebol.mensalidadeCentavos)}
              </Texto>
            ) : null}
          </View>
        </View>
      ) : null}

      {futebol &&
      futebol.tipoCadastro !== "basico" &&
      futebol.controlePagamento !== "nenhum" &&
      futebol.valorQuadraCentavos !== null ? (
        <CartaoSaldoDoMes
          modo="atual"
          mensalistasCadastrados={mensalistas.length}
          mensalistasMeta={futebol.quantidadeMensalistas ?? 0}
          avulsosInformados={futebol.quantidadeAvulsos ?? 0}
          mensalidadeCentavos={
            mostrarMensalistas ? futebol.mensalidadeCentavos : null
          }
          valorAvulsoCentavos={
            mostrarAvulsos
              ? futebol.avulsoEscolhidoCentavos ??
                futebol.avulsoSugeridoCentavos
              : null
          }
          valorQuadraCentavos={futebol.valorQuadraCentavos}
          diasSemana={futebol.diasSemana}
          frequencia={futebol.frequencia}
          mostrarMensalistas={mostrarMensalistas}
          mostrarAvulsos={mostrarAvulsos}
          pagamentosCentavos={Object.values(dados.pagamentosCiclo)}
          pagamentosAvulsosCentavos={dados.arrecadacaoAvulsosCicloCentavos}
          quantidadePagamentosAvulsos={dados.quantidadePagamentosAvulsosCiclo}
        />
      ) : null}

      {futebol?.controlaPresenca ? (
        <>
          <View style={styles.presencas}>
            <View style={styles.dataControles}>
              <Botao
                variante="secundario"
                accessibilityLabel="Ver jogo anterior"
                desabilitado={!podeIrAnterior}
                onPress={() => onDataChange(-1)}
              >
                ‹
              </Botao>
              <Texto variante="secao" style={styles.dataTexto}>
                {dataLabel}
              </Texto>
              <Botao
                variante="secundario"
                accessibilityLabel="Ver próximo jogo"
                desabilitado={!podeIrSeguinte}
                onPress={() => onDataChange(1)}
              >
                ›
              </Botao>
            </View>
            <View style={styles.acoesData}>
              <Texto variante="legenda">{situacaoData}</Texto>
              <Botao
                variante="secundario"
                accessibilityLabel={`Voltar para ${rotuloHoje.toLocaleLowerCase()}`}
                onPress={onHoje}
              >
                {rotuloHoje}
              </Botao>
            </View>
            {mostrarAvisoHojeNaoEhJogo ? (
              <Texto variante="legenda">Hoje não é dia de jogo</Texto>
            ) : null}
          </View>
          <FaixaStatusJogo texto={statusJogoTexto} />
          {!presencasCarregando ? (
            <ResumoDePresenca
              confirmados={totalPresentes}
              cadastrados={dados.jogadores.length}
              goleirosConfirmados={goleirosConfirmados}
              goleirosCadastrados={goleirosCadastrados}
              jogadoresConfirmados={jogadoresConfirmados}
              jogadoresCadastrados={jogadoresCadastrados}
            />
          ) : (
            <Texto variante="legenda">Carregando presenças...</Texto>
          )}
          {sorteioSalvo ? (
            <View style={styles.cardSorteioSalvo}>
              <View style={styles.infoSorteioSalvo}>
                <Texto variante="corpo" style={styles.tituloSorteioSalvo}>
                  ⚽ Times definidos ({sorteioSalvo.times.length} times)
                </Texto>
                <Texto variante="legenda" cor="textSecondary">
                  {sorteioSalvo.totais.jogadores} jogadores · {sorteioSalvo.reservas.length} reservas
                </Texto>
              </View>
              {onAbrirTimes ? (
                <Botao
                  variante="primario"
                  accessibilityLabel="Ver escalação dos times sorteados"
                  onPress={onAbrirTimes}
                  style={styles.botaoVerTimes}
                >
                  Ver times
                </Botao>
              ) : null}
            </View>
          ) : null}
          <SeletorDeOpcoes
            rotulo="Filtrar jogadores"
            opcoes={FILTROS_PRESENCA}
            valor={filtro}
            onChange={(valor) => {
              if (valor) onFiltroChange(valor);
            }}
          />
        </>
      ) : null}
      {futebol?.tipoCadastro === "mensalistas_e_avulsos" || mostrarMensalistas ? (
        <SeletorDeOpcoes
          rotulo="Filtrar por vínculo"
          opcoes={
            mostrarMensalistas || mostrarAvulsos
              ? futebol?.tipoCadastro === "so_mensalistas"
                ? FILTROS_SO_MENSALISTAS
                : FILTROS_VINCULO_COM_PENDENTES
              : FILTROS_VINCULO
          }
          valor={filtroVinculo}
          onChange={(valor) => {
            if (valor) onFiltroVinculoChange(valor);
          }}
        />
      ) : null}
    </View>
  );

  return (
    <SectionList<Jogador, PropsSecaoHome>
      accessibilityLabel="Jogadores cadastrados"
      style={styles.lista}
      contentContainerStyle={styles.conteudoLista}
      sections={secoes}
      keyExtractor={(jogador) => jogador.id}
      renderItem={({ item }) => (
        <ItemHome
          jogador={item}
          controlarPresenca={futebol?.controlaPresenca ?? false}
          presente={dados.presencas[item.id] ?? false}
          mostrarVinculo={futebol?.tipoCadastro === "mensalistas_e_avulsos"}
          pago={item.vinculo === "avulso" ? (dados.presencas[item.id] === true ? dados.pagamentosAvulsosJogo[item.id] !== undefined : undefined) : dados.pagamentosCiclo[item.id] !== undefined}
          mostrarPagamento={item.vinculo === "avulso" ? mostrarAvulsos : mostrarMensalistas}
          desabilitarPagamento={item.vinculo === "avulso" && dados.presencas[item.id] !== true}
          onPresencaChange={(presente) =>
            onPresencaChange(item.id, presente)
          }
          onPagamentoChange={(pago) => onPagamentoChange(item.id, pago)}
          onEditar={() => onEditarJogador(item)}
        />
      )}
      renderSectionHeader={({ section }) => (
        <CabecalhoSecaoJogadores
          tipo={section.tipo}
          quantidade={section.data.length}
          quantidadeTotal={section.quantidadeTotal}
          confirmados={section.confirmados}
        />
      )}
      renderSectionFooter={({ section }) =>
        section.data.length === 0 ? (
          <Texto variante="legenda" style={styles.vazioSecao}>
            {filtro !== "todos"
              ? "Nenhum jogador neste filtro."
              : section.tipo === "goleiro"
                ? "Nenhum goleiro cadastrado ainda."
                : "Nenhum jogador cadastrado ainda."}
          </Texto>
        ) : null
      }
      ListHeaderComponent={resumoLista}
      ItemSeparatorComponent={Separador}
      SectionSeparatorComponent={SeparadorSecoes}
      stickySectionHeadersEnabled={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  );
}

type ItemHomeProps = {
  jogador: Jogador;
  controlarPresenca: boolean;
  presente: boolean;
  mostrarVinculo: boolean;
  onPresencaChange: (presente: boolean) => void;
  pago: boolean | undefined;
  mostrarPagamento: boolean;
  desabilitarPagamento: boolean;
  onPagamentoChange: (pago: boolean) => void;
  onEditar: () => void;
};

function ItemHome({
  jogador,
  controlarPresenca,
  presente,
  mostrarVinculo,
  onPresencaChange,
  pago,
  mostrarPagamento,
  desabilitarPagamento,
  onPagamentoChange,
  onEditar,
}: ItemHomeProps) {
  return (
    <ItemDeJogador
      jogador={jogador}
      mostrarTipo={false}
      mostrarVinculo={mostrarVinculo}
      presente={controlarPresenca ? presente : undefined}
      onPresencaChange={controlarPresenca ? onPresencaChange : undefined}
      pago={mostrarPagamento ? pago : undefined}
      onPagamentoChange={
        mostrarPagamento
          ? onPagamentoChange
          : undefined
      }
      desabilitarPagamento={desabilitarPagamento}
      onEdit={onEditar}
    />
  );
}

function Separador() {
  return <View style={styles.separador} />;
}

function SeparadorSecoes() {
  return <View style={styles.separadorSecoes} />;
}

const styles = StyleSheet.create({
  acoesTopo: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  botaoSair: { minHeight: 48, minWidth: 48, paddingHorizontal: spacing.xs, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  lista: {
    flex: 1,
  },
  conteudoLista: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  cabecalhoLista: {
    gap: spacing.xl,
    paddingBottom: spacing.xl,
  },
  topo: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  tituloHome: {
    gap: spacing.xs,
  },
  botaoEditarFutebol: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.button,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: dimensions.touchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  botaoEditarPressionado: {
    backgroundColor: colors.primarySoftPressed,
  },
  textoEditarFutebol: {
    flexShrink: 1,
  },
  cartao: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    gap: spacing.md,
    padding: spacing.lg,
  },
  infoLinha: {
    gap: spacing.xs,
  },
  resumoCadastro: {
    gap: spacing.sm,
  },
  presencas: {
    gap: spacing.md,
  },
  dataControles: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  dataTexto: {
    flex: 1,
    textAlign: "center",
  },
  acoesData: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  separador: {
    height: spacing.md,
  },
  separadorSecoes: {
    height: spacing.lg,
  },
  vazioSecao: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  cardSorteioSalvo: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md,
  },
  infoSorteioSalvo: {
    flex: 1,
    gap: 2,
  },
  tituloSorteioSalvo: {
    fontWeight: typography.weights.bold,
  },
  botaoVerTimes: {
    minWidth: 100,
  },
});
