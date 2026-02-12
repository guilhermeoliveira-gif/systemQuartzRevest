const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do Postgres (os dados virão do .env)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/teste-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ mensagem: "Conectado ao Postgres!", hora: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.listen(3001, () => console.log("Servidor rodando na porta 3001"));