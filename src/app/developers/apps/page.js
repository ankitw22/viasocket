import Header from '../Header';
import Footer from '../Footer';
import { getAppCount, getApps } from '@/utils/axiosCalls';
import AppsDirectory from './AppsDirectory';
import { PAGE_SIZE, slimApp } from './apps-config';

export const runtime = 'edge';

export async function generateMetadata() {
    return {
        title: 'AI actions for 2,300+ apps · viaSocket Action Layer',
        description: "Give your AI agents access to actions across thousands of apps. Browse AI integrations for HubSpot, Salesforce, Slack, Gmail, Shopify and more.",
    };
}

export default async function AppsPage() {
    const pageUrl = '/developers/apps';
    const [appCount, initialApps] = await Promise.all([
        getAppCount(pageUrl),
        getApps({ limit: PAGE_SIZE, offset: 0 }, pageUrl),
    ]);

    return (
        <>
            <Header />
            <AppsDirectory initialApps={(initialApps || []).map(slimApp)} appCount={appCount} />
            <Footer />
        </>
    );
}
