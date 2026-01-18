"use client";

import { useEffect } from "react";
import { Provider,useDispatch } from "react-redux";
import { store } from "../store/store";
import { fetchStoreData } from "../store/storeSlice";

store.subscribe(() => {
  const state = store.getState();
  localStorage.setItem("cart", JSON.stringify(state.cart));
});
function StoreBootstrap() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchStoreData());
  }, [dispatch]);

  return null;
}
export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <StoreBootstrap />
      {children}
    </Provider>
  );
}
