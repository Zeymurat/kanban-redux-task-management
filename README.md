# Kanban Task Yönetim Uygulaması

Bu proje, React ve Redux kullanılarak geliştirilmiş bir Kanban tahtası uygulamasıdır. Kullanıcılar görevlerini sürükle-bırak yöntemiyle farklı sütunlar arasında taşıyabilir, yeni görevler ekleyebilir ve mevcut görevleri düzenleyebilirler.

## Özellikler

- **Görev Yönetimi**: Yeni görevler oluşturma, düzenleme ve silme
- **Sürükle-Bırak Arayüzü**: Görevleri sütunlar arasında kolayca taşıyabilme
- **Gerçek Zamanlı Senkronizasyon**: Firebase ile gerçek zamanlı veri senkronizasyonu
- **Duyarlı Tasarım**: Farklı ekran boyutlarına uyumlu arayüz
- **Kullanıcı Dostu Arayüz**: Temiz ve sezgisel kullanıcı deneyimi

## Teknoloji Yığını

- **Frontend**: React 18
- **State Yönetimi**: Redux Toolkit
- **Stil**: Tailwind CSS
- **Veritabanı**: Firebase Realtime Database
- **Paket Yöneticisi**: npm
- **Derleyici**: Vite

## Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone [repo-url]
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Firebase yapılandırması:
   - Firebase konsolundan kendi projenizi oluşturun
   - `src/firebase.js` dosyasına kendi Firebase konfigürasyon bilgilerinizi ekleyin

4. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```

## Klasör Yapısı

```
src/
├── components/     # React bileşenleri
├── redux/         # Redux store ve slice'lar
├── modals/        # Modal bileşenleri
├── hooks/         # Özel React hook'ları
├── utils/         # Yardımcı fonksiyonlar
└── assets/        # Statik dosyalar (resimler, ikonlar vb.)
```

## Kullanım

1. **Görev Ekleme**: "+" butonuna tıklayarak yeni görev ekleyebilirsiniz.
2. **Görev Taşıma**: Görevleri farklı sütunlara editleyebilirsiniz.
3. **Görev Düzenleme**: Görev kartına tıklayarak detaylarını görüntüleyip düzenleyebilirsiniz.
4. **Görev Silme**: Görev kartına tıklayarak detaylarını görüntüleyip düzenleyebilirsiniz ve "Delete" butonuna tıklayarak görevi silebilirsiniz.


**Not**: Bu uygulama eğitim amaçlı geliştirilmiştir.
