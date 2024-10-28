require('dotenv').config();
const pool = require('../config/db');

const LPJ_TABLE_NAME = process.env.PG_TABLE_NAME

class LpjRepository {
    async saveLpj(noRequest, tgl_lpj, filename) {
      const query = `
        INSERT INTO ${LPJ_TABLE_NAME} (no_request, tgl_lpj, filename)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const values = [noRequest, tgl_lpj, filename];
      const result = await pool.query(query, values);
      return result.rows[0];
    }
  
    async getLPJHistory() {
      const query = `SELECT * FROM ${LPJ_TABLE_NAME} ORDER BY created_at DESC`;
      const result = await pool.query(query);
      return result.rows;
    }
  
    async getLPJById(id) {
      const query = `SELECT * FROM ${LPJ_TABLE_NAME} WHERE id = $1`;
      const result = await pool.query(query, [id]);
      return result.rows[0];
    }
  }
  
  module.exports = new LpjRepository();