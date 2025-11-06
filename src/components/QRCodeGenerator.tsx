import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  showDownload?: boolean;
}

export function QRCodeGenerator({
  value,
  size = 256,
  level = 'M',
  showDownload = true,
}: QRCodeGeneratorProps) {
  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-code-${value}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-lg">
        <QRCodeSVG
          id="qr-code-svg"
          value={value}
          size={size}
          level={level}
          includeMargin={true}
        />
      </div>
      {showDownload && (
        <Button onClick={downloadQR} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download QR Code
        </Button>
      )}
    </div>
  );
}

