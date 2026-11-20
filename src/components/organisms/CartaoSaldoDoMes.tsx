import { StyleSheet, View } from "react-native";
import { Selo, Texto } from "@/components/atoms";
import { CartaoRecolhivel, LinhaDeTotal } from "@/components/molecules";
import {
  calcularArrecadacaoMensalistas,
  calcularArrecadacaoTotal,
  calcularPagamentosAvulsoNecessarios,
  calcularCoberturaQuadraPercentual,
  calcularJogosPorMes,
  calcularMensalistasNecessarios,
  calcularPrevisaoAvulsos,
  calcularPrevisaoTotalMes,
  calcularSaldoTotal,
  calcularResumoCicloMensal,
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
  pagamentosCentavos?: readonly number[];
  pagamentosAvulsosCentavos?: number;
  quantidadePagamentosAvulsos?: number;
};

function obterStatus(saldoCentavos: number) {
  if (saldoCentavos === 0) {
    return { texto: "Quadra/campo coberto(a)", tipo: "sucesso" as const };
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
  pagamentosCentavos,
  pagamentosAvulsosCentavos = 0,
  quantidadePagamentosAvulsos = 0,
}: CartaoSaldoDoMesProps) {
  const mensalistasConsiderados =
    modo === "previsao" ? mensalistasMeta : mensalistasCadastrados;
  const resumoCiclo =
    modo === "atual" && mostrarMensalistas && pagamentosCentavos !== undefined
      ? calcularResumoCicloMensal(
          pagamentosCentavos,
          mensalistasCadastrados,
          mensalidadeCentavos,
          valorQuadraCentavos,
        )
      : null;
  const arrecadacaoMensalistas = resumoCiclo
    ? resumoCiclo.arrecadadoCentavos
    : mostrarMensalistas && mensalidadeCentavos !== null
      ? calcularArrecadacaoMensalistas(
          mensalistasConsiderados,
          mensalidadeCentavos,
        )
      : 0;
  const jogosPorMes = calcularJogosPorMes(frequencia, diasSemana);
  const totalParticipacoesAvulsasMes = avulsosInformados * jogosPorMes;
  const previsaoAvulsos =
    mostrarAvulsos && valorAvulsoCentavos !== null
      ? calcularPrevisaoAvulsos(
          avulsosInformados,
          valorAvulsoCentavos,
          jogosPorMes,
        )
      : null;
  const saldoAtual = calcularSaldoTotal(calcularArrecadacaoTotal(arrecadacaoMensalistas, pagamentosAvulsosCentavos), valorQuadraCentavos);
  const mensalistasNecessarios =
    mostrarMensalistas && mensalidadeCentavos !== null
      ? calcularMensalistasNecessarios(saldoAtual, mensalidadeCentavos)
      : null;
  const avulsosNecessarios =
    mostrarAvulsos && valorAvulsoCentavos
      ? calcularPagamentosAvulsoNecessarios(saldoAtual, valorAvulsoCentavos)
      : null;
  const saldoPrevisaoTotal =
    previsaoAvulsos === null
      ? null
      : calcularPrevisaoTotalMes(saldoAtual, Math.max(0, previsaoAvulsos - pagamentosAvulsosCentavos));
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
    resumoCiclo
      ? "Saldo do ciclo"
      : modo === "previsao"
      ? (mostrarAvulsos ? "Previsão de saldos (com e sem avulsos)" : "Previsão com todos os mensalistas")
      : "Saldo atual";

  if (compacto) {
    return (
      <View style={[styles.cartao, styles.cartaoCompacto]}>
        <Texto variante="secao">{titulo}</Texto>
        <View style={styles.blocoPrincipal}>
          {modo === "previsao" && mostrarAvulsos && saldoPrevisaoTotal !== null && statusTotal ? (
            <View style={styles.blocoDestaqueCheio}>
              <Texto variante="legenda" cor="primary">
                ⭐ PREVISÃO COM FUTEBOL CHEIO (MENSALISTAS + AVULSOS)
              </Texto>
              <Texto variante="corpo" style={styles.textoContaCheio}>
                {avulsosInformados} avulsos x {jogosPorMes} jogos/mês = {totalParticipacoesAvulsasMes} participações
                {"\n"}{totalParticipacoesAvulsasMes} x {formatarMoedaPtBr(valorAvulsoCentavos ?? 0)} = {formatarMoedaPtBr(previsaoAvulsos ?? 0)} de avulsos
                {"\n"}+ Mensalistas ({formatarMoedaPtBr(arrecadacaoMensalistas)}) = {formatarMoedaPtBr(arrecadacaoMensalistas + (previsaoAvulsos ?? 0))}
              </Texto>
              <LinhaDeTotal
                rotulo="Saldo previsto (futebol cheio):"
                valor={formatarMoedaPtBr(saldoPrevisaoTotal)}
                corValor={saldoPrevisaoTotal < 0 ? "error" : "textPrimary"}
                destaque
              />
              <Selo tipo={statusTotal.tipo}>{statusTotal.texto}</Selo>
            </View>
          ) : null}

          <View style={styles.blocoSemAvulsos}>
            <Texto variante="legenda">
              {mostrarAvulsos ? "Cenário base: se não tiver avulsos (só mensalistas)" : "Cenário dos mensalistas"}
            </Texto>
            <LinhaDeTotal
              rotulo="Saldo só com mensalistas:"
              valor={formatarMoedaPtBr(saldoAtual)}
              corValor={saldoAtual < 0 ? "error" : "textPrimary"}
            />
            <Selo tipo={statusAtual.tipo}>{statusAtual.texto}</Selo>
          </View>

          {mostrarMensalistas ? (
            <>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={`Cobertura da quadra ou campo: ${Math.round(
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
                {formatarMoedaPtBr(valorQuadraCentavos)} da quadra/campo cobertos
              </Texto>
              {resumoCiclo ? (
                <LinhaDeTotal
                  rotulo="Pagaram:"
                  valor={`${resumoCiclo.quantidadePagantes} de ${mensalistasCadastrados} cadastrados`}
                />
              ) : null}
              {modo === "atual" && mostrarAvulsos ? <LinhaDeTotal rotulo="Avulsos no ciclo:" valor={`${formatarMoedaPtBr(pagamentosAvulsosCentavos)} (${quantidadePagamentosAvulsos} pagamentos)`} /> : null}
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
                  rotulo={resumoCiclo ? "Pagaram:" : "Mensalistas cadastrados:"}
                  valor={resumoCiclo
                    ? `${resumoCiclo.quantidadePagantes} de ${mensalistasCadastrados} cadastrados`
                    : `${mensalistasCadastrados} de ${mensalistasMeta}`}
                />
              )}
            </>
          ) : null}
          <LinhaDeTotal
            rotulo="Valor da quadra ou campo:"
            valor={formatarMoedaPtBr(valorQuadraCentavos)}
          />
          {mostrarMensalistas && mensalistasNecessarios !== null ? (
            mensalistasNecessarios > 0 ? (
              <Texto variante="corpo">
                Faltam {mensalistasNecessarios} mensalistas para cobrir sem avulsos
              </Texto>
            ) : (
              <View style={styles.coberta}>
                <Texto variante="corpo">Quadra ou campo coberto(a)</Texto>
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
      {modo === "previsao" && mostrarAvulsos && saldoPrevisaoTotal !== null && statusTotal ? (
        <View style={styles.blocoDestaqueCheio}>
          <Texto variante="legenda" cor="primary">
            ⭐ FUTEBOL CHEIO: {formatarMoedaPtBr(saldoPrevisaoTotal)} ({statusTotal.texto})
          </Texto>
          <Texto variante="legenda">
            {avulsosInformados} avulsos x {jogosPorMes} jogos/mês = {totalParticipacoesAvulsasMes} participações ({formatarMoedaPtBr(previsaoAvulsos ?? 0)})
          </Texto>
        </View>
      ) : null}
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
        <Selo tipo={statusAtual.tipo}>
          {mostrarAvulsos && modo === "previsao" ? `Só mensalistas: ${statusAtual.texto}` : statusAtual.texto}
        </Selo>
      </View>
      {mostrarMensalistas ? (
        <>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Cobertura da quadra ou campo: ${Math.round(
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
                  ? resumoCiclo
                    ? "Falta 1 mensalista pagar para cobrir a quadra ou campo"
                    : "Falta 1 mensalista"
                  : resumoCiclo
                    ? `Faltam ${mensalistasNecessarios} mensalistas pagarem para cobrir a quadra ou campo`
                    : `Faltam ${mensalistasNecessarios} mensalistas`
                : "Quadra/campo coberto(a)"}
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
              {formatarMoedaPtBr(valorQuadraCentavos)} da quadra/campo cobertos
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
                rotulo={resumoCiclo ? "Pagaram:" : "Mensalistas cadastrados:"}
                valor={resumoCiclo
                  ? `${resumoCiclo.quantidadePagantes} de ${mensalistasCadastrados} cadastrados`
                  : `${mensalistasCadastrados} de ${mensalistasMeta}`}
              />
            )}
            {resumoCiclo ? (
              <LinhaDeTotal
                rotulo="Previsto se todos os cadastrados pagarem:"
                valor={formatarMoedaPtBr(calcularPrevisaoTotalMes(resumoCiclo.previsaoTodosPagandoCentavos, pagamentosAvulsosCentavos))}
              />
            ) : null}
            {modo === "atual" && mostrarAvulsos ? <LinhaDeTotal rotulo="Avulsos no ciclo:" valor={`${formatarMoedaPtBr(pagamentosAvulsosCentavos)} (${quantidadePagamentosAvulsos} pagamentos)`} /> : null}
            <View
              accessibilityRole="progressbar"
              accessibilityLabel={`Cobertura da quadra ou campo: ${Math.round(
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
                {mensalistasNecessarios === 1
                  ? resumoCiclo
                    ? "Falta 1 mensalista pagar para cobrir a quadra ou campo"
                    : "Falta 1 mensalista para cobrir a quadra ou campo"
                  : resumoCiclo
                    ? `Faltam ${mensalistasNecessarios} mensalistas pagarem para cobrir a quadra ou campo`
                    : `Faltam ${mensalistasNecessarios} mensalistas para cobrir a quadra ou campo`}
                </Texto>
              ) : (
                <View style={styles.coberta}>
                  <Texto variante="corpo">Quadra ou campo coberto(a)</Texto>
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
          rotulo="Valor da quadra ou campo:"
          valor={formatarMoedaPtBr(valorQuadraCentavos)}
        />
      </View>

      {mostrarAvulsos && previsaoAvulsos !== null ? (
        <View style={styles.bloco}>
          <Texto variante="corpo">Previsão dos avulsos</Texto>
          {modo === "atual" && !mostrarMensalistas ? <LinhaDeTotal rotulo="Avulsos no ciclo:" valor={`${formatarMoedaPtBr(pagamentosAvulsosCentavos)} (${quantidadePagamentosAvulsos} pagamentos)`} /> : null}
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
          {modo === "atual" ? <LinhaDeTotal rotulo="Falta chegar de avulsos:" valor={formatarMoedaPtBr(Math.max(0, previsaoAvulsos - pagamentosAvulsosCentavos))} /> : null}
          {saldoAtual < 0 &&
          avulsosNecessarios !== null ? (
            <Texto variante="corpo">
              ou {avulsosNecessarios} pagamentos de avulso
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
  blocoDestaqueCheio: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radii.card,
    borderWidth: borders.surface,
    gap: spacing.xs,
    padding: spacing.md,
  },
  textoContaCheio: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.primaryText,
  },
  blocoSemAvulsos: {
    backgroundColor: colors.neutralBackground,
    borderRadius: radii.card,
    gap: spacing.xs,
    padding: spacing.md,
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
