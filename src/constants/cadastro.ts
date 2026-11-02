import type {
  ControlePagamento,
  FrequenciaFutebol,
  TipoCadastro,
  TipoJogador,
  Vinculo,
} from "@/types";

export const TIPOS_CADASTRO = [
  { value: "mensalistas_e_avulsos", label: "Mensalistas + avulsos" },
  { value: "so_mensalistas", label: "Só mensalistas" },
  { value: "basico", label: "Só cadastro básico de jogadores" },
] as const satisfies readonly { value: TipoCadastro; label: string }[];

export const TIPOS_JOGADOR = [
  { value: "linha", label: "Linha" },
  { value: "goleiro", label: "Goleiro" },
] as const satisfies readonly { value: TipoJogador; label: string }[];

export const VINCULOS = [
  { value: "mensalista", label: "Mensalista" },
  { value: "avulso", label: "Avulso" },
] as const satisfies readonly { value: Vinculo; label: string }[];

export const DIAS_SEMANA = [
  { value: 0, label: "Dom", nome: "Domingo" },
  { value: 1, label: "Seg", nome: "Segunda" },
  { value: 2, label: "Ter", nome: "Terça" },
  { value: 3, label: "Qua", nome: "Quarta" },
  { value: 4, label: "Qui", nome: "Quinta" },
  { value: 5, label: "Sex", nome: "Sexta" },
  { value: 6, label: "Sáb", nome: "Sábado" },
] as const;

export const FREQUENCIAS = [
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
] as const satisfies readonly { value: FrequenciaFutebol; label: string }[];

export const CONTROLES_PAGAMENTO_MISTO = [
  { value: "nenhum", label: "Não" },
  { value: "mensalistas", label: "Só mensalistas" },
  { value: "avulsos", label: "Só avulsos" },
  { value: "ambos", label: "Mensalistas e avulsos" },
] as const satisfies readonly {
  value: ControlePagamento;
  label: string;
}[];

export const CONTROLES_PAGAMENTO_MENSALISTAS = [
  { value: "mensalistas", label: "Sim" },
  { value: "nenhum", label: "Não" },
] as const satisfies readonly {
  value: ControlePagamento;
  label: string;
}[];
