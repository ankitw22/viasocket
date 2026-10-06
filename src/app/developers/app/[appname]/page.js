import { notFound } from 'next/navigation';
import { getIntegrationsPageData } from '../../../lib/integration-data';
import { getApps } from '@/utils/axiosCalls';
import AppActionLayer from '@/app/components/developers/AppActionLayer';
import { getHasToken } from '../../../lib/getAuth';

export const runtime = 'edge';

// Verify the app is OAuth 2.0 only
async function isOAuth2App(appSlug, pageUrl) {
    try {
        const apps = await getApps(
            { authType: 'Auth2.0', limit: 200 },
            pageUrl
        );
        return apps.some(app => app.appslugname === appSlug);
    } catch {
        return false;
    }
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const appname = resolvedParams?.appname;

    if (!appname) return { title: '404 - Page not found' };

    try {
        const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://viasocket.com'}/developers/app/${appname}`;

        // Verify OAuth 2.0
        const isAuth2 = await isOAuth2App(appname, pageUrl);
        if (!isAuth2) {
            return { title: '404 - Page not found' };
        }

        const data = await getIntegrationsPageData([appname]);

        if (data.noData) {
            return {
                title: '404 - Page not found',
                description: 'The page you are looking for does not exist.',
            };
        }

        const { metadata, appOneDetails } = data;
        let title = metadata?.title || `${appname} - viaSocket`;
        let description = metadata?.description || `Add ${appname} actions to your AI product`;

        if (appOneDetails?.name) {
            title = title.replace(/\[AppOne\]/g, appOneDetails.name);
            description = description.replace(/\[AppOne\]/g, appOneDetails.name);
        }

        return {
            title,
            description,
            keywords: metadata?.keywords,
            openGraph: {
                title,
                description,
                images: metadata?.image ? [{ url: metadata.image }] : undefined,
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: metadata?.image ? [metadata.image] : undefined,
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: '404 - Page not found',
        };
    }
}

export default async function AppActionPage({ params }) {
    const resolvedParams = await params;
    const appname = resolvedParams?.appname;

    if (!appname) {
        notFound();
    }

    const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://viasocket.com'}/developers/app/${appname}`;
    const hasToken = await getHasToken();

    // Verify the app is OAuth 2.0
    const isAuth2 = await isOAuth2App(appname, pageUrl);
    if (!isAuth2) {
        notFound();
    }

    const data = await getIntegrationsPageData([appname]);

    if (data.noData) {
        notFound();
    }

    return <AppActionLayer data={data} hasToken={hasToken} appname={appname} />;
}
