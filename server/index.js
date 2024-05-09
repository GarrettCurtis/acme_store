const {
    client,
    createTables,
    createProduct,
    createUser,
    fetchUsers,
    fetchProducts,
    createFavorite,
    fetchFavorites,
    destroyFavorite, // updated to match the method name in `db.js`
} = require("./db");

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize the database and setup data
const init = async () => {
    await client.connect();
    await createTables();
    console.log("Tables created");

    // Create initial data for users and products
    const [moe, lucy, larry, ethyl, coffeeMug, wirelessCharger, gamingMouse] = await Promise.all([
        createUser({ username: 'moe', password: 'passwordForMoe' }),
        createUser({ username: 'lucy', password: 'passwordForLucy' }),
        createUser({ username: 'larry', password: 'passwordForLarry' }),
        createUser({ username: 'ethyl', password: 'passwordForEthyl' }),
        createProduct({ name: 'coffeeMug' }),
        createProduct({ name: 'wirelessCharger' }),
        createProduct({ name: 'gamingMouse' }),
    ]);

    console.log('User IDs:', moe.id, lucy.id, larry.id, ethyl.id);
    console.log('Product IDs:', coffeeMug.id, wirelessCharger.id, gamingMouse.id);

    // Example favorite association for Moe
    await createFavorite({ userId: moe.id, productId: coffeeMug.id });

    app.listen(port, () => console.log(`Listening on port ${port}`));
};

init();

// API routes

// GET /api/users 
app.get('/api/users', async (req, res, next) => {
    try {
        const users = await fetchUsers();
        res.json(users);
    } catch (err) {
        next(err);
    }
});

// GET /api/products 
app.get('/api/products', async (req, res, next) => {
    try {
        const products = await fetchProducts();
        res.json(products);
    } catch (err) {
        next(err);
    }
});

// GET /api/users/:id/favorites 
app.get('/api/users/:id/favorites', async (req, res, next) => {
    try {
        const favorites = await fetchFavorites(req.params.id);
        res.json(favorites);
    } catch (err) {
        next(err);
    }
});

// POST /api/users/:id/favorites 
app.post('/api/users/:id/favorites', async (req, res, next) => {
    try {
        const { product_id } = req.body;
        const favorite = await createFavorite({ userId: req.params.id, productId: product_id });
        res.status(201).json(favorite);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/users/:userId/favorites/:id 
app.delete('/api/users/:userId/favorites/:id', async (req, res, next) => {
    try {
        await destroyFavorite(req.params.userId, req.params.id);
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
});

// error 
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
