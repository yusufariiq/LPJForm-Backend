require('dotenv').config();
const pool = require('../config/db');

const LPJ_TABLE_NAME = process.env.PG_TABLE_NAME

class LpjRepository {
    async saveLpj(noRequest, tglLpj, filePath) {
      const query = `
        INSERT INTO ${LPJ_TABLE_NAME} (no_request, tgl_lpj, file_path)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const values = [noRequest, tglLpj, filePath];
      const result = await pool.query(query, values);
      return result.rows[0];
    }
  
    async getLpjHistory() {
      const query = `SELECT * FROM ${LPJ_TABLE_NAME} ORDER BY created_at DESC`;
      const result = await pool.query(query);
      return result.rows;
    }
  
    async getLpjById(id) {
      const query = `SELECT file_path FROM ${LPJ_TABLE_NAME} WHERE id = $1`;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    }
  }
  
  module.exports = new LpjRepository();