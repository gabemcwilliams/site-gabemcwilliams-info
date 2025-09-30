// no "use client" here
import SSRPreRenderMask from '@/components/showcase/premiere/spotlight/overlay/SSRPreRenderMask';
import PremiereClient from './PremiereClient';

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function Page({ searchParams }: PageProps) {
  const pick = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
  const num = (v: string | string[] | undefined, fallback: number) => {
    const n = Number(pick(v));
    return Number.isFinite(n) ? n : fallback;
  };

  const cx = num(searchParams?.cx, 960);
  const cy = num(searchParams?.cy, 540);
  const r  = num(searchParams?.r, 150);

  return (
    <>
      {/* SSR placeholder on first paint (zIndex inside component > overlay wrapper) */}
      <SSRPreRenderMask cx={cx} cy={cy} r={r} />
      {/* Your client shell (the old page code moved here) */}
      <PremiereClient />
    </>
  );
}
