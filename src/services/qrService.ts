/**
 * QR Code Generation & Export Service
 * Produces high-contrast QR codes with proper quiet zones, PNG/SVG downloads,
 * and handles public profile routing URLs.
 */
import QRCode from 'qrcode';

export interface QrOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export function getPublicBaseUrl(): string {
  // Use active window origin so QR code links directly to the current working application
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  // Default to development origin
  return 'https://ais-dev-fujobwwzr2h7c67ckhofic-427703154761.asia-southeast1.run.app';
}

export function getPublicUrlForToken(token: string, domainMode: 'app' | 'skypec' = 'app'): string {
  if (domainMode === 'skypec') {
    return `https://hoso.skypec.vn/q/${encodeURIComponent(token)}`;
  }
  // Construct clean absolute URL that resolves properly in this web app on any device
  const origin = getPublicBaseUrl();
  return `${origin}/?token=${encodeURIComponent(token)}`;
}

export async function generateQrDataUrl(
  text: string,
  options: QrOptions = {}
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: options.margin ?? 3,
    width: options.width ?? 320,
    color: {
      dark: options.color?.dark ?? '#003B5C', // Deep SKYPEC Navy
      light: options.color?.light ?? '#FFFFFF',
    },
  };

  try {
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (err) {
    console.error('Failed to generate QR data URL:', err);
    throw err;
  }
}

export async function generateQrSvgString(
  text: string,
  options: QrOptions = {}
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToStringOptions = {
    errorCorrectionLevel: 'H',
    type: 'svg',
    margin: options.margin ?? 3,
    width: options.width ?? 320,
    color: {
      dark: options.color?.dark ?? '#003B5C',
      light: options.color?.light ?? '#FFFFFF',
    },
  };

  try {
    return await QRCode.toString(text, defaultOptions);
  } catch (err) {
    console.error('Failed to generate QR SVG:', err);
    throw err;
  }
}

/**
 * Trigger download of QR as PNG
 */
export function downloadQrPng(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Trigger download of QR as SVG file
 */
export function downloadQrSvg(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
