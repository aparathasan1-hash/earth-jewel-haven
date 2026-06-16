import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { LegalLayout, type LegalSection } from "@/components/villa/LegalLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — The Villageless Mama" },
      { name: "description", content: "The terms that govern your use of The Villageless Mama." },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

const UPDATED = "2026-06-15";

const TR: LegalSection[] = [
  { heading: "1. Kabul", paragraphs: ["The Villageless Mama'yı (\"uygulama\") kullanarak bu Kullanım Şartları'nı kabul etmiş olursun. Kabul etmiyorsan uygulamayı kullanma."] },
  { heading: "2. Kimler kullanabilir", paragraphs: ["Uygulamayı kullanmak için en az 18 yaşında olmalısın. Hesabının güvenliğinden ve hesabın altında gerçekleşen tüm etkinlikten sen sorumlusun."] },
  { heading: "3. Sağlık sorumluluk reddi", paragraphs: ["Uygulamadaki içerik, büyüme grafikleri, persentiller, AI asistan yanıtları ve uzman paylaşımları yalnızca bilgilendirme amaçlıdır ve tıbbi tavsiye, tanı veya tedavi yerine geçmez. Sağlığınla veya bebeğinle ilgili kararlar için her zaman yetkili bir sağlık profesyoneline danış. Acil durumda yerel acil hizmetleri ara."] },
  { heading: "4. Kullanıcı içeriği ve canlı yayın", paragraphs: ["Paylaştığın gönderiler, mesajlar ve canlı yayınlardan sen sorumlusun. Yasa dışı, zararlı, taciz edici, nefret içeren, müstehcen veya başkalarının haklarını ihlal eden içerik yasaktır. Canlı yayın açarak Topluluk Kuralları'nı kabul edersin; yayınların denetlenebilir ve yöneticiler tarafından sonlandırılabilir.", "İçeriğinin sahibi sensin; ancak uygulamayı işletmek için bu içeriği barındırmamıza ve göstermemize izin verirsin."] },
  { heading: "5. Uzman doğrulama", paragraphs: ["\"Doğrulanmış uzman\" rozeti, gönderilen belgelerin incelenmesine dayanır ve bir onay/tavsiye veya sağlık hizmeti garantisi değildir. Uzmanların paylaşımları kendi görüşleridir; doğruluğundan veya sonuçlarından uygulama sorumlu değildir."] },
  { heading: "6. Üyelik ve ödemeler", paragraphs: ["Bazı özellikler ücretli (Gold) üyelik gerektirebilir. Ödemeler üçüncü taraf ödeme sağlayıcısı (Stripe) üzerinden işlenir. Abonelik koşulları satın alma sırasında belirtilir."] },
  { heading: "7. Yasaklı kullanım", paragraphs: ["Uygulamayı kötüye kullanamaz, tersine mühendislik yapamaz, otomatik araçlarla aşırı yük bindiremez veya başkalarının deneyimini bozamazsın."] },
  { heading: "8. Sonlandırma", paragraphs: ["Bu şartları ihlal etmen halinde hesabını askıya alabilir veya kapatabiliriz. Hesabını istediğin zaman Ayarlar'dan silebilirsin."] },
  { heading: "9. Sorumluluğun sınırlandırılması", paragraphs: ["Uygulama \"olduğu gibi\" sağlanır. Yürürlükteki yasaların izin verdiği azami ölçüde, uygulamanın kullanımından doğan dolaylı zararlardan sorumlu değiliz."] },
  { heading: "10. Değişiklikler ve iletişim", paragraphs: ["Bu şartları zaman zaman güncelleyebiliriz; önemli değişiklikleri uygulama içinde bildiririz. Sorular için: fatihese94@gmail.com"] },
];

const EN: LegalSection[] = [
  { heading: "1. Acceptance", paragraphs: ["By using The Villageless Mama (the \"app\") you agree to these Terms of Service. If you do not agree, do not use the app."] },
  { heading: "2. Who can use it", paragraphs: ["You must be at least 18 years old to use the app. You are responsible for keeping your account secure and for all activity under it."] },
  { heading: "3. Health disclaimer", paragraphs: ["Content, growth charts, percentiles, AI assistant replies and expert posts are for information only and are not a substitute for medical advice, diagnosis or treatment. Always consult a qualified health professional for decisions about you or your baby. In an emergency, call your local emergency services."] },
  { heading: "4. User content & live streaming", paragraphs: ["You are responsible for the posts, messages and live streams you share. Illegal, harmful, harassing, hateful, obscene content, or content that infringes others' rights is prohibited. By going live you agree to the Community Guidelines; streams may be moderated and ended by admins.", "You own your content, but you grant us permission to host and display it to operate the app."] },
  { heading: "5. Expert verification", paragraphs: ["The \"verified expert\" badge is based on review of submitted credentials and is not an endorsement or a guarantee of care. Experts' posts are their own opinions; the app is not responsible for their accuracy or outcomes."] },
  { heading: "6. Membership & payments", paragraphs: ["Some features may require a paid (Gold) membership. Payments are processed by a third-party provider (Stripe). Subscription terms are shown at purchase."] },
  { heading: "7. Prohibited use", paragraphs: ["You may not misuse the app, reverse engineer it, overload it with automated tools, or disrupt others' experience."] },
  { heading: "8. Termination", paragraphs: ["We may suspend or close your account if you breach these terms. You can delete your account anytime from Settings."] },
  { heading: "9. Limitation of liability", paragraphs: ["The app is provided \"as is\". To the maximum extent permitted by law, we are not liable for indirect damages arising from your use of the app."] },
  { heading: "10. Changes & contact", paragraphs: ["We may update these terms occasionally and will notify you of material changes in the app. Questions: fatihese94@gmail.com"] },
];

function TermsPage() {
  const lang = useLang();
  const tr = lang === "tr";
  return (
    <LegalLayout
      eyebrow={tr ? "Ana sayfa" : "Home"}
      title={tr ? "Kullanım Şartları" : "Terms of Service"}
      updated={(tr ? "Son güncelleme: " : "Last updated: ") + UPDATED}
      sections={tr ? TR : EN}
      footer={
        tr
          ? "Bu metin genel bilgilendirme amaçlıdır ve hukuki danışmanlık değildir. Yargı bölgenize göre bir avukatça gözden geçirilmesi önerilir."
          : "This text is for general information and is not legal advice. Review by a lawyer for your jurisdiction is recommended."
      }
    />
  );
}
