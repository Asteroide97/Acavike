"""Read the supplied XLSX without Excel automation or database access."""
import argparse
import collections
import csv
import hashlib
import io
import json
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

GROUPS = [
    ("Empaque", "Cintas adhesivas", ["70", "71", "72", "123", "69"]),
    ("Empaque", "Polifoam y protección", ["131"]),
    ("Empaque", "Flejes", ["165"]),
    ("Empaque", "Películas de polietileno", ["168", "176"]),
    ("Empaque", "Emplaye", ["164"]),
    ("Empaque", "Etiquetas", ["500", "499"]),
    ("Abrasivos", "Bloques y esponjas", ["162", "163", "213"]),
    ("Abrasivos", "Discos abrasivos", ["202", "205"]),
    ("Abrasivos", "Rollos de fibra", ["484"]),
    ("Herramientas", "Herramientas eléctricas", ["179"]),
    ("Herramientas", "Herramientas neumáticas", ["183"]),
    ("Herramientas", "Cepillos y accesorios", ["243"]),
    ("Seguridad industrial", "Protección respiratoria", ["403"]),
    ("Seguridad industrial", "Soporte ergonómico", ["457"]),
    ("Limpieza", "Trapos industriales", ["355"]),
    ("Consumibles de oficina", "Accesorios para bebidas", ["313"]),
]
CLASSIFICATION = {key: (category, subcategory) for category, subcategory, keys in GROUPS for key in keys}
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def read_rows(source):
    with zipfile.ZipFile(io.BytesIO(source)) as archive:
        if sum(entry.file_size for entry in archive.infolist()) > 40_000_000:
            raise ValueError("El archivo descomprimido excede el límite de seguridad")
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ["".join(item.itertext()) for item in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {rel.attrib["Id"]: rel.attrib["Target"] for rel in relationships}
        for sheet in workbook.find("s:sheets", NS):
            rel = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
            target = targets[rel]
            filename = target.lstrip("/") if target.startswith("/") else "xl/" + target
            tree = ET.fromstring(archive.read(filename))
            for row in tree.findall(".//s:sheetData/s:row", NS):
                cells = {}
                for cell in row.findall("s:c", NS):
                    value = cell.find("s:v", NS)
                    text = value.text if value is not None else None
                    if cell.attrib.get("t") == "s" and text is not None:
                        text = strings[int(text)]
                    elif cell.attrib.get("t") == "inlineStr":
                        text = "".join(cell.find("s:is", NS).itertext())
                    cells["".join(letter for letter in cell.attrib["r"] if letter.isalpha())] = text
                if any(value is not None for value in cells.values()):
                    yield sheet.attrib["name"], int(row.attrib["r"]), cells


def money(value):
    if value is None:
        return None
    return str(Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def audit(source_path, out_dir, confirmed=False):
    source = source_path.read_bytes()
    digest = hashlib.sha256(source).hexdigest()
    rows, notes, errors = [], [], []
    header_seen = set()
    for sheet, row_number, cells in read_rows(source):
        if cells.get("A") == "ID Alegra":
            expected = ["ID Alegra", "Producto", "Descripción adicional", "Precio con descuento", "Precio público general", "Moneda"]
            if [cells.get(key) for key in "ABCDEF"] != expected:
                raise ValueError("Las columnas del Excel cambiaron. Revisar el mapeo antes de importar")
            header_seen.add(sheet)
            continue
        if sheet not in header_seen:
            notes.extend(value for value in cells.values() if value)
            continue
        external_id = cells.get("A", "").strip()
        name = cells.get("B", "").strip()
        if not external_id or not name:
            errors.append({"sheet": sheet, "row": row_number, "error": "ID o nombre ausente"})
            continue
        category, subcategory = CLASSIFICATION.get(external_id, (None, None))
        public_price, reference_price = money(cells.get("E")), money(cells.get("D"))
        rows.append({
            "sourceSheet": sheet, "sourceRow": row_number, "alegraId": external_id,
            "name": name, "description": cells.get("C"), "publicPrice": public_price,
            "referenceDiscountPrice": reference_price, "currency": cells.get("F"),
            "category": category, "subcategory": subcategory,
            "sku": None, "unit": None, "verifiedStock": None, "images": [],
        })
        if public_price is None or reference_price is None:
            errors.append({"row": row_number, "error": "Precio ausente"})
        elif Decimal(public_price) != (Decimal(reference_price) * Decimal("1.30")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP):
            errors.append({"row": row_number, "error": "Diferencia respecto al incremento del 30%"})
    duplicate_ids = [key for key, count in collections.Counter(row["alegraId"] for row in rows).items() if count > 1]
    duplicate_names = [key for key, count in collections.Counter(row["name"].casefold() for row in rows).items() if count > 1]
    report = {"sourceFile": source_path.name, "sourceSha256": digest, "sourceNotes": notes,
              "pricing": {"publicPriceExcludesVat": True, "discountReferenceOnly": True, "ownerConfirmed": confirmed},
              "products": rows}
    summary = {"totalProducts": len(rows), "duplicateIds": duplicate_ids, "duplicateNames": duplicate_names,
               "errors": errors, "categories": dict(collections.Counter(row["category"] for row in rows)),
               "subcategories": len(set(row["subcategory"] for row in rows)),
               "missing": {key: sum(row[key] in (None, [], "") for row in rows) for key in ["sku", "unit", "verifiedStock", "description", "images"]}}
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "import-review.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "audit-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    with (out_dir / "products-review.csv").open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]) if rows else [])
        writer.writeheader()
        writer.writerows(rows)
    lines = ["# Auditoría del catálogo recurrente", "", f"Productos: {len(rows)}. IDs duplicados: {len(duplicate_ids)}. Nombres duplicados: {len(duplicate_names)}.", "",
             "Precio público sin IVA confirmado por el propietario. Descuento conservado únicamente como referencia.", "",
             "No hay SKU, unidad comercial, existencias verificadas ni fotografías. No inferir unidad de las cantidades contenidas en el nombre. Las asignaciones siguientes son propuestas pendientes de aprobación.", "",
             "| ID Alegra | Producto | Categoría | Subcategoría | Público sin IVA | Referencia descuento |",
             "| --- | --- | --- | --- | ---: | ---: |"]
    for row in rows:
        lines.append("| " + " | ".join(str(row[key] or "Pendiente").replace("|", "/") for key in ["alegraId", "name", "category", "subcategory", "publicPrice", "referenceDiscountPrice"]) + " |")
    (out_dir / "AUDIT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=True))
    if errors or duplicate_ids or duplicate_names:
        raise SystemExit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--out", type=Path, default=Path("output/catalog-review"))
    parser.add_argument("--confirm-pricing", action="store_true", help="Solo tras confirmar con el propietario el precio público sin IVA y descuento de referencia")
    args = parser.parse_args()
    audit(args.source, args.out, args.confirm_pricing)
