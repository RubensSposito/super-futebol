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

export type AgendaFutebol = {
  diasSemana: number[];
  frequencia: FrequenciaFutebol | null;
  horario: string | null;
  vencimentoQuadra: string;
};

export type Futebol = {
  id: number;
  nome: string;
  quantidadeJogadores: number;
  quantidadeMensalistas: number | null;
  quantidadeAvulsos: number | null;
  tipoCadastro: TipoCadastro;
  controlaPresenca: boolean;
  controlePagamento: ControlePagamento;
  vencimentoQuadra: string;
  jogadoresPorTime: number | null;
  quantidadeTimes: number | null;
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

export type FutebolSemDataCriacao = Omit<Futebol, "id" | "dataCriacao">;
export type FutebolNovo = FutebolSemDataCriacao & { dataCriacao: string };

export type RascunhoFutebol = Omit<
  Futebol,
  "id" | "dataCriacao" | keyof AgendaFutebol
> & {
  agenda: AgendaFutebol;
};

export type FutebolLista = Pick<Futebol, "id" | "nome" | "tipoCadastro" | "diasSemana" | "frequencia" | "horario"> & {
  quantidadeJogadoresCadastrados: number;
};
