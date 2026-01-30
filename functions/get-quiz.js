const { MongoClient, ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
    // 1. Keamanan: Cek apakah user sudah login (Opsional untuk GET, tapi disarankan jika ini untuk Admin)
    // Jika fungsi ini juga digunakan oleh siswa untuk mengerjakan ujian, baris user check bisa dihapus.
    const { user } = context.clientContext || {};

    const client = new MongoClient(process.env.MONGODB_URI);
    const { id } = event.queryStringParameters || {};

    try {
        await client.connect();
        const db = client.db('quiz_db');
        
        // 2. Jika ada ID: Ambil satu soal spesifik
        if (id) {
            // Validasi format ID untuk mencegah error BSON
            if (id.length !== 24) {
                return { statusCode: 400, body: JSON.stringify({ error: "Format ID tidak valid" }) };
            }

            const quiz = await db.collection('quizzes').findOne({ _id: new ObjectId(id) });
            
            if (!quiz) {
                return { statusCode: 404, body: JSON.stringify({ error: "Ujian tidak ditemukan" }) };
            }

            return {
                statusCode: 200,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*" 
                },
                body: JSON.stringify(quiz)
            };
        } 
        
        // 3. Jika TIDAK ada ID: Ambil semua daftar ujian
        // Menambahkan sorting berdasarkan 'created_at' terbaru di atas
        const allQuizzes = await db.collection('quizzes')
            .find({})
            .sort({ created_at: -1 }) 
            .toArray();

        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(allQuizzes)
        };

    } catch (e) {
        console.error("Database Error:", e);
        return { 
            statusCode: 500, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: e.message }) 
        };
    } finally {
        await client.close();
    }
};