
> **Aplikasi Kanvas Klasifikasi 5 Huruf Hijaiyah Berbasis AI Roboflow**  
> Disederhanakan khusus untuk modul pembelajaran & workshop tanpa backend/database.

---

## Struktur Berkas

```txt
D:\Produktif\SkillUp/
├── index.html            # Halaman utama kanvas (bisa langsung dibuka di browser)
├── app.js                # Logika kanvas gambar & pemanggilan API Roboflow
├── .env                  # Tempat memasukkan API Key & Model URL Roboflow
└── assets/
    ├── aset-hijaiyah/    # 5 Huruf: alif.svg, ba.svg, ta.svg, tsa.svg, jim.svg
    └── images/           # Ilustrasi: cat-true.png & cat-false.png
```

---

## Cara Menjalankan

Cukup **klik ganda (double click) file `index.html`** di File Explorer untuk langsung membukanya di browser Google Chrome / Microsoft Edge.

---

## Konfigurasi Roboflow API

Buka file `.env` dan masukkan API Key serta Model URL hasil training Anda:

```env
ROBOFLOW_API_KEY="masukkan_api_key_disini"
ROBOFLOW_MODEL_URL="https://serverless.roboflow.com/infer/workflows/workspace/workflow-id"
```

*Atau Anda juga bisa langsung memasukkan API Key lewat tombol **Roboflow Settings** di pojok kanan atas tampilan website.*
