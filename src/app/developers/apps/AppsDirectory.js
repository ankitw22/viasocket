'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getApps } from '@/utils/axiosCalls';
import searchApps from '@/utils/searchApps';
import { Label } from '../Heading';
import { useReveal, revealClass } from '../useReveal';
import { CATEGORIES, PAGE_SIZE, slimApp } from './apps-config';

const PAGE_URL = '/developers/apps';

// The limit must stay constant: the API orders results differently for different
// limits, so a varying limit makes neighbouring pages overlap.
const fetchPage = (category, page) =>
    getApps({ categoryData: [{ name: category }], limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, authType: 'Auth2.0' }, PAGE_URL);

const dedupe = (list, seen = new Set()) =>
    list.filter((a) => {
        if (seen.has(a.rowid)) return false;
        seen.add(a.rowid);
        return true;
    });

// Compact icon tiles: the logo carries the tile, the name is a small caption (full name on hover).
const TILE =
    'flex flex-col items-center justify-center gap-1.5 h-[84px] lg:h-auto px-2 rounded-2xl border border-dev-line bg-dev-surface text-center';

const GRID = 'flex-1 grid grid-cols-4 sm:grid-cols-6 lg:grid-rows-6 gap-2.5';

function AppIcon({ app }) {
    const [failed, setFailed] = useState(false);

    if (!app.iconurl || failed) {
        return (
            <span className="w-full h-full grid place-items-center rounded-lg bg-dev-surface-2 font-semibold text-[16px]" style={{ color: app.brandcolor || undefined }}>
                {app.name?.trim()?.[0]?.toUpperCase() || '?'}
            </span>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={app.iconurl} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} className="w-full h-full object-contain" />
    );
}

function AppCard({ app }) {
    return (
        <Link
            href={app.appslugname ? `/integrations/${app.appslugname}` : '/integrations'}
            aria-label={app.name}
            className={`${TILE} group relative hover:z-10 focus-visible:z-10 no-underline text-dev-ink transition-all hover:-translate-y-0.5 hover:border-dev-line-2 hover:shadow-[0_1px_1px_rgba(11,13,16,.04),0_24px_60px_-30px_rgba(11,13,16,.25)]`}
        >
            <span className="w-8 h-8 sm:w-9 sm:h-9 shrink-0">
                <AppIcon app={app} />
            </span>
            <span className="block w-full truncate text-[11.5px] leading-none text-dev-ink-2">{app.name}</span>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-lg bg-dev-ink text-dev-ink-inv text-[12px] font-medium leading-none px-2.5 py-[7px] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
                {app.name}
            </span>
        </Link>
    );
}

function SkeletonGrid() {
    return (
        <div className={GRID} aria-hidden="true">
            {Array.from({ length: PAGE_SIZE }, (_, i) => (
                <div key={i} className={`${TILE} animate-pulse`}>
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-dev-surface-2 shrink-0" />
                    <span className="h-2.5 w-14 rounded bg-dev-surface-2" />
                </div>
            ))}
        </div>
    );
}

const PAGER_BTN =
    'inline-flex items-center gap-1.5 rounded-full font-semibold text-[14.5px] px-[22px] py-[12px] cursor-pointer transition-[transform,background-color,opacity] hover:-translate-y-px disabled:opacity-60 disabled:cursor-default disabled:hover:translate-y-0';

export default function AppsDirectory({ initialApps = [], appCount }) {
    const [query, setQuery] = useState('');
    const [debounced, setDebounced] = useState('');
    const [category, setCategory] = useState('All');
    // The page number only counts for the list it was set on, so switching
    // category or search lands back on page 1 with no reset effect.
    const [paging, setPaging] = useState({ scope: 'b|All', page: 1 });
    const [loaded, setLoaded] = useState(() =>
        initialApps.length
            ? { key: 'b|All|1', scope: 'b|All', apps: dedupe(initialApps), hasNext: initialApps.length >= PAGE_SIZE, error: false }
            : null,
    );
    const [ref, visible] = useReveal();
    const gridRef = useRef(null);
    const requestId = useRef(0);
    // Raw API pages by "category|page", so Previous/Next are instant and every
    // page can be de-duplicated against the ones before it.
    const cache = useRef(null);
    if (!cache.current) cache.current = new Map(initialApps.length ? [['All|1', initialApps]] : []);

    // Same formula the viaSocket homepage and integrations page use for the headline count.
    const total = appCount ? appCount + 300 : null;
    const searching = Boolean(debounced);
    const scope = searching ? `s|${debounced}` : `b|${category}`;
    const page = paging.scope === scope ? paging.page : 1;
    // Search loads every match once and pages locally, so its key ignores the page.
    const key = searching ? scope : `${scope}|${page}`;
    const isLoading = loaded?.key !== key;
    const changingPage = isLoading && loaded?.scope === scope;

    async function getRaw(cat, p) {
        const k = `${cat}|${p}`;
        if (cache.current.has(k)) return cache.current.get(k);
        const list = (await fetchPage(cat, p))?.map(slimApp) ?? [];
        if (list.length) cache.current.set(k, list);
        return list;
    }

    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 300);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        if (loaded?.key === key) return;
        const id = ++requestId.current;

        (async () => {
            if (searching) {
                const list = await searchApps(debounced);
                if (id !== requestId.current) return;
                // Filter search results to OAuth 2.0 only
                const auth2Only = Array.isArray(list) ? list.filter(a => a.preferedauthtype === 'Auth2.0') : [];
                setLoaded({ key, scope, apps: dedupe(auth2Only.map(slimApp)), hasNext: false, error: !Array.isArray(list) });
                return;
            }

            const raw = await getRaw(category, page);
            if (id !== requestId.current) return;

            // Past the last page (the list ended on an exact multiple of the page size): step back.
            if (!raw.length && page > 1) {
                setPaging({ scope, page: page - 1 });
                return;
            }

            // getApps swallows failures into []; page 1 of a category is never legitimately empty.
            if (!raw.length) {
                setLoaded({ key, scope, apps: [], hasNext: false, error: true });
                return;
            }

            const seen = new Set();
            for (let i = 1; i < page; i += 1) (cache.current.get(`${category}|${i}`) || []).forEach((a) => seen.add(a.rowid));
            setLoaded({ key, scope, apps: dedupe(raw, seen), hasNext: raw.length >= PAGE_SIZE, error: false });
        })();
    }, [key, loaded, searching, debounced, category, page, scope]);

    // Fetch the next page ahead of time: Next becomes instant, and a full page
    // followed by nothing (the true last page) turns Next off.
    useEffect(() => {
        if (searching || loaded?.key !== key || !loaded.hasNext) return;
        let cancelled = false;
        getRaw(category, page + 1).then((next) => {
            if (cancelled || next.length) return;
            setLoaded((l) => (l && l.key === key ? { ...l, hasNext: false } : l));
        });
        return () => {
            cancelled = true;
        };
    }, [loaded, key, searching, category, page]);

    const all = loaded?.apps || [];
    const items = searching ? all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : all;
    const hasNext = searching ? all.length > page * PAGE_SIZE : Boolean(loaded?.hasNext);
    const error = !isLoading && Boolean(loaded?.error);
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = start + items.length - 1;

    let countLabel = '';
    if (!isLoading && !error && items.length) {
        countLabel = searching
            ? `${all.length} result${all.length === 1 ? '' : 's'} for “${debounced}”${all.length > PAGE_SIZE ? ` · showing ${start}–${end}` : ''}`
            : `${category === 'All' ? 'All apps' : category} · showing ${start}–${end}`;
    }

    function goTo(n) {
        setPaging({ scope, page: n });
        const el = gridRef.current;
        if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function selectCategory(cat) {
        setQuery('');
        setDebounced('');
        setCategory(cat);
        setPaging({ scope: `b|${cat}`, page: 1 });
    }

    function onQueryChange(e) {
        const v = e.target.value;
        setQuery(v);
        if (!v.trim()) setDebounced('');
    }

    function retry() {
        setLoaded(null);
    }

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
                {/* Both columns stretch to one height: the grid fills the space and the pager lands level with the last category. */}
                <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-[clamp(24px,4vw,48px)]">
                    <aside className="grid gap-3.5 content-start">
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

                    <div className="flex flex-col gap-4">
                        <p className="sr-only" role="status">{countLabel}</p>
                        {/* Spacer so the grid starts level with the first category, now that the count line is gone. */}
                        <div className="hidden lg:block h-[7px]" aria-hidden="true" />

                        <div ref={gridRef} className="scroll-mt-24 flex flex-col flex-1 sm:min-h-[554px] lg:min-h-0" aria-busy={isLoading}>
                            {isLoading && !changingPage && <SkeletonGrid />}

                            {!error && items.length > 0 && (isLoading ? changingPage : true) && (
                                <div className={`${GRID} transition-opacity ${changingPage ? 'opacity-50' : ''}`}>
                                    {items.map((app) => (
                                        <AppCard key={app.rowid || app.appslugname} app={app} />
                                    ))}
                                </div>
                            )}

                            {!isLoading && !error && items.length === 0 && (
                                <p className="text-dev-ink-3 text-[15px]">
                                    No apps match that search. viaSocket supports {total ? `${total.toLocaleString('en-US')}+` : '2,300+'} apps, so it is very likely covered.{' '}
                                    <Link href="/developers#start" className="text-dev-accent font-medium">Ask us</Link>.
                                </p>
                            )}

                            {error && (
                                <p className="text-dev-ink-3 text-[15px]">
                                    Couldn&apos;t load apps right now.{' '}
                                    <button type="button" onClick={retry} className="text-dev-accent font-medium bg-transparent border-0 p-0 cursor-pointer underline">
                                        Try again
                                    </button>
                                    .
                                </p>
                            )}
                        </div>

                        {!error && (!isLoading || changingPage) && (page > 1 || hasNext) && (
                            <nav aria-label="Pagination" className="flex items-center justify-end gap-3">
                                {page > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => goTo(page - 1)}
                                        disabled={isLoading}
                                        className={`${PAGER_BTN} bg-dev-surface text-dev-ink border border-dev-line-2 hover:bg-dev-surface-2`}
                                    >
                                        <ChevronLeft size={16} /> Previous
                                    </button>
                                )}
                                {/* Kept in place (just hidden) on the last page so Previous never slides across. */}
                                <button
                                    type="button"
                                    onClick={() => goTo(page + 1)}
                                    disabled={isLoading || !hasNext}
                                    aria-hidden={!hasNext}
                                    tabIndex={hasNext ? 0 : -1}
                                    className={`${PAGER_BTN} bg-dev-ink text-dev-ink-inv border-0 ${hasNext ? '' : 'invisible'}`}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </nav>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
