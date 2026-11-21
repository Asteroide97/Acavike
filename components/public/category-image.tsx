"use client";

import Image from "next/image";
import { useState } from "react";
import { CATEGORY_IMAGE_PLACEHOLDER, categoryImageUrl } from "@/lib/category-images";

export function CategoryImage({ imageUrl, name, className = "", sizes = "160px" }: {
  imageUrl?: string | null; name: string; className?: string; sizes?: string;
}) {
  const safe = categoryImageUrl(imageUrl) || CATEGORY_IMAGE_PLACEHOLDER;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return <span className={`relative block shrink-0 overflow-hidden rounded border border-slate-200 bg-white ${className}`}>
    <Image src={failedUrl === safe ? CATEGORY_IMAGE_PLACEHOLDER : safe} alt={name} fill sizes={sizes} className="object-contain p-1.5" unoptimized={safe.endsWith(".svg")} onError={() => setFailedUrl(safe)} />
  </span>;
}
