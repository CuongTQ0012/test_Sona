import React, { useState } from 'react';
import jsQR from 'jsqr';
import { Employee } from '../../types';
import {
  X,
  Upload,
  QrCode,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (tokenOrUrl: string) => void;
  employees: Employee[];
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  employees,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual' | 'demo'>('upload');
  const [manualInput, setManualInput] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  const handleSuccess = (rawText: string) => {
    onScanSuccess(rawText);
    onClose();
  };

  // Handle Image File Upload Scanner using jsQR
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setUploadError('Không thể xử lý ảnh trên trình duyệt.');
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleSuccess(code.data);
        } else {
          setUploadError('Không tìm thấy mã QR hợp lệ trong ảnh này. Vui lòng tải ảnh rõ nét hơn hoặc dùng thẻ mẫu bên dưới.');
        }
      };
      img.onerror = () => {
        setUploadError('Tệp ảnh không hợp lệ.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleSuccess(manualInput.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#006C99] text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-[#EECD2B]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Tra Cứu & Nhận Diện Mã QR Hồ Sơ
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Tải tệp ảnh mã QR • Nhập mã Token / URL • Xem hồ sơ mẫu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls (Camera removed) */}
        <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-[#006C99] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải Ảnh QR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-[#006C99] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Nhập Mã / Token</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'demo'
                ? 'bg-white text-[#006C99] font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Hồ Sơ Mẫu</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 text-xs">
          {/* TAB 1: UPLOAD QR IMAGE */}
          {activeTab === 'upload' && (
            <div className="max-w-md mx-auto space-y-4 text-center py-4">
              <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:border-[#006C99] transition-colors flex flex-col items-center">
                <Upload className="w-12 h-12 text-[#006C99] mb-3" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Chọn hoặc Kéo Thả Ảnh Chứa Mã QR
                </h4>
                <p className="text-slate-500 text-xs mt-1 mb-4 leading-relaxed">
                  Hệ thống tự động đọc và giải mã QR từ ảnh thẻ PET, ảnh chụp màn hình hoặc file tải về (PNG, JPG, JPEG, WEBP)
                </p>
                <label className="px-5 py-2.5 bg-[#006C99] hover:bg-[#005377] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Chọn Tệp Ảnh QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL TOKEN / URL INPUT */}
          {activeTab === 'manual' && (
            <div className="max-w-md mx-auto space-y-4 py-4">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Nhập mã Public Token, Mã NV hoặc Đường dẫn QR:
                  </label>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Ví dụ: A7K9X2M8 hoặc SKP-0125 hoặc https://..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:outline-hidden focus:border-[#006C99] uppercase"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Hỗ trợ Token cố định (8 ký tự), Mã nhân viên SKYPEC hoặc toàn bộ đường dẫn URL.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="w-full py-2.5 bg-[#006C99] hover:bg-[#005377] text-white font-bold rounded-xl text-xs shadow-md disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Mở Hồ Sơ Nhân Viên
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: ONE-CLICK DEMO CARDS */}
          {activeTab === 'demo' && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-slate-700 text-xs">
                <strong>Tra cứu nhanh 1-Chạm:</strong> Bấm vào bất kỳ nhân viên nào dưới đây để lập tức mở giao diện Mobile hồ sơ chuẩn.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => handleSuccess(emp.publicToken)}
                    className="p-3 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-[#006C99] rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                        {emp.avatarUrl ? (
                          <img
                            src={emp.avatarUrl}
                            alt={emp.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">
                            3x4
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="font-bold text-slate-900 group-hover:text-[#006C99] transition-colors truncate">
                          {emp.fullName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {emp.aviationJobTitle}
                        </div>
                        <div className="text-[10px] font-mono text-[#006C99] font-bold">
                          Token: {emp.publicToken}
                        </div>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#006C99] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Hệ thống nhận diện mã QR hàng không SKYPEC
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
