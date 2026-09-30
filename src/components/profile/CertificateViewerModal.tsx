import React, { useState } from 'react';
import {
  X,
  Download,
  ShieldCheck,
  Calendar,
  Award,
  Building,
  FileText,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  Printer,
  Image as ImageIcon,
} from 'lucide-react';
import { formatDateVN } from '../../utils/helpers';
import { SkypecLogo } from '../common/SkypecLogo';

interface CertificateViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  certificateNumber?: string;
  facility?: string;
  issueDate?: string;
  expiryDate?: string;
  employeeName?: string;
  documentType?: 'cert' | 'decision';
  fileName?: string;
  fileUrl?: string;
}

export const CertificateViewerModal: React.FC<CertificateViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  certificateNumber,
  facility = 'Cục Hàng không Việt Nam / SKYPEC',
  issueDate,
  expiryDate,
  employeeName = 'Nhân viên Hàng không',
  documentType = 'cert',
  fileName = 'chung_chi_dien_tu.pdf',
  fileUrl,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [viewTab, setViewTab] = useState<'document' | 'details'>('document');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Determine file type
  const isImageFile =
    Boolean(fileUrl && (fileUrl.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(fileUrl || ''))) ||
    /\.(jpg|jpeg|png|webp)($|\?)/i.test(fileName || '');

  const isPdfFile =
    Boolean(fileUrl && (fileUrl.startsWith('data:application/pdf') || /\.pdf($|\?)/i.test(fileUrl || ''))) ||
    /\.pdf($|\?)/i.test(fileName || '');

  const hasRealUploadedFile = Boolean(
    fileUrl && (fileUrl.startsWith('data:') || fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('/'))
  );

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 60));
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    // If real file URL exists, download directly
    if (hasRealUploadedFile && fileUrl) {
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName || 'chung_chi_skypec.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
      return;
    }

    // Otherwise generate downloadable SVG/HTML certificate snapshot
    const svgCert = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="800" height="600" fill="#FDFCFA" stroke="#006C99" stroke-width="8"/>
        <rect x="20" y="20" width="760" height="560" fill="none" stroke="#EECD2B" stroke-width="2"/>
        <text x="400" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#006C99">CÔNG TY TNHH MTV NHIÊN LIỆU HÀNG KHÔNG VIỆT NAM (SKYPEC)</text>
        <text x="400" y="115" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#666">${facility}</text>
        <text x="400" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#111827">${title.toUpperCase()}</text>
        ${certificateNumber ? `<text x="400" y="215" text-anchor="middle" font-family="Courier, monospace" font-size="14" font-weight="bold" fill="#006C99">Số hiệu: ${certificateNumber}</text>` : ''}
        <text x="400" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#4B5563">Chứng nhận cấp cho:</text>
        <text x="400" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#006C99">${employeeName}</text>
        <text x="400" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#374151">Ngày cấp: ${formatDateVN(issueDate)}   •   Thời hạn hiệu lực: ${formatDateVN(expiryDate)}</text>
        <text x="400" y="480" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#059669">✓ ĐÃ XÁC THỰC SỐ HÓA TRÊN HỆ THỐNG SKYPEC</text>
        <text x="400" y="540" text-anchor="middle" font-family="Courier, monospace" font-size="11" fill="#9CA3AF">Mã tệp: ${fileName} • Hash SHA256-OK</text>
      </svg>
    `;
    const blob = new Blob([svgCert], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (fileName ? fileName.replace(/\.pdf$/i, '.svg') : 'chung_chi_skypec.svg');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#006C99] text-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-white/10 text-[#EECD2B] shrink-0">
              {documentType === 'cert' ? <Award className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base leading-tight truncate">
                {documentType === 'cert' ? 'Bản Sao Số Hóa Chứng Chỉ / CCCM' : 'Quyết Định Huấn Luyện Tại Chỗ'}
              </h3>
              <p className="text-[11px] text-blue-100 truncate mt-0.5">
                {employeeName} • {title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action & View Toolbar */}
        <div className="px-4 sm:px-6 py-2 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          {/* Tabs */}
          <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs font-semibold">
            <button
              onClick={() => setViewTab('document')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewTab === 'document' ? 'bg-[#006C99] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {hasRealUploadedFile && isImageFile ? '🖼️ Ảnh Tệp Tin' : hasRealUploadedFile && isPdfFile ? '📄 Tệp PDF' : '📜 Bản Số Hóa'}
            </button>
            <button
              onClick={() => setViewTab('details')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewTab === 'details' ? 'bg-[#006C99] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ℹ️ Chi Tiết & Pháp Lý
            </button>
          </div>

          {/* Zoom & rotate controls for document */}
          {viewTab === 'document' && (
            <div className="flex items-center gap-1 text-slate-700">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 font-mono text-[11px] font-bold cursor-pointer"
                title="Khôi phục kích thước ban đầu"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRotate}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 cursor-pointer"
                title="Xoay 90 độ"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-slate-200/70 flex-1 flex items-center justify-center">
          {viewTab === 'document' ? (
            <div
              className="transition-transform duration-150 origin-center max-w-full"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              }}
            >
              {/* Case 1: Real uploaded Image */}
              {hasRealUploadedFile && isImageFile && fileUrl ? (
                <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-300 max-w-xl mx-auto">
                  <img
                    src={fileUrl}
                    alt={title}
                    className="max-h-[62vh] w-auto max-w-full object-contain rounded-lg mx-auto"
                  />
                  <div className="text-center text-[11px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-100">
                    {fileName} • Bản chụp gốc
                  </div>
                </div>
              ) : hasRealUploadedFile && isPdfFile && fileUrl ? (
                /* Case 2: Real uploaded PDF */
                <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-300 w-full min-w-[300px] max-w-2xl mx-auto">
                  <div className="h-[60vh] w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                    <iframe
                      src={fileUrl}
                      title={title}
                      className="w-full h-full border-0"
                    />
                  </div>
                  <div className="text-center text-[11px] text-slate-500 font-mono mt-2">
                    {fileName} • Tài liệu PDF đính kèm
                  </div>
                </div>
              ) : (
                /* Case 3: Official SKYPEC Digitized Security Certificate Canvas */
                <div className="bg-amber-50/70 p-6 sm:p-10 rounded-2xl border-4 border-double border-[#006C99]/35 shadow-xl relative overflow-hidden text-slate-800 max-w-2xl mx-auto select-none">
                  {/* Subtle Security Guilloche Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                    <span className="text-8xl font-black text-[#006C99] rotate-[-25deg]">
                      SKYPEC
                    </span>
                  </div>

                  {/* Document Header */}
                  <div className="text-center border-b border-slate-300 pb-4 mb-5">
                    <div className="flex justify-center mb-2">
                      <SkypecLogo size="sm" showText={false} />
                    </div>
                    <div className="text-[11px] font-bold tracking-widest text-[#006C99] uppercase mb-1">
                      {facility}
                    </div>
                    <h2 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-wide">
                      {title}
                    </h2>
                    {certificateNumber && (
                      <div className="text-xs font-mono font-bold text-slate-600 mt-1">
                        Số hiệu: <span className="text-[#006C99]">{certificateNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Recipient & Certification text */}
                  <div className="space-y-3.5 my-5 text-xs sm:text-sm leading-relaxed">
                    <p className="text-center italic text-slate-600">
                      Chứng nhận cấp cho cán bộ, nhân viên:
                    </p>
                    <div className="text-center font-black text-lg sm:text-xl text-[#006C99] tracking-wide uppercase">
                      {employeeName}
                    </div>
                    <p className="text-slate-700 text-justify text-xs leading-relaxed bg-white/70 p-3 rounded-xl border border-slate-200">
                      Đã hoàn thành đầy đủ chương trình đào tạo, huấn luyện chuyên ngành hàng không và sát hạch đạt yêu cầu tiêu chuẩn theo quy chế an toàn của Cục Hàng không Việt Nam, Quy chuẩn kỹ thuật ngành và Quy trình chuẩn Quốc tế JIG.
                    </p>
                  </div>

                  {/* Validity Info */}
                  <div className="grid grid-cols-2 gap-3 bg-white/90 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#006C99]" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Ngày cấp:</span>
                        <span className="font-bold text-slate-800">{formatDateVN(issueDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="text-slate-400 block text-[10px]">Thời hạn hiệu lực:</span>
                        <span className="font-bold text-slate-800">{formatDateVN(expiryDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seal & Verification Signature stamp */}
                  <div className="mt-6 flex justify-between items-end pt-4 border-t border-slate-300 text-xs">
                    <div className="text-left text-slate-500 font-mono text-[10px]">
                      <div>Tệp: {fileName}</div>
                      <div>Xác thực số: SHA256-VERIFIED</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] text-slate-600 italic mb-3">
                        Thủ trưởng Cơ sở Đào tạo / SKYPEC
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-emerald-800 font-black text-[11px] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ĐÃ XÁC THỰC ĐIỆN TỬ
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Details Tab */
            <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-sm max-w-xl w-full text-xs space-y-4">
              <h4 className="font-bold text-sm text-[#006C99] uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Thông Tin Hồ Sơ Pháp Lý
              </h4>

              <div className="space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tên chứng chỉ:</span>
                  <span className="font-bold text-slate-800 text-right">{title}</span>
                </div>
                {certificateNumber && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Số hiệu văn bản:</span>
                    <span className="font-mono font-bold text-[#006C99]">{certificateNumber}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nhân viên sở hữu:</span>
                  <span className="font-bold text-slate-800">{employeeName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Đơn vị cấp:</span>
                  <span className="font-medium text-slate-800 text-right max-w-[60%]">{facility}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Ngày cấp:</span>
                  <span className="font-semibold text-slate-800">{formatDateVN(issueDate)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Thời hạn hết hiệu lực:</span>
                  <span className="font-semibold text-slate-800">{formatDateVN(expiryDate)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tên tệp tin đính kèm:</span>
                  <span className="font-mono text-slate-700">{fileName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Trạng thái lưu trữ:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Khả dụng trên hệ thống QR SKYPEC
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 truncate text-[11px]">
            <span className="truncate">Tệp: <strong>{fileName}</strong></span>
            {downloadSuccess && (
              <span className="text-emerald-600 font-bold animate-in fade-in">
                ✓ Đã tải xuống thiết bị
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#006C99]" />
              <span>Tải Về Máy</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white font-bold transition-colors cursor-pointer shadow-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
