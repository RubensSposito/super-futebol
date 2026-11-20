import type { SQLiteDatabase } from "expo-sqlite";

const VERSAO_ATUAL = 8;

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

      if (versaoAtual < 5) {
        await db.execAsync(`
          ALTER TABLE futebol
          ADD COLUMN dia_pagamento_quadra INTEGER NOT NULL DEFAULT 1
            CHECK (dia_pagamento_quadra BETWEEN 1 AND 31);
          CREATE TABLE pagamentos_mensalidade (
            jogador_id INTEGER NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
            ciclo_inicio TEXT NOT NULL CHECK (length(ciclo_inicio) = 10),
            valor_pago_centavos INTEGER NOT NULL CHECK (valor_pago_centavos >= 0),
            data_marcacao TEXT NOT NULL CHECK (length(data_marcacao) = 10),
            PRIMARY KEY (jogador_id, ciclo_inicio)
          );
          CREATE INDEX pagamentos_mensalidade_ciclo_idx
            ON pagamentos_mensalidade(ciclo_inicio);
        `);
      }

      if (versaoAtual < 6) {
        await db.execAsync(`
          ALTER TABLE futebol ADD COLUMN vencimento_quadra TEXT CHECK (vencimento_quadra IS NULL OR length(vencimento_quadra) = 10);
          ALTER TABLE futebol ADD COLUMN jogadores_por_time INTEGER CHECK (jogadores_por_time IS NULL OR jogadores_por_time BETWEEN 2 AND 22);
          ALTER TABLE futebol ADD COLUMN quantidade_times INTEGER CHECK (quantidade_times IS NULL OR quantidade_times BETWEEN 2 AND 12);
          CREATE TABLE pagamentos_avulso (
            jogador_id INTEGER NOT NULL REFERENCES jogadores(id) ON DELETE CASCADE,
            data_jogo TEXT NOT NULL CHECK (length(data_jogo) = 10),
            valor_pago_centavos INTEGER NOT NULL CHECK (valor_pago_centavos >= 0),
            data_marcacao TEXT NOT NULL CHECK (length(data_marcacao) = 10),
            PRIMARY KEY (jogador_id, data_jogo)
          );
          CREATE INDEX pagamentos_avulso_data_idx ON pagamentos_avulso(data_jogo);
        `);
        const hoje = new Date();
        const dataHoje = [hoje.getFullYear(), String(hoje.getMonth() + 1).padStart(2, "0"), String(hoje.getDate()).padStart(2, "0")].join("-");
        const linhas = await db.getAllAsync<{ id: number; dia_pagamento_quadra: number }>("SELECT id, dia_pagamento_quadra FROM futebol");
        for (const linha of linhas) {
          let ano = hoje.getFullYear();
          let mes = hoje.getMonth();
          let data = "";
          while (!data) {
            const ultimoDia = new Date(ano, mes + 1, 0).getDate();
            if (linha.dia_pagamento_quadra <= ultimoDia) {
              const candidata = [ano, String(mes + 1).padStart(2, "0"), String(linha.dia_pagamento_quadra).padStart(2, "0")].join("-");
              if (candidata >= dataHoje) data = candidata;
            }
            if (!data) {
              mes += 1;
              if (mes > 11) { ano += 1; mes = 0; }
            }
          }
          await db.runAsync("UPDATE futebol SET vencimento_quadra = ? WHERE id = ?", data, linha.id);
        }
      }

      if (versaoAtual < 7) {
        await db.execAsync(`
          CREATE TABLE futebol_v7 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL CHECK (length(trim(nome)) BETWEEN 2 AND 40),
            nome_normalizado TEXT NOT NULL UNIQUE,
            quantidade_jogadores INTEGER NOT NULL CHECK (quantidade_jogadores BETWEEN 1 AND 100),
            quantidade_mensalistas INTEGER CHECK (quantidade_mensalistas IS NULL OR quantidade_mensalistas BETWEEN 1 AND 100),
            quantidade_avulsos INTEGER CHECK (quantidade_avulsos IS NULL OR quantidade_avulsos BETWEEN 0 AND 100),
            tipo_cadastro TEXT NOT NULL CHECK (tipo_cadastro IN ('mensalistas_e_avulsos', 'so_mensalistas', 'basico')),
            controla_presenca INTEGER NOT NULL CHECK (controla_presenca IN (0, 1)),
            controle_pagamento TEXT NOT NULL CHECK (controle_pagamento IN ('nenhum', 'mensalistas', 'avulsos', 'ambos')),
            valor_quadra_centavos INTEGER CHECK (valor_quadra_centavos IS NULL OR valor_quadra_centavos >= 0),
            mensalidade_centavos INTEGER CHECK (mensalidade_centavos IS NULL OR mensalidade_centavos >= 0),
            mensalidade_sugerida_centavos INTEGER CHECK (mensalidade_sugerida_centavos IS NULL OR mensalidade_sugerida_centavos >= 0),
            avulso_escolhido_centavos INTEGER CHECK (avulso_escolhido_centavos IS NULL OR avulso_escolhido_centavos >= 0),
            avulso_sugerido_centavos INTEGER CHECK (avulso_sugerido_centavos IS NULL OR avulso_sugerido_centavos >= 0),
            nome_quadra TEXT,
            endereco TEXT,
            dia_semana INTEGER CHECK (dia_semana IS NULL OR dia_semana BETWEEN 0 AND 6),
            frequencia TEXT CHECK (frequencia IS NULL OR frequencia IN ('semanal', 'quinzenal', 'mensal')),
            horario TEXT CHECK (horario IS NULL OR (length(horario) = 5 AND substr(horario, 3, 1) = ':' AND substr(horario, 1, 2) GLOB '[0-2][0-9]' AND CAST(substr(horario, 1, 2) AS INTEGER) <= 23 AND substr(horario, 4, 2) GLOB '[0-5][0-9]')),
            data_criacao TEXT NOT NULL CHECK (length(data_criacao) = 10),
            dias_semana TEXT,
            dia_pagamento_quadra INTEGER NOT NULL DEFAULT 1 CHECK (dia_pagamento_quadra BETWEEN 1 AND 31),
            vencimento_quadra TEXT CHECK (vencimento_quadra IS NULL OR length(vencimento_quadra) = 10),
            jogadores_por_time INTEGER CHECK (jogadores_por_time IS NULL OR jogadores_por_time BETWEEN 2 AND 22),
            quantidade_times INTEGER CHECK (quantidade_times IS NULL OR quantidade_times BETWEEN 2 AND 12),
            ultimo_aberto_em INTEGER NOT NULL DEFAULT 0
          );

          INSERT INTO futebol_v7 (
            id, nome, nome_normalizado, quantidade_jogadores, quantidade_mensalistas,
            quantidade_avulsos, tipo_cadastro, controla_presenca, controle_pagamento,
            valor_quadra_centavos, mensalidade_centavos, mensalidade_sugerida_centavos,
            avulso_escolhido_centavos, avulso_sugerido_centavos, nome_quadra,
            endereco, dia_semana, frequencia, horario, data_criacao, dias_semana,
            dia_pagamento_quadra, vencimento_quadra, jogadores_por_time,
            quantidade_times, ultimo_aberto_em
          )
          SELECT
            id, 'Meu futebol', 'meu futebol', quantidade_jogadores,
            quantidade_mensalistas, quantidade_avulsos, tipo_cadastro,
            controla_presenca, controle_pagamento, valor_quadra_centavos,
            mensalidade_centavos, mensalidade_sugerida_centavos,
            avulso_escolhido_centavos, avulso_sugerido_centavos, nome_quadra,
            endereco, dia_semana, frequencia, horario, data_criacao, dias_semana,
            dia_pagamento_quadra, vencimento_quadra, jogadores_por_time,
            quantidade_times, 0
          FROM futebol;
          DROP TABLE futebol;
          ALTER TABLE futebol_v7 RENAME TO futebol;

          CREATE TABLE jogadores_v7 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            futebol_id INTEGER NOT NULL REFERENCES futebol(id) ON DELETE CASCADE,
            nome TEXT NOT NULL,
            nome_normalizado TEXT NOT NULL,
            tipo TEXT NOT NULL CHECK (tipo IN ('goleiro', 'linha')),
            posicao TEXT CHECK (posicao IS NULL OR posicao IN ('goleiro', 'zagueiro', 'lateral', 'volante', 'meia', 'atacante')),
            nivel TEXT CHECK (nivel IS NULL OR nivel IN ('iniciante', 'amador', 'semi_profissional', 'profissional')),
            vinculo TEXT CHECK (vinculo IS NULL OR vinculo IN ('mensalista', 'avulso')),
            data_criacao TEXT NOT NULL CHECK (length(data_criacao) = 10),
            UNIQUE (futebol_id, nome_normalizado),
            CHECK ((tipo = 'goleiro' AND (posicao IS NULL OR posicao = 'goleiro')) OR (tipo = 'linha' AND (posicao IS NULL OR posicao IN ('zagueiro', 'lateral', 'volante', 'meia', 'atacante'))))
          );
          INSERT INTO jogadores_v7 (
            id, futebol_id, nome, nome_normalizado, tipo, posicao, nivel, vinculo, data_criacao
          )
          SELECT id, COALESCE((SELECT id FROM futebol ORDER BY id LIMIT 1), 1),
            nome, nome_normalizado, tipo, posicao, nivel, vinculo, data_criacao
          FROM jogadores;
          DROP TABLE jogadores;
          ALTER TABLE jogadores_v7 RENAME TO jogadores;

          CREATE INDEX jogadores_futebol_id_idx ON jogadores(futebol_id);
          INSERT OR REPLACE INTO app_config (key, value)
            SELECT 'active_futebol_id', CAST(id AS TEXT)
            FROM futebol ORDER BY id LIMIT 1;
        `);
        const violacoes = await db.getAllAsync<{ table: string; rowid: number | null; parent: string; fkid: number }>(
          "PRAGMA foreign_key_check",
        );
        if (violacoes.length > 0) {
          throw new Error(`Migração do futebol encontrou ${violacoes.length} referências inválidas.`);
        }
      }

      if (versaoAtual < 8) {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS sorteios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            futebol_id INTEGER NOT NULL REFERENCES futebol(id) ON DELETE CASCADE,
            data_jogo TEXT NOT NULL CHECK (length(data_jogo) = 10),
            dados_json TEXT NOT NULL,
            criado_em TEXT NOT NULL,
            atualizado_em TEXT NOT NULL,
            UNIQUE (futebol_id, data_jogo)
          );
          CREATE INDEX IF NOT EXISTS sorteios_futebol_data_idx ON sorteios(futebol_id, data_jogo);
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
