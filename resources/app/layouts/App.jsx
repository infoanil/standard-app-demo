import { Outlet } from "react-router-dom";
import { Navigation } from "../components/Index"
import {useAppBridge} from "@shopify/app-bridge-react";
import {onLCP} from 'web-vitals';

function App() {

    const shopify = useAppBridge();

    const queue = new Set();
    function addToQueue(metric) {
        queue.add(metric);
    }

    function flushQueue() {

        if (queue.size > 0) {

            let body = {
                shop: shopify.config.shop,
                path: window.location.pathname,
                metrics: [],
            };
            queue.forEach((item) => {

                if (item.name === 'LCP') {

                    let elements = [];
                    item.entries.forEach((entry) => {
                        elements.push(entry.element.outerHTML);
                    });

                    item.elements = elements;
                }

                body.metrics.push(item);
            });

            navigator.sendBeacon('/web-vitals', JSON.stringify(body));

            queue.clear();
        }
    }

    onLCP(addToQueue);

    addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            flushQueue();
        }
    });

    window.axios.interceptors.request.use(async (config) => {
        try {
            let token = await shopify.idToken();
            config.headers['Authorization'] = `Bearer ${token}`;
            return config;
        } catch (e) {
            console.error('Failed to load session token', e);
        }
    });

    return (
        <div className="app-section">
            <Navigation />
            <div className="app-content">
                <Outlet />
            </div>
        </div>
    );
}
export default App;
