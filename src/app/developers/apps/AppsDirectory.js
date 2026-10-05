'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { getApps } from '@/utils/axiosCalls';
import searchApps from '@/utils/searchApps';
import { Label } from '../Heading';
import { useReveal, revealClass } from '../useReveal';
import { CATEGORIES, PAGE_SIZE } from './apps-config';

const PAGE_URL = '/developers/apps';

function AppIcon({ app }) {
    const [failed, setFailed] = useState(false);

    if (!app.iconurl || failed) {
        return (
            <span className="font-semibold text-[18px]" style={{ color: app.brandcolor || undefined }}>
                {app.name?.trim()?.[0]?.toUpperCase() || '?'}
            </span>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={app.iconurl} alt="" loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-contain" />
    );
}

function AppCard({ app }) {
    return (
        <Link
            href={app.appslugname ? `/integrations/${app.appslugname}` : '/integrations'}
            className="flex items-center gap-3.5 p-4 sm:p-5 rounded-2xl border border-dev-line bg-dev-surface no-underline text-dev-ink transition-all hover:-translate-y-0.5 hover:border-dev-line-2 hover:shadow-[0_1px_1px_rgba(11,13,16,.04),0_24px_60px_-30px_rgba(11,13,16,.25)]"
        >
            <span className="w-11 h-11 p-2 rounded-xl bg-white border border-dev-line grid place-items-center shrink-0 overflow-hidden">
                <AppIcon app={app} />
            </span>
            <b className="text-[16.5px] font-semibold tracking-[-0.01em] min-w-0 break-words">{app.name}</b>
        </Link>
    );
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 gap-3" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="flex items-center gap-3.5 p-4 sm:p-5 rounded-2xl border border-dev-line bg-dev-surface animate-pulse">
                    <span className="w-11 h-11 rounded-xl bg-dev-surface-2 shrink-0" />
                    <span className="h-4 w-24 rounded bg-dev-surface-2" />
                </div>
            ))}
        </div>
    );
}

export default function AppsDirectory({ initialApps = [], appCount }) {
    const [query, setQuery] = useState('');
    const [debounced, setDebounced] = useState('');
    const [category, setCategory] = useState('All');
    const [apps, setApps] = useState(initialApps);
    const [loadedKey, setLoadedKey] = useState(initialApps.length ? 'All|' : null);
    const [hasMore, setHasMore] = useState(initialApps.length >= PAGE_SIZE);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [ref, visible] = useReveal();
    const requestId = useRef(0);

    // Same formula the viaSocket homepage and integrations page use for the headline count.
    const total = appCount ? appCount + 300 : null;
    const key = `${category}|${debounced}`;
    const isLoading = loadedKey !== key;

    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 300);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        if (loadedKey === key) return;
        const id = ++requestId.current;
        setError(false);
        setLoadingMore(false);

        (async () => {
            const list = debounced
                ? await searchApps(debounced)
                : await getApps({ categoryData: [{ name: category }], limit: PAGE_SIZE, offset: 0 }, PAGE_URL);
            if (id !== requestId.current) return;

            // searchApps returns undefined on failure; a category with no apps back means the request failed.
            const failed = !Array.isArray(list) || (!debounced && list.length === 0);
            setApps(failed ? [] : list);
            setHasMore(!failed && !debounced && list.length >= PAGE_SIZE);
            setError(failed);
            setLoadedKey(key);
        })();
    }, [key, loadedKey, category, debounced]);

    async function loadMore() {
        const id = requestId.current;
        setLoadingMore(true);
        const list = await getApps({ categoryData: [{ name: category }], limit: PAGE_SIZE, offset: apps.length }, PAGE_URL);
        if (id !== requestId.current) return;
        setApps((prev) => {
            const seen = new Set(prev.map((a) => a.rowid));
            return prev.concat((list || []).filter((a) => !seen.has(a.rowid)));
        });
        setHasMore(Array.isArray(list) && list.length >= PAGE_SIZE);
        setLoadingMore(false);
    }

    function selectCategory(cat) {
        setQuery('');
        setDebounced('');
        setCategory(cat);
    }

    function onQueryChange(e) {
        setQuery(e.target.value);
        if (category !== 'All') setCategory('All');
    }

    function retry() {
        setLoadedKey(null);
    }

    const searching = Boolean(debounced);
    const countLabel = isLoading
        ? ''
        : error
          ? ''
          : searching
            ? `${apps.length} result${apps.length === 1 ? '' : 's'} for “${debounced}”`
            : `Showing ${apps.length}${hasMore ? '+' : ''} ${category === 'All' ? 'apps' : `${category} apps`}`;

    return (
        <>
            <section className="max-w-[1080px] mx-auto px-[clamp(20px,5vw,64px)] pt-[clamp(40px,6vw,72px)] pb-[clamp(24px,4vw,40px)] grid gap-[clamp(20px,3vw,36px)] justify-items-center text-center">
                <span className="inline-flex items-center gap-2 text-dev-accent bg-dev-accent-soft border border-dev-accent/25 rounded-full px-3.5 py-1.5 font-medium">
                    <i className="w-1.5 h-1.5 rounded-full bg-dev-accent inline-block" />
                    Action layer · app directory
                </span>
                <h1 className="font-semibold tracking-[-0.035em] leading-[1.02] text-[clamp(38px,5.6vw,72px)] mx-auto max-w-[18ch]">
                    AI actions for the apps you already use
                </h1>
                <p className="text-[clamp(17px,1.5vw,20px)] leading-[1.5] text-dev-ink-2 mx-auto max-w-[46ch]">
                    Give your AI agents access to actions across {total ? `${total.toLocaleString('en-US')}+` : 'thousands of'} apps.
                </p>
                <label className="flex items-center gap-3 w-full max-w-[560px] border border-dev-line-2 bg-dev-surface rounded-full px-[18px] py-3 shadow-[0_1px_1px_rgba(11,13,16,.04),0_24px_60px_-30px_rgba(11,13,16,.25)]">
                    <Search size={18} className="text-dev-ink-3 shrink-0" strokeWidth={2} />
                    <input
                        type="search"
                        placeholder="Search app to add to your product"
                        aria-label="Search apps"
                        value={query}
                        onChange={onQueryChange}
                        className="border-0 outline-0 bg-transparent font-[inherit] text-[16px] text-dev-ink w-full placeholder:text-dev-ink-3"
                    />
                </label>
            </section>

            <section ref={ref} className={`max-w-[1080px] mx-auto px-[clamp(20px,5vw,64px)] pb-[clamp(56px,8vw,112px)] ${revealClass(visible)}`}>
                <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-[clamp(24px,4vw,48px)] items-start">
                    <aside className="lg:sticky lg:top-[84px] grid gap-3.5">
                        <Label>Categories</Label>
                        <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    aria-pressed={!searching && category === cat}
                                    onClick={() => selectCategory(cat)}
                                    className={`text-left text-[14.5px] cursor-pointer transition-colors rounded-full border border-dev-line px-3.5 py-2 lg:rounded-[10px] lg:border-0 lg:px-3 lg:py-[9px] ${
                                        !searching && category === cat ? 'bg-dev-ink text-dev-ink-inv' : 'bg-dev-surface lg:bg-transparent text-dev-ink-2 hover:bg-dev-surface-2 hover:text-dev-ink'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </aside>

                    <div className="grid gap-4" aria-live="polite">
                        <div className="min-h-[18px]">
                            <span className="font-dev-mono text-[11.5px] tracking-[0.1em] uppercase text-dev-ink-3">{countLabel}</span>
                        </div>

                        {isLoading && <SkeletonGrid />}

                        {!isLoading && !error && apps.length > 0 && (
                            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 gap-3">
                                {apps.map((app) => (
                                    <AppCard key={app.rowid || app.appslugname} app={app} />
                                ))}
                            </div>
                        )}

                        {!isLoading && !error && apps.length === 0 && (
                            <p className="text-dev-ink-3 text-[15px]">
                                No apps match that search. viaSocket supports {total ? `${total.toLocaleString('en-US')}+` : '2,300+'} apps, so it is very likely covered.{' '}
                                <Link href="/developers#start" className="text-dev-accent font-medium">Ask us</Link>.
                            </p>
                        )}

                        {!isLoading && error && (
                            <p className="text-dev-ink-3 text-[15px]">
                                Couldn&apos;t load apps right now.{' '}
                                <button type="button" onClick={retry} className="text-dev-accent font-medium bg-transparent border-0 p-0 cursor-pointer underline">
                                    Try again
                                </button>
                                .
                            </p>
                        )}

                        {!isLoading && !error && hasMore && (
                            <button
                                type="button"
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="justify-self-center mt-2 inline-flex items-center rounded-full border border-dev-line-2 bg-transparent text-dev-ink font-semibold text-[15px] px-[22px] py-[12px] cursor-pointer transition-transform hover:-translate-y-px disabled:opacity-60 disabled:cursor-default"
                            >
                                {loadingMore ? 'Loading…' : 'Load more apps'}
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
