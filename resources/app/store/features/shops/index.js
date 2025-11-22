import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { API } from "../../../api";

export const fetchShop = createAsyncThunk(
    'shop/fetchShop',
    async () => {
        let { data } = await API.get('/app/shops/auth');
        return data;
    }
);

export const shopSlice = createSlice({
    name: 'shopStore',
    initialState: {
        shop: {},
        loading: false,
        error: null,
        status: 'idle',
    },
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchShop.pending, (state) => {
            state.loading = true;
            state.status = 'loading';
        })
        builder.addCase(fetchShop.fulfilled, (state, action) => {
            state.loading = false;
            state.status = 'successful';
            state.shop = action.payload?.shop;
        })
        builder.addCase(fetchShop.rejected, (state, action) => {
            state.loading = false;
            state.status = 'failed';
            state.error = action?.error?.message || 'Something went wrong'
        })
    },
})

// export const {  } = shopSlice.actions

export default shopSlice.reducer
