const pool = require('../config/db');

class LpjRepository {
    async saveLpj(noRequest, tglLpj, filePath) {
      const query = `
        INSERT INTO lpj_history (no_request, tgl_lpj, file_path)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const values = [noRequest, tglLpj, filePath];
      const result = await pool.query(query, values);
      return result.rows[0];
    }
  
    async getLpjHistory() {
      const query = 'SELECT * FROM lpj_history ORDER BY created_at DESC';
      const result = await pool.query(query);
      return result.rows;
    }
  
    async getLpjById(id) {
      const query = 'SELECT file_path FROM lpj_history WHERE id = $1';
      const result = await pool.query(query, [id]);
      return result.rows[0];
    }
  }
  
  module.exports = new LpjRepository();