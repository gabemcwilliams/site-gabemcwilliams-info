// app/(showcase)/premiere/page.tsx  (SERVER — no "use client")
import SSRPreRenderMask from '@/components/showcase/premiere/spotlight/overlay/SSRPreRenderMask';
import PremiereClient from './PremiereClient';

export default function Page({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const cx = Number(searchParams.cx) || 960;
  const cy = Number(searchParams.cy) || 540;
  const r  = Number(searchParams.r)  || 150;

  return (
    <>
      {/* SSR placeholder on first paint */}
      <SSRPreRenderMask cx={cx} cy={cy} r={r} />
      {/* Your existing client code */}
      <PremiereClient />
    </>
  );
}
