import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { LegalLayout, type LegalSection } from "@/components/villa/LegalLayout";

export const Route = createFileRoute("/data-policy")({
  head: () => ({
    meta: [
      { title: "Privacy & Data Policy — The Villageless Mama" },
      { name: "description", content: "What data we collect, why, and your rights (GDPR/KVKK)." },
    ],
    links: [{ rel: "canonical", href: "/data-policy" }],
  }),
  component: DataPolicyPage,
});

const UPDATED = "2026-06-15";

const TR: LegalSection[] = [
  { heading: "Hangi verileri topluyoruz", paragraphs: ["Hesap bilgileri (e-posta, kullanıcı adı, profil), senin eklediğin içerik (paylaşımlar, mesajlar, ruh hali kayıtları, bebek profili, büyüme ölçümleri, beslenme/uyku kayıtları) ve uygulamayı çalıştırmak için gerekli teknik veriler. Yalnızca senin eklediğin veriyi işleriz; üçüncü taraf reklam takibi yapmayız."] },
  { heading: "Neden işliyoruz", paragraphs: ["Verini yalnızca sana hizmeti sunmak için kullanırız: profilini göstermek, takip özelliklerini sağlamak, topluluğu işletmek ve güvenliği korumak. Verini reklam için satmayız."] },
  { heading: "Hassas veriler", paragraphs: ["Ruh hali, bebek ve sağlıkla ilgili kayıtlar hassas kabul edilir ve varsayılan olarak özel tutulur (yalnızca sen görürsün; gizlilik ayarlarından paylaşımı sen kontrol edersin). Uzman doğrulama belgeleri özel depolanır ve yalnızca inceleme ekibi erişebilir."] },
  { heading: "Saklama ve barındırma", paragraphs: ["Veriler güvenli altyapı sağlayıcımız (Supabase) üzerinde, satır düzeyi güvenlik (RLS) ile yalnız sana erişilebilecek şekilde saklanır. Ödemeler Stripe tarafından işlenir; kart bilgilerini biz saklamayız."] },
  { heading: "Haklarının (KVKK/GDPR)", paragraphs: ["Verilerine erişme, düzeltme ve silme hakkın vardır. Ayarlar → Hesap bölümünden tüm verini JSON olarak indirebilir ve hesabını (tüm verinle birlikte) kalıcı olarak silebilirsin. İstersen e-posta ile de talep edebilirsin."] },
  { heading: "Çerezler", paragraphs: ["Yalnızca oturumunu açık tutmak ve tercihlerini (tema, dil) hatırlamak için gerekli yerel depolama/çerezleri kullanırız. Reklam veya üçüncü taraf izleme çerezi kullanmayız."] },
  { heading: "Çocuklar", paragraphs: ["Uygulama yetişkinlere yöneliktir (18+). Bebeğine ait eklediğin bilgiler senin ebeveyn sorumluluğundadır ve varsayılan olarak özeldir."] },
  { heading: "İletişim", paragraphs: ["Gizlilikle ilgili talep ve sorular için: fatihese94@gmail.com"] },
];

const EN: LegalSection[] = [
  { heading: "What we collect", paragraphs: ["Account info (email, username, profile), content you add (posts, messages, mood entries, baby profile, growth measurements, feeding/sleep logs), and technical data needed to run the app. We only process data you add; we do not run third-party ad tracking."] },
  { heading: "Why we process it", paragraphs: ["We use your data only to provide the service to you: showing your profile, enabling tracking features, running the community, and keeping it safe. We do not sell your data for advertising."] },
  { heading: "Sensitive data", paragraphs: ["Mood, baby and health-related records are treated as sensitive and kept private by default (only you see them; you control sharing in privacy settings). Expert verification documents are stored privately and accessible only to the review team."] },
  { heading: "Storage & hosting", paragraphs: ["Data is stored on our secure infrastructure provider (Supabase) with row-level security (RLS) so only you can access it. Payments are processed by Stripe; we do not store card details."] },
  { heading: "Your rights (GDPR/KVKK)", paragraphs: ["You have the right to access, correct and delete your data. From Settings → Account you can download all your data as JSON and permanently delete your account (with all your data). You may also request this by email."] },
  { heading: "Cookies", paragraphs: ["We use only the local storage/cookies needed to keep you signed in and remember your preferences (theme, language). We do not use advertising or third-party tracking cookies."] },
  { heading: "Children", paragraphs: ["The app is for adults (18+). Information you add about your baby is under your parental responsibility and is private by default."] },
  { heading: "Contact", paragraphs: ["For privacy requests and questions: fatihese94@gmail.com"] },
];

function DataPolicyPage() {
  const lang = useLang();
  const tr = lang === "tr";
  return (
    <LegalLayout
      eyebrow={tr ? "Ana sayfa" : "Home"}
      title={tr ? "Gizlilik ve Veri Politikası" : "Privacy & Data Policy"}
      updated={(tr ? "Son güncelleme: " : "Last updated: ") + UPDATED}
      sections={tr ? TR : EN}
      footer={
        tr
          ? "Bu metin genel bilgilendirme amaçlıdır ve hukuki danışmanlık değildir."
          : "This text is for general information and is not legal advice."
      }
    />
  );
}
