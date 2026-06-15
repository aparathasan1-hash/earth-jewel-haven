import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { LegalLayout, type LegalSection } from "@/components/villa/LegalLayout";

export const Route = createFileRoute("/community-guidelines")({
  head: () => ({
    meta: [
      { title: "Community Guidelines — The Villageless Mama" },
      { name: "description", content: "How we keep this a safe, kind space — including live streams." },
    ],
    links: [{ rel: "canonical", href: "/community-guidelines" }],
  }),
  component: GuidelinesPage,
});

const UPDATED = "2026-06-15";

const TR: LegalSection[] = [
  { heading: "Burası sakin bir sığınak", paragraphs: ["The Villageless Mama, lohusa dönemindeki annelerin nazikçe desteklendiği bir alandır. Birbirimize şefkatle davranırız. Aşağıdaki kurallar tüm odalar, paylaşımlar, mesajlar ve canlı yayınlar için geçerlidir."] },
  { heading: "Nazik ol", paragraphs: ["Taciz, zorbalık, aşağılama, nefret söylemi ve ayrımcılık yasaktır. Anlaşmazlıkta bile saygılı kal. Tıbbi tavsiye dayatma; deneyimini paylaş ama profesyonel yardımın yerini tutmadığını unutma."] },
  { heading: "Güvenliği koru", paragraphs: ["Kendine veya bir başkasına zarar verme, intihar teşviki, tehlikeli \"tavsiyeler\" ve kriz anlarını istismar yasaktır. Birinin risk altında olduğunu görürsen bildir. Kriz anında yerel acil hatları ara."] },
  { heading: "Canlı yayın kuralları", paragraphs: ["Canlı yayında çıplaklık, cinsel içerik, şiddet, yasa dışı faaliyet, başkalarını rızası olmadan gösterme ve reşit olmayanları riske atma kesinlikle yasaktır.", "Yayıncılar sohbeti denetlemekten sorumludur. Yöneticiler herhangi bir yayını uyarı yapmadan sonlandırabilir. Kuralların ciddi ihlali hesabın kapatılmasına yol açar."] },
  { heading: "Mahremiyete saygı", paragraphs: ["Başkalarının kişisel bilgilerini (adres, telefon, özel fotoğraf) izinsiz paylaşma. Bebeğinin veya başkasının görüntüsünü paylaşırken dikkatli ol."] },
  { heading: "Spam ve sömürü yok", paragraphs: ["İstenmeyen reklam, dolandırıcılık, sahte uzmanlık iddiası ve para/duygu sömürüsü yasaktır. Uzman rozeti yalnızca doğrulanmış belgelerle verilir."] },
  { heading: "Bildir ve destek al", paragraphs: ["Her yayında ve içerikte bildir butonu vardır. Bildirimlerin gizli tutulur. Bir kuralı çiğneyen içeriği gördüğünde bildir; ekibimiz inceler.", "Sorular ve ciddi durumlar için: fatihese94@gmail.com"] },
];

const EN: LegalSection[] = [
  { heading: "This is a calm sanctuary", paragraphs: ["The Villageless Mama is a space where postpartum mothers are supported gently. We treat each other with kindness. These rules apply to all rooms, posts, messages and live streams."] },
  { heading: "Be kind", paragraphs: ["Harassment, bullying, shaming, hate speech and discrimination are not allowed. Stay respectful even in disagreement. Don't push medical advice; share your experience but remember it isn't a substitute for professional help."] },
  { heading: "Keep it safe", paragraphs: ["Self-harm or harm to others, encouragement of suicide, dangerous \"advice\", and exploitation of someone in crisis are prohibited. If you see someone at risk, report it. In a crisis, call your local emergency lines."] },
  { heading: "Live streaming rules", paragraphs: ["In live streams, nudity, sexual content, violence, illegal activity, showing others without consent, and putting minors at risk are strictly prohibited.", "Broadcasters are responsible for moderating their chat. Admins may end any stream without warning. Serious violations lead to account closure."] },
  { heading: "Respect privacy", paragraphs: ["Don't share others' personal information (address, phone, private photos) without permission. Be careful when sharing images of your baby or others."] },
  { heading: "No spam or exploitation", paragraphs: ["Unsolicited ads, scams, false claims of expertise, and financial or emotional exploitation are prohibited. The expert badge is granted only with verified credentials."] },
  { heading: "Report and get support", paragraphs: ["Every stream and post has a report button. Your reports are kept confidential. If you see content that breaks a rule, report it; our team reviews.", "For questions and serious matters: fatihese94@gmail.com"] },
];

function GuidelinesPage() {
  const lang = useLang();
  const tr = lang === "tr";
  return (
    <LegalLayout
      eyebrow={tr ? "Ana sayfa" : "Home"}
      title={tr ? "Topluluk Kuralları" : "Community Guidelines"}
      updated={(tr ? "Son güncelleme: " : "Last updated: ") + UPDATED}
      intro={
        tr
          ? "Bu alanı herkes için güvenli ve nazik tutmak hepimizin sorumluluğu."
          : "Keeping this space safe and kind is everyone's responsibility."
      }
      sections={tr ? TR : EN}
    />
  );
}
