import { useEffect, useState, type ReactNode, lazy, Suspense } from "react";

// Lazy-load the actual provider so Particle SDK is never imported during SSR
const ParticleProviderInner = lazy(() =>
  import("./ParticleProviderInner").then((m) => ({ default: m.ParticleProviderInner }))
);

export function ParticleProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<>{children}</>}>
      <ParticleProviderInner>{children}</ParticleProviderInner>
    </Suspense>
  );
}
