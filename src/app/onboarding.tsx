import { useRouter } from "expo-router";
import { useState } from "react";
import { Botao, Texto } from "@/components/atoms";
import {
  BlocoDePergunta,
  CaixaDeTemplate,
} from "@/components/organisms";
import { TelaBase } from "@/components/templates";
import { spacing } from "@/theme";
import { StyleSheet, View } from "react-native";

type Modo = "manual" | "importar" | null;

export default function Onboarding() {
  const router = useRouter();
  const [apenasHoje, setApenasHoje] = useState<boolean | null>(null);
  const [modo, setModo] = useState<Modo>(null);

  function responderPergunta1(valor: boolean) {
    setApenasHoje(valor);
    setModo(null);
  }

  function responderPergunta2(valor: Exclude<Modo, null>) {
    setModo(valor);
    if (valor === "manual") {
      router.push({ pathname: "/partida-rapida", params: { modo: "manual" } });
    }
  }

  return (
    <TelaBase rolavel contentStyle={styles.conteudo}>
      <BlocoDePergunta
        passo="Pergunta 1"
        pergunta="Vai cadastrar só para jogar hoje?"
        opcoes={[
          { value: "sim", label: "Sim" },
          { value: "nao", label: "Não" },
        ]}
        valor={
          apenasHoje === true ? "sim" : apenasHoje === false ? "nao" : null
        }
        onChange={(valor) => responderPergunta1(valor === "sim")}
      />
      {apenasHoje === false ? (
        <View style={styles.importacao}>
          <Texto variante="corpo">
            Perfeito! Vamos montar a base do seu futebol.
          </Texto>
          <Botao
            variante="primario"
            accessibilityLabel="Continuar para configurar o futebol"
            onPress={() => router.push("/cadastro-futebol")}
          >
            Continuar cadastro
          </Botao>
        </View>
      ) : null}
      {apenasHoje === true ? (
        <>
          <BlocoDePergunta
            passo="Pergunta 2"
            pergunta="Vai cadastrar manualmente ou importar uma lista?"
            opcoes={[
              { value: "manual", label: "Manualmente" },
              { value: "importar", label: "Importar lista" },
            ]}
            valor={modo}
            onChange={responderPergunta2}
          />
          {modo === "importar" ? (
            <View style={styles.importacao}>
              <Texto variante="corpo">
                Monte a lista neste formato (um nome por linha, depois do hífen):
              </Texto>
              <CaixaDeTemplate />
              <Botao
                variante="primario"
                accessibilityLabel="Continuar para importar lista"
                onPress={() =>
                  router.push({
                    pathname: "/partida-rapida",
                    params: { modo: "importar" },
                  })
                }
              >
                Continuar
              </Botao>
            </View>
          ) : null}
        </>
      ) : null}
    </TelaBase>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    justifyContent: "center",
  },
  importacao: {
    gap: spacing.md,
  },
});
