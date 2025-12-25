'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { SiteConfig } from '@/types';

const defaultSiteConfig: SiteConfig = {
  siteName: 'SANHUB',
  siteTagline: 'Let Imagination Come Alive',
  siteDescription: '「SANHUB」是专为 AI 创作打造的一站式平台',
  siteSubDescription: '我们融合了 Sora 视频生成、Gemini 图像创作与多模型 AI 对话。在这里，技术壁垒已然消融，你唯一的使命就是释放纯粹的想象。',
  contactEmail: 'support@sanhub.com',
  copyright: 'Copyright © 2025 SANHUB',
  poweredBy: 'Powered by OpenAI Sora & Google Gemini',
};

const SiteConfigContext = createContext<SiteConfig>(defaultSiteConfig);

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaultSiteConfig);

  useEffect(() => {
    fetch('/api/site-config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setConfig(data.data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}
