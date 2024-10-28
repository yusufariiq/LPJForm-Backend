const pool = require('../config/db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS lpj_history (
    id SERIAL PRIMARY KEY,
    no_request VARCHAR(255) NOT NULL,
    tgl_lpj DATE NOT NULL,
    filename VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`

pool.query(createTableQuery)
    .then(() => console.log('Table created or already exists'))
    .catch(error => console.log('Error creating table:', error));

module.exports = {
    tableName: 'lpj_history'
};

