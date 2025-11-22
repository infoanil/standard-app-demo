import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

let resolve = () => {};
let reject = () => {};

const initialState = {
    id: 'confirm-modal',
    active: false,
    title: 'Confirm',
    message: 'Are you sure you want to proceed?',
    tone: 'default',
    options: {
        primaryAction: {
            content: 'Yes',
            tone: 'default',
            loading: false,
            disabled: false
        },
        secondaryActions: [{
            content: 'No',
            tone: 'default',
            loading: false,
            disabled: false
        }]
    }
};

export const confirm = createAsyncThunk(
    'confirm/confirm',
    async (args, thunkAPI) => {

        thunkAPI.dispatch(initialize(args));

        return await new Promise((resolveFn, rejectFn) => {
            resolve = resolveFn;
            reject = rejectFn;
        });
    }
);

export const confirmSlice = createSlice({
    name: 'confirm',
    initialState: initialState,
    reducers: {
        agree: (state) => {
            for (const [key, value] of Object.entries(initialState)) {
                state[key] = value;
            }
            resolve(true);
        },

        close: (state) => {
            for (const [key, value] of Object.entries(initialState)) {
                state[key] = value;
            }
            resolve(false);
        },

        initialize: (state, action) => {

            for (const [key, value] of Object.entries(initialState)) {
                state[key] = value;
            }

            let { title, message, tone = 'default', options = {} } = action.payload;

            state.active = true;

            if (title) state.title = title;
            if (message) state.message = message;

            let primaryAction = state.options.primaryAction;
            if (tone) primaryAction.tone = tone;
            if(options && options.primaryAction) {
                for (const [key, value] of Object.entries(options.primaryAction)) {
                    if (value) primaryAction[key] = value;
                }
            }
            state.options.primaryAction = primaryAction;

            let secondaryActions = state.options.secondaryActions;

            if(options && options.secondaryActions && options.secondaryActions.length) {
                options.secondaryActions.forEach((secondaryAction, index) => {
                    for (const [key, value] of Object.entries(secondaryAction)) {
                        if (value) secondaryActions[index][key] = value;
                    }
                });
            }

            if (options && options.secondaryActions && !options.secondaryActions?.length) {
                 secondaryActions = []
            }

            state.options.secondaryActions = secondaryActions;
        },

        reset: (state) => {
            for (const [key, value] of Object.entries(initialState)) {
                state[key] = value;
            }
        }
    },
})

export const { agree, close, initialize, reset } = confirmSlice.actions

export default confirmSlice.reducer
