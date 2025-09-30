// app/(showcase)/premiere/page.tsx
import SSRPreRenderMask from '@/components/showcase/premiere/spotlight/overlay/SSRPreRenderMask';
import PremiereClient from './PremiereClient';

export default function Page({ searchParams }: any) {
  const pick = (v: any) => Array.isArray(v) ? v[0] : v;
  const num  = (v: any, fallback: number) => {
    const n = Number(pick(v));
    return Number.isFinite(n) ? n : fallback;
  };

  const cx = num(searchParams?.cx, 960);
  const cy = num(searchParams?.cy, 540);
  const r  = num(searchParams?.r, 150);

  return (
    <>
      <SSRPreRenderMask cx={cx} cy={cy} r={r} />
      <PremiereClient />
    </>
  );
}
