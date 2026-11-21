import { cn } from "@/lib/utils";
import { BRAND_LOGO_ALT, BRAND_LOGO_HEIGHT, BRAND_LOGO_URL, BRAND_LOGO_WIDTH } from "@/lib/brand";

export function BrandLogo({ className, tone = "blue" }: { className?: string; tone?: "blue" | "white" }) {
  return (
    <span role="img" aria-label={BRAND_LOGO_ALT} data-brand-logo={tone} className={cn("inline-block max-w-full shrink-0", className)}>
      <span
        className="block w-full"
        style={{
          aspectRatio: `${BRAND_LOGO_WIDTH} / ${BRAND_LOGO_HEIGHT}`,
          backgroundColor: tone === "white" ? "#ffffff" : "var(--brand-blue)",
          // Luminance uses the original lettering as a mask without editing its pixels.
          maskImage: `url("${BRAND_LOGO_URL}")`,
          maskMode: "luminance",
          maskSize: "contain",
          maskPosition: "center",
          maskRepeat: "no-repeat",
        }}
      />
    </span>
  );
}
