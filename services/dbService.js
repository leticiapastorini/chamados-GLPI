require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.PGHOST,
  port:     process.env.PGPORT,
  user:     process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE
});

/**
 * Insere um snapshot de tickets no banco.
 * @param {Array} tickets — array de objetos { id, title, status, created_at }
 * @param {Date} snapshotDate
 */
async function saveSnapshot(tickets, snapshotDate = new Date()) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertText = `
      INSERT INTO glpi_ticket_snapshots
        (ticket_id, title, status_code, created_at, snapshot_date)
      VALUES ($1, $2, $3, $4, $5)
    `;
    for (const t of tickets) {
      await client.query(insertText, [
        t.id,
        t.title,
        t.status,
        t.created_at,
        snapshotDate
      ]);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro salvando snapshot:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { saveSnapshot };

/**
+ * Insere ou atualiza o resumo diário de chamados.
+ * @param {string} date      — YYYY-MM-DD
+ * @param {number} total     — total de chamados no dia
+ * @param {boolean} aboveMeta — true se total > 50
+ */
async function saveDailySummary(date, total, aboveMeta) {
      const client = await pool.connect();
      const text = `
        INSERT INTO glpi_daily_totals
          (date, total_chamados, above_meta)
        VALUES ($1, $2, $3)
        ON CONFLICT (date) DO UPDATE
          SET total_chamados = EXCLUDED.total_chamados,
              above_meta     = EXCLUDED.above_meta
      `;
      try {
        await client.query(text, [date, total, aboveMeta]);
      } finally {
        client.release();
      }
    }
    module.exports.saveDailySummary = saveDailySummary;