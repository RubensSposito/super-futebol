export type TipoCadastro =
  | "mensalistas_e_avulsos"
  | "so_mensalistas"
  | "basico";

export type ControlePagamento =
  | "nenhum"
  | "mensalistas"
  | "avulsos"
  | "ambos";

export type FrequenciaFutebol = "semanal" | "quinzenal" | "mensal";

export type Futebol = {
  quantidadeJogadores: number;
  quantidadeMensalistas: number | null;
  quantidadeAvulsos: number | null;
  tipoCadastro: TipoCadastro;
  controlaPresenca: boolean;
  controlePagamento: ControlePagamento;
  valorQuadraCentavos: number | null;
  mensalidadeSugeridaCentavos: number | null;
  mensalidadeCentavos: number | null;
  avulsoEscolhidoCentavos: number | null;
  avulsoSugeridoCentavos: number | null;
  nomeQuadra: string | null;
  endereco: string | null;
  diasSemana: number[];
  frequencia: FrequenciaFutebol | null;
  horario: string | null;
  dataCriacao: string;
};

export type RascunhoFutebol = Omit<Futebol, "dataCriacao">;
