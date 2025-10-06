'use client';

import Link from 'next/link';
import {useEffect, useMemo, useRef, useState} from 'react';

type LinkItem = { label: string; href: string; external?: boolean };

type Props = {
    /** Optional: provide links directly; otherwise it will fetch /nav-links.json */
    links?: LinkItem[];
    /** Where to fetch links if not provided */
    jsonUrl?: string; // default: '/nav-links.json'
    /** Optional extra className to position in your navbar (e.g. 'pr-6') */
    className?: string;
    /** ARIA label for the button */
    buttonLabel?: string;
};

/**
 * One-file hamburger “bubble” menu using your global CSS variables.
 * Colors:
 *  - bars / bubble: var(--BRAND_ROBOT)
 *  - text:          #fff (on dark bubble)
 *  - page bg/others remain your globals
 */
export default function HamburgerMenu(
    {
        links,
        jsonUrl = '/nav-links.json',
        className,
        buttonLabel = 'Open menu',
    }: Props) {
    const [open, setOpen] = useState(false);
    const [loadedLinks, setLoadedLinks] = useState<LinkItem[] | null>(links ?? null);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const btnRef = useRef<HTMLButtonElement | null>(null);

    // Lazy-load links if not supplied
    useEffect(() => {
        if (links?.length) return;
        let alive = true;
        (async () => {
            try {
                const res = await fetch(jsonUrl, {cache: 'no-store'});
                if (!res.ok) throw new Error(`Failed to fetch ${jsonUrl}`);
                const data = (await res.json()) as LinkItem[];
                if (alive) setLoadedLinks(data);
            } catch {
                if (alive) setLoadedLinks([]);
            }
        })();
        return () => {
            alive = false;
        };
    }, [jsonUrl, links]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (wrapRef.current?.contains(t)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    // ESC to close
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    const items = useMemo(() => loadedLinks ?? [], [loadedLinks]);

    return (
        <div
            ref={wrapRef}
            className={['hb-wrap', className ?? ''].join(' ')}
            // positioning is up to parent; this wrapper is relative to allow the bubble/bg
            style={{position: 'relative', zIndex: 2}}
        >
            {/* Button + bars */}
            <button
                ref={btnRef}
                type="button"
                aria-label={buttonLabel}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className={`hb-menu ${open ? 'change' : ''}`}
            >
                <span id="bar1" className="bar"/>
                <span id="bar2" className="bar"/>
                <span id="bar3" className="bar"/>
            </button>

            {/* Bubble background (behind the menu list) */}
            <div className={`menu-bg ${open ? 'change-bg' : ''}`}/>

            {/* Menu list */}
            <nav className={`nav ${open ? 'change' : ''}`} aria-hidden={!open}>
                <ul>
                    {items.map((item) => {
                        const external = item.external || /^https?:\/\//i.test(item.href);
                        return external ? (
                            <li key={item.label}>
                                <a
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setOpen(false)}
                                >
                                    {item.label}
                                </a>
                            </li>
                        ) : (
                            <li key={item.label}>
                                <Link href={item.href} onClick={() => setOpen(false)}>
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Component-scoped styles using your globals */}
            <style jsx>{`
                /* Wrapper inherits background; bubble sits absolutely at top/left */
                .hb-wrap :global(*) {
                    box-sizing: border-box;
                }

                /* Button area */
                .hb-menu {
                    width: 45px;
                    height: 40px;
                    margin: 30px 0 20px 20px;
                    cursor: pointer;
                    display: inline-flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: stretch;
                    gap: 6px; /* visual spacing; bars also use transforms below */
                    background: transparent;
                    border: 0;
                    padding: 0;
                    position: relative;
                    z-index: 2; /* above the bubble */
                }

                .bar {
                    height: 5px;
                    width: 100%;
                    display: block;
                    border-radius: 5px;
                    transition: 0.3s ease;
                    background-color: var(--BRAND_ROBOT);
                }

                /* Initial offsets (match the codepen sample) */
                #bar1 {
                    transform: translateY(-4px);
                }

                #bar3 {
                    transform: translateY(4px);
                }

                /* Menu list */
                .nav {
                    transition: 0.3s ease;
                    display: none;
                    position: absolute;
                    top: 0;
                    left: 0;
                    padding-top: 82px; /* clears the button zone visually */
                    z-index: 2;
                }

                .nav.change {
                    display: block;
                }

                .nav ul {
                    padding: 0 22px;
                    margin: 0;
                }

                .nav li {
                    list-style: none;
                    padding: 12px 0;
                }

                .nav li a {
                    color: #fff;
                    font-size: 20px;
                    text-decoration: none;
                }

                .nav li a:hover {
                    font-weight: bold;
                }

                /* Bubble background behind menu, using BRAND_ROBOT */
                .menu-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 1;
                    width: 0;
                    height: 0;
                    margin: 30px 0 20px 20px;
                    border-radius: 50%;
                    background: radial-gradient(
                            circle,
                            var(--BRAND_ROBOT),
                            var(--BRAND_ROBOT)
                    );
                    transition: 0.3s ease;
                }

                /* Open state transforms (turn bars into "X", lighten bars) */
                .change .bar {
                    background-color: #fff;
                }

                .change #bar1 {
                    transform: translateY(4px) rotateZ(-45deg);
                }

                .change #bar2 {
                    opacity: 0;
                }

                .change #bar3 {
                    transform: translateY(-6px) rotateZ(45deg);
                }

                /* Bubble expansion size/offset — tweak to taste */
                .change-bg {
                    width: 520px;
                    height: 460px;
                    transform: translate(-60%, -30%);
                }

                /* Respect your global background; this component doesn't force page bg */
                :global(body) {
                    background: var(--background);
                    color: var(--foreground);
                    font-family: var(--font-inter), var(--font-sans), sans-serif;
                }
            `}</style>
        </div>
    );
}
