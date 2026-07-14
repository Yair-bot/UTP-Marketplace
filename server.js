// Servidor Backend Express e Integración con MySQL

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de credenciales
const DB_HOST = 'localhost';
const DB_USER = 'root';
const DB_PASSWORD = '1234'; 
const DB_PORT = 3306;
const DB_NAME = 'utp_marketplace';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let pool;

// Inicialización de la Base de Datos y Servidor
async function initDatabase() {
  try {
    // 1. Conexión inicial al servidor MySQL (sin base de datos)
    const initConnection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT
    });

    console.log('Conectado al servidor MySQL local...');

    // 2. Crear la base de datos si no existe
    await initConnection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    console.log(`Base de datos "${DB_NAME}" creada o ya existente.`);
    await initConnection.end();

    // 3. Crear el pool de conexiones conectado a la base de datos
    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 4. Crear la tabla 'productos'
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        imagen VARCHAR(255) NOT NULL,
        estado VARCHAR(50) NOT NULL,
        vendedor VARCHAR(255) NOT NULL,
        correo VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL
      )
    `);
    console.log('Tabla "productos" validada en MySQL.');


    // Arrancar el servidor Express una vez lista la BD
    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(` Servidor corriendo en http://localhost:${PORT}`);
      console.log(`===================================================`);
    });

  } catch (error) {
    console.error('ERROR al inicializar la base de datos o servidor:', error.message);
    console.error('Asegúrate de que tu servidor MySQL local (XAMPP / WampServer) esté encendido.');
  }
}

// ENDPOINTS DE LA API REST
// Obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar productos: ' + error.message });
  }
});

// Obtener un producto por su ID
app.get('/api/productos/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar producto: ' + error.message });
  }
});

// Registrar un nuevo producto (Creación de Admin)
app.post('/api/productos', async (req, res) => {
  const { nombre, precio, categoria, imagen, estado, vendedor, correo, descripcion } = req.body;
  if (!nombre || !precio || !categoria || !estado || !vendedor || !correo || !descripcion) {
    return res.status(400).json({ error: 'Faltan campos obligatorios en el formulario' });
  }

  try {
    const imgPath = imagen || 'https://placehold.co/600x450/e2e8f0/1e293b?text=UTP+Marketplace';
    const query = 'INSERT INTO productos (nombre, precio, categoria, imagen, estado, vendedor, correo, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await pool.query(query, [nombre, precio, categoria, imgPath, estado, vendedor, correo, descripcion]);
    res.json({ id: result.insertId, message: 'Producto registrado con éxito en MySQL' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar producto: ' + error.message });
  }
});

// Eliminar un producto (Borrado de Admin)
app.delete('/api/productos/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'El producto no existe o ya fue eliminado' });
    }
    res.json({ message: 'Producto eliminado correctamente de MySQL' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto: ' + error.message });
  }
});

// Iniciar base de datos
initDatabase();
