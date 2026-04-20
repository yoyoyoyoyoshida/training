import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import styles from './QrCode.module.css';

interface QrCodeProps {
  url: string;
  size?: number;
}

function QrCode({ url, size = 128 }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const generate = async () => {
      try {
        const result = await QRCode.toDataURL(url, { width: size, margin: 1 });
        if (isMounted) {
          setDataUrl(result);
        }
      } catch (error) {
        console.error('Failed to generate QR code', error);
      }
    };

    generate();

    return () => {
      isMounted = false;
    };
  }, [url, size]);

  return (
    <div className={styles['qr-block']}>
      {dataUrl ? (
        <img
          className={styles['qr-image']}
          src={dataUrl}
          alt="2side PLL App Store QR"
          width={size}
          height={size}
        />
      ) : (
        <div className={styles['qr-image']} style={{ width: size, height: size }} />
      )}
    </div>
  );
}

export default QrCode;
