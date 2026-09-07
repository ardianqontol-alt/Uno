# Game UNO — Vercel

Game UNO single-player vs Bot, dibuat sebagai web statis sehingga mudah di-host di Vercel.

## Deploy ke Vercel

1. Ekstrak ZIP ini.
2. Upload folder/proyek ke Vercel.
3. Setelah deploy, game bisa dibuka di:
   `https://DOMAIN-KAMU.vercel.app/uno`

Tidak membutuhkan Node.js server atau database untuk mode Bot.

## Integrasi ke bot WhatsApp

Command `.uno` pada bot cukup mengarahkan tombol/link ke:

`https://DOMAIN-KAMU.vercel.app/uno`

Game berjalan di browser pengguna.

## Fitur

- Easy / Hard / Master
- Bot AI berbeda berdasarkan level
- 7 kartu awal
- Draw pile
- Wild dan Wild +4
- Skip, Reverse, +2
- Validasi kartu
- UNO button
- Animasi kartu/deal/hover
- Responsive untuk HP
- Tanpa dependency npm
