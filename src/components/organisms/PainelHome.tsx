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
  TipoJogador,
} from "@/types";
import { Botao, Texto } from "@/components/atoms";
import {
  CabecalhoSecaoJogadores,
  FaixaStatusJogo,
  ItemDeJogador,
  SeletorDeOpcoes,
  AvisoImportacao,
} from "@/components/molecules";
import { CartaoSaldoDoMes } from "./CartaoSaldoDoMes";
import { ResumoDePresenca } from "./ResumoDePresenca";
import { formatarMoedaPtBr } from "@/lib/financeiro";
import { DIAS_SEMANA, FREQUENCIAS } from "@/constants";
import {
  borders,
  colors,
  dimensions,
  radii,
  spacing,
} from "@/theme";

export type FiltroPresenca = "todos" | "presentes" | "ausentes";
export type FiltroVinculo = "todos" | "mensalistas" | "avulsos";

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
  onDataChange: (deslocamentoDias: number) => void;
  onHoje: () => void;
  onFiltroChange: (filtro: FiltroPresenca) => void;
  onFiltroVinculoChange: (filtro: FiltroVinculo) => void;
  onPresencaChange: (jogadorId: string, presente: boolean) => void;
  onEditarJogador: (jogador: Jogador) => void;
  onEditarFutebol: () => void;
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
  onDataChange,
  onHoje,
  onFiltroChange,
  onFiltroVinculoChange,
  onPresencaChange,
  onEditarJogador,
  onEditarFutebol,
}: PainelHomeProps) {
  const futebol = dados.futebol;
  const mostrarMensalistas =
    futebol?.controlePagamento === "mensalistas" ||
    futebol?.controlePagamento === "ambos";
  const mostrarAvulsos =
    futebol?.controlePagamento === "avulsos" ||
    futebol?.controlePagamento === "ambos";
  const avulsosCadastrados =
    futebol?.tipoCadastro === "mensalistas_e_avulsos"
      ? dados.jogadores.filter((jogador) => jogador.vinculo === "avulso")
          .length
      : 0;
  const dias = futebol?.diasSemana
    .map((valor) => DIAS_SEMANA.find((opcao) => opcao.value === valor)?.label)
    .filter((dia) => dia !== undefined)
    .join(" e ");
  const frequencia = FREQUENCIAS.find(
    (opcao) => opcao.value === futebol?.frequencia,
  );
  const resumoAgenda = [
    dias || null,
    frequencia?.label ?? null,
    futebol?.horario ?? null,
  ]
    .filter((parte): parte is string => parte !== null)
    .join(" · ");

  const jogadoresDoVinculo = useMemo(() => {
    if (filtroVinculo === "todos") return dados.jogadores;
    return dados.jogadores.filter(
      (jogador) => jogador.vinculo ===
        (filtroVinculo === "mensalistas" ? "mensalista" : "avulso"),
    );
  }, [dados.jogadores, filtroVinculo]);
  const idsVisiveis = useMemo(
    () => new Set(jogadoresVisiveis.map((jogador) => jogador.id)),
    [jogadoresVisiveis],
  );

  const secaoComTipo = (
    tipo: TipoJogador,
  ): { total: number; confirmados: number; visiveis: Jogador[] } => {
    const todos = jogadoresDoVinculo.filter((jogador) => jogador.tipo === tipo);
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
          <Texto variante="titulo">Seu futebol</Texto>
          <Texto variante="corpo">
            {dados.jogadores.length} jogadores cadastrados
          </Texto>
        </View>
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
            Editar informações do futebol
          </Texto>
        </Pressable>
      </View>

      {futebol &&
      (futebol.nomeQuadra || futebol.endereco || resumoAgenda) ? (
        <View style={styles.cartao}>
          <Texto variante="secao">Dados do futebol</Texto>
          {futebol.nomeQuadra || futebol.endereco ? (
            <Texto variante="corpo">
              📍{" "}
              {[futebol.nomeQuadra, futebol.endereco]
                .filter((parte): parte is string => Boolean(parte))
                .join(" · ")}
            </Texto>
          ) : null}
          {resumoAgenda ? (
            <Texto variante="corpo">🗓️ {resumoAgenda}</Texto>
          ) : null}
        </View>
      ) : null}

      <View style={styles.cartao}>
        <Texto variante="secao">Resumo do cadastro</Texto>
        <View style={styles.resumoCadastro}>
          <Texto variante="corpo">
            {futebol?.tipoCadastro === "basico"
              ? "Cadastro básico"
              : futebol?.tipoCadastro === "so_mensalistas"
                ? "Só mensalistas"
                : "Mensalistas e avulsos"}
          </Texto>
          {futebol?.quantidadeMensalistas !== null &&
          futebol?.quantidadeMensalistas !== undefined ? (
            <Texto variante="legenda">
              {futebol.tipoCadastro === "so_mensalistas"
                ? dados.jogadores.length
                : dados.jogadores.filter(
                    (jogador) => jogador.vinculo === "mensalista",
                  ).length}{" "}
              de {futebol.quantidadeMensalistas} mensalistas
            </Texto>
          ) : null}
          {futebol?.controlePagamento !== "nenhum" &&
          futebol?.mensalidadeCentavos !== null &&
          futebol?.mensalidadeCentavos !== undefined ? (
            <Texto variante="legenda">
              Mensalidade: {formatarMoedaPtBr(futebol.mensalidadeCentavos)}
            </Texto>
          ) : null}
          {futebol?.valorQuadraCentavos !== null &&
          futebol?.valorQuadraCentavos !== undefined ? (
            <Texto variante="legenda">
              Valor da quadra: {formatarMoedaPtBr(futebol.valorQuadraCentavos)}
            </Texto>
          ) : null}
        </View>
      </View>

      {futebol &&
      futebol.tipoCadastro !== "basico" &&
      futebol.controlePagamento !== "nenhum" &&
      futebol.valorQuadraCentavos !== null ? (
        <CartaoSaldoDoMes
          modo="atual"
          mensalistasCadastrados={
            futebol.tipoCadastro === "so_mensalistas"
              ? dados.jogadores.length
              : dados.jogadores.filter(
                  (jogador) => jogador.vinculo === "mensalista",
                ).length
          }
          mensalistasMeta={futebol.quantidadeMensalistas ?? 0}
          avulsosInformados={avulsosCadastrados}
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
            <Texto variante="corpo">Carregando presenças...</Texto>
          )}
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
      {futebol?.tipoCadastro === "mensalistas_e_avulsos" ? (
        <SeletorDeOpcoes
          rotulo="Filtrar por vínculo"
          opcoes={FILTROS_VINCULO}
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
          onPresencaChange={(presente) =>
            onPresencaChange(item.id, presente)
          }
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
  onEditar: () => void;
};

function ItemHome({
  jogador,
  controlarPresenca,
  presente,
  mostrarVinculo,
  onPresencaChange,
  onEditar,
}: ItemHomeProps) {
  return (
    <ItemDeJogador
      jogador={jogador}
      mostrarTipo={false}
      mostrarVinculo={mostrarVinculo}
      presente={controlarPresenca ? presente : undefined}
      onPresencaChange={controlarPresenca ? onPresencaChange : undefined}
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
    gap: spacing.md,
  },
  tituloHome: {
    gap: spacing.xs,
  },
  botaoEditarFutebol: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radii.button,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: dimensions.touchTarget,
    paddingHorizontal: spacing.lg,
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
});
