# Bidly — Delcom Auction

Aplikasi studi kasus P5 PABWE: marketplace lelang berbasis Vue 3, JavaScript, dan Bun. UI menggunakan Tailwind CSS v4, Pinia, Vue Router, Lucide, SweetAlert2, dan Toast UI Editor.

## Menjalankan aplikasi

```bash
bun install
bun run dev
```

Buat `.env` dari `.env.example` bila konfigurasi lokal perlu diubah. Secara default Vite berjalan di `http://localhost:3000` dan menggunakan API `https://open-api.delcom.org/api/v1`.

## Fitur

- Registrasi, login, dan logout dengan token yang disimpan di `localStorage`.
- Daftar lelang dengan filter semua, milik sendiri, berlangsung, dan berakhir; pencarian judul/deskripsi.
- Detail lelang, deskripsi Markdown, histori/tawaran tertinggi, dan validasi bid.
- Tambah, ubah, unggah cover, hapus satu, atau hapus semua lelang milik pengguna.
- Direktori pengguna, pengaturan profil, unggah foto, dan ganti kata sandi.
- Layout responsif, state loading/kosong/error, dan konfirmasi aksi destruktif.

## Perintah

```bash
bun run dev
bun run build
bun run preview
bun run test
bun run test:coverage
bun run test:integration
```

Semua endpoint memakai base URL dari `VITE_DELCOM_BASEURL`. Endpoint lelang menggunakan ejaan API Delcom `/aucations`.
Ganti kata sandi memakai `PUT /users/password` sesuai dokumentasi API Delcom (8 Oktober 2026), bukan `/users/me/password`.

`bun run test:integration` menjalankan tes kontrak request API dengan mock `fetch` sekaligus smoke test read-only ke API live, termasuk membandingkan endpoint ganti kata sandi yang resmi dengan path lama. Tes endpoint yang memerlukan autentikasi dijalankan bila `DELCOM_TEST_EMAIL` dan `DELCOM_TEST_PASSWORD` diatur; tes ini hanya membaca data dan tidak membuat atau mengubah akun.
Untuk tes terautentikasi, simpan kedua variabel tersebut di `.env.local` (file ini diabaikan Git) atau atur di environment shell sebelum menjalankan `bun run test:integration`. Jangan commit atau bagikan kredensial.

`bun run test:coverage` menegakkan coverage 100% (statements, branches, functions, lines) untuk semua adapter API, Pinia stores, helpers, dan composable JavaScript. Tes interaksi Vue mencakup alur autentikasi, profil/pengguna, dashboard/detail lelang, kartu, serta pembuatan dan penawaran lelang; berkas tampilan lainnya belum dihitung dalam angka coverage logika bisnis tersebut. Editor Markdown dimuat saat modal lelang dibuka agar tidak menambah beban unduhan awal.
