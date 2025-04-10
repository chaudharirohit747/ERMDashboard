require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testConnection() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        console.log('Attempting to connect to MongoDB...');
        await client.connect();
        console.log('Successfully connected to MongoDB!');
        
        const db = client.db('erm_dashboard');
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
    } catch (err) {
        console.error('Error details:', {
            name: err.name,
            message: err.message,
            code: err.code,
            stack: err.stack
        });
    } finally {
        await client.close();
    }
}

testConnection();
