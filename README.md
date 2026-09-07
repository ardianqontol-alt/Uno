# Game UNO V3 — Vercel

Versi ini memperbaiki alur permainan agar lebih dekat dengan aturan UNO dan memberi tahu kartu mana yang bisa dipasang.

## Aturan yang diterapkan
- 7 kartu awal untuk pemain dan Bot.
- Kartu yang bisa dipasang diberi efek glow ✨.
- Kartu bisa dipasang jika warna sama atau simbol/angka sama.
- Wild bisa dimainkan dan pemain memilih warna berikutnya.
- Wild +4 hanya bisa dimainkan jika pemain tidak memiliki kartu dengan warna kartu jalan.
- Skip melewati giliran.
- Reverse pada permainan 2 pemain berfungsi seperti Skip.
- +2 membuat pemain berikutnya mengambil 2 kartu dan kehilangan giliran.
- Jika tidak punya kartu yang cocok, tekan AMBIL.
- Jika kartu yang diambil cocok, kartu tersebut boleh langsung dipasang.
- Saat tinggal 1 kartu, tekan UNO.
- Jika tinggal 2 kartu lalu memasang kartu tanpa memanggil UNO, pemain dikenai penalti 2 kartu.
- Bot memiliki Easy, Hard, dan Master.

## Deploy
Project ini adalah web statis tanpa dependency npm. Upload ke Vercel.

Setelah deploy:
`https://ayaka-uno.vercel.app`

Kemudian URL tersebut dapat dipasang pada tombol `.uno` di bot WhatsApp.

## Catatan
Kartu dibuat dengan CSS/HTML agar tidak mengambil gambar aset UNO resmi dari pihak ketiga.
