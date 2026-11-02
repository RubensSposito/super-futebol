import type { Nivel } from "@/types";

export const NIVEIS = [
  { value: "iniciante", label: "Iniciante" },
  { value: "amador", label: "Amador" },
  { value: "semi_profissional", label: "Semi profissional" },
  { value: "profissional", label: "Profissional" },
] as const satisfies readonly { value: Nivel; label: string }[];
