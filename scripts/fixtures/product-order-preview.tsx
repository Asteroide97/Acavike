"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductOrderEditor, type OrderProductCard } from "@/components/admin/product-order-editor";
const categories = [
  {id:"r",name:"Empaque",slug:"empaque",parentId:null,isActive:true},
  {id:"c",name:"Cintas adhesivas",slug:"cintas",parentId:"r",isActive:true},
  {id:"d",name:"Cajas",slug:"cajas",parentId:"r",isActive:true},
];
export default function LocalOrderPreview() {
  const [data,setData]=useState<{products:OrderProductCard[];version:number;categoryId:string}|null>(null);
  useEffect(()=>{const categoryId=new URL(window.location.href).searchParams.get("categoria")||"c"; void fetch(`/api/product-order-fixture?categoria=${categoryId}`).then(response=>response.json()).then(setData);},[]);
  if(process.env.NODE_ENV!=="development") return null;
  return <main className="admin-app mx-auto max-w-4xl space-y-5 p-4"><h1 className="text-2xl font-semibold">Ordenar productos</h1><p>Prueba local aislada. Sin base ni escrituras de producción.</p><Link href="/admin/productos">Volver a productos</Link>{data?<ProductOrderEditor categories={categories} products={data.products} categoryId={data.categoryId} initialVersion={data.version} available demoMode={false}/>:<p>Cargando…</p>}</main>;
}
