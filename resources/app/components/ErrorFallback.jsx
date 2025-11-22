import { LegacyCard, EmptyState, Layout } from '@shopify/polaris';
import { useNavigate } from "react-router-dom";
import { useErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {

    const navigate = useNavigate();
    const { resetBoundary } = useErrorBoundary();

    const handleResetRenderer = () => {
        navigate('/');
        resetBoundary();
    }

    return (
        <Layout>
            <Layout.Section>
                <div className="error-fallback">
                    <div className="error-fallback-content">
                        <LegacyCard sectioned>
                            <EmptyState
                                heading="Something went wrong"
                                action={{
                                    content: 'Back To Dashboard',
                                    onAction: handleResetRenderer
                                }}
                                image="/images/server_error.webp"
                            >
                                <p>Please try again!</p>
                                <p>Let us know if it keeps happening</p>
                            </EmptyState>
                        </LegacyCard>
                    </div>
                </div>
            </Layout.Section>
        </Layout>
    );
}

export default ErrorFallback;
