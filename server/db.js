
const pg = require('pg');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_store');

// Create and drop tables 
const createTables = async () => {
    const SQL = `
    DROP TABLE IF EXISTS user_products CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS favorites CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    CREATE TABLE users (
        id UUID PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255)
    );

    CREATE TABLE products (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL
    );

    CREATE TABLE favorites (
        id UUID PRIMARY KEY,
        product_id UUID REFERENCES products(id) NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
    );
    `;
    await client.query(SQL);
};

// Create a user with a hashed password
const createUser = async ({ username, password }) => {
    const SQL = `
    INSERT INTO users(id, username, password)
    VALUES ($1, $2, $3)
    RETURNING *;
    `;
    const hashedPassword = await bcrypt.hash(password, 5);
    const response = await client.query(SQL, [uuid.v4(), username, hashedPassword]);
    return response.rows[0];
};

// Create a product
const createProduct = async ({ name }) => {
    const SQL = `
    INSERT INTO products(id, name)
    VALUES ($1, $2)
    RETURNING *;
    `;
    const response = await client.query(SQL, [uuid.v4(), name]);
    return response.rows[0];
};

// Create a favorite
const createFavorite = async ({ userId, productId }) => {
    const SQL = `
    INSERT INTO favorites(id, product_id, user_id)
    VALUES ($1, $2, $3)
    RETURNING *;
    `;
    const response = await client.query(SQL, [uuid.v4(), productId, userId]);
    return response.rows[0];
};

// Fetch all users
const fetchUsers = async () => {
    const SQL = `SELECT * FROM users;`;
    const response = await client.query(SQL);
    return response.rows;
};

// Fetch all products
const fetchProducts = async () => {
    const SQL = `SELECT * FROM products;`;
    const response = await client.query(SQL);
    return response.rows;
};

// Fetch all favorites for a specific user
const fetchFavorites = async (userId) => {
    const SQL = `SELECT * FROM favorites WHERE user_id = $1;`;
    const response = await client.query(SQL, [userId]);
    return response.rows;
};

// Delete a favorite for a specific user
const destroyFavorite = async (userId, favoriteId) => {
    const SQL = `DELETE FROM favorites WHERE user_id = $1 AND id = $2;`;
    await client.query(SQL, [userId, favoriteId]);
};

// Export all methods for use in the Express application
module.exports = {
    client,
    createTables,
    createUser,
    createProduct,
    fetchUsers,
    fetchProducts,
    createFavorite,
    fetchFavorites,
    destroyFavorite
};
