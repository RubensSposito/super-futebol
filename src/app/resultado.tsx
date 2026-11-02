import { useMemo, useState } from "react";
import { ResultadoPartida } from "@/components/organisms";
import { TelaBase } from "@/components/templates";
import { dividirTimes, sugerirTamanhoTime } from "@/lib/times";
import { usePartidaRapidaStore } from "@/store";

export default function Resultado() {
  const jogadores = usePartidaRapidaStore((state) => state.jogadores);
  const [sementeSorteio] = useState(() =>
    Math.floor(Math.random() * 1_000_000),
  );
  const [tamanhoInicial] = useState(() => {
    const sugestao = sugerirTamanhoTime(jogadores.length);
    return Math.max(sugestao, 2);
  });
  const [tamanhoDigitado, setTamanhoDigitado] = useState(
    String(tamanhoInicial),
  );
  const [tamanhoValido, setTamanhoValido] = useState(tamanhoInicial);
  const [modoAutomatico, setModoAutomatico] = useState(true);
  const [contadorSorteios, setContadorSorteios] = useState(0);
  const [erroTamanho, setErroTamanho] = useState<string | null>(null);
  const resultado = useMemo(
    () =>
      dividirTimes(
        jogadores,
        tamanhoValido,
        criarGeradorAleatorio(sementeSorteio + contadorSorteios),
      ),
    [jogadores, tamanhoValido, contadorSorteios, sementeSorteio],
  );

  function alterarTamanho(valor: string) {
    setTamanhoDigitado(valor);
    const tamanho = Number(valor);
    if (
      !/^\d+$/.test(valor) ||
      !Number.isInteger(tamanho) ||
      tamanho < 2 ||
      tamanho > jogadores.length
    ) {
      setErroTamanho(`Informe um número entre 2 e ${jogadores.length}.`);
      return;
    }

    setErroTamanho(null);
    setTamanhoValido(tamanho);
    setContadorSorteios((contador) => contador + 1);
  }

  function alterarModoAutomatico(ativado: boolean) {
    setModoAutomatico(ativado);
    if (!ativado) {
      return;
    }

    const sugestao = Math.max(sugerirTamanhoTime(jogadores.length), 2);
    setTamanhoDigitado(String(sugestao));
    setTamanhoValido(sugestao);
    setErroTamanho(null);
    setContadorSorteios((contador) => contador + 1);
  }

  function sortearNovamente() {
    setContadorSorteios((contador) => contador + 1);
  }

  return (
    <TelaBase>
      <ResultadoPartida
        resultado={resultado}
        modoAutomatico={modoAutomatico}
        tamanhoEmUso={tamanhoValido}
        tamanhoDigitado={tamanhoDigitado}
        erroTamanho={erroTamanho}
        onTamanhoChange={alterarTamanho}
        onModoAutomaticoChange={alterarModoAutomatico}
        onSortearNovamente={sortearNovamente}
      />
    </TelaBase>
  );
}

function criarGeradorAleatorio(sementeInicial: number): () => number {
  let semente = sementeInicial >>> 0;
  return () => {
    semente = (semente * 1_664_525 + 1_013_904_223) >>> 0;
    return semente / 0x1_0000_0000;
  };
}
