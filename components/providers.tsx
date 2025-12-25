'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';
import { SiteConfigProvider } from '@/components/providers/site-config-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SiteConfigProvider>
        {children}
        <Toaster />
      </SiteConfigProvider>
    </SessionProvider>
  );
}
