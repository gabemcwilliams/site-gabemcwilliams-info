export default function Footer() {
  return (
    <footer
      className="bg-[var(--BG_NAVBAR)] text-[var(--BRAND_LEAF)] w-full
                 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]
                 text-sm"
      aria-labelledby="site-footer"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p id="site-footer" className="sr-only">Site footer</p>

        {/* Row 1: copyright (always first) */}
        <div className="text-center mb-2 text-[13px]">
          © 2025 Gabriel McWilliams
        </div>

        {/* Row 2+: wrap links; separators only on md+ */}
        <nav aria-label="Footer links">
          <ul
            className="flex flex-wrap justify-center items-center
                       gap-x-6 gap-y-2"
          >
            {[
              { href: 'https://github.com/gabemcwilliams', label: 'GitHub' },
              { href: 'https://www.linkedin.com/in/gabemcwilliams/', label: 'LinkedIn' },
              { href: '/contact', label: 'Contact' },
              { href: '/about', label: 'About' },
            ].map((item, i, arr) => (
              <li key={item.href} className="relative">
                <a
                  href={item.href}
                  className="inline-block px-1 py-2
                             hover:text-[var(--BRAND_ROBOT)] focus-visible:outline-2
                             focus-visible:outline-offset-2
                             focus-visible:outline-[var(--BRAND_ROBOT)]
                             transition-colors"
                >
                  {item.label}
                </a>

                {/* separator dot on md+ only, hide after last */}
                {i < arr.length - 1 && (
                  <span
                    className="hidden md:inline-block
                               text-[var(--BRAND_LEAF_DIM)] mx-3 align-middle select-none"
                    aria-hidden="true"
                  >
                    |
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
