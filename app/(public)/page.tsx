import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { ArrowRight, ClipboardCheck, Package, Warehouse } from "lucide-react";
import { getHomepageData } from "@/lib/site";
import { CategoryImage } from "@/components/public/category-image";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

const categories = [
  { slug: "empaque", label: "Empaque", aliases: [] },
  { slug: "abrasivos", label: "Abrasivos", aliases: [] },
  { slug: "equipo-de-seguridad", label: "Equipo de Seguridad", aliases: ["seguridad-industrial"] },
  { slug: "herramienta", label: "Herramienta Neumática", aliases: ["herramientas-herramientas-neumaticas", "herramientas"] },
  { slug: "tornilleria", label: "Tornillería", aliases: [] },
];

const steps = [
  { Icon: Warehouse, label: <>Material en<br />tu planta</> },
  { Icon: ClipboardCheck, label: <>Conteo cada<br />semana</> },
  { Icon: Package, label: <>Resurtido<br />programado</> },
];

export default async function HomePage() {
  noStore();
  const data = await getHomepageData().catch(() => null);
  const available = data?.categories ?? [];

  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <h1 id="home-title">Todo para tu planta.<br />En un solo lugar.</h1>
          <p>Encuentra tus consumibles y solicita una cotización</p>
          <div className={styles.actions}>
            <Link href="/catalogo" className={styles.primary}>Explorar Catálogo</Link>
            <Link href="/cotizacion-rapida" className={styles.secondary}>Enviar lista de materiales</Link>
          </div>
        </div>
        <div className={styles.heroPhoto} role="img" aria-label="Abrasivos, película stretch, herramientas neumáticas y consumibles industriales" />
      </section>

      <section className={styles.categories} aria-label="Categorías de suministros">
        <div className={styles.categoryGrid}>
          {categories.map((category) => {
            const selected = available.find(item => item.slug === category.slug)
              || category.aliases.flatMap(slug => available.filter(item => item.slug === slug))[0];
            return (
            <Link
              key={category.slug}
              href={selected ? `/catalogo/${selected.slug}` : "/catalogo"}
              className={styles.category}
            >
              <CategoryImage imageUrl={selected?.imageUrl} name={category.label} className={styles.categoryPhoto} sizes="(max-width: 760px) 45vw, 220px" />
              <span className={styles.categoryLabel}>{category.label}</span>
            </Link>
          ); })}
        </div>
        <div className={styles.categoryLinks}>
          <Link href="/catalogo">Compra por categoría</Link>
          <Link href="/contacto">Contacto empresarial</Link>
        </div>
      </section>

      <section className={styles.consignation} aria-labelledby="inventory-title">
        <div className={styles.consignationInner}>
          <div className={styles.inventoryCopy}>
            <h2 id="inventory-title">Quedarte sin inventario<br />no es opción.</h2>
            <p>Inventario en consigna dentro de tu planta.<br />Pagas lo que consumes y coordinamos el resurtido.</p>
          </div>
          <div className={styles.steps} aria-label="Proceso de inventario en consignación">
            {steps.map(({ Icon, label }, index) => (
              <div className={styles.stepGroup} key={index}>
                {index > 0 ? <ArrowRight className={styles.arrow} aria-hidden="true" /> : null}
                <div className={styles.step}>
                  <Icon strokeWidth={1.25} aria-hidden="true" />
                  <p>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.contactBand} aria-label="Contacto comercial">
        <div className={styles.contactInner}>
          <div>
            <p className={styles.contactTitle}>¿Listo para que nunca te falte material?</p>
            <p className={styles.contactSubtitle}>Cotiza tus consumibles con nuestro equipo.</p>
          </div>
          <Link href="/contacto" className={styles.contactCta}>Contactar ventas <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
}
