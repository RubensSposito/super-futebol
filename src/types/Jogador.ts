export type TipoJogador = "goleiro" | "linha";

export type Posicao =
  | "goleiro"
  | "zagueiro"
  | "lateral"
  | "volante"
  | "meia"
  | "atacante";

export type Nivel =
  | "iniciante"
  | "amador"
  | "semi_profissional"
  | "profissional";

export type Vinculo = "mensalista" | "avulso";

export type Jogador = {
  id: string;
  nome: string;
  tipo: TipoJogador;
  posicao?: Posicao;
  nivel?: Nivel;
  vinculo?: Vinculo;
};

export type NovoJogador = Omit<Jogador, "id">;

export type MotivoFalhaCriacaoJogador =
  | "nome_vazio"
  | "nome_duplicado"
  | "tipo_invalido"
  | "posicao_invalida"
  | "jogador_nao_encontrado";

export type ResultadoValidacaoJogador =
  | { valido: true; nome: string }
  | { valido: false; motivo: MotivoFalhaCriacaoJogador };

export type ResultadoEdicaoJogador =
  | { sucesso: true; jogador: Jogador }
  | { sucesso: false; motivo: MotivoFalhaCriacaoJogador };

export type ResultadoCriacaoJogador =
  | { sucesso: true; jogador: Jogador }
  | { sucesso: false; motivo: MotivoFalhaCriacaoJogador };
