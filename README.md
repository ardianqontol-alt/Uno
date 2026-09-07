# UNO Web Game — Vercel

Versi ini dibuat agar tampilan dan alur bermain mendekati referensi video: panel hijau vertikal, bot di atas, draw pile dan kartu jalan di tengah, status giliran, serta kartu pemain berjajar/fan di bawah.

## Kartu
Menggunakan representasi kartu permainan UNO standar: angka 0–9, Skip, Reverse, +2, Wild, dan Wild +4. Kartu dibuat dengan CSS/vector di dalam game, bukan mengambil aset/logo resmi dari pihak ketiga.

## Animasi
- animasi pembagian kartu
- kartu pemain terangkat saat disentuh
- indikator giliran
- animasi logo
- efek toast untuk aksi
- modal pemilihan warna
- responsif untuk layar HP

## Deploy Vercel
Upload isi folder ini sebagai project Vercel. Tidak ada dependency npm.

Setelah deploy:
`https://PROJECT.vercel.app/uno`

URL tersebut bisa dipasang ke tombol `.uno` pada bot WhatsApp.

## Catatan
Mode saat ini adalah single-player melawan Bot. State permainan berjalan di browser dan tidak membutuhkan database.
