"use client";

import { Provider } from "react-redux";
import { store } from "../store/store";

store.subscribe(() => {
  const state = store.getState();
  localStorage.setItem("cart", JSON.stringify(state.cart));
});

export default function Providers({ children }) {
  return <Provider store={store}>{children}</Provider>;
}
