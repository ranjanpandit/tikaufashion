import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
  },
  reducers: {
    /* =========================
       ADD TO CART
    ========================== */
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
    },

    /* =========================
       UPDATE QTY (DIRECT)
    ========================== */
    updateQty(state, action) {
      const { cartId, qty } = action.payload;
      const item = state.items.find((i) => i.cartId === cartId);
      if (item && qty >= 1) {
        item.qty = qty;
      }
    },

    /* =========================
       INCREASE
    ========================== */
    increaseQty(state, action) {
      const item = state.items.find(
        (i) => i.cartId === action.payload
      );
      if (item) {
        item.qty += 1;
      }
    },

    /* =========================
       DECREASE
    ========================== */
    decreaseQty(state, action) {
      const item = state.items.find(
        (i) => i.cartId === action.payload
      );
      if (item && item.qty > 1) {
        item.qty -= 1;
      }
    },

    /* =========================
       REMOVE
    ========================== */
    removeFromCart(state, action) {
      state.items = state.items.filter(
        (i) => i.cartId !== action.payload
      );
    },

    /* =========================
       CLEAR
    ========================== */
    clearCart(state) {
      state.items = [];
    },
  },
});

export const {
  addToCart,
  updateQty,
  increaseQty,
  decreaseQty,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
