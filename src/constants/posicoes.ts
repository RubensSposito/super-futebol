import type { Posicao } from "@/types";

export const POSICOES = [
  { value: "zagueiro", label: "Zagueiro" },
  { value: "lateral", label: "Lateral" },
  { value: "volante", label: "Volante" },
  { value: "meia", label: "Meia" },
  { value: "atacante", label: "Atacante" },
] as const satisfies readonly { value: Posicao; label: string }[];

export const POSICAO_GOLEIRO = { value: "goleiro", label: "Goleiro" } as const;
