import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/acavike-supplies-logo-trimmed.webp"
      alt="Acavike Supplies"
      width={870}
      height={580}
      priority={priority}
      className={cn("h-auto max-w-full object-contain", className)}
    />
  );
}
