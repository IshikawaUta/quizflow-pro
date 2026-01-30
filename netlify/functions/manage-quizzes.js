const { MongoClient, ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
    // 1. Ambil User Context dari Netlify Identity
    const { user } = context.clientContext || {};
    const method = event.httpMethod;
    const { id } = event.queryStringParameters || {};

    // 2. Keamanan: Semua akses wajib Login Admin
    if (!user) {
        return { 
            statusCode: 401, 
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            },
            body: JSON.stringify({ error: "Unauthorized: Sesi berakhir atau Anda bukan admin." }) 
        };
    }

    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        const db = client.db('quiz_db');
        const collection = db.collection('quizzes');

        // --- GET: Ambil daftar ujian atau satu ujian spesifik ---
        if (method === "GET") {
            if (id) {
                // Validasi format ObjectId MongoDB agar tidak menyebabkan error BSON
                if (!ObjectId.isValid(id)) {
                    return { 
                        statusCode: 400, 
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ error: "Format ID tidak valid" }) 
                    };
                }
                
                const quiz = await collection.findOne({ _id: new ObjectId(id) });
                
                if (!quiz) {
                    return { 
                        statusCode: 404, 
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ error: "Ujian tidak ditemukan" }) 
                    };
                }

                return { 
                    statusCode: 200, 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(quiz) 
                };
            }
            
            // Ambil semua ujian, urutkan dari yang terbaru (berdasarkan _id)
            const quizzes = await collection.find({})
                .sort({ _id: -1 }) 
                .toArray();

            return { 
                statusCode: 200, 
                headers: { 
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store" 
                },
                body: JSON.stringify(quizzes || []) 
            };
        }

        // --- POST: Tambah Ujian Baru ---
        if (method === "POST") {
            const data = JSON.parse(event.body);
            const result = await collection.insertOne({
                ...data,
                passing_grade: parseInt(data.passing_grade) || 75,
                created_at: new Date(),
                author: user.email
            });
            
            return { 
                statusCode: 201, 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: "Ujian berhasil dibuat", 
                    id: result.insertedId 
                }) 
            };
        }

        // --- PUT: Update Ujian ---
        if (method === "PUT") {
            if (!id || !ObjectId.isValid(id)) {
                return { 
                    statusCode: 400, 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ error: "ID tidak valid atau diperlukan" }) 
                };
            }

            const updatedData = JSON.parse(event.body);
            
            // Buang _id dari body agar tidak error saat update di MongoDB
            delete updatedData._id; 
            
            const result = await collection.updateOne(
                { _id: new ObjectId(id) }, 
                { 
                    $set: { 
                        ...updatedData, 
                        last_updated: new Date() 
                    } 
                }
            );
            
            if (result.matchedCount === 0) {
                return { 
                    statusCode: 404, 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ error: "Ujian tidak ditemukan" }) 
                };
            }

            return { 
                statusCode: 200, 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Ujian berhasil diperbarui" }) 
            };
        }

        // --- DELETE: Hapus Ujian ---
        if (method === "DELETE") {
            if (!id || !ObjectId.isValid(id)) {
                return { 
                    statusCode: 400, 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ error: "ID tidak valid atau diperlukan" }) 
                };
            }
            
            const targetId = new ObjectId(id);

            // 1. Hapus dokumen ujian
            const deleteResult = await collection.deleteOne({ _id: targetId });
            
            if (deleteResult.deletedCount === 0) {
                return { 
                    statusCode: 404, 
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ error: "Ujian tidak ditemukan untuk dihapus" }) 
                };
            }
            
            // 2. Hapus semua nilai (results) yang terkait dengan ujian ini
            // Pastikan field di koleksi 'results' adalah quiz_id dalam format ObjectId
            await db.collection('results').deleteMany({ quiz_id: targetId });
            
            return { 
                statusCode: 200, 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: "Ujian dan data nilai terkait telah dihapus berhasil" 
                }) 
            };
        }

        // Jika metode HTTP tidak didukung
        return { 
            statusCode: 405, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Method Not Allowed" }) 
        };

    } catch (e) {
        console.error("Manage Quizzes Error:", e);
        return { 
            statusCode: 500, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                error: "Internal Server Error", 
                details: e.message 
            }) 
        };
    } finally {
        // Selalu tutup koneksi database
        await client.close();
    }
};