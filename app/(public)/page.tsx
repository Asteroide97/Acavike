import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { ArrowRight, ClipboardCheck, Mail, MapPin, Package, Phone, Warehouse } from "lucide-react";
import { getHomepageData, getPublicContactDetails, getSiteSettingsMap } from "@/lib/site";
import styles from "./home.module.css";

export const dynamic = "force-dynamic";

const categories = [
  { slug: "empaque", label: "Empaque" },
  { slug: "abrasivos", label: "Abrasivos" },
  { slug: "equipo-de-seguridad", label: "Equipo de Seguridad" },
  { slug: "herramienta", label: "Herramienta Neumática" },
  { slug: "tornilleria", label: "Tornillería" },
];

const steps = [
  { Icon: Warehouse, label: <>Material en<br />tu planta</> },
  { Icon: ClipboardCheck, label: <>Conteo cada<br />semana</> },
  { Icon: Package, label: <>Resurtido<br />programado</> },
];

export default async function HomePage() {
  noStore();
  const [data, settings] = await Promise.all([
    getHomepageData().catch(() => null),
    getSiteSettingsMap().catch(() => ({})),
  ]);
  const contact = getPublicContactDetails(settings);
  const availableSlugs = new Set((data?.categories ?? []).map((category) => category.slug));

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
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              href={availableSlugs.has(category.slug) ? `/catalogo/${category.slug}` : "/catalogo"}
              className={styles.category}
            >
              <span className={styles.categoryPhoto} style={{ backgroundImage: `url("/home/category-${index}.webp")` }} role="img" aria-label={category.label} />
              <span className={styles.categoryLabel}>{category.label}</span>
            </Link>
          ))}
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
          <Link href="/contacto" className={styles.contactTitle}>¿Listo para que nunca te falte material? Contáctanos</Link>
          <span className={styles.contactItem}><MapPin aria-hidden="true" />{contact.companyAddress}</span>
          <div className={styles.contactDetails}>
            <a href={`mailto:${contact.supportEmail}`} className={styles.contactItem}><Mail aria-hidden="true" />{contact.supportEmail}</a>
            <a href={`tel:${contact.supportPhone.replace(/[^+\d]/g, "")}`} className={styles.contactItem}><Phone aria-hidden="true" />{contact.supportPhone}</a>
          </div>
        </div>
      </section>
    </div>
  );
}
