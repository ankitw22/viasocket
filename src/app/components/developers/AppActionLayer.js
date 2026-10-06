'use client';

import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './AppActionLayer.module.css';

export default function AppActionLayer({ data, appname }) {
    if (!data || data.noData) {
        return notFound();
    }

    const {
        appOneDetails,
        metadata,
        faqData = [],
        useCasesNewData = [],
    } = data;

    if (!appOneDetails) {
        return notFound();
    }

    const app = appOneDetails;
    const heroIcon = app?.iconurl;
    const brandColor = app?.brandcolor || '#2B5BFF';

    // Extract actions from use cases or useCasesNewData
    const actions = useCasesNewData?.slice(0, 6) || [];
    const triggers = useCasesNewData?.filter(u => u.triggerType)?.slice(0, 3) || [];

    return (
        <div className={styles.container}>
            <style>{`
                :root {
                    --brand-color: ${brandColor};
                }
            `}</style>

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <Link href="/developers/apps" className={styles.logo}>
                        <span className={styles.logoDot}></span>
                        viaSocket
                    </Link>
                    <nav className={styles.nav}>
                        <a href="/action-layer/">Apps</a>
                        <a href="/auth.html">Managed auth</a>
                        <a href="/pricing.html">Pricing</a>
                        <a href="/#start">Docs</a>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <nav className={styles.breadcrumb}>
                        <a href="/developers/apps">Action layer</a>
                        <span>/</span>
                        <span>{app.name}</span>
                    </nav>

                    <div className={styles.heroIcon} style={{ '--c': brandColor }}>
                        {heroIcon ? (
                            <img src={heroIcon} alt={app.name} />
                        ) : (
                            <span>{app.name?.charAt(0)}</span>
                        )}
                    </div>

                    <h1>Add {app.name} actions to your AI product</h1>
                    <p className={styles.lead}>
                        Give your AI agent the ability to act in {app.name}. Your users connect their own {app.name} account inside your product, and your AI can perform {actions.length || 6} key actions. Authentication, mapping and monitoring are handled by viaSocket.
                    </p>

                    <div className={styles.ctaGroup}>
                        <button className={styles.btnPrimary}>Copy prompt</button>
                        <a href="/#start" className={styles.btnSecondary}>Read docs</a>
                        <span className={styles.ctaNote}>Live in under 15 minutes</span>
                    </div>
                </div>
            </section>

            {/* What AI can do */}
            <section className={styles.section}>
                <h2>What your AI can do in {app.name}</h2>
                <div className={styles.label}>Actions</div>

                <div className={styles.actionsGrid}>
                    {actions.map((action, idx) => (
                        <div key={idx} className={styles.actionCard}>
                            <b>{action.name || `Action ${idx + 1}`}</b>
                            <p>{action.description || 'Perform this action in ' + app.name}</p>
                        </div>
                    ))}
                </div>

                {triggers.length > 0 && (
                    <>
                        <div className={styles.label} style={{ marginTop: '24px' }}>
                            Triggers & webhooks
                        </div>
                        <div className={styles.triggersList}>
                            {triggers.map((trigger, idx) => (
                                <span key={idx} className={styles.trigger}>
                                    <i></i>
                                    {trigger.name || `Trigger ${idx + 1}`}
                                </span>
                            ))}
                        </div>
                        <p className={styles.smallText}>
                            Events in {app.name} flow back into your product so your AI can respond.
                        </p>
                    </>
                )}
            </section>

            {/* How it works */}
            <section className={styles.section}>
                <h2>How the {app.name} AI integration works</h2>

                <div className={styles.flowLine}>
                    <div className={styles.flowStep}>Your AI decides</div>
                    <div className={styles.flowArrow}></div>
                    <div className={styles.flowStep}>Connect {app.name}</div>
                    <div className={styles.flowArrow}></div>
                    <div className={`${styles.flowStep} ${styles.flowStepHub}`}>viaSocket</div>
                    <div className={styles.flowArrow}></div>
                    <div className={styles.flowStep}>Authenticate</div>
                    <div className={styles.flowArrow}></div>
                    <div className={styles.flowStep}>Execute action</div>
                    <div className={styles.flowArrow}></div>
                    <div className={styles.flowStep}>Return result</div>
                </div>

                <div className={styles.stepsGrid}>
                    <div className={styles.step}>
                        <span className={styles.stepNum}>01</span>
                        <b>Your user connects {app.name}</b>
                        <p>A connect flow inside your product. viaSocket manages OAuth, tokens, refresh and reauthorization. <a href="/auth.html">Managed auth →</a></p>
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNum}>02</span>
                        <b>Your AI picks an action</b>
                        <p>It sees only the {app.name} actions this user and tenant are allowed to use. No API docs in its context.</p>
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNum}>03</span>
                        <b>viaSocket executes and verifies</b>
                        <p>Mapping, retries, idempotency and monitoring are handled. Your AI gets a clean result or a clean failure.</p>
                    </div>
                </div>
            </section>

            {/* Multi-tenant */}
            <section className={styles.section}>
                <h2>Built for multi-tenant AI products</h2>
                <div className={styles.stepsGrid}>
                    <div className={styles.step}>
                        <b>Every customer, their own {app.name}</b>
                        <p>Connections, credentials and permissions are isolated per tenant and per user. Nothing is shared.</p>
                    </div>
                    <div className={styles.step}>
                        <b>You control the scopes</b>
                        <p>Decide what your AI may read, write, create or delete in {app.name} for each customer.</p>
                    </div>
                    <div className={styles.step}>
                        <b>See every action</b>
                        <p>Intent, call, response and verified result are recorded per user, so you can debug anything your AI did in {app.name}.</p>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            {faqData && faqData.length > 0 && (
                <section className={styles.section}>
                    <div className={styles.label}>FAQ</div>
                    <h2>{app.name} AI integration questions</h2>

                    <div className={styles.faqList}>
                        {faqData.map((faq, idx) => (
                            <details key={idx} className={styles.faq}>
                                <summary>
                                    {faq.question || faq.title}
                                    <i></i>
                                </summary>
                                <p>{faq.answer || faq.description}</p>
                            </details>
                        ))}
                    </div>
                </section>
            )}

            {/* About */}
            <section className={styles.section}>
                <div className={styles.label}>About</div>
                <div className={styles.aboutHead}>
                    <div className={styles.heroIcon} style={{ '--c': brandColor }}>
                        {heroIcon ? (
                            <img src={heroIcon} alt={app.name} />
                        ) : (
                            <span>{app.name?.charAt(0)}</span>
                        )}
                    </div>
                    <h2>About {app.name}</h2>
                </div>
                <p className={styles.lead}>
                    {app.description || `${app.name} is a powerful platform for business operations. Teams use it to manage workflows, track data and automate processes.`}
                </p>
            </section>

            {/* CTA */}
            <section className={styles.ctaBlock}>
                <h2>Give your AI {app.name} actions today.</h2>
                <p>One prompt adds the action layer to your product. {app.name} and 2,300+ other apps, with managed auth and monitoring.</p>
                <button className={styles.btnPrimary}>Copy prompt</button>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <span><b>viaSocket</b> · a Walkover product</span>
                <span>2,300+ apps · Managed auth · Multi-tenant · Managed mapping · Monitoring</span>
            </footer>
        </div>
    );
}
