"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStoreData,
  fetchBestSellers,
} from "@/store/storeSlice";
import SliceRenderer from "@/components/store/SliceRenderer";
import HomeInfoBar from "@/components/store/HomeInfoBar";

export default function HomePage() {
  const dispatch = useDispatch();
  const { store, bestSellers } = useSelector(
    (state) => state.storeData
  );

  useEffect(() => {
    if (!store) {
      dispatch(fetchStoreData());
      dispatch(fetchBestSellers());
    }
  }, [store, dispatch]);

  if (!store) return null;

  return (
    <>
      {/* Important info below header */}
      <HomeInfoBar store={store} />

      <SliceRenderer
        slices={store.homepageSlices || []}
        store={store}
        bestSellers={bestSellers}
      />
    </>
  );
}
