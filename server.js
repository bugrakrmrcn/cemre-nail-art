const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// JWT Secret (üretimde environment variable kullanın)
const JWT_SECRET = process.env.JWT_SECRET || 'jel-tirnak-admin-secret-key-2024';

// Admin şifresi (üretimde environment variable kullanın)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/build')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer konfigürasyonu (dosya yükleme)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
  }
});

// Veritabanı bağlantısı
const db = new sqlite3.Database('./randevular.db', (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err.message);
  } else {
    console.log('Veritabanı bağlantısı başarılı');
    // Tabloları oluştur
    createTables();
  }
});

// Tabloları oluştur
function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS randevular (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isim TEXT NOT NULL,
      soyisim TEXT NOT NULL,
      telefon TEXT NOT NULL,
      tarih TEXT NOT NULL,
      saat TEXT NOT NULL,
      hizmet TEXT NOT NULL,
      durum TEXT DEFAULT 'aktif',
      olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Tablo oluşturma hatası:', err.message);
    } else {
      console.log('Randevular tablosu hazır');
    }
  });

  // Admin tablosu oluştur
  db.run(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kullanici_adi TEXT UNIQUE NOT NULL,
      sifre_hash TEXT NOT NULL,
      olusturma_tarihi DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Admin tablo oluşturma hatası:', err.message);
    } else {
      console.log('Admin tablosu hazır');
      // Varsayılan admin kullanıcısı oluştur
      createDefaultAdmin();
    }
  });

  // Galeri tablosu oluştur
  db.run(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Galeri tablo oluşturma hatası:', err.message);
    } else {
      console.log('Galeri tablosu hazır');
    }
  });
}

// Varsayılan admin kullanıcısı oluştur
function createDefaultAdmin() {
  db.get("SELECT * FROM admin WHERE kullanici_adi = 'admin'", (err, row) => {
    if (err) {
      console.error('Admin kontrol hatası:', err.message);
      return;
    }
    
    if (!row) {
      const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
      db.run(
        "INSERT INTO admin (kullanici_adi, sifre_hash) VALUES (?, ?)",
        ['admin', hashedPassword],
        (err) => {
          if (err) {
            console.error('Varsayılan admin oluşturma hatası:', err.message);
          } else {
            console.log('Varsayılan admin kullanıcısı oluşturuldu');
            console.log('Kullanıcı adı: admin');
            console.log('Şifre:', ADMIN_PASSWORD);
          }
        }
      );
    }
  });
}

// Middleware: JWT token doğrulama
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Erişim token\'ı gerekli' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
}

// API Endpoints

// Admin giriş
app.post('/api/admin/login', (req, res) => {
  const { kullanici_adi, sifre } = req.body;

  if (!kullanici_adi || !sifre) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
  }

  db.get("SELECT * FROM admin WHERE kullanici_adi = ?", [kullanici_adi], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }

    if (!row || !bcrypt.compareSync(sifre, row.sifre_hash)) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const token = jwt.sign(
      { id: row.id, kullanici_adi: row.kullanici_adi },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token,
      kullanici_adi: row.kullanici_adi,
      message: 'Giriş başarılı'
    });
  });
});

// Admin token doğrulama
app.get('/api/admin/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    kullanici_adi: req.user.kullanici_adi 
  });
});

// Tüm randevuları getir (admin için)
app.get('/api/admin/randevular', authenticateToken, (req, res) => {
  db.all("SELECT * FROM randevular ORDER BY tarih, saat", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Aktif randevuları getir (müşteri tarafı için)
app.get('/api/randevular/aktif', (req, res) => {
  db.all("SELECT * FROM randevular WHERE durum = 'aktif' ORDER BY tarih, saat", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Yeni randevu oluştur
app.post('/api/randevular', (req, res) => {
  const { isim, soyisim, telefon, tarih, saat, hizmet } = req.body;
  
  // Aynı tarih ve saatte randevu var mı kontrol et
  db.get("SELECT * FROM randevular WHERE tarih = ? AND saat = ? AND durum = 'aktif'", [tarih, saat], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      res.status(400).json({ error: 'Bu saat zaten dolu' });
      return;
    }
    
    // Randevuyu oluştur
    db.run(
      "INSERT INTO randevular (isim, soyisim, telefon, tarih, saat, hizmet) VALUES (?, ?, ?, ?, ?, ?)",
      [isim, soyisim, telefon, tarih, saat, hizmet],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ 
          id: this.lastID, 
          message: 'Randevu başarıyla oluşturuldu' 
        });
      }
    );
  });
});

// Randevu iptal et (müşteri)
app.put('/api/randevular/:id/iptal', (req, res) => {
  const { id } = req.params;
  
  db.run("UPDATE randevular SET durum = 'iptal' WHERE id = ?", [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Randevu bulunamadı' });
      return;
    }
    res.json({ message: 'Randevu iptal edildi' });
  });
});

// Randevu iptal et (admin)
app.put('/api/admin/randevular/:id/iptal', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run("UPDATE randevular SET durum = 'admin_iptal' WHERE id = ?", [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Randevu bulunamadı' });
      return;
    }
    res.json({ message: 'Randevu admin tarafından iptal edildi' });
  });
});

// Müsait saatleri getir
app.get('/api/musait-saatler/:tarih', (req, res) => {
  const { tarih } = req.params;
  
  // Hafta içi 16:00-20:00 arası saatler
  const musaitSaatler = ['16:00', '17:00', '18:00', '19:00'];
  
  // O tarihte alınmış randevuları getir
  db.all("SELECT saat FROM randevular WHERE tarih = ? AND durum = 'aktif'", [tarih], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const alinmisSaatler = rows.map(row => row.saat);
    const bosSaatler = musaitSaatler.filter(saat => !alinmisSaatler.includes(saat));
    
    res.json(bosSaatler);
  });
});

// Galeri API'leri

// Tüm galeri resimlerini getir
app.get('/api/gallery', (req, res) => {
  db.all("SELECT * FROM gallery ORDER BY upload_date DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    const images = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      url: `/uploads/${row.filename}`,
      uploadDate: row.upload_date
    }));
    
    res.json(images);
  });
});

// Galeri resmi yükle (admin)
app.post('/api/admin/gallery/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Resim dosyası gerekli' });
  }
  
  const { title, description } = req.body;
  
  if (!title) {
    // Dosyayı sil
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Başlık gerekli' });
  }
  
  db.run(
    "INSERT INTO gallery (title, description, filename, original_name) VALUES (?, ?, ?, ?)",
    [title, description || '', req.file.filename, req.file.originalname],
    function(err) {
      if (err) {
        // Dosyayı sil
        fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({ 
        id: this.lastID,
        message: 'Resim başarıyla yüklendi',
        url: `/uploads/${req.file.filename}`
      });
    }
  );
});

// Galeri resmi sil (admin)
app.delete('/api/admin/gallery/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // Önce dosya bilgisini al
  db.get("SELECT filename FROM gallery WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Resim bulunamadı' });
      return;
    }
    
    // Veritabanından sil
    db.run("DELETE FROM gallery WHERE id = ?", [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Dosyayı sil
      const filePath = path.join(__dirname, 'uploads', row.filename);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Dosya silme hatası:', err);
        }
      });
      
      res.json({ message: 'Resim başarıyla silindi' });
    });
  });
});

// React uygulamasını serve et
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Veritabanı bağlantısı kapatıldı');
    process.exit(0);
  });
});
