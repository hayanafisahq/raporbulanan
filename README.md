# Laporan Les Privat

Halaman web statis untuk laporan bulanan les privat: jadwal per minggu (Matematika, Bahasa Inggris, IPA), keterangan kemampuan siswa, serta tanggapan siswa dan pengajar. Tidak butuh server dan tidak ada proses build.

## Isi folder

| File | Fungsi |
| --- | --- |
| `index.html` | Halaman utama |
| `style.css` | Tampilan |
| `app.js` | Logika halaman dan mode edit |
| `data.js` | **Isi laporan** (nama siswa, jadwal, kemampuan, tanggapan). File inilah yang diganti saat laporan berubah |
| `README.md` | Petunjuk ini |

## Menaruhnya di GitHub Pages

1. Buat repositori baru di GitHub, misalnya `laporan-les`.
2. Klik **Add file → Upload files**, seret kelima file di atas, lalu **Commit changes**.
3. Buka **Settings → Pages**. Di bagian **Build and deployment**, pilih **Deploy from a branch**, lalu branch `main` dan folder `/ (root)`, kemudian **Save**.
4. Tunggu satu sampai dua menit. Alamatnya akan muncul di halaman yang sama, bentuknya `https://NAMAKAMU.github.io/laporan-les/`.

## Mengubah isi laporan

1. Buka alamat halamanmu dengan tambahan `?edit`, misalnya `https://NAMAKAMU.github.io/laporan-les/?edit`.
2. Tekan **Edit laporan**, ubah tanggal, materi, kemampuan, atau tanggapan.
3. Tekan **Unduh data.js**.
4. Di repositori GitHub, klik **Add file → Upload files**, unggah `data.js` hasil unduhan (nama yang sama akan menggantikan yang lama), lalu **Commit changes**.
5. Tunggu sekitar satu menit, lalu muat ulang halaman biasa (tanpa `?edit`).

Catatan:
- Tombol **Edit laporan** hanya muncul kalau alamatnya memakai `?edit`. Ini sekadar penyembunyi tombol, bukan kunci keamanan. Pengunjung biasa yang membuka `?edit` pun hanya mengubah tampilan di browsernya sendiri dan tidak bisa mengubah isi di GitHub.
- **Simpan draft** menyimpan perubahan di browser itu saja, berguna kalau belum selesai mengedit. Draft baru tampil untuk orang lain setelah `data.js` diunggah ke GitHub.
- Kalau kamu lebih suka, `data.js` juga bisa diedit langsung di GitHub lewat ikon pensil, tanpa mode edit. Format isinya ada di file itu.

## Bulan ke-2 dan seterusnya

Satu bulan di laporan ini berarti 4 minggu les, bukan bulan kalender, jadi tanggalnya boleh melintasi pergantian bulan (misalnya mulai 27 Oktober sampai 21 November). Ubah **Nama bulan** di mode edit untuk menyesuaikan. Setelah empat minggu selesai, tekan **+ Mulai bulan ke-2**. Keterangan kemampuan disalin dari bulan sebelumnya, sedangkan jadwal dan tanggapan dikosongkan.

## Memakai di komputer tanpa GitHub

Buka `index.html` langsung dari folder. Mode edit otomatis aktif untuk file yang dibuka dari komputer.

## Soal privasi

GitHub Pages bersifat publik: siapa pun yang tahu alamatnya bisa membuka halaman, dan di paket gratis repositorinya juga harus publik, sehingga isi `data.js` bisa dibaca siapa saja. Sebaiknya pakai nama panggilan atau inisial siswa, dan jangan menulis data pribadi seperti alamat, nomor telepon, atau nilai rapor resmi.

## Menambah mata pelajaran

Daftar mata pelajaran ada di bagian atas `app.js` (`SUBJ`). Untuk menambah satu, tambahkan baris baru di sana, lalu tambahkan warnanya di `style.css` (ikuti pola `.chip.mtk`, `.subj.mtk`, dan variabel warna `--mtk`). Data lama tetap aman, tetapi bulan yang sudah ada perlu diberi daftar kemampuan untuk mapel baru itu: tambahkan `"kode": []` di `abilities` pada `data.js`.
