import type { SQLiteDatabase } from "expo-sqlite";

const VERSAO_ATUAL = 4;

export async function executarMigracoes(db: SQLiteDatabase): Promise<void> {
  const versao = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const versaoAtual = versao?.user_version ?? 0;
  if (versaoAtual > VERSAO_ATUAL) {
    throw new Error(
      `Banco versão ${versaoAtual} não é compatível com esta versão do app.`,
    );
  }
  if (versaoAtual === VERSAO_ATUAL) return;

  if (versaoAtual < VERSAO_ATUAL) {
    await db.execAsync("PRAGMA foreign_keys = OFF;");
  }
  try {
    await db.withTransactionAsync(async () => {
      if (versaoAtual < 1) {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS futebol (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            quantidade_jogadores INTEGER NOT NULL CHECK (quantidade_jogadores BETWEEN 2 AND 100),
            quantidade_mensalistas INTEGER,
            tipo_cadastro TEXT NOT NULL CHECK (tipo_cadastro IN ('mensalistas_e_avulsos', 'so_mensalistas', 'basico')),
            controla_presenca INTEGER NOT NULL CHECK (controla_presenca IN (0, 1)),
            controle_pagamento TEXT NOT NULL CHECK (controle_pagamento IN ('nenhum', 'mensalistas', 'avulsos', 'ambos')),
            valor_quadra_centavos INTEGER,
            mensalidade_centavos INTEGER,
            mensalidade_automatica INTEGER NOT NULL CHECK (mensalidade_automatica IN (0, 1)),
            data_criacao TEXT NOT NULL CHECK (length(data_criacao) = 10)
          );
          CREATE TABLE IF NOT EXISTS jogadores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            nome_normalizado TEXT NOT NULL UNIQUE,
            posicao TEXT NOT NULL CHECK (posicao IN ('goleiro', 'jogador')),
            nivel TEXT CHECK (nivel IS NULL OR nivel IN ('pereba', 'amador', 'semi_profissional', 'profissional')),
            tipo TEXT CHECK (tipo IS NULL OR tipo IN ('mensalista', 'avulso')),
            data_criacao TEXT NOT NULL CHECK (length(data_criacao) = 10)
          );
          CREATE TABLE IF NOT EXISTS presencas (
            jogador_id INTEGER NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
            data TEXT NOT NULL CHECK (length(data) = 10),
            presente INTEGER NOT NULL CHECK (presente IN (0, 1)),
            PRIMARY KEY (jogador_id, data)
          );
        `);
      }

      if (versaoAtual < 2) {
        await db.execAsync(`
          CREATE TABLE futebol_v2 (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            quantidade_jogadores INTEGER NOT NULL CHECK (quantidade_jogadores BETWEEN 1 AND 100),
            quantidade_mensalistas INTEGER
              CHECK (quantidade_mensalistas IS NULL OR quantidade_mensalistas BETWEEN 1 AND 100),
            quantidade_avulsos INTEGER
              CHECK (quantidade_avulsos IS NULL OR quantidade_avulsos BETWEEN 0 AND 100),
            tipo_cadastro TEXT NOT NULL CHECK (tipo_cadastro IN ('mensalistas_e_avulsos', 'so_mensalistas', 'basico')),
            controla_presenca INTEGER NOT NULL CHECK (controla_presenca IN (0, 1)),
            controle_pagamento TEXT NOT NULL CHECK (controle_pagamento IN ('nenhum', 'mensalistas', 'avulsos', 'ambos')),
            valor_quadra_centavos INTEGER CHECK (valor_quadra_centavos IS NULL OR valor_quadra_centavos >= 0),
            mensalidade_centavos INTEGER CHECK (mensalidade_centavos IS NULL OR mensalidade_centavos >= 0),
            mensalidade_sugerida_centavos INTEGER
              CHECK (mensalidade_sugerida_centavos IS NULL OR mensalidade_sugerida_centavos >= 0),
            avulso_escolhido_centavos INTEGER
              CHECK (avulso_escolhido_centavos IS NULL OR avulso_escolhido_centavos >= 0),
            avulso_sugerido_centavos INTEGER
              CHECK (avulso_sugerido_centavos IS NULL OR avulso_sugerido_centavos >= 0),
            nome_quadra TEXT,
            endereco TEXT,
            dia_semana INTEGER CHECK (dia_semana IS NULL OR dia_semana BETWEEN 0 AND 6),
            frequencia TEXT CHECK (frequencia IS NULL OR frequencia IN ('semanal', 'quinzenal', 'mensal')),
            horario TEXT CHECK (
              horario IS NULL OR (
                length(horario) = 5 AND substr(horario, 3, 1) = ':' AND
                substr(horario, 1, 2) GLOB '[0-2][0-9]' AND
                CAST(substr(horario, 1, 2) AS INTEGER) <= 23 AND
                substr(horario, 4, 2) GLOB '[0-5][0-9]'
              )
            ),
            data_criacao TEXT NOT NULL CHECK (length(data_criacao) = 10)
          );
          INSERT INTO futebol_v2 (
            id, quantidade_jogadores, quantidade_mensalistas, quantidade_avulsos,
            tipo_cadastro, controla_presenca, controle_pagamento,
            valor_quadra_centavos, mensalidade_centavos,
            mensalidade_sugerida_centavos, data_criacao
          )
          SELECT
            id, quantidade_jogadores, quantidade_mensalistas,
            CASE WHEN tipo_cadastro = 'mensalistas_e_avulsos'
              THEN max(0, quantidade_jogadores - COALESCE(quantidade_mensalistas, 0))
              ELSE 0 END,
            tipo_cadastro, controla_presenca, controle_pagamento,
            valor_quadra_centavos, mensalidade_centavos,
            CASE WHEN mensalidade_automatica = 1 THEN mensalidade_centavos ELSE NULL END,
            data_criacao
          FROM futebol;
          DROP TABLE futebol;
          ALTER TABLE futebol_v2 RENAME TO futebol;

          CREATE TABLE jogadores_v2 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            nome_normalizado TEXT NOT NULL UNIQUE,
            tipo TEXT NOT NULL CHECK (tipo IN ('goleiro', 'linha')),
            posicao TEXT CHECK (posicao IS NULL OR posicao IN ('goleiro', 'zagueiro', 'lateral', 'volante', 'meia', 'atacante')),
            nivel TEXT CHECK (nivel IS NULL OR nivel IN ('iniciante', 'amador', 'semi_profissional', 'profissional')),
            vinculo TEXT CHECK (vinculo IS NULL OR vinculo IN ('mensalista', 'avulso')),
            data_criacao TEXT NOT NULL CHECK (length(data_criacao) = 10),
            CHECK (
              (tipo = 'goleiro' AND (posicao IS NULL OR posicao = 'goleiro')) OR
              (tipo = 'linha' AND (posicao IS NULL OR posicao IN ('zagueiro', 'lateral', 'volante', 'meia', 'atacante')))
            )
          );
          INSERT INTO jogadores_v2
            (id, nome, nome_normalizado, tipo, posicao, nivel, vinculo, data_criacao)
          SELECT
            id, nome, nome_normalizado,
            CASE posicao WHEN 'goleiro' THEN 'goleiro' ELSE 'linha' END,
            CASE posicao WHEN 'goleiro' THEN 'goleiro' ELSE NULL END,
            CASE nivel WHEN 'pereba' THEN 'iniciante' ELSE nivel END,
            tipo, data_criacao
          FROM jogadores;
          DROP TABLE jogadores;
          ALTER TABLE jogadores_v2 RENAME TO jogadores;
        `);
      }

      if (versaoAtual < 3) {
        await db.execAsync(`
          CREATE TABLE futebol_v3 (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            quantidade_jogadores INTEGER NOT NULL
              CHECK (quantidade_jogadores BETWEEN 1 AND 100),
            quantidade_mensalistas INTEGER
              CHECK (
                quantidade_mensalistas IS NULL OR
                quantidade_mensalistas BETWEEN 1 AND 100
              ),
            quantidade_avulsos INTEGER
              CHECK (
                quantidade_avulsos IS NULL OR
                quantidade_avulsos BETWEEN 0 AND 100
              ),
            tipo_cadastro TEXT NOT NULL
              CHECK (tipo_cadastro IN (
                'mensalistas_e_avulsos', 'so_mensalistas', 'basico'
              )),
            controla_presenca INTEGER NOT NULL
              CHECK (controla_presenca IN (0, 1)),
            controle_pagamento TEXT NOT NULL
              CHECK (controle_pagamento IN (
                'nenhum', 'mensalistas', 'avulsos', 'ambos'
              )),
            valor_quadra_centavos INTEGER
              CHECK (
                valor_quadra_centavos IS NULL OR valor_quadra_centavos >= 0
              ),
            mensalidade_centavos INTEGER
              CHECK (mensalidade_centavos IS NULL OR mensalidade_centavos >= 0),
            mensalidade_sugerida_centavos INTEGER
              CHECK (
                mensalidade_sugerida_centavos IS NULL OR
                mensalidade_sugerida_centavos >= 0
              ),
            avulso_escolhido_centavos INTEGER
              CHECK (
                avulso_escolhido_centavos IS NULL OR
                avulso_escolhido_centavos >= 0
              ),
            avulso_sugerido_centavos INTEGER
              CHECK (
                avulso_sugerido_centavos IS NULL OR
                avulso_sugerido_centavos >= 0
              ),
            nome_quadra TEXT,
            endereco TEXT,
            dia_semana INTEGER
              CHECK (dia_semana IS NULL OR dia_semana BETWEEN 0 AND 6),
            frequencia TEXT
              CHECK (
                frequencia IS NULL OR
                frequencia IN ('semanal', 'quinzenal', 'mensal')
              ),
            horario TEXT
              CHECK (
                horario IS NULL OR (
                  length(horario) = 5 AND substr(horario, 3, 1) = ':' AND
                  substr(horario, 1, 2) GLOB '[0-2][0-9]' AND
                  CAST(substr(horario, 1, 2) AS INTEGER) <= 23 AND
                  substr(horario, 4, 2) GLOB '[0-5][0-9]'
                )
              ),
            data_criacao TEXT NOT NULL CHECK (length(data_criacao) = 10)
          );
          INSERT INTO futebol_v3 (
            id, quantidade_jogadores, quantidade_mensalistas,
            quantidade_avulsos, tipo_cadastro, controla_presenca,
            controle_pagamento, valor_quadra_centavos, mensalidade_centavos,
            mensalidade_sugerida_centavos, avulso_escolhido_centavos,
            avulso_sugerido_centavos, nome_quadra, endereco, dia_semana,
            frequencia, horario, data_criacao
          )
          SELECT
            id, quantidade_jogadores, quantidade_mensalistas,
            quantidade_avulsos, tipo_cadastro, controla_presenca,
            controle_pagamento, valor_quadra_centavos, mensalidade_centavos,
            mensalidade_sugerida_centavos, avulso_escolhido_centavos,
            avulso_sugerido_centavos, nome_quadra, endereco, dia_semana,
            frequencia, horario, data_criacao
          FROM futebol;
          DROP TABLE futebol;
          ALTER TABLE futebol_v3 RENAME TO futebol;

          CREATE TABLE jogadores_v3 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            nome_normalizado TEXT NOT NULL UNIQUE,
            tipo TEXT NOT NULL CHECK (tipo IN ('goleiro', 'linha')),
            posicao TEXT
              CHECK (
                posicao IS NULL OR
                posicao IN (
                  'goleiro', 'zagueiro', 'lateral', 'volante', 'meia',
                  'atacante'
                )
              ),
            nivel TEXT
              CHECK (
                nivel IS NULL OR
                nivel IN (
                  'iniciante', 'amador', 'semi_profissional', 'profissional'
                )
              ),
            vinculo TEXT
              CHECK (vinculo IS NULL OR vinculo IN ('mensalista', 'avulso')),
            data_criacao TEXT NOT NULL CHECK (length(data_criacao) = 10),
            CHECK (
              (tipo = 'goleiro' AND (posicao IS NULL OR posicao = 'goleiro')) OR
              (tipo = 'linha' AND (
                posicao IS NULL OR
                posicao IN ('zagueiro', 'lateral', 'volante', 'meia', 'atacante')
              ))
            )
          );
          INSERT INTO jogadores_v3 (
            id, nome, nome_normalizado, tipo, posicao, nivel, vinculo,
            data_criacao
          )
          SELECT
            id, nome, nome_normalizado, tipo, posicao, nivel, vinculo,
            data_criacao
          FROM jogadores;
          DROP TABLE jogadores;
          ALTER TABLE jogadores_v3 RENAME TO jogadores;
        `);
      }

      if (versaoAtual < 4) {
        await db.execAsync(`
          ALTER TABLE futebol ADD COLUMN dias_semana TEXT;
          UPDATE futebol
          SET dias_semana = CASE
            WHEN dia_semana IS NULL THEN NULL
            ELSE CAST(dia_semana AS TEXT)
          END;
        `);
      }

      await db.execAsync(`PRAGMA user_version = ${VERSAO_ATUAL};`);
    });
  } finally {
    if (versaoAtual < VERSAO_ATUAL) {
      await db.execAsync("PRAGMA foreign_keys = ON;");
    }
  }
}
