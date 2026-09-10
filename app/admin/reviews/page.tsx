"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useEcomStore } from "@/store/ecomStore";
import { ReviewItem } from "@/lib/ecomData";

export default function AdminReviewsPage() {
  const { reviews, deleteReview, toggleVerifiedBuyer, addToast } = useEcomStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [starFilter, setStarFilter] = useState<string>("ALL");
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);

  // Analytics Metrics
  const totalReviews = reviews.length;
  const averageRating = useMemo(() => {
    if (totalReviews === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / totalReviews).toFixed(1));
  }, [reviews, totalReviews]);

  const photoReviewsCount = useMemo(() => {
    return reviews.filter((r) => r.images && r.images.length > 0).length;
  }, [reviews]);

  const verifiedReviewsCount = useMemo(() => {
    return reviews.filter((r) => r.verifiedPurchase).length;
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = r.userName.toLowerCase().includes(query);
        const matchesProduct = r.productName.toLowerCase().includes(query);
        const matchesTitle = r.title.toLowerCase().includes(query);
        const matchesComment = r.comment.toLowerCase().includes(query);
        if (!matchesName && !matchesProduct && !matchesTitle && !matchesComment) {
          return false;
        }
      }

      // Star filter
      if (starFilter !== "ALL" && r.rating !== parseInt(starFilter, 10)) {
        return false;
      }

      return true;
    });
  }, [reviews, searchQuery, starFilter]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete this review by ${name}?`)) {
      deleteReview(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">⭐ Reviews &amp; Moderation Hub</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor customer feedback, verify buyer authentications, and moderate customer photos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 shadow-2xs">
            <span>●</span>
            <span>Live Sync Active</span>
          </span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Total Reviews
          </span>
          <span className="text-2xl font-extrabold text-stone-900 tabular-nums">{totalReviews}</span>
          <p className="text-[10px] text-emerald-700 font-bold">100% indexed in store</p>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Avg Rating Score
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-stone-900 tabular-nums">{averageRating}</span>
            <span className="text-amber-500 font-bold text-base">★</span>
          </div>
          <p className="text-[10px] text-stone-500 font-medium">Out of 5.0 maximum</p>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            With Customer Photos
          </span>
          <span className="text-2xl font-extrabold text-stone-900 tabular-nums">{photoReviewsCount}</span>
          <p className="text-[10px] text-blue-700 font-medium">Real photoshoot attachments</p>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border shadow-xs space-y-1">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
            Verified Purchases
          </span>
          <span className="text-2xl font-extrabold text-stone-900 tabular-nums">{verifiedReviewsCount}</span>
          <p className="text-[10px] text-emerald-700 font-medium">
            {totalReviews > 0 ? Math.round((verifiedReviewsCount / totalReviews) * 100) : 100}% verified orders
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by customer name, product, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full clay-input text-xs py-2 pe-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-stone-500 shrink-0">Rating:</span>
          {["ALL", "5", "4", "3", "2", "1"].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                starFilter === s
                  ? "bg-[#792c14] text-white shadow-2xs"
                  : "bg-muted text-stone-700 hover:bg-stone-200"
              }`}
            >
              {s === "ALL" ? "All" : `${s} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table / Feed */}
      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-stone-600 uppercase text-[10px] font-bold tracking-wider border-b border-border/80">
              <tr>
                <th className="px-4 py-3">Customer &amp; Location</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Review Headline &amp; Feedback</th>
                <th className="px-4 py-3">Customer Photos</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-stone-500">
                    No customer reviews match your search filter.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-muted/20 transition-colors">
                    
                    {/* Customer Info */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-sm border border-stone-200 shrink-0">
                          {rev.userAvatar || "👤"}
                        </div>
                        <div>
                          <span className="font-bold text-stone-900 block">{rev.userName}</span>
                          <span className="text-[10px] text-stone-400 block">{rev.location || "India"}</span>
                          <button
                            onClick={() => toggleVerifiedBuyer(rev.id)}
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 inline-block ${
                              rev.verifiedPurchase
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                            title="Click to toggle verified status"
                          >
                            {rev.verifiedPurchase ? "✓ Verified Buyer" : "Unverified"}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <span className="font-semibold text-stone-900 block truncate" title={rev.productName}>
                        {rev.productName}
                      </span>
                      {rev.wristSize && (
                        <span className="text-[10px] text-stone-400 block">
                          Size: {rev.wristSize}
                        </span>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-0.5 bg-emerald-700 text-white font-bold text-[11px] px-2 py-0.5 rounded shadow-2xs">
                        <span>{rev.rating}</span>
                        <span className="text-[9px]">★</span>
                      </span>
                    </td>

                    {/* Headline & Comment */}
                    <td className="px-4 py-3.5 max-w-sm">
                      <span className="font-bold text-stone-900 block leading-snug">
                        {rev.title}
                      </span>
                      <p className="text-[11px] text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                        {rev.comment}
                      </p>
                      {rev.helpfulCount > 0 && (
                        <span className="text-[10px] text-stone-400 mt-1 inline-block">
                          👍 {rev.helpfulCount} customer helpful vote{rev.helpfulCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>

                    {/* Photos */}
                    <td className="px-4 py-3.5">
                      {rev.images && rev.images.length > 0 ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {rev.images.map((img, i) => (
                            <div
                              key={i}
                              onClick={() => setSelectedPhotoModal(img)}
                              className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 cursor-pointer relative hover:opacity-80 shadow-2xs shrink-0"
                            >
                              <Image src={img} alt="Attachment" fill sizes="40px" className="object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-400">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-stone-500 text-[11px]">
                      {rev.date}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(rev.id, rev.userName)}
                        className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Photo Lightbox Modal */}
      {selectedPhotoModal && (
        <div
          onClick={() => setSelectedPhotoModal(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full aspect-square rounded-2xl overflow-hidden bg-black shadow-2xl"
          >
            <Image src={selectedPhotoModal} alt="Enlarged photo" fill sizes="512px" className="object-contain" />
            <button
              onClick={() => setSelectedPhotoModal(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white font-bold text-sm flex items-center justify-center hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
