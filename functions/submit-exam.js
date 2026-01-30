const { MongoClient, ObjectId } = require('mongodb');

/**
 * Netlify Function: submit-exam
 * Menangani pengiriman jawaban siswa, menghitung skor, 
 * dan menyimpan hasil ke database MongoDB.
 */

exports.handler = async (event, context) => {
    // 1. Hanya izinkan metode POST
    if (event.httpMethod !== "POST") {
        return { 
            statusCode: 405, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Method Not Allowed" }) 
        };
    }

    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        // 2. Parse data dari frontend
        const data = JSON.parse(event.body);
        const { 
            quiz_id, 
            answers, 
            student_name, 
            student_absent, 
            student_class 
        } = data;

        // Validasi input minimal
        if (!quiz_id || !answers || !student_name) {
            return { 
                statusCode: 400, 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Data pengerjaan tidak lengkap." }) 
            };
        }

        // Cek validitas format ObjectId
        if (quiz_id.length !== 24) {
            return { 
                statusCode: 400, 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "ID Ujian tidak valid." }) 
            };
        }

        await client.connect();
        const db = client.db('quiz_db');

        // 3. Ambil data kunci jawaban dari koleksi quizzes
        const quiz = await db.collection('quizzes').findOne({ 
            _id: new ObjectId(quiz_id) 
        });

        if (!quiz) {
            return { 
                statusCode: 404, 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Data ujian tidak ditemukan di server." }) 
            };
        }

        // 4. Logika Penilaian Otomatis
        let correctCount = 0;
        const totalQuestions = quiz.questions.length;

        // Bandingkan jawaban siswa dengan correct_answer_index di database
        quiz.questions.forEach((question, index) => {
            // Pastikan jawaban ada dan cocok (tipe data harus sama-sama number atau string)
            if (answers[index] !== undefined && answers[index] !== null) {
                if (parseInt(answers[index]) === parseInt(question.correct_answer_index)) {
                    correctCount++;
                }
            }
        });

        // Hitung skor (skala 0 - 100)
        const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        // 5. Susun Dokumen Hasil (SINKRON DENGAN GET-RESULT.JS)
        const resultDoc = {
            quiz_id: new ObjectId(quiz_id),
            quiz_title: quiz.title, // Backup judul jika quiz aslinya dihapus nanti
            student_name: student_name,
            student_absent: student_absent || "-",
            student_class: student_class || "-",
            score: finalScore,
            correct_count: correctCount,
            wrong_count: totalQuestions - correctCount,
            answers: answers, 
            completed_at: new Date()
        };

        // 6. Simpan ke koleksi 'results'
        const result = await db.collection('results').insertOne(resultDoc);

        // 7. Kembalikan ID hasil pengerjaan ke frontend
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            },
            body: JSON.stringify({ 
                message: "Ujian berhasil dikirim", 
                id: result.insertedId,
                score: finalScore 
            })
        };

    } catch (error) {
        console.error("Submit Exam Error:", error);
        return { 
            statusCode: 500, 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Gagal memproses jawaban.", error: error.message }) 
        };
    } finally {
        await client.close();
    }
};