"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CATEGORY_IMAGE_PLACEHOLDER, categoryImageUrl } from "@/lib/category-images";
import styles from "./category-header.module.css";

export function CategoryHeader({ name, description, imageUrl, productCount, query }: {
  name: string; description?: string | null; imageUrl?: string | null; productCount: number; query: string;
}) {
  const source = categoryImageUrl(imageUrl);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const hasImage = Boolean(source && source !== CATEGORY_IMAGE_PLACEHOLDER && failedSource !== source);

  return <div data-category-hero data-has-image={hasImage} className={`${styles.hero} ${hasImage ? styles.withImage : ""}`}>
    <div className={styles.copy}>
      <p className={styles.kicker}>Suministros para tu empresa</p>
      <h1 className={styles.title}>{name}</h1>
      {description?.trim() ? <p className={styles.description}>{description}</p> : null}
      <p className={styles.count}>{productCount} {productCount === 1 ? "producto" : "productos"}{query ? ` para “${query}”` : ""}</p>
      <Link href="/cotizacion-rapida" className={`public-btn-outline ${styles.quote}`}>Cotización express</Link>
    </div>
    {hasImage && source ? <div className={styles.visual}>
      <Image src={source} alt={name} fill sizes="(max-width: 639px) 90vw, (max-width: 1023px) 42vw, 380px" className={styles.image} unoptimized={source.endsWith(".svg")} onError={() => setFailedSource(source)} />
    </div> : null}
  </div>;
}
