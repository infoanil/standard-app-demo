import { createSlice } from "@reduxjs/toolkit"
import { isBoolean } from "lodash";

const initialState = {
    active: false
};

export const loaderSlice = createSlice({
    name: 'loader',
    initialState: initialState,
    reducers: {
        start: (state) => {
            state.active = true;
        },
        stop: (state) => {
            state.active = false;
        },
        load: (state, action) => {
            let active = true;
            if (isBoolean(action.payload)) {
                active = action.payload;
            }

            state.active = active;
        },
        reset: (state) => {
            for (const [key, value] of Object.entries(initialState)) {
                state[key] = value;
            }
        }
    },
})

export const { start, stop, load, reset } = loaderSlice.actions

export default loaderSlice.reducer
