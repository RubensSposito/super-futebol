import { useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import { HeroBoasVindas, TelaBase } from "@/components";
import { getFutebolAtivoId, listarFutebols } from "@/db";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      let pronto: string = "/onboarding";
      try {
        // Verifica os dados salvos e garante um tempo mínimo da tela de boas-vindas
        const [resultado] = await Promise.all([
          (async () => { const lista = await listarFutebols(); if (!lista.sucesso) return "/onboarding"; if (lista.dados.length === 0) return "/onboarding"; const ativo = await getFutebolAtivoId(); return ativo ? "/home" : "/futebols"; })(),
          new Promise((r) => setTimeout(r, 2000)),
        ]);
        pronto = resultado;
      } catch (e) {
        console.warn("Erro ao abrir o banco:", e);
      }
      if (cancelado) return;
      router.replace(pronto as Href);
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
