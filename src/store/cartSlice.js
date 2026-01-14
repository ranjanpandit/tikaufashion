import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  coupon: null, // { code, type, value, maxDiscount }
  subtotal: 0,
  discount: 0,
  total: 0,
};

/* =========================
   HELPERS
========================= */
function calculateDiscount(subtotal, coupon) {
  if (!coupon) return 0;

  let discount = 0;

  if (coupon.type === "PERCENT") {
    discount = (subtotal * coupon.value) / 100;
  }

  if (coupon.type === "FLAT") {
    discount = coupon.value;
  }

  if (coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  return Math.round(discount);
}

function calculateTotals(state) {
  state.subtotal = state.items.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  state.discount = calculateDiscount(
    state.subtotal,
    state.coupon
  );

  state.total = Math.max(
    state.subtotal - state.discount,
    0
  );
}

/* =========================
   SLICE
========================= */
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action) {
      const item = action.payload;

      const existing = state.items.find(
        (i) =>
          i.productId === item.productId &&
          JSON.stringify(i.selectedOptions) ===
            JSON.stringify(item.selectedOptions)
      );

      if (existing) {
        existing.qty += item.qty;
      } else {
        state.items.push(item);
      }

      calculateTotals(state);
    },

    updateQty(state, action) {
      const { cartId, qty } = action.payload;
      const item = state.items.find((i) => i.cartId === cartId);
      if (item && qty >= 1) item.qty = qty;
      calculateTotals(state);
    },

    increaseQty(state, action) {
      const item = state.items.find(
        (i) => i.cartId === action.payload
      );
      if (item) item.qty += 1;
      calculateTotals(state);
    },

    decreaseQty(state, action) {
      const item = state.items.find(
        (i) => i.cartId === action.payload
      );
      if (item && item.qty > 1) item.qty -= 1;
      calculateTotals(state);
    },

    removeFromCart(state, action) {
      state.items = state.items.filter(
        (i) => i.cartId !== action.payload
      );
      calculateTotals(state);
    },

    /* =========================
       COUPON
    ========================== */
    applyCoupon(state, action) {
      // action.payload = { code, type, value, maxDiscount }
      state.coupon = action.payload;
      calculateTotals(state);
    },

    removeCoupon(state) {
      state.coupon = null;
      calculateTotals(state);
    },

    clearCart() {
      return initialState;
    },
  },
});

export const {
  addToCart,
  updateQty,
  increaseQty,
  decreaseQty,
  removeFromCart,
  applyCoupon,
  removeCoupon,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
