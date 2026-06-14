# 🌿 EARTH JEWEL HAVEN — Master Plan

## Vizyon
Postpartum anneler için dijital bir köy. Sessiz, reklamsız, şefkatli bir sığınak.

## Benchmark Platformlar (200K$+ seviyesi)
- **Peanut** (peanut.app) — $50M+ fon, anne sosyal ağı
- **What to Expect** (whattoexpect.com) — $10M+, hamilelik/postpartum rehber
- **Mush** (mushapp.com) — £2M+, yerel anne arkadaşlığı
- **Motherly** (mother.ly) — $3M+, anne medyası + community
- **The Bump** (thebump.com) — $5M+, hamilelik rehberi

---

## FAZ 0 — MEVCUT DURUM ✅ (Tamamlandı)

### Çalışan Özellikler:
- ✅ Kayıt/Giriş/Şifre sıfırlama (email confirmation dahil)
- ✅ Profil görüntüleme (avatar, username, bio, bebek bilgileri)
- ✅ Profil düzenleme + avatar yükleme
- ✅ 6 oda (Recovery, Nursery, Crisis, Quiet, Support, Mind)
- ✅ Nefes egzersizi (Breathing Pacer)
- ✅ Vault (içerik arşivi)
- ✅ Community (realtime mesajlaşma odaları)
- ✅ Admin paneli (kullanıcı, rozet, vault yönetimi)
- ✅ Çoklu dil (EN, TR, ES, FR, DE)
- ✅ Dark/Light tema
- ✅ Gold üyelik (Stripe altyapısı)
- ✅ Toast bildirimleri

### Eksikler / Hatalar:
- ✅ `auth.edit-profile.tsx` — Düzeltildi (tüm alanlar, avatar yükleme, toast bildirimleri)
- ❌ Bookmark/favori sistemi yok
- ❌ Bebek profili (fotoğraf + gelişim takibi) yok
- ❌ Ruh hali takibi yok
- ❌ Postpartum gün sayacı yok
- ❌ Bildirim ayarları yok
- ❌ Gizlilik ayarları yok
- ❌ Nefes seansları sadece local storage'da (sunucuya kaydedilmiyor tam olarak)
- ❌ Hesap silme butonu yok

---

## FAZ 1 — KRİTİK HATA DÜZELTMELERİ (Hemen Yapılacak)

### 1.1 `auth.edit-profile.tsx`'i Tamamen Yeniden Yaz ✅
- [x] Avatar yükleme UI'ı (kamera butonu, önizleme, loading animasyonu)
- [x] Tüm profil alanları: username, full_name, bio, baby_name, baby_birth_date
- [x] Toast bildirimleri (başarılı/başarısız)
- [x] Form validasyonu
- [x] Kaydet butonu loading state

### 1.2 Profil Sayfasında Avatar Gösterimini Düzelt ✅
- [x] `avatar_url` varsa resim göster, yoksa varsayılan User ikonu (zaten çalışıyordu)

### 1.3 Supabase Storage Setup ✅
- [x] `avatars` bucket'ı oluştur (public) — script ile yapılacak
- [x] Storage RLS politikaları (SELECT/INSERT/UPDATE/DELETE) — script ile yapılacak
- [x] `uploadAvatar()` fonksiyonunu `auth.ts`'ye ekle (zaten vardı)

### ✅ FAZ 1 TAMAMLANMA KRİTERLERİ:
- [x] Profil düzenleme sayfası açılıyor, tüm alanlar gösteriliyor
- [x] Avatar yüklenebiliyor ve profil sayfasında görünüyor
- [x] Toast bildirimleri çalışıyor

---

## FAZ 2 — PROFİL SAYFASI İYİLEŞTİRMELERİ

### 2.1 Bebek Profili + Postpartum Sayacı
- [ ] Veritabanına `baby_photo_url` alanı ekle (`profiles` tablosu)
- [ ] Bebek fotoğrafı yükleme (ayrı storage bucket)
- [ ] Postpartum gün sayacı: "Bebeğin X günlük" (doğum tarihinden itibaren)
- [ ] Bebek adı, doğum tarihi, kilo (isteğe bağlı) gösterimi
- [ ] Profil kartında bebek bilgileri bölümü

### 2.2 Aktivite İstatistikleri
- [ ] Nefes seanslarını sunucuya kaydet (şu an sadece local storage)
- [ ] Toplam nefes süresi (bugün, bu hafta, tüm zamanlar)
- [ ] Streak (art arda günler) hesaplama
- [ ] Basit grafik (son 7 günlük aktivite)
- [ ] Profil sayfasında "Aktivite" bölümü

### 2.3 Bookmark / Favori Sistemi
- [ ] Veritabanına `bookmarks` tablosu ekle
- [ ] Vault'ta "Kaydet" butonu (bookmark icon)
- [ ] Profil sayfasında "Kaydedilenler" bölümü
- [ ] Bookmark kaldırma

### ✅ FAZ 2 TAMAMLANMA KRİTERLERİ:
- [ ] Bebek profili eklenebiliyor ve görüntülenebiliyor
- [ ] Postpartum sayacı doğru çalışıyor
- [ ] Nefes istatistikleri sunucuda saklanıyor
- [ ] Streak ve grafik gösteriliyor
- [ ] Vault'tan içerik kaydedilebiliyor
- [ ] Kaydedilenler profil sayfasında listeleniyor

---

## FAZ 3 — RUHSAL İYİLİK HALİ TAKİBİ

### 3.1 Ruh Hali Takibi (Mood Tracker)
- [ ] Veritabanına `mood_entries` tablosu ekle
- [ ] Günlük ruh hali girişi (emoji-based: 😊😐😢😡😴)
- [ ] İsteğe bağlı kısa not ekleme
- [ ] Ruh hali geçmişi (takvim görünümü veya liste)
- [ ] Profil sayfasında "Ruh Halim" bölümü

### 3.2 Günlük Check-in
- [ ] Her gün ilk girişte check-in modal'ı
- [ ] "Bugün nasılsın?" sorusu + emoji seçimi
- [ ] Check-in geçmişi grafiği (heatmap)
- [ ] Bildirim hatırlatıcı (opsiyonel)

### ✅ FAZ 3 TAMAMLANMA KRİTERLERİ:
- [ ] Ruh hali kaydedilebiliyor
- [ ] Geçmiş görüntülenebiliyor
- [ ] Günlük check-in çalışıyor
- [ ] Heatmap grafiği gösteriliyor

---

## FAZ 4 — COMMUNITY GELİŞTİRMELERİ

### 4.1 Oda Detayları
- [ ] Oda açıklaması, oluşturulma tarihi, üye sayısı
- [ ] Oda sahibi etiketi
- [ ] Oda gizlilik ayarları (public/private)
- [ ] Odaya katılma/ayrılma

### 4.2 Mesajlaşma İyileştirmeleri
- [ ] Mesajlarda avatar gösterimi
- [ ] Mesaj düzenleme/silme (kendi mesajları)
- [ ] Okundu bildirimi
- [ ] Bildirim sesi
- [ ] Alıntı yaparak cevaplama

### 4.3 Kullanıcı Profili (Başkalarının Görünümü)
- [ ] Başka bir kullanıcının profiline tıklama
- [ ] Kullanıcının rozetleri, odaları, aktivitesi (sınırlı)
- [ ] Özel mesaj gönderme (opsiyonel)

### ✅ FAZ 4 TAMAMLANMA KRİTERLERİ:
- [ ] Oda detayları gösteriliyor
- [ ] Mesaj düzenleme/silme çalışıyor
- [ ] Avatar mesajlarda görünüyor
- [ ] Başka kullanıcı profili görüntülenebiliyor

---

## FAZ 5 — AYARLAR VE GİZLİLİK

### 5.1 Bildirim Ayarları
- [ ] Email bildirim tercihleri (günlük hatırlatma, haftalık özet)
- [ ] Push bildirim (PWA için)
- [ ] Bildirim tercihlerini kaydetme (veritabanı)

### 5.2 Gizlilik Ayarları
- [ ] Profili gizleme (başkaları göremesin)
- [ ] Çevrimiçi durumu gizleme
- [ ] Aktif odaları gizleme
- [ ] Profil görünürlük ayarları

### 5.3 Hesap Yönetimi
- [ ] Hesap silme butonu (onay adımı ile)
- [ ] Veri indirme (GDPR uyumlu)
- [ ] Şifre değiştirme (mevcut sayfa iyileştirilecek)
- [ ] Email değiştirme

### ✅ FAZ 5 TAMAMLANMA KRİTERLERİ:
- [ ] Bildirim tercihleri kaydedilebiliyor
- [ ] Gizlilik ayarları çalışıyor
- [ ] Hesap silme çalışıyor
- [ ] Veri indirme çalışıyor

---

## FAZ 6 — PREMIUM ÜYELİK VE ÖDEME

### 6.1 Gold Üyelik Yönetimi
- [ ] Ödeme geçmişi sayfası
- [ ] Fatura görüntüleme/indirme
- [ ] Plan değiştirme (Free → Gold, Gold → Free)
- [ ] İptal akışı

### 6.2 Premium İçerik Kilidi
- [ ] Gold üyelere özel vault içerikleri
- [ ] Gold üyelere özel odalar
- [ ] Premium rozetler
- [ ] Ödeme duvarı (paywall) UI'ı

### ✅ FAZ 6 TAMAMLANMA KRİTERLERİ:
- [ ] Ödeme akışı uçtan uca çalışıyor
- [ ] Premium içerik kilitlenebiliyor
- [ ] Fatura görüntülenebiliyor
- [ ] Plan değiştirme çalışıyor

---

## FAZ 7 — BEBEK GELİŞİM TAKİBİ

### 7.1 Bebek Büyüme Grafiği
- [ ] Kilo/boy takibi (veritabanı tablosu)
- [ ] WHO persentil grafikleri
- [ ] Bebek fotoğrafı albümü (zaman tüneli)
- [ ] Aşı takvimi

### 7.2 Bebek Günlüğü
- [ ] Günlük not ekleme (bebek için)
- [ ] Beslenme/uyku takibi (basit)
- [ ] Bebek milestone'ları (ilk gülümseme, ilk diş...)

### ✅ FAZ 7 TAMAMLANMA KRİTERLERİ:
- [ ] Kilo/boy kaydedilebiliyor ve grafik gösteriliyor
- [ ] Bebek fotoğrafı albümü çalışıyor
- [ ] Aşı takvimi gösteriliyor
- [ ] Bebek günlüğü çalışıyor

---

## FAZ 8 — MOBİL DENEYİM VE PERFORMANS

### 8.1 PWA İyileştirmeleri
- [ ] Offline destek (service worker)
- [ ] Push bildirimler
- [ ] Splash screen iyileştirmeleri
- [ ] manifest.json güncelleme

### 8.2 Performans Optimizasyonu
- [ ] Lazy loading (sayfalar ve bileşenler)
- [ ] Görsel optimizasyonu (webp, lazy loading)
- [ ] Bundle boyutu küçültme
- [ ] Lighthouse skoru iyileştirme (90+)

### 8.3 Erişilebilirlik
- [ ] ARIA etiketleri
- [ ] Klavye navigasyonu
- [ ] Ekran okuyucu uyumluluğu
- [ ] Renk kontrastı iyileştirmeleri

### ✅ FAZ 8 TAMAMLANMA KRİTERLERİ:
- [ ] PWA offline çalışıyor
- [ ] Lighthouse 90+ skor
- [ ] Ekran okuyucu ile kullanılabilir
- [ ] Bundle boyutu < 200KB (initial)

---

## FAZ 9 — ANALİTİK VE İÇGÖRÜLER

### 9.1 Kullanıcı İstatistikleri (Admin)
- [ ] Toplam kullanıcı sayısı
- [ ] Aktif kullanıcılar (günlük/haftalık/aylık)
- [ ] En popüler içerikler
- [ ] Kullanıcı davranış analizi

### 9.2 Kişisel İçgörüler
- [ ] "Bu hafta X dakika nefes aldın"
- [ ] "En sık ziyaret ettiğin oda: Y"
- [ ] "Ruh halin geçen haftaya göre Z"
- [ ] Haftalık özet email'i

### ✅ FAZ 9 TAMAMLANMA KRİTERLERİ:
- [ ] Admin panelinde istatistikler gösteriliyor
- [ ] Kişisel içgörüler profil sayfasında
- [ ] Haftalık özet email'i gönderiliyor

---

## FAZ 10 — LANS HAZIRLIĞI

### 10.1 SEO İyileştirmeleri
- [ ] Tüm sayfalar için meta etiketleri
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] Open Graph etiketleri
- [ ] Schema.org yapısal veri

### 10.2 Yasal Uyumluluk
- [ ] Gizlilik politikası sayfası (mevcut)
- [ ] Kullanım şartları sayfası
- [ ] Çerez politikası
- [ ] GDPR uyumluluğu

### 10.3 Test ve Kalite Güvencesi
- [ ] Tüm formların testi
- [ ] Mobil uyumluluk testi
- [ ] Tarayıcı uyumluluk testi
- [ ] Yük testi
- [ ] Güvenlik testi

### ✅ FAZ 10 TAMAMLANMA KRİTERLERİ:
- [ ] SEO puanı 95+
- [ ] Tüm yasal metinler hazır
- [ ] Testler geçiyor
- [ ] Canlıya alınabilir durumda

---

## 📊 ÖNCELİK SIRASI ÖZETİ

| Faz | Adı | Süre | Öncelik |
|-----|-----|------|---------|
| **1** | Kritik Hata Düzeltmeleri | 1-2 gün | 🔴 Kritik |
| **2** | Profil Sayfası İyileştirmeleri | 3-5 gün | 🔴 Kritik |
| **3** | Ruhsal İyilik Hali Takibi | 3-4 gün | 🟡 Yüksek |
| **4** | Community Geliştirmeleri | 4-5 gün | 🟡 Yüksek |
| **5** | Ayarlar ve Gizlilik | 3-4 gün | 🟡 Yüksek |
| **6** | Premium Üyelik | 5-7 gün | 🟢 Orta |
| **7** | Bebek Gelişim Takibi | 5-7 gün | 🟢 Orta |
| **8** | Mobil Deneyim | 4-5 gün | 🟢 Orta |
| **9** | Analitik ve İçgörüler | 3-4 gün | 🔵 Düşük |
| **10** | Lans Hazırlığı | 3-5 gün | 🔵 Düşük |

**Toplam Tahmini Süre:** 5-7 hafta (tam zamanlı)

---

## KURAL
Her faz **%100 tamamlanmadan** bir sonraki faza geçilmeyecek. Her fazın sonunda test listesi kontrol edilecek.
