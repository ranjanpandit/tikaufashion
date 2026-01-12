import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/* =========================
   ASYNC ACTIONS
========================= */
export const fetchStoreData = createAsyncThunk(
  "store/fetchStoreData",
  async () => {
    const res = await fetch("/api/store");
    if (!res.ok) throw new Error("Failed to load store");
    return res.json();
  }
);

export const fetchBestSellers = createAsyncThunk(
  "store/fetchBestSellers",
  async () => {
    const res = await fetch("/api/store/best-sellers");
    if (!res.ok) return [];
    return res.json();
  }
);

/* =========================
   SLICE
========================= */
const storeSlice = createSlice({
  name: "store",
  initialState: {
    store: null,
    bestSellers: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStoreData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStoreData.fulfilled, (state, action) => {
        state.store = action.payload;
        state.loading = false;
      })
      .addCase(fetchBestSellers.fulfilled, (state, action) => {
        state.bestSellers = action.payload;
      });
  },
});

export default storeSlice.reducer;
