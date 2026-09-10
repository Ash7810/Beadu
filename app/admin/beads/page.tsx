"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { PRODUCTS_CATALOG, Product, PRODUCT_CATEGORIES, MATERIAL_FILTERS } from "@/lib/ecomData";
import { INITIAL_BEADS } from "@/lib/catalog";
import { Bead, BeadCategory } from "@/lib/types";
import { useEcomStore } from "@/store/ecomStore";

const BEAD_CATEGORIES: BeadCategory[] = [
  "acrylic", "glass", "stone", "wood", "ceramic", "crystal",
  "gold", "silver", "pearl", "letter", "charm", "premium-charm",
  "heart", "zodiac", "birthstone", "accent", "custom",
];

const BEAD_MATERIALS = [
  "Premium Acrylic", "Hand-Crafted Glass", "Natural Stone", "Natural Wood",
  "Fine Ceramic", "Crystal", "22K Gold Plated", "Sterling Silver",
  "Freshwater Pearl", "Custom Artisan",
];

// ——— File → ObjectURL helper ———
function fileToObjectUrl(file: File): string {
  return URL.createObjectURL(file);
}

export default function AdminBeadsPage() {
  const { addToast, productStock, getProductStock, setProductStock } = useEcomStore();
  const [activeTab, setActiveTab] = useState<"products" | "beads">("products");

  // ═══════════════════════════════════════
  //  PRODUCTS STATE
  // ═══════════════════════════════════════
  const [products, setProducts] = useState<Product[]>(PRODUCTS_CATALOG);
  const [productCatFilter, setProductCatFilter] = useState("All");
  const [productModal, setProductModal] = useState<"add" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const productFileRef = useRef<HTMLInputElement>(null);

  const defaultProduct: Omit<Product, "id"> = {
    name: "",
    price: 399,
    originalPrice: 549,
    rating: 5.0,
    reviewsCount: 0,
    category: "Bracelets",
    material: "Wooden Beads",
    image: "/beads/pomelli_photoshoot_image_1_1_0726.png",
    images: [],
    description: "",
    details: ["Handcrafted in India", "Eco-friendly natural materials"],
    inStock: true,
    stockQuantity: 10,
  };

  const [productForm, setProductForm] = useState<Omit<Product, "id">>(defaultProduct);
  const [productImages, setProductImages] = useState<string[]>([]);

  const filteredProducts = products.filter(
    (p) => productCatFilter === "All" || p.category === productCatFilter
  );

  const openAddProduct = () => {
    setProductForm(defaultProduct);
    setProductImages([]);
    setProductModal("add");
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    const currentStock = getProductStock(p.id);
    setProductForm({ ...p, stockQuantity: currentStock });
    setProductImages([...p.images]);
    setProductModal("edit");
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newUrls = Array.from(files).map(fileToObjectUrl);
    setProductImages((prev) => [...prev, ...newUrls]);
    e.target.value = "";
  };

  const removeProductImage = (idx: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name) return;

    const imgs = productImages.length > 0 ? productImages : ["/beads/pomelli_photoshoot_image_1_1_0726.png"];
    const qty = typeof productForm.stockQuantity === "number" ? Math.max(0, productForm.stockQuantity) : 10;

    if (productModal === "add") {
      const newId = `p-${Date.now()}`;
      const newProduct: Product = {
        ...productForm,
        id: newId,
        image: imgs[0],
        images: imgs,
        originalPrice: productForm.originalPrice || Math.round(productForm.price * 1.3),
        stockQuantity: qty,
        inStock: qty > 0,
      };
      setProductStock(newId, qty);
      setProducts([newProduct, ...products]);
      addToast("Product Added!", `${newProduct.name} added to catalog with ${qty} units stock.`, "success");
    } else if (editingProduct) {
      setProductStock(editingProduct.id, qty);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? { ...productForm, id: editingProduct.id, image: imgs[0], images: imgs, stockQuantity: qty, inStock: qty > 0 }
            : p
        )
      );
      addToast("Product Updated!", `${productForm.name} saved with ${qty} units stock.`, "success");
    }

    setProductModal(null);
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    if (typeof window !== "undefined" && window.confirm("Delete this product?")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      addToast("Product Deleted", "Item removed from catalog.", "warning");
    }
  };

  // ═══════════════════════════════════════
  //  BEADS STATE
  // ═══════════════════════════════════════
  const [beads, setBeads] = useState<Bead[]>(INITIAL_BEADS);
  const [beadCatFilter, setBeadCatFilter] = useState("all");
  const [beadModal, setBeadModal] = useState<"add" | "edit" | null>(null);
  const [editingBead, setEditingBead] = useState<Bead | null>(null);
  const beadFileRef = useRef<HTMLInputElement>(null);

  // Load saved admin bead customizations from localStorage or API
  useEffect(() => {
    try {
      const stored = localStorage.getItem("beadu_admin_beads");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBeads(parsed);
          return;
        }
      }
      fetch("/api/beads")
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d) && d.length > 0) setBeads(d);
        })
        .catch(() => {});
    } catch (_) {}
  }, []);

  const persistBeads = (updated: Bead[]) => {
    setBeads(updated);
    try {
      localStorage.setItem("beadu_admin_beads", JSON.stringify(updated));
    } catch (_) {}
  };

  const defaultBead: Omit<Bead, "id"> = {
    name: "",
    category: "acrylic",
    price: 5,
    material: "Premium Acrylic",
    imageUrl: "/beads/final_beads/bead-final-001.png",
    isPremium: false,
    rotationAllowed: true,
    rotation: 0,
    size: 1.0,
    sizeMm: 8,
    widthMm: 8,
    active: true,
  };

  const [beadForm, setBeadForm] = useState<Omit<Bead, "id">>(defaultBead);
  const [beadPreviewUrl, setBeadPreviewUrl] = useState("");

  const filteredBeads = beads.filter(
    (b) => beadCatFilter === "all" || b.category === beadCatFilter
  );

  const openAddBead = () => {
    setBeadForm(defaultBead);
    setBeadPreviewUrl("");
    setBeadModal("add");
  };

  const openEditBead = (b: Bead) => {
    setEditingBead(b);
    setBeadForm({ ...b, rotation: b.rotation || 0 });
    setBeadPreviewUrl(b.imageUrl);
    setBeadModal("edit");
  };

  const handleBeadImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = fileToObjectUrl(file);
    setBeadPreviewUrl(url);
    setBeadForm((prev) => ({ ...prev, imageUrl: url }));
    e.target.value = "";
  };

  const saveBead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beadForm.name) return;

    const imgUrl = beadPreviewUrl || beadForm.imageUrl || "/beads/final_beads/bead-final-001.png";

    if (beadModal === "add") {
      const newBead: Bead = {
        ...beadForm,
        id: `bead-custom-${Date.now()}`,
        imageUrl: imgUrl,
        rotation: beadForm.rotation || 0,
      };
      const next = [...beads, newBead];
      persistBeads(next);
      addToast("Bead Added!", `${newBead.name} added to customizer catalog.`, "success");
    } else if (editingBead) {
      const next = beads.map((b) =>
        b.id === editingBead.id ? { ...beadForm, id: editingBead.id, imageUrl: imgUrl, rotation: beadForm.rotation || 0 } : b
      );
      persistBeads(next);
      addToast("Bead Updated!", `${beadForm.name} saved with ${beadForm.rotation || 0}° rotation.`, "success");
    }

    setBeadModal(null);
    setEditingBead(null);
  };

  const deleteBead = (id: string) => {
    if (typeof window !== "undefined" && window.confirm("Delete this bead?")) {
      const next = beads.filter((b) => b.id !== id);
      persistBeads(next);
      addToast("Bead Deleted", "Bead removed from customizer.", "warning");
    }
  };

  // ═══════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════
  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl text-foreground font-normal">
            Inventory Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage shop products & customizer beads
          </p>
        </div>
        <button
          onClick={activeTab === "products" ? openAddProduct : openAddBead}
          className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm hover:bg-primary/90 transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          + Add {activeTab === "products" ? "Product" : "Bead"}
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-border/40 tabular-nums">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-5 py-2.5 text-xs font-bold transition-[color,border-color] duration-150 ease-out border-b-2 -mb-px ${
            activeTab === "products"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          🛍️ Shop Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("beads")}
          className={`px-5 py-2.5 text-xs font-bold transition-[color,border-color] duration-150 ease-out border-b-2 -mb-px ${
            activeTab === "beads"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          🔮 Customizer Beads ({beads.length})
        </button>
      </div>

      {/* ═══ PRODUCTS TAB ═══ */}
      {activeTab === "products" && (
        <>
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setProductCatFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] ${
                  productCatFilter === cat
                    ? "bg-foreground text-background"
                    : "bg-card border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((item) => (
              <div key={item.id} className="clay-panel p-4 bg-white space-y-3">
                <div className="flex gap-3 items-center">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-border flex-shrink-0 bg-muted/20">
                    <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">{item.material}</span>
                    <h3 className="font-semibold text-xs text-foreground truncate">{item.name}</h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-primary">₹{item.price}</span>
                      {item.originalPrice && (
                        <span className="text-[10px] text-muted-foreground line-through">₹{item.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Image count + badges */}
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-bold">
                    {item.images.length} image{item.images.length > 1 ? "s" : ""}
                  </span>
                  {item.isBestSeller && (
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Bestseller</span>
                  )}
                  {item.isNewArrival && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">New</span>
                  )}
                </div>

                {/* Stock Level & Actions */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      getProductStock(item.id) === 0 ? "bg-red-500" : getProductStock(item.id) <= 4 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                    }`} />
                    <span className="text-[11px] text-muted-foreground font-medium">Stock:</span>
                    <span className={`text-[11px] font-bold ${
                      getProductStock(item.id) === 0 ? "text-destructive" : getProductStock(item.id) <= 4 ? "text-amber-600" : "text-emerald-600"
                    }`}>
                      {getProductStock(item.id) === 0 ? "Sold Out" : `${getProductStock(item.id)} units`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button onClick={() => openEditProduct(item)} className="text-primary font-bold hover:underline text-[11px]">
                      Edit
                    </button>
                    <button onClick={() => deleteProduct(item.id)} className="text-red-500 font-bold hover:underline text-[11px]">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══ BEADS TAB ═══ */}
      {activeTab === "beads" && (
        <>
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setBeadCatFilter("all")}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                beadCatFilter === "all"
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              All
            </button>
            {BEAD_CATEGORIES.map((cat) => {
              const count = beads.filter((b) => b.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setBeadCatFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all capitalize ${
                    beadCatFilter === cat
                      ? "bg-foreground text-background"
                      : "bg-card border border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Beads Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredBeads.map((bead) => (
              <div key={bead.id} className={`clay-panel p-3 bg-white space-y-2 ${!bead.active ? "opacity-50" : ""}`}>
                {/* Bead Preview with Rotation */}
                <div className="relative w-full aspect-square flex items-center justify-center bg-muted/10 rounded-xl overflow-hidden">
                  <img
                    src={bead.imageUrl}
                    alt={bead.name}
                    style={bead.rotation ? { transform: `rotate(${bead.rotation}deg)` } : undefined}
                    className="w-3/4 h-3/4 object-contain drop-shadow-sm"
                  />
                  {bead.isPremium && (
                    <span className="absolute top-1.5 right-1.5 bg-amber-400 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                      ★
                    </span>
                  )}
                  {bead.rotation ? (
                    <span className="absolute bottom-1.5 left-1.5 bg-black/40 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                      {bead.rotation}°
                    </span>
                  ) : null}
                </div>

                <div className="text-center space-y-0.5">
                  <p className="text-[11px] font-semibold text-foreground truncate" title={bead.name}>{bead.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{bead.category} • {bead.sizeMm}mm</p>
                  <p className="text-[11px] font-bold text-primary">₹{bead.price}</p>
                </div>

                <div className="flex justify-between pt-1.5 border-t border-border/30">
                  <button onClick={() => openEditBead(bead)} className="text-primary font-bold text-[10px] hover:underline">
                    Edit
                  </button>
                  <button
                    onClick={() => setBeads((prev) => prev.map((b) => b.id === bead.id ? { ...b, active: !b.active } : b))}
                    className={`text-[10px] font-bold ${bead.active ? "text-green-600" : "text-red-500"}`}
                  >
                    {bead.active ? "Active" : "Inactive"}
                  </button>
                  <button onClick={() => deleteBead(bead.id)} className="text-red-500 font-bold text-[10px] hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════ */}
      {/*  PRODUCT ADD/EDIT MODAL                */}
      {/* ═══════════════════════════════════════ */}
      {productModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setProductModal(null); setEditingProduct(null); }} />
          <form
            onSubmit={saveProduct}
            className="relative bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 z-10 font-sans max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="font-heading text-xl text-foreground">
                {productModal === "add" ? "Add New Product" : "Edit Product"}
              </h3>
              <button type="button" onClick={() => { setProductModal(null); setEditingProduct(null); }} className="text-xs font-bold text-muted-foreground">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Carved Ebony Sphere Strand"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="clay-input w-full text-xs"
                />
              </div>

              {/* Price + Original Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="clay-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.originalPrice || ""}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) || undefined })}
                    className="clay-input w-full text-xs"
                  />
                </div>
              </div>

              {/* Stock Quantity */}
              <div className="bg-muted/40 p-3 rounded-2xl border border-border/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground">
                    Available Stock Quantity (Units) *
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (productForm.stockQuantity ?? 10) === 0 ? "bg-red-100 text-red-700" : (productForm.stockQuantity ?? 10) <= 4 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {(productForm.stockQuantity ?? 10) === 0 ? "Sold Out" : `${productForm.stockQuantity ?? 10} in stock`}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 15"
                  value={productForm.stockQuantity ?? 10}
                  onChange={(e) => setProductForm({ ...productForm, stockQuantity: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="clay-input w-full text-xs bg-background font-bold"
                />
                <p className="text-[10px] text-muted-foreground">
                  Controls the maximum purchasing limit on shop and cart. Setting to 0 marks product as &quot;Sold Out&quot; and disables purchasing.
                </p>
              </div>

              {/* Category + Material */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as Product["category"] })}
                    className="clay-input w-full text-xs bg-background"
                  >
                    {PRODUCT_CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Material *</label>
                  <select
                    value={productForm.material}
                    onChange={(e) => setProductForm({ ...productForm, material: e.target.value as Product["material"] })}
                    className="clay-input w-full text-xs bg-background"
                  >
                    {MATERIAL_FILTERS.filter((m) => m !== "All Materials").map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Product description..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="clay-input w-full text-xs resize-none"
                />
              </div>

              {/* Details (comma-separated) */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Details (one per line)</label>
                <textarea
                  rows={3}
                  placeholder={"Material: Indian Rosewood\nBead Size: 8mm\nHandcrafted in India"}
                  value={(productForm.details || []).join("\n")}
                  onChange={(e) => setProductForm({ ...productForm, details: e.target.value.split("\n").filter(Boolean) })}
                  className="clay-input w-full text-xs resize-none font-mono"
                />
              </div>

              {/* Flags */}
              <div className="flex gap-4 items-center text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                    className="accent-primary"
                  />
                  <span className="font-semibold">In Stock</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isBestSeller || false}
                    onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                    className="accent-amber-500"
                  />
                  <span className="font-semibold">Bestseller</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isNewArrival || false}
                    onChange={(e) => setProductForm({ ...productForm, isNewArrival: e.target.checked })}
                    className="accent-blue-500"
                  />
                  <span className="font-semibold">New Arrival</span>
                </label>
              </div>

              {/* ——— Multi-Image Upload ——— */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Product Images ({productImages.length})
                </label>

                {/* Image Preview Grid */}
                {productImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {productImages.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <div className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 ${idx === 0 ? "border-primary" : "border-border/40"}`}>
                          <Image src={url} alt={`Image ${idx + 1}`} fill sizes="64px" className="object-cover" />
                        </div>
                        {idx === 0 && (
                          <span className="absolute -top-1.5 -left-1.5 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeProductImage(idx)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                <input
                  ref={productFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleProductImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => productFileRef.current?.click()}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/60 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  📷 Upload Images from Device
                </button>
                <p className="text-[10px] text-muted-foreground mt-1">First image becomes the primary. You can upload multiple.</p>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-white text-xs font-bold py-3 rounded-2xl shadow-sm">
              {productModal === "add" ? "Save & Publish Product" : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/*  BEAD ADD/EDIT MODAL                   */}
      {/* ═══════════════════════════════════════ */}
      {beadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setBeadModal(null); setEditingBead(null); }} />
          <form
            onSubmit={saveBead}
            className="relative bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 z-10 font-sans max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="font-heading text-xl text-foreground">
                {beadModal === "add" ? "Add New Bead" : "Edit Bead"}
              </h3>
              <button type="button" onClick={() => { setBeadModal(null); setEditingBead(null); }} className="text-xs font-bold text-muted-foreground">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Form Fields */}
              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Bead Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marble Blue"
                    value={beadForm.name}
                    onChange={(e) => setBeadForm({ ...beadForm, name: e.target.value })}
                    className="clay-input w-full text-xs"
                  />
                </div>

                {/* Category + Material */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                    <select
                      value={beadForm.category}
                      onChange={(e) => setBeadForm({ ...beadForm, category: e.target.value as BeadCategory })}
                      className="clay-input w-full text-xs bg-background capitalize"
                    >
                      {BEAD_CATEGORIES.map((c) => (
                        <option key={c} value={c} className="capitalize">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Material</label>
                    <select
                      value={beadForm.material}
                      onChange={(e) => setBeadForm({ ...beadForm, material: e.target.value })}
                      className="clay-input w-full text-xs bg-background"
                    >
                      {BEAD_MATERIALS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={beadForm.price}
                    onChange={(e) => setBeadForm({ ...beadForm, price: Number(e.target.value) })}
                    className="clay-input w-full text-xs"
                  />
                </div>

                {/* Sizes */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-foreground mb-1">Size (mm)</label>
                    <input
                      type="number"
                      value={beadForm.sizeMm}
                      onChange={(e) => {
                        const mm = Number(e.target.value);
                        setBeadForm({ ...beadForm, sizeMm: mm, widthMm: mm, size: Number((mm / 8).toFixed(2)) });
                      }}
                      className="clay-input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-foreground mb-1">Width (mm)</label>
                    <input
                      type="number"
                      value={beadForm.widthMm}
                      onChange={(e) => setBeadForm({ ...beadForm, widthMm: Number(e.target.value) })}
                      className="clay-input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-foreground mb-1">Rel. Size</label>
                    <input
                      type="number"
                      step="0.01"
                      value={beadForm.size}
                      onChange={(e) => setBeadForm({ ...beadForm, size: Number(e.target.value) })}
                      className="clay-input w-full text-xs"
                    />
                  </div>
                </div>

                {/* Rotation */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <span>Default Image Rotation</span>
                    <span className="text-primary font-mono font-bold">{beadForm.rotation || 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={beadForm.rotation || 0}
                    onChange={(e) => setBeadForm({ ...beadForm, rotation: Number(e.target.value) })}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex gap-1.5">
                    {[0, 45, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setBeadForm({ ...beadForm, rotation: deg })}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          (beadForm.rotation || 0) === deg
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={beadForm.isPremium}
                      onChange={(e) => setBeadForm({ ...beadForm, isPremium: e.target.checked })}
                      className="accent-amber-500"
                    />
                    <span className="font-semibold">Premium ★</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={beadForm.rotationAllowed}
                      onChange={(e) => setBeadForm({ ...beadForm, rotationAllowed: e.target.checked })}
                      className="accent-primary"
                    />
                    <span className="font-semibold">Rotation Allowed</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={beadForm.active}
                      onChange={(e) => setBeadForm({ ...beadForm, active: e.target.checked })}
                      className="accent-green-600"
                    />
                    <span className="font-semibold">Active</span>
                  </label>
                </div>
              </div>

              {/* Right: Live Preview + Image Upload */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-foreground">Live Preview</label>
                <div className="relative aspect-square w-full bg-muted/10 rounded-2xl border border-border/40 flex items-center justify-center overflow-hidden">
                  <img
                    src={beadPreviewUrl || beadForm.imageUrl}
                    alt="Bead preview"
                    style={beadForm.rotation ? { transform: `rotate(${beadForm.rotation}deg)` } : undefined}
                    className="w-3/4 h-3/4 object-contain drop-shadow-md transition-transform duration-300"
                  />
                  {beadForm.isPremium && (
                    <span className="absolute top-2 right-2 bg-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      ★ Premium
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 bg-black/40 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {beadForm.sizeMm}mm • {beadForm.rotation || 0}°
                  </span>
                </div>

                {/* Upload */}
                <input
                  ref={beadFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBeadImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => beadFileRef.current?.click()}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/60 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                >
                  📷 Upload Bead Image
                </button>
                <p className="text-[10px] text-muted-foreground">Upload a transparent PNG for best results.</p>
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-white text-xs font-bold py-3 rounded-2xl shadow-sm">
              {beadModal === "add" ? "Add Bead to Customizer" : "Save Bead Changes"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
