const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
    
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        const user = context.clientContext && context.clientContext.user;
        if (!user) return { statusCode: 401, body: "Unauthorized" };

        const data = JSON.parse(event.body);
        await client.connect();
        const result = await client.db('quiz_db').collection('quizzes').insertOne({
            ...data,
            createdAt: new Date(),
            author: user.email
        });

        return { statusCode: 201, body: JSON.stringify({ id: result.insertedId }) };
    } catch (e) {
        return { statusCode: 500, body: e.toString() };
    } finally { await client.close(); }
};const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
    // 1. Keamanan: Hanya izinkan metode POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }
    
    // 2. Keamanan: Cek apakah user adalah Admin yang sudah login
    const user = context.clientContext && context.clientContext.user;
    if (!user) {
        return { 
            statusCode: 401, 
            body: JSON.stringify({ error: "Akses ditolak. Silakan login." }) 
        };
    }

    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        const data = JSON.parse(event.body);
        
        await client.connect();
        const db = client.db('quiz_db');

        // 3. Masukkan data dengan format yang sinkron dengan manage-quizzes.js
        const result = await db.collection('quizzes').insertOne({
            ...data,
            created_at: new Date(), // Menggunakan snake_case agar seragam saat sorting
            author: user.email      // Mencatat siapa pembuatnya
        });

        return { 
            statusCode: 201, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                message: "Ujian berhasil dibuat", 
                id: result.insertedId 
            }) 
        };

    } catch (e) {
        console.error("Create Quiz Error:", e);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: e.message }) 
        };
    } finally { 
        await client.close(); 
    }
};