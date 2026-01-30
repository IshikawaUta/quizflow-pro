const { MongoClient, ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
    const { id } = event.queryStringParameters || {};
    
    // 1. Validasi ID (Harus 24 karakter jika menggunakan ObjectId)
    if (!id || id.length !== 24) {
        return { 
            statusCode: 400, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "ID hasil tidak valid atau tidak ditemukan." }) 
        };
    }

    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        const db = client.db('quiz_db');

        // 2. Gunakan Agregasi dengan penanganan error tipe data quiz_id
        const resultData = await db.collection('results').aggregate([
            { $match: { _id: new ObjectId(id) } },
            {
                // Menghindari error jika quiz_id sudah berupa ObjectId atau masih String
                $addFields: {
                    quiz_obj_id: { $toObjectId: "$quiz_id" }
                }
            },
            {
                $lookup: {
                    from: "quizzes",
                    localField: "quiz_obj_id",
                    foreignField: "_id",
                    as: "quiz_info"
                }
            },
            { $unwind: { path: "$quiz_info", preserveNullAndEmptyArrays: true } }
        ]).toArray();

        if (resultData.length === 0) {
            return { 
                statusCode: 404, 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Data hasil tidak ditemukan." }) 
            };
        }

        const res = resultData[0];

        // 3. Return data dengan struktur yang bersih
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            },
            body: JSON.stringify({
                // Identitas Siswa
                student_name: res.student_name || "Tanpa Nama",
                student_absent: res.student_absent || "-",
                student_class: res.student_class || "-",
                
                // Skor & Statistik
                score: res.score,
                correct_count: res.correct_count,
                wrong_count: res.wrong_count,
                completed_at: res.completed_at || res.createdAt,
                
                // Detail Ujian (Handling jika data quiz sudah dihapus)
                quiz_title: res.quiz_title || (res.quiz_info ? res.quiz_info.title : "Ujian Telah Dihapus"),
                student_answers: res.answers || [],
                quiz_details: res.quiz_info ? res.quiz_info.questions : []
            })
        };

    } catch (e) {
        console.error("Error get-result:", e);
        return { 
            statusCode: 500, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Terjadi kesalahan pada server." }) 
        };
    } finally {
        await client.close();
    }
};