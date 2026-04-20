import { useEffect, useRef } from 'react';
import './AdSenseSlot.css';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdSenseSlotProps {
  adSlotId?: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
}

const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;

function AdSenseSlot({ adSlotId, format = 'auto' }: AdSenseSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientId || !adRef.current) return;

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-adsbygoogle], script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.setAttribute('data-adsbygoogle', '');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    } else if (existingScript.src.includes(clientId) === false) {
      existingScript.remove();
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      console.warn('AdSense push error', error);
    }
  }, []);

  if (!clientId) {
    return <div className="adsense-placeholder">AdSenseのクライアントIDを設定すると広告が表示されます。</div>;
  }

  return (
    <div className="adsense-wrapper" ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={adSlotId ?? 'auto'}
        data-ad-format={format}
      />
    </div>
  );
}

export default AdSenseSlot;
