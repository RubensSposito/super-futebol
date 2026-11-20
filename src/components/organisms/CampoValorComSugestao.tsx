import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Botao, Texto } from "@/components/atoms";
import { CampoMoeda } from "@/components/molecules/CampoMoeda";
import { formatarMoedaPtBr } from "@/lib/financeiro";
import { spacing } from "@/theme";

type CampoValorComSugestaoProps = {
  rotulo: string;
  accessibilityLabel: string;
  nomeValor: string;
  accessibilityLabelZerar: string;
  valorCentavos: number | null;
  valorSugeridoCentavos: number | null;
  onChange: (valorCentavos: number | null, digitadoManualmente: boolean) => void;
  mensagemErro?: string | null;
  textoApoio?: string;
  onUsarSugestao: () => void;
};

export function CampoValorComSugestao({
  rotulo,
  accessibilityLabel,
  nomeValor,
  accessibilityLabelZerar,
  valorCentavos,
  valorSugeridoCentavos,
  onChange,
  mensagemErro,
  textoApoio,
  onUsarSugestao,
}: CampoValorComSugestaoProps) {
  const [confirmacaoVisivel, setConfirmacaoVisivel] = useState(false);
  const sugeridoAplicado = valorSugeridoCentavos !== null && valorCentavos === valorSugeridoCentavos;

  useEffect(() => {
    if (!confirmacaoVisivel) return;
    const identificador = setTimeout(() => setConfirmacaoVisivel(false), 2000);
    return () => clearTimeout(identificador);
  }, [confirmacaoVisivel]);

  return (
    <View style={styles.container}>
      <CampoMoeda
        rotulo={rotulo}
        accessibilityLabel={accessibilityLabel}
        valorCentavos={valorCentavos}
        onChange={onChange}
        mensagemErro={mensagemErro}
      />
      <View style={styles.acoes}>
        <Botao
          variante="secundario"
          ativo={sugeridoAplicado}
          accessibilityLabel={
            valorSugeridoCentavos === null
              ? `Usar valor sugerido de ${nomeValor}`
              : `Usar valor sugerido de ${formatarMoedaPtBr(valorSugeridoCentavos).replace(/,00$/, "")} para ${nomeValor}`
          }
          desabilitado={valorSugeridoCentavos === null}
          onPress={() => {
            if (valorSugeridoCentavos === null) return;
            onUsarSugestao();
            setConfirmacaoVisivel(true);
          }}
          style={styles.botao}
        >
          {sugeridoAplicado
            ? "✓ Sugerido aplicado"
            : `Usar sugerido · ${valorSugeridoCentavos === null ? "—" : formatarMoedaPtBr(valorSugeridoCentavos).replace(/,00$/, "")}`}
        </Botao>
        <Botao
          variante="secundario"
          accessibilityLabel={accessibilityLabelZerar}
          onPress={() => {
            onChange(null, true);
            setConfirmacaoVisivel(false);
          }}
          style={styles.botao}
        >
          Zerar
        </Botao>
      </View>
      {valorSugeridoCentavos === null && textoApoio ? (
        <Texto variante="legenda">{textoApoio}</Texto>
      ) : null}
      {confirmacaoVisivel ? (
        <Texto variante="legenda" cor="successText" accessibilityLiveRegion="polite">
          Valor sugerido aplicado
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  acoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    alignItems: "stretch",
  },
  botao: { flexGrow: 1, flexBasis: "45%" },
});
