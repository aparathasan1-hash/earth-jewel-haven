import { useT } from "@/lib/i18n";

export function Logo() {
  const t = useT();
  return (
    <span className="flex items-center gap-3">
      <img
        src="/Amblem.jpg"
        alt={t("site.shortTitle")}
        className="h-10 w-auto object-contain"
      />
      <span className="hidden sm:inline font-serif text-sm text-foreground tracking-tight">
        {t("site.shortTitle")}
      </span>
    </span>
  );
}
