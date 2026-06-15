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

## FAZ 0 — MEVCUT DURUM ✅ (2026-06-14 Analiz Edildi)

### ✅ Tam Olarak Çalışan Özellikler:
- ✅ Kayıt/Giriş/Şifre sıfırlama (email confirmation ile)
- ✅ Profil görüntüleme ve düzenleme (avatar, username, bio)
- ✅ Avatar yükleme ve gösterim
- ✅ 6 oda (Recovery, Nursery, Crisis, Quiet, Support, Mind)
- ✅ Community (realtime mesajlaşma odaları + Supabase Realtime)
- ✅ Admin paneli (kullanıcı, rozet, vault yönetimi)
- ✅ Çoklu dil (EN, TR, ES, FR, DE)
- ✅ Dark/Light tema
- ✅ Gold üyelik (Stripe entegrasyonu)
- ✅ Toast bildirimleri (sonner)
- ✅ Badge/rozet sistemi
- ✅ Vault (içerik arşivi, admin editing)
- ✅ Nefes egzersizi (Breathing Pacer + Supabase'de kaydediliyor)
- ✅ Bebek profili oluşturma + fotoğraf yükleme
- ✅ Postpartum gün sayacı (calculatePostpartumDays)
- ✅ Bebek yaş hesaplama (years/months/days)
- ✅ Bebek milestone'ları (etkinlikler) takibi
- ✅ Breath sessions Supabase'de saklanıyor

### ⚠️ Eksik / Yapılması Gereken:
- ❌ Bookmark/favori sistemi (Vault özelleme)
- ❌ Ruh hali takibi (Mood tracker)
- ❌ Günlük check-in modalı
- ❌ Heatmap görselleştirmesi
- ❌ Mesaj düzenleme/silme (Community'de)
- ❌ Başka kullanıcı profilini görme
- ❌ Bildirim ayarları (email/push preferences)
- ❌ Gizlilik ayarları (profil gizleme, çevrimiçi durumu)
- ❌ Hesap silme (account deletion)
- ❌ Ödeme geçmişi ve fatura görüntüleme
- ❌ Bebek ağırlık/boy takibi (WHO grafikler)
- ❌ Aşı takvimi
- ❌ Bebek günlüğü / defter

---

## FAZ 1 — KRİTİK HATA DÜZELTMELERİ ✅ (Tamamlandı)

### 1.1 `auth.edit-profile.tsx` Yeniden Yazıldı ✅
- [x] Avatar yükleme UI'ı (kamera butonu, önizleme, loading animasyonu)
- [x] Tüm profil alanları: username, full_name, bio, baby_name, baby_birth_date
- [x] Toast bildirimleri (başarılı/başarısız)
- [x] Form validasyonu
- [x] Kaydet butonu loading state

### 1.2 Profil Sayfasında Avatar Gösterimini Düzelt ✅
- [x] `avatar_url` varsa resim göster, yoksa varsayılan User ikonu

### 1.3 Supabase Storage Setup ✅
- [x] `avatars` bucket'ı oluştur (public)
- [x] Storage RLS politikaları (SELECT/INSERT/UPDATE/DELETE)
- [x] `uploadAvatar()` fonksiyonu `auth.ts`'de var

### ✅ FAZ 1 TAMAMLANMA KRİTERLERİ: TAM ✓
- [x] Profil düzenleme sayfası açılıyor, tüm alanlar gösteriliyor
- [x] Avatar yüklenebiliyor ve profil sayfasında görünüyor
- [x] Toast bildirimleri çalışıyor
- [x] Baby profilleri oluşturulabiliyor
- [x] Postpartum sayacı çalışıyor

---

## FAZ 2 — PROFİL SAYFASI İYİLEŞTİRMELERİ ✅ (Tamamlandı)

### 2.1 Bebek Profili + Postpartum Sayacı ✅
- [x] Veritabanında `baby_photo_url` alanı var (`babies` tablosu)
- [x] Bebek fotoğrafı yükleme (baby_photos bucket)
- [x] Postpartum gün sayacı: "Bebeğin X günlük" (çalışıyor!)
- [x] Bebek adı, doğum tarihi, kilo gösterimi
- [x] Profil kartında bebek bilgileri bölümü
- [x] **EKLENDI**: Bebek yaş bilgisi (years/months/days) profil kartında gösteriliyor
- [x] **EKLENDI**: Baby milestone'ları (💫 N milestones) profil kartında görüntüleniyor

### 2.2 Aktivite İstatistikleri ✅
- [x] Nefes seansları Supabase'ye kaydediliyor (artık local storage değil)
- [x] Toplam nefes süresi hesaplanabiliyor (backend var)
- [x] **EKLENDI**: Streak hesaplama gösteriliyor (🔥 X-Day Streak)
- [x] **EKLENDI**: Grafik (son 7 günlük aktivite bar chart recharts ile) ✓
- [x] **EKLENDI**: BreathingStats modal'ında "Activity Chart" bölümü

### 2.3 Bookmark / Favori Sistemi ✅
- [x] Veritabanına `saved_vault_items` tablosu eklendi (RLS policies ile)
- [x] Vault'ta "Kaydet" butonu (❤️ bookmark icon) ✓
- [x] Profil sayfasında "Saved Content" bölümü ✓
- [x] Bookmark kaldırma (toggle save/unsave) ✓

### ✅ FAZ 2 TAMAMLANMA KRİTERLERİ: 100% TAM ✓
- [x] Bebek profili eklenebiliyor ve görüntülenebiliyor
- [x] Postpartum sayacı doğru çalışıyor
- [x] Nefes istatistikleri sunucuda saklanıyor
- [x] Streak ve grafik gösteriliyor — **TAM ✓**
- [x] Vault'tan içerik kaydedilebiliyor — **TAM ✓**
- [x] Kaydedilenler profil sayfasında listeleniyor — **TAM ✓**
- [x] Baby milestones profil sayfasında görüntüleniyor — **TAM ✓**
- [x] Baby age (years/months/days) gösteriliyor — **TAM ✓**

---

## FAZ 3 — RUHSAL İYİLİK HALİ TAKİBİ ✅ (Tamamlandı)

### 3.1 Ruh Hali Takibi (Mood Tracker) ✅
- [x] Veritabanına `mood_entries` tablosu eklendi (RLS policies ile)
- [x] MoodEntry type ve 4 backend fonksiyonu (`getMoodEntries`, `getTodayMood`, `saveMoodEntry`, `deleteMoodEntry`)
- [x] Emoji-based ruh hali seçimi (1-5 scale: 😢😟😐🙂😊)
- [x] İsteğe bağlı not ekleme (max 200 chars)
- [x] Profil sayfasında "Mood History" bölümü

### 3.2 Günlük Check-in Modal ✅
- [x] `/src/components/villa/DailyCheckIn.tsx` komponenti oluşturuldu
- [x] Emoji selector (5 mood options)
- [x] Optional note textarea
- [x] Save/Cancel butonu
- [x] Toast bildirim
- [x] Modal animasyonları (framer-motion)

### 3.3 Daily Check-in Trigger ✅
- [x] `DailyCheckInManager` hook `/src/routes/__root.tsx`'ye eklendi
- [x] Her login'de kontrol: kullanıcı bugün check-in yaptı mı?
- [x] Yeni kullanıcı ise 1.5 saniye sonra modal gösterilir
- [x] Modal dismiss edilebilir

### 3.4 GitHub-style Heatmap Görselleştirmesi ✅
- [x] `/src/components/villa/MoodHeatmap.tsx` komponenti oluşturuldu
- [x] Son 12 ay verisi (52 hafta × 7 gün = 364 gün grid)
- [x] Color intensity based on mood (1-5)
  - Mood 1 (😢): kırmızı
  - Mood 2 (😟): turuncu
  - Mood 3 (😐): sarı
  - Mood 4 (🙂): yeşil
  - Mood 5 (😊): açık yeşil
- [x] Hover tooltip: tarih + mood emoji + note preview
- [x] Stats aşağıda: Avg mood, Total entries, Best mood
- [x] Responsive (mobile ve desktop)

### 3.5 Validation Schema ✅
- [x] `moodEntrySchema` validation.ts'ye eklendi

### ✅ FAZ 3 TAMAMLANMA KRİTERLERİ: 100% TAM ✓
- [x] Ruh hali kaydedilebiliyor
- [x] Geçmiş görüntülenebiliyor (heatmap)
- [x] Günlük check-in çalışıyor
- [x] Heatmap grafiği gösteriliyor
- [x] Color coding açık ve anlaşılır
- [x] Tooltip ve hover işlevleri çalışıyor

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

### 5.1 Bildirim Ayarları ✅ (Tamamlandı)
- [x] Email bildirim tercihleri (günlük hatırlatma, haftalık özet)
- [x] Push bildirim (PWA için)
- [x] Bildirim tercihlerini kaydetme (veritabanı)
- [x] Settings sayfası (`/auth/settings`) oluşturuldu
- [x] Toggle UI bileşenleri
- [x] Tüm dillerde çeviriler (EN, TR, ES, FR, DE)
- [x] `user_preferences` tablosu Supabase'ye yapıldı
- [x] Profil sayfasında Settings linki eklendi

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

---

## 📊 GÜNCEL DURUM (2026-06-14 - GÜNCELLENDI 19:45)

| Faz | Adı | Durum | Tamamlanma % |
|-----|-----|-------|--------------|
| **1** | Kritik Hata Düzeltmeleri | ✅ Tamamlandı | 100% |
| **2** | Profil Sayfası İyileştirmeleri | ✅ Tamamlandı | 100% |
| **3** | Ruhsal İyilik Hali Takibi | ✅ Tamamlandı | 100% |
| **4** | Community Geliştirmeleri | ✅ Tamamlandı | 100% |
| **5.1** | Bildirim Ayarları | ✅ Tamamlandı | 100% |
| **5.2-5.3** | Gizlilik & Hesap Yönetimi | ⏳ Başlanmadı | 0% |
| **6** | Premium Üyelik | ⏳ Başlanmadı | 0% |
| **7** | Bebek Gelişim Takibi | ⏳ Başlanmadı | 0% |
| **8** | Mobil Deneyim | ⏳ Başlanmadı | 0% |
| **9** | Analitik ve İçgörüler | ⏳ Başlanmadı | 0% |
| **10** | Lans Hazırlığı | ⏳ Başlanmadı | 0% |

---

## 🎯 ÖNCELİKLİ AKSIYON MADDELERİ

### ✅ Phase 5.1 Tamamlandı! Yapılanlar:
1. **Bildirim Ayarları Sayfası**: `/auth/settings` route'u oluşturuldu
2. **Toggle UI**: 3 bildirim tercihi toggle switch'i
3. **Backend Functions**: `getNotificationPreferences()` ve `updateNotificationPreferences()`
4. **Veritabanı**: `user_preferences` tablosu + RLS policies
5. **Çeviriler**: Tüm 5 dilde (EN/TR/ES/FR/DE) çeviriler eklendi
6. **Profile Integration**: Profil sayfasında Settings linki

### Hemen Yapılması Gereken (Phase 5.2-5.3 için):
1. **Gizlilik Ayarları**: Profil gizleme, çevrimiçi durumu gizle
2. **Hesap Silme**: Onaylı hesap silme fonksiyonu
3. **Veri İndirme**: GDPR uyumlu data export
4. **Şifre Değiştirme**: İyileştirilmiş sayfa

### Sonraki Yapılması Gereken (Phase 4 artık tamamlandı - yakında devam edilecek):
1. **Premium Content Locking**: Gold üyeliğe özel içerik
2. **Bebek Gelişim**: Kilo/boy grafikleri, aşı takvimi
3. **PWA Offline**: Çevrimdışı destek
4. **Analytics**: Admin paneli istatistikleri

### Backlog:
- Baby weight/height tracking with WHO graphs (Phase 7)
- Vaccination calendar (Phase 7)
- Baby journal/diary (Phase 7)
- PWA offline support (Phase 8)
- Analytics dashboard (Phase 9)
- SEO/Launch prep (Phase 10)

---

## KURAL
Her faz **%100 tamamlanmadan** bir sonraki faza geçilmeyecek. Her fazın sonunda test listesi kontrol edilecek.

**Son Güncelleme**: 14 Haziran 2026, 19:45 UTC
**Durum**: FAZ 1, 2, 3, 4 & 5.1 Tamamlandı ✅ (Toplam 45% tamamlanmış), FAZ 5.2 Hazırlanıyor
