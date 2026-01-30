document.addEventListener("DOMContentLoaded", () => {
    // Fungsi untuk memperbarui nama di UI
    const updateAdminUI = (user) => {
        // Mencari ID 'admin-name' atau 'admin-name-display' (sesuai update index.html sebelumnya)
        const nameEl = document.getElementById('admin-name') || document.getElementById('admin-name-display');
        if (nameEl && user) {
            const displayName = user.user_metadata?.full_name || user.email.split('@')[0];
            nameEl.innerText = displayName;
        }
    };

    // 1. Cek status login saat halaman dimuat
    const user = netlifyIdentity.currentUser();

    if (!user) {
        // Jika tidak ada user, sembunyikan konten dan buka modal login
        document.body.classList.add('opacity-0');
        // Gunakan sedikit delay agar modal tidak terblokir popup blocker browser
        setTimeout(() => netlifyIdentity.open('login'), 500);
    } else {
        updateAdminUI(user);
    }

    // 2. Event: Saat User Berhasil Login
    netlifyIdentity.on('login', (user) => {
        document.body.classList.remove('opacity-0');
        updateAdminUI(user);
        netlifyIdentity.close();
        
        // Reload hanya jika berada di halaman yang membutuhkan data segar
        // namun biasanya cukup dengan trigger init Alpine jika menggunakan redirect
        window.location.reload(); 
    });

    // 3. Event: Saat User Logout
    netlifyIdentity.on('logout', () => {
        // Bersihkan cache/session lokal jika perlu
        window.location.href = "/";
    });

    // 4. Event: Error handling (Opsional namun disarankan)
    netlifyIdentity.on('error', err => console.error('Auth Error:', err));

    // Tambahan: Pastikan jika modal ditutup tanpa login, user diredirect balik ke home
    netlifyIdentity.on('close', () => {
        const currentUser = netlifyIdentity.currentUser();
        if (!currentUser && !window.location.pathname.includes('/index.html')) {
            // Jika user menutup modal tapi tidak login dan tidak di halaman utama admin
            // Opsional: biarkan mereka di halaman tersebut atau tendang ke home
            // window.location.href = "/";
        }
    });
});