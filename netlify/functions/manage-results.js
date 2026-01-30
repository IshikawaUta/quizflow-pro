const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
    // Cek Autentikasi Admin
    const { user } = context.clientContext || {};
    if (!user) {
        return { 
            statusCode: 401, 
            body: JSON.stringify({ error: "Unauthorized" }) 
        };
    }

    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        const db = client.db('quiz_db');
        
        // Ambil semua hasil, urutkan dari yang terbaru
        const results = await db.collection('results')
            .find({})
            .sort({ completed_at: -1 })
            .toArray();

        return { 
            statusCode: 200, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(results)
        };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    } finally {
        await client.close();
    }
};