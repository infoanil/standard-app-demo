import { Image, Layout } from '@shopify/polaris';

function PageNotFound() {
    return (
        <Layout>
            <Layout.Section>
                <div className="page-not-found">
                    <Image width="600px" alt="404 page not found" source="/images/page_not_found.webp" />
                </div>
            </Layout.Section>
        </Layout>
    );
}

export default PageNotFound;
