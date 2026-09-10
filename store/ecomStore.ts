import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, ReviewItem, MOCK_REVIEWS, PRODUCTS_CATALOG } from '@/lib/ecomData';
import { useAuthStore } from './authStore';

export interface CartItem {
  product: Product;
  quantity: number;
  giftWrap: boolean;
  giftMessage?: string;
}

export interface Address {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
  addressType?: 'HOME' | 'WORK';
}

export interface Order {
  id: string;
  userId?: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  giftWrapFee: number;
  platformFee: number;
  shippingFee: number;
  total: number;
  status: 'Order Placed' | 'Order Accepted' | 'Confirmed' | 'Crafting' | 'Dispatched' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  shippingAddress: Address;
  paymentMode: string;
  transactionId?: string;
  awbNumber?: string;
}

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'warning';
}

interface EcomState {
  cart: CartItem[];
  wishlist: string[]; // Product IDs
  addresses: Address[];
  orders: Order[];
  productStock: Record<string, number>;
  reviews: ReviewItem[];
  searchQuery: string;
  toasts: ToastMessage[];

  // Session State
  activeUserId: string | null;
  userCarts: Record<string, CartItem[]>;
  userWishlists: Record<string, string[]>;
  syncUserSession: (userId: string | null) => void;

  // Stock Management & Inventory Actions
  getProductStock: (productId: string) => number;
  setProductStock: (productId: string, quantity: number) => void;

  // Actions
  addReview: (reviewData: Omit<ReviewItem, 'id' | 'date'>) => void;
  upvoteReview: (reviewId: string) => void;
  deleteReview: (reviewId: string) => void;
  toggleVerifiedBuyer: (reviewId: string) => void;
  getProductRatingInfo: (productId: string, fallbackRating?: number, fallbackCount?: number) => { rating: number; reviewsCount: number };
  addToCart: (product: Product, quantity?: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => boolean;
  toggleGiftWrap: (productId: string, giftWrap: boolean) => void;
  updateGiftMessage: (productId: string, message: string) => void;
  clearCart: () => void;

  toggleWishlist: (productId: string) => void;
  moveToWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  addAddress: (address: Omit<Address, 'id'>) => string;
  updateAddress: (id: string, address: Partial<Omit<Address, 'id'>>) => void;
  setDefaultAddress: (id: string) => void;
  removeAddress: (id: string) => void;
  getUserAddresses: (userId?: string) => Address[];

  createOrder: (
    shippingAddress: Address,
    paymentMode: string,
    transactionId: string,
    userId?: string
  ) => Order;

  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrderAWB: (orderId: string, awbNumber: string) => void;
  syncDelhiveryAutoStatuses: () => void;

  setSearchQuery: (query: string) => void;
  addToast: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;

  // Calculators
  getCartSubtotal: () => number;
  getGiftWrapTotal: () => number;
  getPlatformFee: () => number;
  getShippingFee: () => number;
  getGrandTotal: () => number;
  getCartItemCount: () => number;
}

// Production initialization: Clean empty collections for genuine real customer data
const DEFAULT_ADDRESSES: Address[] = [];
const INITIAL_ORDERS: Order[] = [];

// Initialize live stock catalog mapping
const INITIAL_STOCK: Record<string, number> = PRODUCTS_CATALOG.reduce((acc, p) => {
  acc[p.id] = p.stockQuantity ?? 10;
  return acc;
}, {} as Record<string, number>);

export const useEcomStore = create<EcomState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      addresses: DEFAULT_ADDRESSES,
      orders: INITIAL_ORDERS,
      productStock: INITIAL_STOCK,
      reviews: MOCK_REVIEWS,
      searchQuery: '',
      toasts: [],
      
      activeUserId: null,
      userCarts: {},
      userWishlists: {},

      syncUserSession: (newUserId) => {
        set((state) => {
          if (state.activeUserId === newUserId) return state;

          const oldId = state.activeUserId || 'guest';
          const updatedCarts = { ...state.userCarts, [oldId]: state.cart };
          const updatedWishlists = { ...state.userWishlists, [oldId]: state.wishlist };

          const targetId = newUserId || 'guest';
          const newCart = updatedCarts[targetId] || [];
          
          let finalCart = newCart;
          let finalWishlist = updatedWishlists[targetId] || [];

          if (oldId === 'guest' && targetId !== 'guest') {
             if (state.cart.length > 0) {
               finalCart = [...newCart];
               for (const item of state.cart) {
                 const exists = finalCart.findIndex(c => c.product.id === item.product.id);
                 if (exists > -1) {
                   finalCart[exists] = { ...finalCart[exists], quantity: finalCart[exists].quantity + item.quantity };
                 } else {
                   finalCart.push(item);
                 }
               }
             }
             updatedCarts['guest'] = [];
             
             if (state.wishlist.length > 0) {
                finalWishlist = Array.from(new Set([...finalWishlist, ...state.wishlist]));
             }
             updatedWishlists['guest'] = [];
          }

          return {
            activeUserId: newUserId,
            userCarts: updatedCarts,
            userWishlists: updatedWishlists,
            cart: finalCart,
            wishlist: finalWishlist,
          };
        });

        // 2. Background DB Sync if user is logged in
        if (newUserId && newUserId !== 'guest' && typeof window !== 'undefined') {
          Promise.all([
            fetch(`/api/cart?userId=${newUserId}`).then(r => r.json()),
            fetch(`/api/wishlist?userId=${newUserId}`).then(r => r.json()),
            fetch(`/api/addresses?userId=${newUserId}`).then(r => r.json()),
            fetch(`/api/orders?userId=${newUserId}`).then(r => r.json())
          ]).then(([cartData, wishlistData, addrData, ordersData]) => {
            set((state) => {
               // Only apply if user hasn't logged out during fetch
               if (state.activeUserId !== newUserId) return state;

               // Smart merge for cart: combine DB items and current state items
               const mergedCart = [...state.cart];
               if (cartData.success && Array.isArray(cartData.cart)) {
                 for (const dbItem of cartData.cart) {
                   const existingIdx = mergedCart.findIndex(c => c.product.id === dbItem.product.id);
                   if (existingIdx > -1) {
                     // Prefer the highest quantity between guest and DB
                     mergedCart[existingIdx].quantity = Math.max(mergedCart[existingIdx].quantity, dbItem.quantity);
                   } else {
                     mergedCart.push(dbItem);
                   }
                 }
               }

               // Smart merge for wishlist
               let mergedWishlist = [...state.wishlist];
               if (wishlistData.success && Array.isArray(wishlistData.wishlist)) {
                 mergedWishlist = Array.from(new Set([...mergedWishlist, ...wishlistData.wishlist]));
               }

               return {
                 cart: mergedCart,
                 wishlist: mergedWishlist,
                 addresses: addrData.success ? addrData.addresses : state.addresses,
                 orders: ordersData.success ? ordersData.orders : state.orders,
               };
            });
            // Push the intelligently merged cart and wishlist back up to the server
            const currentState = get();
            if (currentState.cart.length > 0) {
              fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: newUserId, items: currentState.cart })
              }).catch(() => {});
            }
            if (currentState.wishlist.length > 0) {
              fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: newUserId, items: currentState.wishlist })
              }).catch(() => {});
            }
          }).catch(() => {});
        }
      },

      getProductStock: (productId: string) => {
        if (productId.startsWith('custom-')) return 99; // Custom bracelets
        const state = get();
        if (state.productStock && typeof state.productStock[productId] === 'number') {
          return state.productStock[productId];
        }
        const found = PRODUCTS_CATALOG.find((p) => p.id === productId);
        return found?.stockQuantity ?? 10;
      },

      setProductStock: (productId: string, quantity: number) => {
        const cleanQty = Math.max(0, quantity);
        set((state) => ({
          productStock: {
            ...state.productStock,
            [productId]: cleanQty,
          },
        }));

        if (typeof window !== 'undefined') {
          fetch('/api/stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: cleanQty }),
          }).catch(() => {});
        }
      },

      addReview: (reviewData) => {
        const id = `rev-${Date.now()}`;
        const date = new Date().toLocaleDateString('en-IN', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        const newReview: ReviewItem = {
          ...reviewData,
          id,
          date,
        };

        set((state) => ({
          reviews: [newReview, ...state.reviews],
        }));

        get().addToast('Review Published', 'Your review has been verified and posted.', 'success');
      },

      upvoteReview: (reviewId) => {
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
          ),
        }));
      },

      deleteReview: (reviewId) => {
        set((state) => ({
          reviews: state.reviews.filter((r) => r.id !== reviewId),
        }));
        get().addToast('Review Removed', 'Review removed successfully.', 'info');
      },

      toggleVerifiedBuyer: (reviewId) => {
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === reviewId ? { ...r, verifiedPurchase: !r.verifiedPurchase } : r
          ),
        }));
      },

      getProductRatingInfo: (productId, fallbackRating = 4.9, fallbackCount = 42) => {
        const state = get();
        const productReviews = state.reviews.filter((r) => r.productId === productId);
        if (productReviews.length === 0) {
          return { rating: fallbackRating, reviewsCount: fallbackCount };
        }
        const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = Number((sum / productReviews.length).toFixed(1));
        return { rating: avg, reviewsCount: productReviews.length };
      },

      addToCart: (product, quantity = 1) => {
        const availableStock = get().getProductStock(product.id);
        if (availableStock <= 0) {
          get().addToast('Out of Stock', `${product.name} is currently out of stock.`, 'warning');
          return false;
        }

        const state = get();
        const existingIndex = state.cart.findIndex((item) => item.product.id === product.id);
        const currentQty = existingIndex > -1 ? state.cart[existingIndex].quantity : 0;
        const requestedTotal = currentQty + quantity;

        if (requestedTotal > availableStock) {
          const allowedAdd = Math.max(0, availableStock - currentQty);
          if (allowedAdd <= 0) {
            get().addToast(
              'Stock Limit Reached',
              `You already have all ${availableStock} available units of ${product.name} in your bag.`,
              'warning'
            );
            return false;
          }

          set((s) => {
            const updated = [...s.cart];
            if (existingIndex > -1) {
              updated[existingIndex] = { ...updated[existingIndex], quantity: availableStock };
            } else {
              updated.push({ product, quantity: availableStock, giftWrap: false, giftMessage: '' });
            }
            return {
              cart: updated,
              wishlist: s.wishlist.filter((id) => id !== product.id),
            };
          });

          get().addToast(
            'Stock Adjusted',
            `Added ${allowedAdd} unit(s). Max available stock is ${availableStock}.`,
            'info'
          );
          return true;
        }

        set((s) => {
          let updatedCart: CartItem[];
          if (existingIndex > -1) {
            updatedCart = [...s.cart];
            updatedCart[existingIndex] = {
              ...updatedCart[existingIndex],
              quantity: updatedCart[existingIndex].quantity + quantity,
            };
          } else {
            updatedCart = [
              ...s.cart,
              { product, quantity, giftWrap: false, giftMessage: '' },
            ];
          }

          const updatedWishlist = s.wishlist.filter((id) => id !== product.id);
          return { cart: updatedCart, wishlist: updatedWishlist };
        });

        // Background push sync
        const stateSync = get();
        if (stateSync.activeUserId && stateSync.activeUserId !== 'guest' && typeof window !== 'undefined') {
          fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: stateSync.activeUserId, items: stateSync.cart })
          }).catch(() => {});
        }

        get().addToast('Added to Cart', `${product.name} added.`, 'success');
        return true;
      },

      removeFromCart: (productId) => {
        const target = get().cart.find((item) => item.product.id === productId);
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        }));
        if (target) {
          get().addToast('Removed from Bag', `${target.product.name} removed from your bag.`, 'info');
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return false;
        }

        const availableStock = get().getProductStock(productId);
        if (quantity > availableStock) {
          get().addToast(
            'Stock Limit',
            `Cannot exceed available stock of ${availableStock} units.`,
            'warning'
          );
          set((state) => ({
            cart: state.cart.map((item) =>
              item.product.id === productId ? { ...item, quantity: availableStock } : item
            ),
          }));
          return false;
        }

        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
        return true;
      },

      toggleGiftWrap: (productId, giftWrap) => {
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, giftWrap } : item
          ),
        }));
      },

      updateGiftMessage: (productId, giftMessage) => {
        const trimmedMessage = giftMessage.slice(0, 120);
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, giftMessage: trimmedMessage } : item
          ),
        }));
      },

      clearCart: () => {
        set({ cart: [] });
      },

      toggleWishlist: (productId) => {
        const exists = get().wishlist.includes(productId);
        set((state) => {
          const updated = exists
            ? state.wishlist.filter((id) => id !== productId)
            : [...state.wishlist, productId];

          return { wishlist: updated };
        });
        if (exists) {
          get().addToast('Wishlist', 'Item removed from your wishlist.', 'info');
        } else {
          get().addToast('Wishlist', 'Item saved to your wishlist.', 'success');
        }
      },

      moveToWishlist: (productId) => {
        set((state) => {
          const updatedWishlist = state.wishlist.includes(productId)
            ? state.wishlist
            : [...state.wishlist, productId];
          const updatedCart = state.cart.filter((item) => item.product.id !== productId);
          return { wishlist: updatedWishlist, cart: updatedCart };
        });
      },

      isInWishlist: (productId) => {
        return get().wishlist.includes(productId);
      },

      addAddress: (addressData) => {
        const id = `addr-${Date.now()}`;
        const currentUserId = addressData.userId !== undefined ? addressData.userId : useAuthStore.getState().user?.id;
        const newAddress: Address = {
          ...addressData,
          id,
          userId: currentUserId,
        };

        set((state) => {
          let addresses = [...state.addresses];
          if (newAddress.isDefault) {
            addresses = addresses.map((a) =>
              a.userId === currentUserId ? { ...a, isDefault: false } : a
            );
          }
          return { addresses: [...addresses, newAddress] };
        });

        get().addToast('Address Saved', 'Shipping address added successfully.', 'success');
        return id;
      },

      updateAddress: (id, updatedData) => {
        set((state) => {
          const target = state.addresses.find((a) => a.id === id);
          const targetUserId = updatedData.userId !== undefined ? updatedData.userId : target?.userId;
          let addresses = state.addresses.map((a) => (a.id === id ? { ...a, ...updatedData } : a));
          if (updatedData.isDefault) {
            addresses = addresses.map((a) => {
              if (a.userId === targetUserId) {
                return { ...a, isDefault: a.id === id };
              }
              return a;
            });
          }
          return { addresses };
        });
        get().addToast('Address Updated', 'Shipping address updated successfully.', 'success');
      },

      setDefaultAddress: (id) => {
        set((state) => {
          const target = state.addresses.find((a) => a.id === id);
          const targetUserId = target?.userId;
          return {
            addresses: state.addresses.map((a) => {
              if (a.userId === targetUserId) {
                return { ...a, isDefault: a.id === id };
              }
              return a;
            }),
          };
        });
        get().addToast('Default Address Set', 'Primary delivery address updated.', 'success');
      },

      removeAddress: (id) => {
        set((state) => {
          const target = state.addresses.find((a) => a.id === id);
          const wasDefault = target?.isDefault;
          const targetUserId = target?.userId;
          const remaining = state.addresses.filter((a) => a.id !== id);
          if (wasDefault) {
            const firstUserAddrIndex = remaining.findIndex((a) => a.userId === targetUserId);
            if (firstUserAddrIndex > -1) {
              remaining[firstUserAddrIndex] = { ...remaining[firstUserAddrIndex], isDefault: true };
            }
          }
          return { addresses: remaining };
        });
        get().addToast('Address Removed', 'Shipping address removed from your account.', 'info');
      },

      getUserAddresses: (userId) => {
        const targetUserId = userId !== undefined ? userId : useAuthStore.getState().user?.id;
        if (!targetUserId) return [];
        return get().addresses.filter((a) => a.userId === targetUserId);
      },

      createOrder: (shippingAddress, paymentMode, transactionId, customUserId) => {
        const state = get();
        if (state.cart.length === 0) {
          throw new Error('Cannot create order with an empty cart.');
        }

        // Validate available stock for all items
        for (const item of state.cart) {
          const availableStock = state.getProductStock(item.product.id);
          if (item.quantity > availableStock) {
            const errorMsg = `Insufficient stock for ${item.product.name}. Only ${availableStock} unit(s) available.`;
            get().addToast('Stock Insufficient', errorMsg, 'warning');
            throw new Error(errorMsg);
          }
        }

        // Deduct purchased quantities from productStock
        const updatedStock: Record<string, number> = { ...(state.productStock || INITIAL_STOCK) };
        for (const item of state.cart) {
          if (!item.product.id.startsWith('custom-')) {
            const current = updatedStock[item.product.id] !== undefined
              ? updatedStock[item.product.id]
              : (item.product.stockQuantity ?? 10);
            updatedStock[item.product.id] = Math.max(0, current - item.quantity);
          }
        }

        const subtotal = state.getCartSubtotal();
        const giftWrapFee = state.getGiftWrapTotal();
        const platformFee = state.getPlatformFee();
        const grandTotal = state.getGrandTotal();

        const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
        const awbNumber = `DLHV${Math.floor(100000000 + Math.random() * 900000000)}`;
        const orderUserId = customUserId !== undefined ? customUserId : useAuthStore.getState().user?.id;

        const newOrder: Order = {
          id: orderId,
          userId: orderUserId,
          createdAt: new Date().toISOString(),
          items: [...state.cart],
          subtotal,
          giftWrapFee,
          platformFee,
          shippingFee: state.getShippingFee(),
          total: grandTotal,
          status: 'Order Placed',
          shippingAddress,
          paymentMode,
          transactionId,
          awbNumber,
        };

        set((s) => ({
          orders: [newOrder, ...s.orders],
          cart: [],
          productStock: updatedStock,
        }));

        get().addToast('Order Placed!', `Your order ${orderId} has been successfully placed.`, 'success');

        return newOrder;
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        }));
        get().addToast('Status Updated', `Order ${orderId} status set to ${status}.`, 'success');
      },

      updateOrderAWB: (orderId, awbNumber) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, awbNumber } : o)),
        }));
        get().addToast('AWB Generated', `Tracking AWB ${awbNumber} assigned to ${orderId}.`, 'success');
      },

      syncDelhiveryAutoStatuses: () => {
        import('@/lib/delhivery').then(({ getLiveDelhiveryStatus }) => {
          set((state) => ({
            orders: state.orders.map((o) => {
              if (o.status === 'Cancelled') return o;
              const autoStatus = getLiveDelhiveryStatus(o.createdAt, o.status);
              return { ...o, status: autoStatus };
            }),
          }));
        });
      },

      setSearchQuery: (searchQuery) => {
        set({ searchQuery });
      },

      addToast: (title, message, type = 'info') => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        set(() => ({
          toasts: [{ id, title, message, type }],
        }));

        setTimeout(() => {
          get().removeToast(id);
        }, 3200);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      getCartSubtotal: () => {
        return get().cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },

      getGiftWrapTotal: () => {
        return get().cart.reduce((sum, item) => sum + (item.giftWrap ? 20 * item.quantity : 0), 0);
      },

      getPlatformFee: () => {
        return 0;
      },

      getShippingFee: () => {
        return get().cart.length > 0 ? 100 : 0;
      },

      getGrandTotal: () => {
        const subtotal = get().getCartSubtotal();
        if (subtotal === 0) return 0;
        return subtotal + get().getGiftWrapTotal() + get().getShippingFee();
      },

      getCartItemCount: () => {
        return get().cart.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'beadu-ecom-store-v1',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          return localStorage.getItem(name);
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          try {
            localStorage.setItem(name, value);
          } catch {
            try {
              localStorage.clear();
              localStorage.setItem(name, value);
            } catch {
              // Ignore storage quota limits gracefully
            }
          }
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          localStorage.removeItem(name);
        },
      })),
      partialize: (state) => ({
        cart: state.cart.map((item) => {
          const img = item.product.image;
          const cleanImg = img && img.length > 500 ? "/beads/pomelli_photoshoot_image_1_1_0726.png" : img;
          return {
            ...item,
            product: {
              ...item.product,
              image: cleanImg,
            },
          };
        }),
        wishlist: state.wishlist,
        addresses: state.addresses,
        productStock: state.productStock,
        orders: state.orders.map((order) => ({
          ...order,
          items: order.items.map((item) => {
            const img = item.product.image;
            const cleanImg = img && img.length > 500 ? "/beads/pomelli_photoshoot_image_1_1_0726.png" : img;
            return {
              ...item,
              product: {
                ...item.product,
                image: cleanImg,
              },
            };
          }),
        })),
        activeUserId: state.activeUserId,
        userWishlists: state.userWishlists,
        userCarts: Object.fromEntries(
          Object.entries(state.userCarts).map(([uid, cartItems]) => [
            uid,
            cartItems.map((item) => {
              const img = item.product.image;
              const cleanImg = img && img.length > 500 ? "/beads/pomelli_photoshoot_image_1_1_0726.png" : img;
              return {
                ...item,
                product: {
                  ...item.product,
                  image: cleanImg,
                },
              };
            })
          ])
        ),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!Array.isArray(state.addresses)) state.addresses = [];
          if (!Array.isArray(state.orders)) state.orders = [];
          if (!Array.isArray(state.cart)) state.cart = [];
          if (!Array.isArray(state.wishlist)) state.wishlist = [];
          if (!state.productStock || typeof state.productStock !== 'object') {
            state.productStock = INITIAL_STOCK;
          }

          // Fetch fresh live central inventory from server
          if (typeof window !== 'undefined') {
            fetch('/api/stock')
              .then((r) => r.json())
              .then((data) => {
                if (data.success && data.stock) {
                  useEcomStore.setState((s) => ({
                    productStock: { ...s.productStock, ...data.stock },
                  }));
                }
              })
              .catch(() => {});
          }
        }
      },
    }
  )
);

if (typeof window !== 'undefined') {
  (window as unknown as { __ecomStore: typeof useEcomStore.getState }).__ecomStore = useEcomStore.getState;

  // Background Push Sync for Cart and Wishlist
  useEcomStore.subscribe((state, prevState) => {
    if (!state.activeUserId || state.activeUserId === 'guest') return;

    if (state.cart !== prevState.cart) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.activeUserId, items: state.cart })
      }).catch(() => {});
    }

    if (state.wishlist !== prevState.wishlist) {
      fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.activeUserId, items: state.wishlist })
      }).catch(() => {});
    }

    if (state.addresses !== prevState.addresses) {
      // Filter out addresses that don't belong to the active user to prevent cross-contamination
      const userAddrs = state.addresses.filter(a => a.userId === state.activeUserId);
      fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.activeUserId, addresses: userAddrs })
      }).catch(() => {});
    }
  });
}
