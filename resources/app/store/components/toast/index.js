import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

let resolve = () => {};
let reject = () => {};

const initialState = {
    active: false,
    content: 'Processed successfully',
    duration: 3000,
    error: false
};

export const toast = createAsyncThunk(
    'toast/toast',
    async (args, thunkAPI) => {

        thunkAPI.dispatch(initialize(args));

        return await new Promise((resolveFn, rejectFn) => {
            resolve = resolveFn;
            reject = rejectFn;
        });
    }
);

export const toastSlice = createSlice({
    name: 'toast',
    initialState: initialState,
    reducers: {
        close: (state) => {
            resolve(false);
            state.active = false;
        },

        initialize: (state, action) => {

            for (const [key, value] of Object.entries(initialState)) {
                state[key] = value;
            }

            let { content, error = false, duration = null} = action.payload;

            state.active = true;

            if (content) state.content = content;
            if (error) state.error = error;
            if (duration) state.duration = duration;
        },

        reset: (state) => {
            for (const [key, value] of Object.entries(initialState)) {
                state[key] = value;
            }
        }
    },
})

export const { close, initialize, reset } = toastSlice.actions

export default toastSlice.reducer
