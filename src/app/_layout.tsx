import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors, typography } from "@/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          headerTitleStyle: {
            color: colors.textPrimary,
            fontSize: typography.sizes.section,
            fontWeight: typography.weights.bold,
          },
        }}
      >
        <Stack.Screen
          name="home"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="cadastro-futebol"
          options={{
            headerShown: true,
            title: "Configurar futebol",
          }}
        />
        <Stack.Screen
          name="cadastro-jogadores"
          options={{
            headerShown: true,
            title: "Cadastrar jogadores",
          }}
        />
        <Stack.Screen
          name="partida-rapida"
          options={{
            headerShown: true,
            title: "Partida rápida",
          }}
        />
        <Stack.Screen
          name="resultado"
          options={{
            headerShown: true,
            title: "Times do dia",
          }}
        />
      </Stack>
    </>
  );
}
