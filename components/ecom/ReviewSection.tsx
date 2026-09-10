"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { useEcomStore } from "@/store/ecomStore";
// ReviewItem type from ecomData used for reference only

interface ReviewSectionProps {
  productId: string;
  productName: string;
}

export function ReviewSection({ productId, productName }: ReviewSectionProps) {
  const { reviews, addReview, upvoteReview, addToast } = useEcomStore();

  // Filter reviews for this product
  const productReviews = useMemo(() => {
    const matched = reviews.filter((r) => r.productId === productId);
    return matched.length > 0 ? matched : reviews;
  }, [reviews, productId]);

  // Upvoted reviews tracking
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());

  // Star filter
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [onlyPhotosFilter, setOnlyPhotosFilter] = useState<boolean>(false);

  // Write Review Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState("");
  const [location, setLocation] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Statistics calculation
  const totalReviews = productReviews.length;
  const averageRating = useMemo(() => {
    if (totalReviews === 0) return 5.0;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / totalReviews).toFixed(1));
  }, [productReviews, totalReviews]);

  // Histogram calculation
  const starCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach((r) => {
      if (counts[r.rating] !== undefined) counts[r.rating]++;
    });
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star],
      percentage: totalReviews > 0 ? Math.round((counts[star] / totalReviews) * 100) : 0,
    }));
  }, [productReviews, totalReviews]);

  // Photo gallery
  const photos = useMemo(() => {
    const items: { url: string; author: string }[] = [];
    productReviews.forEach((r) => {
      if (r.images && r.images.length > 0) {
        r.images.forEach((img) => items.push({ url: img, author: r.userName }));
      }
    });
    return items;
  }, [productReviews]);

  // Filtered reviews
  const displayedReviews = useMemo(() => {
    return productReviews.filter((r) => {
      if (selectedStarFilter !== null && r.rating !== selectedStarFilter) return false;
      if (onlyPhotosFilter && (!r.images || r.images.length === 0)) return false;
      return true;
    });
  }, [productReviews, selectedStarFilter, onlyPhotosFilter]);

  const handleUpvote = (reviewId: string) => {
    if (upvotedIds.has(reviewId)) {
      addToast("Already Voted", "You have already marked this review as helpful.", "info");
      return;
    }
    upvoteReview(reviewId);
    setUpvotedIds((prev) => new Set(prev).add(reviewId));
  };

  // Real device photo upload & camera capture handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPhotos: string[] = [];
    let processed = 0;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        addToast("File Too Large", "Images must be under 5MB each.", "warning");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newPhotos.push(event.target.result as string);
        }
        processed++;
        if (processed === files.length) {
          setUploadedPhotos((prev) => [...prev, ...newPhotos].slice(0, 4));
          setIsUploading(false);
          addToast("Photo Added", "Your photo is attached to this review.", "success");
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const addPresetSamplePhoto = (sampleUrl: string) => {
    if (!uploadedPhotos.includes(sampleUrl)) {
      setUploadedPhotos((prev) => [...prev, sampleUrl].slice(0, 4));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !title.trim() || !comment.trim()) {
      addToast("Required Fields", "Please complete your name, title, and comment.", "warning");
      return;
    }

    addReview({
      productId,
      userName: authorName.trim(),
      userAvatar: rating >= 4 ? "👩" : "👨",
      location: location.trim() || "India",
      rating,
      title: title.trim(),
      comment: comment.trim(),
      verifiedPurchase: true,
      productName,
      images: uploadedPhotos,
      helpfulCount: 0,
    });

    setIsModalOpen(false);
    setTitle("");
    setComment("");
    setAuthorName("");
    setLocation("");
    setUploadedPhotos([]);
  };

  return (
    <section className="mt-12 sm:mt-16 pt-10 border-t border-stone-200">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Minimal Summary Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-stone-200/80">
          {/* Rating Number & Review Count */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-[#792c14] text-white px-3.5 py-1.5 rounded-xl text-xl font-bold shadow-xs">
              <span>{averageRating}</span>
              <span className="text-amber-300 text-lg">★</span>
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Ratings &amp; Reviews</h3>
              <p className="text-xs text-stone-500 font-medium">
                {totalReviews} verified {totalReviews === 1 ? "review" : "reviews"} for this product
              </p>
            </div>
          </div>

          {/* Action: Write Review */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-auto px-5 py-2.5 rounded-full bg-[#792c14] hover:bg-[#68250f] text-white text-xs font-bold shadow-xs transition-[transform,background-color] active:scale-[0.96] flex items-center gap-1.5"
          >
            <span>📸</span>
            <span>Rate &amp; Review</span>
          </button>
        </div>

        {/* Star Rating Distribution & Customer Photos Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Histogram Bars */}
          <div className="md:col-span-7 space-y-1.5">
            {starCounts.map(({ star, count, percentage }) => {
              const isSelected = selectedStarFilter === star;
              return (
                <div
                  key={star}
                  onClick={() => setSelectedStarFilter(isSelected ? null : star)}
                  className={`flex items-center gap-3 text-xs cursor-pointer py-1 px-2 rounded-lg transition-colors ${
                    isSelected ? "bg-amber-100/70" : "hover:bg-stone-50"
                  }`}
                >
                  <span className="w-8 text-right font-bold text-stone-700">{star} ★</span>
                  <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-[11px] font-medium text-stone-500 tabular-nums">
                    {percentage}%
                  </span>
                  <span className="w-8 text-right text-[10px] text-stone-400 tabular-nums">
                    ({count})
                  </span>
                </div>
              );
            })}
          </div>

          {/* Customer Photos Preview Strip */}
          {photos.length > 0 && (
            <div className="md:col-span-5 md:border-l md:border-stone-200/80 md:pl-6 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-stone-800">Customer Photos ({photos.length})</span>
                <button
                  type="button"
                  onClick={() => setOnlyPhotosFilter(!onlyPhotosFilter)}
                  className={`text-[11px] font-bold ${
                    onlyPhotosFilter ? "text-[#792c14] underline" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  {onlyPhotosFilter ? "Show all" : "View with photos"}
                </button>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {photos.slice(0, 5).map((p, i) => (
                  <div
                    key={i}
                    onClick={() => setActivePhoto(p.url)}
                    className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200 shrink-0 cursor-pointer relative hover:opacity-90 shadow-2xs"
                  >
                    <Image src={p.url} alt={`Photo by ${p.author}`} fill sizes="56px" className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Minimal Filters */}
        <div className="flex items-center gap-2 pt-2 text-xs flex-wrap">
          <span className="text-stone-400 font-bold text-[11px] mr-1">Filter:</span>
          
          <button
            type="button"
            onClick={() => {
              setSelectedStarFilter(null);
              setOnlyPhotosFilter(false);
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              selectedStarFilter === null && !onlyPhotosFilter
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            All
          </button>

          {[5, 4, 3].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setSelectedStarFilter(selectedStarFilter === star ? null : star)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                selectedStarFilter === star
                  ? "bg-[#792c14] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {star} ★
            </button>
          ))}

          {photos.length > 0 && (
            <button
              type="button"
              onClick={() => setOnlyPhotosFilter(!onlyPhotosFilter)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                onlyPhotosFilter
                  ? "bg-[#792c14] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              With Photos 📸
            </button>
          )}

          {(selectedStarFilter !== null || onlyPhotosFilter) && (
            <button
              type="button"
              onClick={() => {
                setSelectedStarFilter(null);
                setOnlyPhotosFilter(false);
              }}
              className="text-stone-400 hover:text-stone-700 text-[11px] underline ml-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Reviews Feed */}
        <div className="divide-y divide-stone-100 space-y-6">
          {displayedReviews.length === 0 ? (
            <div className="text-center py-8 text-xs text-stone-500">
              No reviews match the selected filter.
            </div>
          ) : (
            displayedReviews.map((rev) => {
              const hasVoted = upvotedIds.has(rev.id);
              return (
                <div key={rev.id} className="pt-6 first:pt-0 space-y-2.5 text-xs">
                  {/* Rating, Title & Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-700 text-white font-bold text-[11px] px-2 py-0.5 rounded-md flex items-center gap-0.5">
                        <span>{rev.rating}</span>
                        <span className="text-[9px]">★</span>
                      </span>
                      <h4 className="font-bold text-stone-900 text-sm">{rev.title}</h4>
                    </div>
                    <span className="text-[11px] text-stone-400">{rev.date}</span>
                  </div>

                  {/* Comment */}
                  <p className="text-stone-600 leading-relaxed text-xs sm:text-[13px]">
                    {rev.comment}
                  </p>

                  {/* Clean Rounded-Rectangle Photos (Replacing round bubbles) */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex gap-2.5 pt-1">
                      {rev.images.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActivePhoto(img)}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-stone-200 cursor-pointer relative hover:opacity-90 shadow-2xs group"
                        >
                          <Image
                            src={img}
                            alt="Customer review photo"
                            fill
                            sizes="80px"
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Author, Location, Verified Badge & Helpful Button */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-stone-400">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-800">{rev.userName}</span>
                      {rev.location && <span>• {rev.location}</span>}
                      {rev.verifiedPurchase && (
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          ✓ Verified Buyer
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpvote(rev.id)}
                      className={`text-[11px] font-medium transition-colors ${
                        hasVoted ? "text-emerald-700 font-bold" : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      👍 Helpful ({rev.helpfulCount || 0})
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal for Writing a Review with Real Camera & File Upload */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Write a Review</h3>
                  <p className="text-[11px] text-stone-400 truncate max-w-xs">{productName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-stone-100 text-stone-600 text-xs font-bold hover:bg-stone-200 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                {/* 1-5 Star Picker */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Your Rating *</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl transition-transform hover:scale-110 focus:outline-hidden ${
                          star <= rating ? "text-amber-500" : "text-stone-200"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs font-bold text-stone-600 ml-2">
                      {rating === 5
                        ? "Excellent"
                        : rating === 4
                        ? "Good"
                        : rating === 3
                        ? "Average"
                        : "Needs Improvement"}
                    </span>
                  </div>
                </div>

                {/* Review Headline */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Review Headline *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Beautiful finish & exact fit"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="clay-input w-full text-xs"
                  />
                </div>

                {/* Review Description */}
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Detailed Review *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="What did you like or dislike about this handcrafted item?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="clay-input w-full text-xs leading-relaxed"
                  />
                </div>

                {/* Name & City */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pooja M."
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="clay-input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">City / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="clay-input w-full text-xs"
                    />
                  </div>
                </div>

                {/* Real Device Camera / File Upload */}
                <div className="space-y-2 pt-1">
                  <label className="block font-bold text-stone-700">Add Product Photos</label>
                  
                  {/* File Input Target */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="review-camera-upload"
                  />
                  
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-stone-300 hover:border-[#792c14] rounded-2xl p-3.5 flex flex-col items-center justify-center gap-1 transition-colors bg-stone-50/70 hover:bg-stone-50 text-center"
                  >
                    <span className="text-xl">📸</span>
                    <span className="text-xs font-bold text-stone-800">
                      Take Photo or Upload from Device
                    </span>
                    <span className="text-[10px] text-stone-400">
                      JPG, PNG, WebP up to 5MB (Max 4 photos)
                    </span>
                  </div>

                  {/* Uploaded Thumbnails Preview */}
                  {uploadedPhotos.length > 0 && (
                    <div className="flex gap-2 pt-1 flex-wrap">
                      {uploadedPhotos.map((photoUrl, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-stone-300 group shadow-2xs">
                          <Image src={photoUrl} alt={`Upload ${idx + 1}`} fill sizes="56px" className="object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white text-[9px] font-bold flex items-center justify-center hover:bg-red-600"
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Desktop Testing Fallback Presets */}
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-stone-500">
                    <span>Or quick-add sample:</span>
                    <button
                      type="button"
                      onClick={() => addPresetSamplePhoto("/beads/pomelli_photoshoot_image_1_1_0726.png")}
                      className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-medium"
                    >
                      Sample 1
                    </button>
                    <button
                      type="button"
                      onClick={() => addPresetSamplePhoto("/beads/pomelli_photoshoot_image_4_5_0809.png")}
                      className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-medium"
                    >
                      Sample 2
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 py-2.5 rounded-xl bg-[#792c14] hover:bg-[#68250f] text-white text-xs font-bold shadow-xs active:scale-[0.96] disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Submit Review"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Minimal Lightbox */}
        {activePhoto && (
          <div
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full aspect-square rounded-2xl overflow-hidden bg-black"
            >
              <Image src={activePhoto} alt="Zoomed review photo" fill sizes="512px" className="object-contain" />
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white font-bold text-sm flex items-center justify-center hover:bg-black"
              >
                ✕
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
