"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

type QuoteProductOption = {
  id: string;
  name: string;
  sku: string;
  price: number;
  unit: string;
};

type QuoteDraftItem = {
  productId: string | null;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function parseSerializedItems(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [sku, name, quantityValue, priceValue, productId] = line.split("|").map((part) => part.trim());
      const quantity = Number(quantityValue);
      const unitPrice = Number(priceValue);

      if (!name || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice)) {
        return null;
      }

      return {
        productId: productId || null,
        sku: sku || "",
        name,
        quantity,
        unitPrice,
      } satisfies QuoteDraftItem;
    })
    .filter(Boolean) as QuoteDraftItem[];
}

function serializeItems(items: QuoteDraftItem[]) {
  return items
    .map((item) =>
      [
        item.sku || "",
        item.name,
        String(item.quantity),
        roundMoney(item.unitPrice).toString(),
        item.productId || "",
      ].join("|"),
    )
    .join("\n");
}

function calculateIncludedTax(total: number) {
  return roundMoney((total * 0.16) / 1.16);
}

export function QuoteItemsBuilder({
  products,
  defaultValue,
}: {
  products: QuoteProductOption[];
  defaultValue: string;
}) {
  const [manualValue, setManualValue] = useState(defaultValue);
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState(products[0] ? String(products[0].price) : "");
  const [builderError, setBuilderError] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const filteredProducts = !normalizedSearch
    ? products
    : products.filter((product) => {
        const haystack = `${product.name} ${product.sku} ${product.unit}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      });
  const items = parseSerializedItems(manualValue);
  const productById = new Map(products.map((product) => [product.id, product] as const));
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ??
    filteredProducts[0] ??
    products[0] ??
    null;

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = calculateIncludedTax(subtotal);
  const total = roundMoney(subtotal);

  useEffect(() => {
    if (!selectedProduct && !products.length) {
      return;
    }

    if (!selectedProductId && products[0]) {
      setSelectedProductId(products[0].id);
      setPrice(String(products[0].price));
      return;
    }

    if (selectedProduct) {
      setPrice((currentPrice) => {
        const parsed = Number(currentPrice);
        return Number.isFinite(parsed) && parsed > 0 ? currentPrice : String(selectedProduct.price);
      });
    }
  }, [products, selectedProduct, selectedProductId]);

  function updateItems(nextItems: QuoteDraftItem[]) {
    setManualValue(serializeItems(nextItems));
  }

  function addItem() {
    if (!selectedProduct) {
      setBuilderError("Selecciona un producto para agregar la partida.");
      return;
    }

    const parsedQuantity = Math.floor(Number(quantity));
    const parsedPrice = Number(price);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setBuilderError("La cantidad debe ser mayor a cero.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setBuilderError("Captura un precio válido para la partida.");
      return;
    }

    updateItems([
      ...items,
      {
        productId: selectedProduct.id,
        sku: selectedProduct.sku,
        name: selectedProduct.name,
        quantity: parsedQuantity,
        unitPrice: roundMoney(parsedPrice),
      },
    ]);

    setBuilderError("");
    setQuantity("1");
    setPrice(String(selectedProduct.price));
  }

  function updateItem(index: number, patch: Partial<QuoteDraftItem>) {
    const nextItems = [...items];
    const currentItem = nextItems[index];

    if (!currentItem) {
      return;
    }

    nextItems[index] = {
      ...currentItem,
      ...patch,
    };

    updateItems(nextItems);
  }

  function removeItem(index: number) {
    updateItems(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
        <div className="space-y-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o SKU"
          />
          <Select
            value={selectedProductId}
            onChange={(event) => {
              const nextProduct = products.find((product) => product.id === event.target.value) ?? null;
              setSelectedProductId(event.target.value);
              if (nextProduct) {
                setPrice(String(nextProduct.price));
              }
            }}
            disabled={!filteredProducts.length}
          >
            {filteredProducts.length ? null : <option value="">No hay productos disponibles</option>}
            {filteredProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} · {product.sku} · {formatCurrency(product.price)}
              </option>
            ))}
          </Select>
        </div>

        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          placeholder="Cantidad"
        />

        <Input
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="Precio"
        />

        <Button type="button" className="xl:self-end" onClick={addItem}>
          Agregar partida
        </Button>
      </div>

      {builderError ? <p className="text-sm font-medium text-red-600">{builderError}</p> : null}

      <div className="space-y-3">
        {items.length ? (
          items.map((item, index) => {
            const relatedProduct = item.productId ? productById.get(item.productId) : null;

            return (
              <div
                key={`${item.productId || item.sku || item.name}-${index}`}
                className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-[1.4fr_0.7fr_0.8fr_auto]"
              >
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.sku || "Sin SKU"}
                    {relatedProduct?.unit ? ` · ${relatedProduct.unit}` : ""}
                  </p>
                </div>

                <Input
                  type="number"
                  min={1}
                  value={String(item.quantity)}
                  onChange={(event) => {
                    const parsedQuantity = Math.floor(Number(event.target.value));
                    updateItem(index, {
                      quantity: Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1,
                    });
                  }}
                />

                <div className="space-y-2">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={String(item.unitPrice)}
                    onChange={(event) => {
                      const parsedPrice = Number(event.target.value);
                      updateItem(index, {
                        unitPrice: Number.isFinite(parsedPrice) && parsedPrice > 0 ? roundMoney(parsedPrice) : 0,
                      });
                    }}
                  />
                  <p className="text-xs text-slate-500">Total: {formatCurrency(item.quantity * item.unitPrice)}</p>
                </div>

                <Button type="button" variant="outline" onClick={() => removeItem(index)}>
                  Quitar
                </Button>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-600">
            Aún no hay partidas. Usa el buscador para agregar productos o captura líneas manuales en modo avanzado.
          </div>
        )}
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Subtotal</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(subtotal)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">IVA incluido</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(tax)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(total)}</p>
        </div>
      </div>

      <p className="text-xs text-slate-500">Los precios capturados ya incluyen IVA. El total no suma el impuesto dos veces.</p>

      <details className="rounded-3xl border border-slate-200 bg-white p-4" open={!items.length}>
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Modo avanzado</summary>
        <p className="mt-3 text-xs text-slate-500">
          Una línea por partida con el formato SKU|Nombre|Cantidad|Precio|ProductId. El ProductId es opcional.
        </p>
        <Textarea
          name="itemsText"
          value={manualValue}
          onChange={(event) => setManualValue(event.target.value)}
          className="mt-3 min-h-[220px]"
        />
      </details>
    </div>
  );
}
