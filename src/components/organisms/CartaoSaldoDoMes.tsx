import { StyleSheet, View } from "react-native";
import { Selo, Texto } from "@/components/atoms";
import { CartaoRecolhivel, LinhaDeTotal } from "@/components/molecules";
import {
  calcularArrecadacaoMensalistas,
  calcularAvulsosNecessarios,
  calcularCoberturaQuadraPercentual,
  calcularJogosPorMes,
  calcularMensalistasNecessarios,
  calcularPrevisaoAvulsos,
  calcularPrevisaoTotalMes,
  calcularSaldoTotal,
  formatarMoedaPtBr,
} from "@/lib/financeiro";
import type { FrequenciaFutebol } from "@/types";
import {
  borders,
  colors,
  dimensions,
  radii,
  spacing,
  typography,
} from "@/theme";

type CartaoSaldoDoMesProps = {
  modo: "previsao" | "atual";
  compacto?: boolean;
  mensalistasCadastrados: number;
  mensalistasMeta: number;
  avulsosInformados: number;
  mensalidadeCentavos: number | null;
  valorAvulsoCentavos: number | null;
  valorQuadraCentavos: number;
  diasSemana: readonly number[];
  frequencia: FrequenciaFutebol | null;
  mostrarMensalistas: boolean;
  mostrarAvulsos: boolean;
};

function obterStatus(saldoCentavos: number) {
  if (saldoCentavos === 0) {
    return { texto: "Quadra coberta", tipo: "sucesso" as const };
  }
  if (saldoCentavos > 0) {
    return {
      texto: `Sobra ${formatarMoedaPtBr(saldoCentavos)}`,
      tipo: "sucesso" as const,
    };
  }
  return {
    texto: `Falta ${formatarMoedaPtBr(Math.abs(saldoCentavos))}`,
    tipo: "aviso" as const,
  };
}

export function CartaoSaldoDoMes({
  modo,
  compacto = false,
  mensalistasCadastrados,
  mensalistasMeta,
  avulsosInformados,
  mensalidadeCentavos,
  valorAvulsoCentavos,
  valorQuadraCentavos,
  diasSemana,
  frequencia,
  mostrarMensalistas,
  mostrarAvulsos,
}: CartaoSaldoDoMesProps) {
  const mensalistasConsiderados =
    modo === "previsao" ? mensalistasMeta : mensalistasCadastrados;
  const arrecadacaoMensalistas =
    mostrarMensalistas && mensalidadeCentavos !== null
      ? calcularArrecadacaoMensalistas(
          mensalistasConsiderados,
          mensalidadeCentavos,
        )
      : 0;
  const jogosPorMes = calcularJogosPorMes(frequencia, diasSemana);
  const previsaoAvulsos =
    mostrarAvulsos && valorAvulsoCentavos !== null
      ? calcularPrevisaoAvulsos(
          avulsosInformados,
          valorAvulsoCentavos,
          jogosPorMes,
        )
      : null;
  const saldoAtual = mostrarMensalistas
    ? calcularSaldoTotal(arrecadacaoMensalistas, valorQuadraCentavos)
    : previsaoAvulsos === null
      ? calcularSaldoTotal(0, valorQuadraCentavos)
      : calcularSaldoTotal(previsaoAvulsos, valorQuadraCentavos);
  const mensalistasNecessarios =
    mostrarMensalistas && mensalidadeCentavos !== null
      ? calcularMensalistasNecessarios(saldoAtual, mensalidadeCentavos)
      : null;
  const avulsosNecessarios =
    mostrarMensalistas && previsaoAvulsos !== null && valorAvulsoCentavos
      ? calcularAvulsosNecessarios(
          valorQuadraCentavos,
          arrecadacaoMensalistas,
          valorAvulsoCentavos,
          jogosPorMes,
        )
      : null;
  const saldoPrevisaoTotal =
    previsaoAvulsos === null
      ? null
      : mostrarMensalistas
        ? calcularPrevisaoTotalMes(saldoAtual, previsaoAvulsos)
        : saldoAtual;
  const coberturaPercentual = mostrarMensalistas
    ? calcularCoberturaQuadraPercentual(
        arrecadacaoMensalistas,
        valorQuadraCentavos,
      )
    : null;
  const statusAtual = obterStatus(saldoAtual);
  const statusTotal =
    saldoPrevisaoTotal === null ? null : obterStatus(saldoPrevisaoTotal);
  const temAgenda = frequencia !== null && diasSemana.length > 0;
  const progresso = Math.max(0, Math.min(100, coberturaPercentual ?? 0));
  const titulo =
    modo === "previsao"
      ? "Previsão com todos os mensalistas cadastrados"
      : "Saldo atual";

  if (compacto) {
    return (
      <View style={[styles.cartao, styles.cartaoCompacto]}>
        <Texto variante="secao">{titulo}</Texto>
        <View style={styles.blocoPrincipal}>
          <LinhaDeTotal
            rotulo={modo === "previsao" ? "Saldo previsto:" : "Saldo atual:"}
            valor={formatarMoedaPtBr(saldoAtual)}
            corValor={saldoAtual < 0 ? "error" : "textPrimary"}
            destaque
          />
          <Selo tipo={statusAtual.tipo}>{statusAtual.texto}</Selo>
          {mostrarMensalistas ? (
            <>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={`Cobertura da quadra: ${Math.round(
                  coberturaPercentual ?? 0,
                )}%`}
                accessibilityValue={{
                  min: 0,
                  max: 100,
                  now: progresso,
                }}
                style={styles.trilho}
              >
                <View style={[styles.progresso, { width: `${progresso}%` }]} />
              </View>
              <Texto variante="legenda">
                {formatarMoedaPtBr(arrecadacaoMensalistas)} de{" "}
                {formatarMoedaPtBr(valorQuadraCentavos)} da quadra cobertos
              </Texto>
              {modo === "previsao" ? (
                <LinhaDeTotal
                  rotulo="Mensalistas:"
                  valor={`${mensalistasMeta} x ${
                    mensalidadeCentavos === null
                      ? "—"
                      : formatarMoedaPtBr(mensalidadeCentavos)
                  } = ${formatarMoedaPtBr(arrecadacaoMensalistas)}`}
                />
              ) : (
                <LinhaDeTotal
                  rotulo="Mensalistas cadastrados:"
                  valor={`${mensalistasCadastrados} de ${mensalistasMeta}`}
                />
              )}
            </>
          ) : null}
          <LinhaDeTotal
            rotulo="Valor da quadra:"
            valor={formatarMoedaPtBr(valorQuadraCentavos)}
          />
          {mostrarMensalistas && mensalistasNecessarios !== null ? (
            mensalistasNecessarios > 0 ? (
              <Texto variante="corpo">
                Faltam {mensalistasNecessarios} mensalistas
              </Texto>
            ) : (
              <View style={styles.coberta}>
                <Texto variante="corpo">Quadra coberta</Texto>
                {saldoAtual > 0 ? (
                  <Texto variante="corpo" cor="primary">
                    Sobra {formatarMoedaPtBr(saldoAtual)}
                  </Texto>
                ) : null}
              </View>
            )
          ) : null}
        </View>
      </View>
    );
  }

  const resumoRecolhido = (
    <View style={styles.resumoRecolhido}>
      <View style={styles.linhaResumoSaldo}>
        <Texto
          variante="titulo"
          cor={saldoAtual < 0 ? "error" : "textPrimary"}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={styles.valorResumoSaldo}
        >
          {formatarMoedaPtBr(saldoAtual)}
        </Texto>
        <Selo tipo={statusAtual.tipo}>{statusAtual.texto}</Selo>
      </View>
      {mostrarMensalistas ? (
        <>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Cobertura da quadra: ${Math.round(
              coberturaPercentual ?? 0,
            )}%`}
            accessibilityValue={{
              min: 0,
              max: 100,
              now: progresso,
            }}
            style={styles.trilho}
          >
            <View style={[styles.progresso, { width: `${progresso}%` }]} />
          </View>
          {mensalistasNecessarios === null ? null : (
            <Texto variante="corpo">
              {mensalistasNecessarios > 0
                ? mensalistasNecessarios === 1
                  ? "Falta 1 mensalista"
                  : `Faltam ${mensalistasNecessarios} mensalistas`
                : "Quadra coberta"}
            </Texto>
          )}
        </>
      ) : null}
    </View>
  );

  return (
    <CartaoRecolhivel titulo={titulo} resumo={resumoRecolhido}>
      <View style={styles.blocoPrincipal}>
        {mostrarMensalistas ? (
          <>
            <Texto variante="legenda">
              {formatarMoedaPtBr(arrecadacaoMensalistas)} de{" "}
              {formatarMoedaPtBr(valorQuadraCentavos)} da quadra cobertos
            </Texto>
            {modo === "previsao" ? (
              <LinhaDeTotal
                rotulo="Mensalistas:"
                valor={`${mensalistasMeta} x ${
                  mensalidadeCentavos === null
                    ? "—"
                    : formatarMoedaPtBr(mensalidadeCentavos)
                } = ${formatarMoedaPtBr(arrecadacaoMensalistas)}`}
              />
            ) : (
              <LinhaDeTotal
                rotulo="Mensalistas cadastrados:"
                valor={`${mensalistasCadastrados} de ${mensalistasMeta}`}
              />
            )}
            <View
              accessibilityRole="progressbar"
              accessibilityLabel={`Cobertura da quadra: ${Math.round(
                coberturaPercentual ?? 0,
              )}%`}
              accessibilityValue={{
                min: 0,
                max: 100,
                now: progresso,
              }}
              style={styles.trilho}
            >
              <View style={[styles.progresso, { width: `${progresso}%` }]} />
            </View>
            {mensalistasNecessarios !== null ? (
              mensalistasNecessarios > 0 ? (
                <Texto variante="corpo">
                  Faltam {mensalistasNecessarios} mensalistas para cobrir a
                  quadra
                </Texto>
              ) : (
                <View style={styles.coberta}>
                  <Texto variante="corpo">Quadra coberta</Texto>
                  {saldoAtual > 0 ? (
                    <Texto variante="corpo" cor="primary">
                      Sobra {formatarMoedaPtBr(saldoAtual)}
                    </Texto>
                  ) : null}
                </View>
              )
            ) : null}
          </>
        ) : null}
        <LinhaDeTotal
          rotulo="Valor da quadra:"
          valor={formatarMoedaPtBr(valorQuadraCentavos)}
        />
      </View>

      {mostrarAvulsos && previsaoAvulsos !== null ? (
        <View style={styles.bloco}>
          <Texto variante="corpo">Previsão dos avulsos</Texto>
          {temAgenda ? (
            <Texto variante="corpo">
              {avulsosInformados} avulsos x{" "}
              {formatarMoedaPtBr(valorAvulsoCentavos ?? 0)} x {jogosPorMes}{" "}
              jogos no mês = {formatarMoedaPtBr(previsaoAvulsos)}
            </Texto>
          ) : (
            <>
              <Texto variante="corpo">
                {avulsosInformados} avulsos x{" "}
                {formatarMoedaPtBr(valorAvulsoCentavos ?? 0)} (cada avulso
                pagando uma vez) = {formatarMoedaPtBr(previsaoAvulsos)}
              </Texto>
              <Texto variante="legenda">
                Cadastre dia e frequência para prever o mês inteiro
              </Texto>
            </>
          )}
          {mostrarMensalistas &&
          saldoAtual < 0 &&
          avulsosNecessarios !== null ? (
            <Texto variante="corpo">
              Ou {avulsosNecessarios} avulsos para cobrir o que falta
              {jogosPorMes > 1 ? ` (${jogosPorMes} jogos no mês)` : ""}
            </Texto>
          ) : null}
        </View>
      ) : null}

      {previsaoAvulsos !== null && statusTotal ? (
        <View style={styles.blocoMenor}>
          <Texto variante="corpo">Previsão total do mês</Texto>
          <LinhaDeTotal
            rotulo="Total:"
            valor={formatarMoedaPtBr(saldoPrevisaoTotal ?? 0)}
            corValor={
              (saldoPrevisaoTotal ?? 0) < 0 ? "error" : "textPrimary"
            }
            destaque
          />
          <Selo tipo={statusTotal.tipo}>{statusTotal.texto}</Selo>
        </View>
      ) : null}
    </CartaoRecolhivel>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: colors.surface,
    borderColor: colors.primarySoft,
    borderRadius: radii.card,
    borderWidth: borders.highlight,
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  cartaoCompacto: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  blocoPrincipal: {
    gap: spacing.md,
  },
  resumoRecolhido: {
    gap: spacing.md,
  },
  linhaResumoSaldo: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  valorResumoSaldo: {
    flexShrink: 1,
    fontSize: typography.sizes.title,
  },
  trilho: {
    backgroundColor: colors.neutralBackground,
    borderRadius: radii.pill,
    height: dimensions.touchTarget / 6,
    overflow: "hidden",
    width: "100%",
  },
  progresso: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: "100%",
  },
  coberta: {
    gap: spacing.xs,
  },
  bloco: {
    borderTopColor: colors.border,
    borderTopWidth: borders.separator,
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  blocoMenor: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
