import '../js/bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from "react-router-dom";
import '@shopify/polaris/build/esm/styles.css';
import store from './store'
import { Provider } from 'react-redux'
import { router } from "./router";
import '../css/app.css';

const container = document.getElementById('app');

if (container) {
    const root = createRoot(container);
    root.render(
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    );
}
