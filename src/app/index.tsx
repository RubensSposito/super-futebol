import { useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import { HeroBoasVindas, TelaBase } from "@/components";
import { isSetupDone } from "@/db";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      let pronto = false;
      try {
        // Verifica os dados salvos e garante um tempo mínimo da tela de boas-vindas
        const [resultado] = await Promise.all([
          isSetupDone(),
          new Promise((r) => setTimeout(r, 2000)),
        ]);
        pronto = resultado;
      } catch (e) {
        console.warn("Erro ao abrir o banco:", e);
      }
      if (cancelado) return;
      router.replace((pronto ? "/home" : "/onboarding") as Href);
    }

    iniciar();
    return () => {
      cancelado = true;
    };
  }, [router]);

  return (
    <TelaBase centralizada>
      <HeroBoasVindas />
    </TelaBase>
  );
}
