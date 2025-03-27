require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3004;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Route principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configuration de la connexion à la base de données
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

console.log('Configuration de la base de données:', {
  ...dbConfig,
  password: '****' // Masquer le mot de passe dans les logs
});

// Fonction pour initialiser la connexion à la base de données
async function initDatabase() {
  try {
    console.log('Tentative de connexion à MySQL...');
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    console.log('Connexion initiale à MySQL établie');

    // Créer la base de données si elle n'existe pas
    console.log(`Création de la base de données ${dbConfig.database} si elle n'existe pas...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.end();
    console.log('Base de données créée/confirmée');

    // Établir la connexion à la base de données
    console.log('Création du pool de connexions...');
    const pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('Pool de connexions créé');

    // Créer la table todos si elle n'existe pas
    console.log('Création de la table todos si elle n\'existe pas...');
    const connection2 = await pool.getConnection();
    await connection2.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    connection2.release();
    console.log('Table todos créée/confirmée');

    return pool;
  } catch (error) {
    console.error('Erreur détaillée d\'initialisation de la base de données:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    throw error;
  }
}

// Initialiser la base de données et démarrer le serveur
let dbPool;
initDatabase()
  .then(pool => {
    dbPool = pool;
    console.log('Base de données initialisée avec succès');

    // Middleware de gestion des erreurs global
    app.use((err, req, res, next) => {
      console.error('Erreur non gérée:', err);
      res.status(500).json({
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

    // Routes CRUD
    // Récupérer toutes les tâches
    app.get('/todos', async (req, res) => {
      try {
        console.log('Récupération de toutes les tâches...');
        const [rows] = await dbPool.query('SELECT * FROM todos ORDER BY created_at DESC');
        console.log(`${rows.length} tâches récupérées`);
        return res.json(rows);
      } catch (error) {
        console.error('Erreur lors de la récupération des tâches:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération des tâches' });
      }
    });

    // Ajouter une nouvelle tâche
    app.post('/todos', async (req, res) => {
      const { task } = req.body;
      if (!task) {
        return res.status(400).json({ error: 'La tâche ne peut pas être vide' });
      }
      try {
        console.log('Ajout d\'une nouvelle tâche:', task);
        const [result] = await dbPool.query(
          'INSERT INTO todos (task, completed) VALUES (?, false)', 
          [task]
        );
        console.log('Tâche ajoutée avec l\'ID:', result.insertId);
        res.status(201).json({ 
          id: result.insertId, 
          task, 
          completed: false 
        });
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la tâche:', error);
        return res.status(500).json({ error: 'Erreur lors de l\'ajout de la tâche' });
      }
    });

    // Marquer une tâche comme terminée
    app.put('/todos/:id/complete', async (req, res) => {
      const { id } = req.params;
      try {
        console.log('Mise à jour de la tâche:', id);
        const [result] = await dbPool.query('UPDATE todos SET completed = true WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Tâche non trouvée' });
        }
        console.log('Tâche mise à jour avec succès');
        return res.json({ message: 'Tâche mise à jour' });
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la tâche:', error);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour de la tâche' });
      }
    });

    // Supprimer une tâche
    app.delete('/todos/:id', async (req, res) => {
      const { id } = req.params;
      try {
        console.log('Suppression de la tâche:', id);
        const [result] = await dbPool.query('DELETE FROM todos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Tâche non trouvée' });
        }
        console.log('Tâche supprimée avec succès');
        return res.json({ message: 'Tâche supprimée' });
      } catch (error) {
        console.error('Erreur lors de la suppression de la tâche:', error);
        return res.status(500).json({ error: 'Erreur lors de la suppression de la tâche' });
      }
    });

    // Route de santé
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Démarrer le serveur
    app.listen(port, '0.0.0.0', () => {
      console.log(`Serveur démarré sur http://0.0.0.0:${port}`);
      console.log('Environnement:', process.env.NODE_ENV || 'development');
    });
  })
  .catch(error => {
    console.error('Impossible de démarrer le serveur:', error);
    process.exit(1);
  });