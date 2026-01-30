# 🚀 QuizFlow Pro

**QuizFlow Pro** adalah platform ujian online (CBT) modern berbasis *Serverless* yang dibangun menggunakan Jekyll, Alpine.js, MongoDB, dan Netlify Functions. Didesain untuk performa tinggi, antarmuka yang gahar (cyberpunk style), dan kemudahan pengelolaan ujian bagi admin.

---

## ✨ Fitur Utama

* **Admin Panel**: Manajemen ujian (Buat, Edit, Hapus) yang terintegrasi dengan Netlify Identity.
* **Siswa Interface**: Tampilan ujian yang bersih dengan fitur *shuffle* (acak) soal.
* **Auto Grading**: Penghitungan skor otomatis di sisi server (Netlify Functions).
* **Visualisasi Hasil**: Laporan hasil ujian menggunakan Chart.js.
* **Export Data**: Rekap nilai dapat diunduh dalam format CSV.
* **Responsive Design**: Menggunakan Tailwind CSS untuk tampilan optimal di semua perangkat.

---

## 🛠️ Prasyarat (Prerequisites)

Sebelum memulai, pastikan Anda sudah menginstal:

* [Ruby & Bundler](https://www.ruby-lang.org/en/documentation/installation/) (untuk Jekyll)
* [Node.js](https://nodejs.org/) (untuk Netlify Functions)
* [Netlify CLI](https://docs.netlify.com/cli/get-started/) (`npm install netlify-cli -g`)
* Akun [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 📥 Instalasi Lokal

1. **Clone Repositori**
```bash
git clone https://github.com/IshikawaUta/quizflow-pro.git
cd quizflow-pro

```


2. **Instal Dependensi Ruby (Jekyll)**
```bash
bundle install

```


3. **Instal Dependensi Node.js**
```bash
npm install

```


4. **Konfigurasi Environment Variable**
Buat file `.env` di direktori utama dan tambahkan koneksi MongoDB Anda:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quiz_db?retryWrites=true&w=majority

```


5. **Jalankan Secara Lokal**
Gunakan Netlify CLI untuk menjalankan fungsi backend dan frontend secara bersamaan:
```bash
netlify dev

```


Aplikasi akan berjalan di `http://localhost:8888`.

---

## 🚀 Deployment ke Netlify

### 1. Persiapan MongoDB

* Dapatkan *Connection String* dari MongoDB Atlas.
* Pastikan IP `0.0.0.0/0` (Allow Access from Anywhere) sudah ditambahkan di *Network Access* MongoDB Atlas agar Netlify Functions bisa terhubung.

### 2. Push ke GitHub

```bash
git add .
git commit -m "Initial commit - QuizFlow Pro"
git push origin main

```

### 3. Hubungkan ke Netlify

1. Buka [Netlify Dashboard](https://app.netlify.com/).
2. Pilih **"Add new site"** > **"Import an existing project"**.
3. Hubungkan dengan repositori GitHub Anda.
4. **Build Settings** (akan otomatis terisi berdasarkan `netlify.toml`):
* Build Command: `bundle exec jekyll build`
* Publish directory: `_site`
* Functions directory: `netlify/functions`


5. **Environment Variables**:
Buka menu *Site Settings* > *Environment variables*, lalu tambahkan:
* `MONGODB_URI`: (Isi dengan URL MongoDB Atlas Anda)



### 4. Aktifkan Netlify Identity (Untuk Admin)

1. Di dashboard Netlify, buka tab **Identity**.
2. Klik **Enable Identity**.
3. Di bagian **Registration preferences**, ubah menjadi **Invite only** (agar tidak sembarang orang bisa jadi admin).
4. Aktifkan **Git Gateway** di bawah menu *Services*.

---

## 📁 Struktur Folder

* `_layouts/`: Template utama Jekyll.
* `admin/`: Halaman manajemen ujian dan rekap nilai.
* `netlify/functions/`: Logika backend (Node.js) untuk interaksi database.
* `_site/`: Hasil build final (statis).
* `netlify.toml`: Konfigurasi routing dan build Netlify.

---

## 📝 Lisensi

Proyek ini dibuat untuk tujuan pendidikan. Silakan modifikasi sesuai kebutuhan Anda.

---

**Dibuat dengan ❤️ oleh [IshikawaUta**](https://www.google.com/search?q=https://github.com/IshikawaUta)