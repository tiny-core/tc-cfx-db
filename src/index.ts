/*
 * tc_db — Copyright (C) 2026 tiny-core
 * Licenciado sob a LGPL-3.0-or-later. Ver LICENSE.md, COPYING e COPYING.LESSER.
 * Sem QUALQUER GARANTIA, na medida permitida por lei.
 */
/**
 * tc_db — camada de acesso a MySQL para o FXServer.
 *
 * Porquê JS e não Lua: o Lua do Cfx não tem sockets nem driver MySQL. A alternativa
 * seria depender de um recurso de terceiros, que é exatamente o que queremos evitar.
 * Este recurso não é escrowed (o escrow não encripta JS de qualquer forma) e também
 * não precisa de ser: não contém lógica de negócio nenhuma, só transporte.
 *
 * Todas as consultas usam placeholders. Não existe caminho neste ficheiro que
 * concatene input em SQL — é a única garantia real contra injeção.
 */
import mysql, { type Pool, type PoolOptions, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise'

type Params = ReadonlyArray<string | number | boolean | null>

declare function GetConvar(name: string, fallback: string): string
declare function GetConvarInt(name: string, fallback: number): number
declare function on(event: string, handler: (...args: unknown[]) => void): void
declare function exports(name: string, fn: (...args: never[]) => unknown): void

let pool: Pool | null = null

/** Aceita a connection string estilo `mysql://user:pass@host/db` ou o formato chave=valor. */
function parseConnectionString(value: string): PoolOptions {
  if (value.startsWith('mysql://')) {
    const url = new URL(value)
    return {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
    }
  }

  const options: Record<string, string> = {}
  for (const pair of value.split(',')) {
    const [key, ...rest] = pair.split('=')
    if (key) options[key.trim()] = rest.join('=').trim()
  }

  return {
    host: options.host ?? 'localhost',
    port: Number(options.port ?? 3306),
    user: options.user ?? 'root',
    password: options.password ?? '',
    database: options.database ?? '',
  }
}

function getPool(): Pool {
  if (pool) return pool

  const connectionString = GetConvar('tc_db_connection_string', '')
  if (!connectionString) throw new Error('convar tc_db_connection_string em falta no server.cfg')

  pool = mysql.createPool({
    ...parseConnectionString(connectionString),
    connectionLimit: GetConvarInt('tc_db_connection_limit', 10),
    // Filas sem limite escondem problemas de lentidão até o servidor cair.
    queueLimit: 50,
    namedPlaceholders: false,
    charset: 'utf8mb4_general_ci',
    supportBigNumbers: true,
    // Datas como string: o Lua não tem tipo Date e a conversão implícita perde timezone.
    dateStrings: true,
  })

  return pool
}

/** Avisa quando uma consulta demora demais — quase sempre é um índice em falta. */
const SLOW_QUERY_MS = GetConvarInt('tc_db_slow_query_warning', 150)

async function run<T>(sql: string, params: Params = []): Promise<T> {
  const start = Date.now()

  try {
    const [rows] = await getPool().execute(sql, params as unknown[])
    return rows as T
  } finally {
    const elapsed = Date.now() - start
    if (elapsed > SLOW_QUERY_MS) console.warn(`[tc_db] consulta lenta (${elapsed}ms): ${sql}`)
  }
}

/** Todas as linhas. */
exports('query', async (sql: string, params?: Params) => run<RowDataPacket[]>(sql, params))

/** Primeira linha, ou null. */
exports('single', async (sql: string, params?: Params) => {
  const rows = await run<RowDataPacket[]>(sql, params)
  return rows[0] ?? null
})

/** Primeiro valor da primeira linha, ou null. Para COUNT, SUM, um único campo. */
exports('scalar', async (sql: string, params?: Params) => {
  const rows = await run<RowDataPacket[]>(sql, params)
  const first = rows[0]
  return first ? (Object.values(first)[0] ?? null) : null
})

/** ID inserido. */
exports('insert', async (sql: string, params?: Params) => {
  const result = await run<ResultSetHeader>(sql, params)
  return result.insertId
})

/** Número de linhas afetadas. */
exports('update', async (sql: string, params?: Params) => {
  const result = await run<ResultSetHeader>(sql, params)
  return result.affectedRows
})

/**
 * Várias consultas atómicas: ou passam todas, ou nenhuma.
 * Obrigatório em qualquer operação que mova dinheiro ou itens entre jogadores.
 */
exports('transaction', async (queries: Array<{ sql: string; params?: Params }>) => {
  const connection = await getPool().getConnection()

  try {
    await connection.beginTransaction()

    for (const { sql, params } of queries) {
      await connection.execute(sql, (params ?? []) as unknown[])
    }

    await connection.commit()
    return true
  } catch (error) {
    await connection.rollback()
    console.error('[tc_db] transação revertida:', error)
    return false
  } finally {
    connection.release()
  }
})

on('onResourceStop', (resource: unknown) => {
  if (resource !== 'tc_db') return
  void pool?.end()
})
