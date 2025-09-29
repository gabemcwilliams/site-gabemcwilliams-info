export default function Footer() {
  return (
<footer className="bg-[var(--BG_NAVBAR)] text-[var(--BRAND_LEAF)] text-center py-4 text-sm mt-[2rem]">
      <div className="max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-6 md:px-12">
        <p className="space-x-2">
          <span>© 2025 Gabriel McWilliams</span>
          <span className="text-[var(--BRAND_LEAF_DIM)] px-2">┃</span>

          <a
            href="https://github.com/gabemcwilliams"
            className="hover:text-[var(--BRAND_ROBOT)] transition-colors duration-150"
          >
            GitHub
          </a>
          <span className="text-[var(--BRAND_LEAF_DIM)] px-2">┃</span>

          <a
            href="https://www.linkedin.com/in/gabemcwilliams/"
            className="hover:text-[var(--BRAND_ROBOT)] transition-colors duration-150"
          >
            LinkedIn
          </a>
          <span className="text-[var(--BRAND_LEAF_DIM)] px-2">┃</span>

          <a
            href="/about"
            className="hover:text-[var(--BRAND_ROBOT)] transition-colors duration-150"
          >
            About
          </a>
          <span className="text-[var(--BRAND_LEAF_DIM)] px-2">┃</span>

          <a
            href="/contact"
            className="hover:text-[var(--BRAND_ROBOT)] transition-colors duration-150"
          >
            Contact
          </a>
        </p>
      </div>
    </footer>
  );
}
