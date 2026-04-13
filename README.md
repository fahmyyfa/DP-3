## Pengujian Aspek Kualitas (Daily Project 3)

Pengujian ini dilakukan untuk memverifikasi bahwa implementasi sistem **SPAO** telah memenuhi standar kualitas yang dirancang pada **Daily Project 2**. Fokus utama pengujian mencakup keamanan data, ketahanan sistem, dan akurasi algoritma scoring.

| No | Aspek Kualitas | Skenario Pengujian | Hasil Riil di Aplikasi | Status |
|:---:|:---:|:---|:---|:---:|
| 1 | **Security** | Perlindungan kunci akses (API Key) agar tidak terekspos di sisi klien/browser. | **LULUS.** API Key SerpApi disimpan menggunakan `Supabase Secrets` dan hanya diakses melalui `Edge Function` (Server-side). Tidak ada kunci sensitif di kode frontend. | ✅ **PASS** |
| 2 | **Reliability** | Penanganan kondisi saat mesin pencari tidak menemukan data alumni di internet (No Results). | **LULUS.** Sistem mampu menangkap respon kosong dari Google, menampilkan pesan "Profil tidak ditemukan", dan tetap stabil tanpa terjadi *crash* pada aplikasi. | ✅ **PASS** |
| 3 | **Accuracy** | Penentuan status pelacakan berdasarkan *Confidence Score* otomatis sesuai ambang batas. | **LULUS.** Data dengan skor $\ge 0.75$ otomatis menjadi **Teridentifikasi**. Data dengan skor $0.50 - 0.74$ masuk ke status **Perlu Verifikasi Manual**. | ✅ **PASS** |
| 4 | **Efficiency** | Mengatasi batasan keamanan browser (*CORS Error*) saat mengakses API pihak ketiga secara langsung. | **LULUS.** Menggunakan `Supabase Edge Functions` sebagai *proxy* komunikasi server-to-server, sehingga pengiriman data dari frontend berjalan lancar dan cepat. | ✅ **PASS** |

### Detail Logika Threshold
Sistem menggunakan parameter ambang batas (threshold) yang ketat untuk menjamin validitas data alumni:
**Confidence Threshold ($0.75$):** Batas minimal untuk identifikasi otomatis sebagai alumni yang valid. 
**Manual Review Threshold ($0.50$):** Batas minimal untuk memicu tinjauan manual oleh Admin jika terdapat keraguan data.
