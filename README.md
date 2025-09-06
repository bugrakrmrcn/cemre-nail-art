# 💅 Jel Tırnak Randevu Sistemi

Modern ve kullanışlı jel tırnak ofisi randevu sistemi. Müşteriler kolayca randevu alabilir, admin panelinden tüm randevular yönetilebilir.

## ✨ Özellikler

### Müşteri Tarafı
- 📅 Hafta içi tarih seçimi (16:00-20:00)
- ⏰ Müsait saat görüntüleme
- 💅 Hizmet seçimi (Jel Tırnak / Manikür)
- 📱 Mobil uyumlu tasarım
- 🎨 Modern pembe pastel tema

### Admin Paneli
- 🔐 Güvenli giriş sistemi
- 👩‍💼 Tüm randevuları görüntüleme
- 📊 Randevu istatistikleri
- ❌ Randevu iptal etme
- 🔍 Filtreleme seçenekleri
- 📱 Mobil uyumlu yönetim
- 🚪 Güvenli çıkış sistemi

## 🚀 Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn

### Adımlar

1. **Bağımlılıkları yükleyin:**
```bash
npm install
cd client
npm install
cd ..
```

2. **Geliştirme modunda çalıştırın:**
```bash
npm run dev
```

3. **Üretim için build alın:**
```bash
npm run build
```

4. **Üretim modunda çalıştırın:**
```bash
npm start
```

## 🌐 Deployment (Vercel)

1. **Vercel hesabı oluşturun:** [vercel.com](https://vercel.com)

2. **GitHub'a yükleyin:**
```bash
git init
git add .
git commit -m "İlk commit"
git remote add origin [GITHUB_REPO_URL]
git push -u origin main
```

3. **Vercel'e bağlayın:**
   - Vercel dashboard'da "New Project"
   - GitHub repo'nuzu seçin
   - Otomatik deploy olacak

4. **Domain bağlama:**
   - Vercel dashboard'da "Domains" sekmesi
   - Kendi domain'inizi ekleyin

## 📱 Kullanım

### Müşteri Randevu Alma
1. Ana sayfada "Randevu Al" sekmesi
2. Ad, soyad bilgilerini girin
3. Tarih seçin (sadece hafta içi)
4. Müsait saatlerden birini seçin
5. Hizmet türünü seçin
6. "Randevu Al" butonuna tıklayın

### Admin Paneli
1. "Admin Girişi" sekmesine geçin
2. Giriş bilgilerini girin:
   - Kullanıcı Adı: `admin`
   - Şifre: `admin123`
3. Admin paneline erişin
4. Tüm randevuları görüntüleyin
5. İstatistikleri kontrol edin
6. Gerekirse randevuları iptal edin
7. "Çıkış Yap" ile güvenli çıkış yapın

## 🗄️ Veritabanı

Sistem SQLite veritabanı kullanır. Veriler `randevular.db` dosyasında saklanır.

### Tablo Yapısı
```sql
CREATE TABLE randevular (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  isim TEXT NOT NULL,
  soyisim TEXT NOT NULL,
  tarih TEXT NOT NULL,
  saat TEXT NOT NULL,
  hizmet TEXT NOT NULL,
  durum TEXT DEFAULT 'aktif',
  olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 Tasarım

- **Renk Paleti:** Pembe pastel (#ec4899, #be185d) + Gri tonları
- **Tipografi:** Segoe UI, modern ve okunabilir
- **Responsive:** Mobil, tablet ve desktop uyumlu
- **Animasyonlar:** Smooth transitions ve hover efektleri

## 🔧 API Endpoints

### Müşteri API'leri
- `GET /api/randevular/aktif` - Aktif randevular
- `POST /api/randevular` - Yeni randevu
- `PUT /api/randevular/:id/iptal` - Müşteri iptal
- `GET /api/musait-saatler/:tarih` - Müsait saatler

### Admin API'leri (Token Gerekli)
- `POST /api/admin/login` - Admin girişi
- `GET /api/admin/verify` - Token doğrulama
- `GET /api/admin/randevular` - Tüm randevular
- `PUT /api/admin/randevular/:id/iptal` - Admin iptal

## 📞 Destek

Herhangi bir sorun yaşarsanız:
- GitHub Issues kullanın
- E-posta: [email@example.com]

## 📄 Lisans

MIT License - Ticari kullanım serbesttir.

---

**💅 Jel Tırnak Ofisi Randevu Sistemi** - Modern, güvenli ve kullanışlı!
