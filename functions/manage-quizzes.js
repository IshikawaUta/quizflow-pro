const { MongoClient, ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
    // 1. Keamanan: Cek apakah user login via Netlify Identity
    const { user } = context.clientContext || {};
    if (!user) {
        return { 
            statusCode: 401, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Unauthorized: Silakan login terlebih dahulu." }) 
        };
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    const method = event.httpMethod;
    const { id } = event.queryStringParameters || {};

    try {
        await client.connect();
        const db = client.db('quiz_db');
        const collection = db.collection('quizzes');

        // --- GET: Ambil daftar ujian ---
        if (method === "GET") {
            if (id) {
                if (id.length !== 24) return { statusCode: 400, body: JSON.stringify({ error: "ID tidak valid" }) };
                const quiz = await collection.findOne({ _id: new ObjectId(id) });
                return { 
                    statusCode: 200, 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(quiz) 
                };
            }
            
            // Perbaikan: Menggunakan _id untuk sorting (paling akurat untuk data baru)
            const quizzes = await collection.find({})
                .sort({ _id: -1 }) 
                .toArray();

            return { 
                statusCode: 200, 
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store, no-cache, must-revalidate" // Hindari cache kosong
                },
                body: JSON.stringify(quizzes || []) 
            };
        }

        // --- POST: Tambah Ujian Baru ---
        if (method === "POST") {
            const data = JSON.parse(event.body);
            const result = await collection.insertOne({
                ...data,
                created_at: new Date(),
                author: user.email
            });
            return { 
                statusCode: 201, 
                body: JSON.stringify({ message: "Ujian berhasil dibuat", id: result.insertedId }) 
            };
        }

        // --- PUT: Update Ujian ---
        if (method === "PUT") {
            if (!id) return { statusCode: 400, body: "ID diperlukan" };
            const updatedData = JSON.parse(event.body);
            delete updatedData._id; // Jangan update ID
            
            await collection.updateOne(
                { _id: new ObjectId(id) }, 
                { $set: { ...updatedData, last_updated: new Date() } }
            );
            
            return { 
                statusCode: 200, 
                body: JSON.stringify({ message: "Ujian diperbarui" }) 
            };
        }

        // --- DELETE: Hapus Ujian ---
        if (method === "DELETE") {
            if (!id) return { statusCode: 400, body: "ID diperlukan" };
            await collection.deleteOne({ _id: new ObjectId(id) });
            await db.collection('results').deleteMany({ quiz_id: new ObjectId(id) });
            return { 
                statusCode: 200, 
                body: JSON.stringify({ message: "Terhapus" }) 
            };
        }

        return { statusCode: 405, body: "Method Not Allowed" };

    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    } finally {
        await client.close();
    }
};