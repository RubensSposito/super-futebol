import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { CampoTexto, Texto } from "@/components/atoms";
import { formatarMoedaPtBr, lerMoedaPtBr } from "@/lib/financeiro";
import { colors, dimensions, spacing, typography } from "@/theme";

type CampoMoedaProps = {
  rotulo: string;
  accessibilityLabel: string;
  valorCentavos: number | null;
  onChange: (valorCentavos: number | null, digitadoManualmente: boolean) => void;
  mensagemErro?: string | null;
  placeholder?: string;
};

const VALOR_MAXIMO_CENTAVOS = 9_999_999;

function limparEntrada(valor: string): string {
  let saida = "";
  let separadorUsado = false;
  let casasDecimais = 0;
  let digitosInteiros = 0;
  for (const caractere of valor.replace(/\./g, ",")) {
    if (caractere === "," && !separadorUsado) {
      saida += caractere;
      separadorUsado = true;
    } else if (/\d/.test(caractere)) {
      if (separadorUsado && casasDecimais < 2) {
        saida += caractere;
        casasDecimais += 1;
      } else if (!separadorUsado && digitosInteiros < 6) {
        saida += caractere;
        digitosInteiros += 1;
      }
    }
  }
  return saida;
}

export function CampoMoeda({
  rotulo,
  accessibilityLabel,
  valorCentavos,
  onChange,
  mensagemErro,
  placeholder = "R$ 0,00",
}: CampoMoedaProps) {
  const [texto, setTexto] = useState(
    valorCentavos === null ? "" : formatarMoedaPtBr(valorCentavos),
  );
  const [focado, setFocado] = useState(false);
  const anteriorRef = useRef<number | null>(valorCentavos);
  const textoExibido = focado
    ? texto
    : valorCentavos === null
      ? ""
      : formatarMoedaPtBr(valorCentavos);

  return (
    <View style={styles.container}>
      <Texto variante="legenda">{rotulo}</Texto>
      <CampoTexto
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Ao tocar, o valor atual será selecionado para substituição."
        accessibilityRole="text"
        value={textoExibido}
        placeholder={placeholder}
        keyboardType="decimal-pad"
        selectTextOnFocus
        style={styles.campo}
        onFocus={() => {
          anteriorRef.current = valorCentavos;
          setFocado(true);
          setTexto("");
          onChange(null, false);
        }}
        onChangeText={(entrada) => {
          const sanitizada = limparEntrada(entrada);
          setTexto(sanitizada);
          const centavos = lerMoedaPtBr(sanitizada);
          const valorValido = centavos !== null && centavos <= VALOR_MAXIMO_CENTAVOS
            ? centavos
            : null;
          onChange(valorValido, true);
        }}
        onBlur={() => {
          setFocado(false);
          const valorAtual = lerMoedaPtBr(texto);
          const valorFinal = valorAtual !== null && valorAtual <= VALOR_MAXIMO_CENTAVOS
            ? valorAtual
            : anteriorRef.current;
          onChange(valorFinal, false);
        }}
      />
      {mensagemErro ? (
        <Texto variante="legenda" cor="error" accessibilityLiveRegion="polite">
          {mensagemErro}
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  campo: {
    height: dimensions.currencyFieldHeight,
    minHeight: dimensions.currencyFieldHeight,
    fontSize: typography.sizes.currency,
    color: colors.textPrimary,
  },
});
