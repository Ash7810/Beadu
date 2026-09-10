import { NextRequest, NextResponse } from "next/server";
import { MOCK_REVIEWS, ReviewItem } from "@/lib/ecomData";

// In-memory backend store for reviews (initialized with seed data)
let serverReviews: ReviewItem[] = [...MOCK_REVIEWS];

/**
 * GET /api/reviews
 * Query parameters:
 *  - productId: filter by product ID
 *  - rating: filter by specific star rating (1-5)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const ratingStr = searchParams.get("rating");

    let results = [...serverReviews];

    if (productId) {
      results = results.filter((r) => !r.productId || r.productId === productId);
    }

    if (ratingStr) {
      const star = parseInt(ratingStr, 10);
      if (!isNaN(star)) {
        results = results.filter((r) => r.rating === star);
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      reviews: results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Could not retrieve reviews" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Creates and validates a new customer review
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productId,
      productName,
      userName,
      rating,
      title,
      comment,
      location,
      images,
      wristSize,
    } = body;

    // Validation
    if (!userName || !title || !comment) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: userName, title, and comment." },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5 stars." },
        { status: 400 }
      );
    }

    // Sanitize and construct new review
    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      productId: productId || "b-earth-cats-eye",
      productName: productName || "Artisan Handcrafted Bracelet",
      userName: String(userName).trim().slice(0, 50),
      userAvatar: numRating >= 4 ? "👩" : "👨",
      rating: numRating,
      date: new Date().toLocaleDateString("en-IN", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      title: String(title).trim().slice(0, 100),
      comment: String(comment).trim().slice(0, 1000),
      location: location ? String(location).trim().slice(0, 50) : "India",
      verifiedPurchase: true,
      wristSize: wristSize || undefined,
      images: Array.isArray(images) ? images.slice(0, 4) : [],
      helpfulCount: 0,
    };

    serverReviews.unshift(newReview);

    return NextResponse.json(
      {
        success: true,
        message: "Review validated and published successfully.",
        review: newReview,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to process review creation." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews
 * Admin moderation route to delete/hide flagged reviews
 */
export async function DELETE(req: NextRequest) {
  try {
    // Require admin authorization
    const authHeader = req.headers.get("authorization") || req.headers.get("x-admin-key");
    const validSecret = process.env.ADMIN_SECRET_KEY || "beadu-admin-key-2026";
    if (!authHeader || (authHeader !== `Bearer ${validSecret}` && authHeader !== validSecret)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin authorization required to delete reviews." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json(
        { success: false, message: "Missing review id parameter." },
        { status: 400 }
      );
    }

    const initialLen = serverReviews.length;
    serverReviews = serverReviews.filter((r) => r.id !== reviewId);

    if (serverReviews.length === initialLen) {
      return NextResponse.json(
        { success: false, message: "Review not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Review ${reviewId} successfully deleted.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete review." },
      { status: 500 }
    );
  }
}
