import { sendErrorMessage } from './SendErrorMessage';
import axios from 'axios';
import { APPERPAGE } from '@/const/integrations';
import { ABTESTCOUNT } from '@/const/tables';
import { setupCache } from 'axios-cache-interceptor';

const axiosWithCache = setupCache(axios);

// The A/B tracking table lives in its own database with its own auth key, so it
// does not go through getDataFromTable like the content tables do.
const abTestTableUrl = () =>
    `${process.env.NEXT_PUBLIC_DB_BASE_URL}/65c4c053a3fad7804af5bba8/${ABTESTCOUNT}`;

const abTestHeaders = () => ({
    'auth-key': `${process.env.NEXT_PUBLIC_DB_KEY_ABTEST}`,
    'Content-Type': 'application/json',
});

// Kept well clear of the API's cap: a limit of 500 silently returns zero rows
// (400 is still fine), which would look like a visitor with no history.
const ABTEST_LOOKUP_LIMIT = 200;

// Every column an upsert has to read before it can write: the visitor summary,
// the counters, and the interaction history that must be appended to rather than
// replaced.
const ABTEST_ROW_FIELDS = [
    'rowid',
    'autonumber',
    'name',
    'user_id',
    'varient',
    'view_count',
    'revisit_count',
    'environment',
    'utmdata',
    'signup',
    'timestamp',
    'click_data',
    'page_data',
    'last_action',
    'last_action_at',
    'first_url',
    'last_url',
    'session_id',
    'last_visit_at',
    'createdat',
].join(',');

export async function getDataFromTable(table, query, pageUrl) {
    const apiUrl = `${process.env.NEXT_PUBLIC_DB_BASE_URL}/65d2ed33fa9d1a94a5224235/${table}${query ? query : ''}`;

    try {
        const response = await axiosWithCache.get(apiUrl, {
            headers: {
                'auth-key': `${process.env.NEXT_PUBLIC_DB_KEY}`,
            },
            cache: {
                ttl: 1000 * 60 * 20, // Cache for 20 minutes
                interpretHeader: false,
            },
        });
        return response?.data;
    } catch (error) {
        console.error(error?.response?.data || error.message);
        sendErrorMessage({ error, pageUrl, source: apiUrl });
    }
}

export async function getLiveSupportData(pageUrl) {
    const url = `https://plugservice-api.viasocket.com/get-support-data`;
    try {
        const response = await axiosWithCache.get(url, {});
        return response?.data?.count?.rows || [];
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: url,
        });

        return [];
    }
}

export async function getBlogs(pageUrl) {
    const baseUrl = `https://table-api.viasocket.com/66029bf861a15927654de175/tblngzrs5`;
    const limit = 200;
    let allBlogs = [];
    let offset = 0;
    let hasMore = true;

    try {
        while (hasMore) {
            const url = `${baseUrl}?limit=${limit}&offset=${offset}`;
            const response = await axiosWithCache.get(url, {
                headers: {
                    'auth-key': process.env.NEXT_PUBLIC_BLOG_DB_KEY,
                    'Content-Type': 'application/json',
                },
                cache: {
                    ttl: 1000 * 60 * 60, //cache for 1 hour
                    interpretHeader: false,
                },
            });

            const blogs = response?.data?.data?.rows || [];
            allBlogs = [...allBlogs, ...blogs];

            // If we got fewer than 'limit' records, we've fetched all data
            if (blogs.length < limit) {
                hasMore = false;
            } else {
                offset += limit;
            }
        }

        return allBlogs;
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: baseUrl,
        });
        return [];
    }
}

export async function getIndustries(pageUrl) {
    const url = `https://table-api.viasocket.com/65d2ed33fa9d1a94a5224235/tblxy04hk`;
    try {
        const response = await axiosWithCache.get(url, {
            headers: {
                'auth-key': process.env.NEXT_PUBLIC_DB_KEY,
                'Content-Type': 'application/json',
            },
            cache: {
                ttl: 1000 * 60 * 20, //cache for 20 min
                interpretHeader: false,
            },
        });
        return response?.data?.data?.rows || [];
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: url,
        });
        return [];
    }
}

export async function getDepartments(pageUrl) {
    const url = `https://table-api.viasocket.com/65d2ed33fa9d1a94a5224235/tbluyx8o1`;
    try {
        const response = await axiosWithCache.get(url, {
            headers: {
                'auth-key': `${process.env.NEXT_PUBLIC_DB_KEY}`,
                'Content-Type': 'application/json',
            },
            cache: {
                ttl: 1000 * 60 * 20, //cache for 20 min
                interpretHeader: false,
            },
        });
        return response?.data?.data?.rows || [];
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: url,
        });
        return [];
    }
}

export async function getVideos(pageUrl) {
    const url = `https://table-api.viasocket.com/65d2ed33fa9d1a94a5224235/tblh3g587`;
    try {
        const response = await axiosWithCache.get(url, {
            headers: {
                'auth-key': `${process.env.NEXT_PUBLIC_DB_KEY}`,
                'Content-Type': 'application/json',
            },
            cache: {
                ttl: 1000 * 60 * 60, // cache for 1 hour
                interpretHeader: false,
            },
        });
        return response?.data?.data?.rows || [];
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: url,
        });
        return [];
    }
}

export async function getTemplates(pageUrl) {
    const url = `${process.env.NEXT_PUBLIC_INTEGRATION_URL}templates/all`;
    try {
        const response = await axios.get(url);
        return response?.data?.data?.templates || [];
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: url,
        });
        return [];
    }
}

export async function getApps(query, pageUrl) {
    const category = query?.categoryData?.length > 0 ? query?.categoryData[0]?.name : 'All';
    const fetchUrl = `${process.env.NEXT_PUBLIC_INTEGRATION_URL}api/v1/plugins/all`;
    const params = {
        category: (category !== 'All' && category) || '',
        preferred_auth_type: 'Auth2.0', // OAuth 2.0 apps only
        limit: query?.limit || APPERPAGE,
        // Callers that page by route pass `page` and step by APPERPAGE; callers
        // that load in their own batch size pass `offset` directly.
        offset: query?.offset ?? (query?.page ? query?.page * APPERPAGE : 0),
    };

    try {
        const response = await axiosWithCache.get(fetchUrl, {
            params,
            cache: {
                ttl: 1000 * 60 * 20, //cache for 20 min
                interpretHeader: false,
            },
        });
        const apps = response?.data?.data;
        return apps || [];
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: fetchUrl,
        });
        return [];
    }
}

// The usecases API filters by one app at a time — repeated `app` params make it
// error — so callers ask for each selected app separately.
export async function getUsecases(app, pageUrl) {
    const url = `https://viasocket.com/automation-ideas/api/usecases`;
    try {
        const response = await axiosWithCache.get(url, {
            params: { app },
            cache: {
                ttl: 1000 * 60 * 20, // cache for 20 min
                interpretHeader: false,
            },
        });
        return response?.data?.data || [];
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: url,
        });
        return [];
    }
}

export async function getCombos(pageInfo, pageUrl) {
    if (pageInfo?.appone) {
        const url = `${process.env.NEXT_PUBLIC_INTEGRATION_URL}api/v1/plugins/recommend/integrations?service=${pageInfo?.appone}${pageInfo?.apptwo && pageInfo?.apptwo != null ? '&service=' + pageInfo.apptwo : ''}`;
        try {
            const response = await axiosWithCache.get(url, {
                cache: {
                    ttl: 1000 * 60 * 20, // cache for 20 min
                    interpretHeader: false,
                },
            });
            return response?.data;
        } catch (error) {
            sendErrorMessage({
                error,
                pageUrl,
                source: url,
            });
            return null;
        }
    }
}

export async function fetchPluginData(slug, pageUrl) {
    let data = null;
    const url = `${process.env.NEXT_PUBLIC_INTEGRATION_URL}plugins/search?prefix=${slug[0]}`;
    try {
        const response = await axiosWithCache.get(url, {
            cache: {
                ttl: 1000 * 60 * 20, // cache for 20 min
                interpretHeader: false,
            },
        });
        data = response.data;
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: url,
        });
    }
    return data;
}

export async function getMeta(pageUrl) {
    const apiUrl = `${process.env.NEXT_PUBLIC_DB_BASE_URL}/65d2ed33fa9d1a94a5224235/tbl2bk656`;

    try {
        const response = await axiosWithCache.get(apiUrl, {
            headers: {
                'auth-key': `${process.env.NEXT_PUBLIC_DB_KEY}`,
            },
            cache: {
                ttl: 1000 * 60 * 20, // Cache for 20 minutes
                interpretHeader: false,
            },
        });
        return response?.data?.data?.rows;
    } catch (error) {
        console.error(error?.response?.data || error.message);
        sendErrorMessage({ error, pageUrl, source: apiUrl });
    }
}

export async function getFaq(pageUrl) {
    const apiUrl = `${process.env.NEXT_PUBLIC_DB_BASE_URL}/65d2ed33fa9d1a94a5224235/tblnoi7ng`;

    try {
        const response = await axiosWithCache.get(apiUrl, {
            headers: {
                'auth-key': `${process.env.NEXT_PUBLIC_DB_KEY}`,
            },
            cache: {
                ttl: 1000 * 60 * 20, // Cache for 20 minutes
                interpretHeader: false,
            },
        });
        return response?.data?.data?.rows;
    } catch (error) {
        console.error(error?.response?.data || error.message);
        sendErrorMessage({ error, pageUrl, source: apiUrl });
    }
}

export async function getAppCount(pageUrl) {
    const apiUrl = `${process.env.NEXT_PUBLIC_INTEGRATION_URL}get-apps-count`;

    try {
        const response = await axiosWithCache.get(apiUrl, {
            cache: {
                ttl: 1000 * 60 * 20, // Cache for 20 minutesr
                interpretHeader: false,
            },
        });
        const count = response.data.count;
        return Math.ceil(count / 100) * 100;
    } catch (error) {
        console.log(error?.response?.data || error.message, 'errormesssageeeee');
        sendErrorMessage({ error, pageUrl, source: apiUrl });
    }
}

export async function getClientStories(pageUrl) {
    const url = `https://api.docstar.io/p/getSideBarData?collectionId=EVBBQjKlmMxW`;
    try {
        const response = await axiosWithCache.get(url, {
            cache: {
                ttl: 1000 * 60 * 20, // cache for 20 min
                interpretHeader: false,
            },
        });
        return response?.data?.pages || {};
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: url,
        });
        return {};
    }
}

export async function trackRedditEvent(eventName, { event_source_url, click_id } = {}, pageUrl) {
    // Only fire Reddit Conversion API in production; skip on local/test
    if (process.env.NEXT_PUBLIC_PRODUCTION_ENVIRONMENT !== 'prod') {
        return null;
    }
    const url = `${process.env.NEXT_PUBLIC_INTEGRATION_URL}api/reddit/${eventName}`;
    try {
        const { data } = await axios.post(
            url,
            { event_source_url, click_id },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return data;
    } catch (error) {
        sendErrorMessage({ error, pageUrl: pageUrl || event_source_url, source: url });
        return null;
    }
}

export async function getCategoryBlogs(query, pageUrl) {
    const category =
        query?.categoryData?.length > 0
            ? query?.categoryData[0]?.name.toLowerCase() === 'all'
                ? ''
                : query?.categoryData[0]?.name
            : '';
    const searchQuery = category.replace(/-/g, ' ');
    const fetchUrl = `https://viasocket.com/discovery/api/blog?search=${encodeURIComponent(searchQuery)}`;
    try {
        const response = await axiosWithCache.get(fetchUrl, {
            headers: {
                env: 'prod',
            },
            cache: {
                ttl: 1000 * 60 * 20, //cache for 20 min
                interpretHeader: false,
            },
        });
        const blogs = response?.data?.data?.blogs;
        return blogs || [];
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: fetchUrl,
        });
        return [];
    }
}

/**
 * Every row the table holds for one visitor, oldest first.
 *
 * There should only ever be one — the tracker upserts — but rows written before
 * that was true, and rows created by two tabs racing, are returned too so the
 * caller can collapse them into the oldest.
 *
 * Deliberately not axiosWithCache: the table answers reads with
 * cache-control: max-age=172800, so a repeated lookup would be served a
 * two-day-old row. The timestamp defeats the CDN copy as well.
 */
export async function getAbTestVisitorRows(visitorId, pageUrl) {
    // The visitor id lives inside the JSON kept in `name`, so it is matched with
    // LIKE; ordering by autonumber makes "the oldest row" the same answer for
    // every concurrent request, which is what keeps them from disagreeing about
    // which row survives.
    const params = new URLSearchParams({
        filter: `name LIKE '%${visitorId}%'`,
        fields: ABTEST_ROW_FIELDS,
        sort: 'autonumber',
        limit: String(ABTEST_LOOKUP_LIMIT),
        _: String(Date.now()),
    });

    const url = `${abTestTableUrl()}?${params.toString()}`;

    try {
        const response = await axios.get(url, { headers: abTestHeaders() });
        return response?.data?.data?.rows || [];
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: url,
        });
        return null;
    }
}

export async function saveAbTestVisit(record, pageUrl) {
    const url = abTestTableUrl();

    try {
        // Inserts go in a records array; the response carries the new row.
        const response = await axios.post(url, { records: [record] }, { headers: abTestHeaders() });
        return response?.data?.data?.[0] || null;
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: url,
        });
        return null;
    }
}

/**
 * Rewrites the given columns of one row, addressed by rowid.
 *
 * This is how a repeat visit is recorded: the visitor already has a row, so their
 * counters are updated in place instead of another row being inserted.
 */
export async function updateAbTestVisit(rowid, fields, pageUrl) {
    // The rowid goes straight into the where clause, so only the shape the table
    // itself hands back is accepted.
    if (!/^row[a-z0-9]+$/i.test(rowid || '')) return null;

    const url = abTestTableUrl();

    try {
        const response = await axios.patch(
            url,
            { records: [{ where: `rowid = '${rowid}'`, fields }] },
            { headers: abTestHeaders() }
        );
        return response?.data?.data ?? true;
    } catch (error) {
        sendErrorMessage({
            error,
            pageUrl,
            source: url,
        });
        return null;
    }
}
