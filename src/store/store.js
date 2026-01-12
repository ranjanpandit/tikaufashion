import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import storeReducer from "./storeSlice";

/* =========================
   LOAD FROM LOCALSTORAGE
========================= */
function loadCart() {
  if (typeof window === "undefined") return undefined;

  try {
    const data = localStorage.getItem("cart");
    return data ? JSON.parse(data) : undefined;
  } catch {
    return undefined;
  }
}

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    storeData: storeReducer, // 👈 NEW
  },
  preloadedState: {
    cart: loadCart(),
  },
});
