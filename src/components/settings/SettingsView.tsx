import React, { useState } from 'react';
import { SystemSettings } from '../../types';
import { storageService } from '../../services/storageService';
import {
  Settings,
  Shield,
  Bell,
  Building,
  Save,
  RotateCcw,
  CheckCircle2,
  Lock,
  Globe,
} from 'lucide-react';

interface SettingsViewProps {
  settings: SystemSettings;
  onSettingsUpdated: (newSettings: SystemSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsUpdated,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    const updated = storageService.updateSettings(formData);
    onSettingsUpdated(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDemo = () => {
    const confirmed = window.confirm(
      'Khôi phục dữ liệu mẫu sẽ đưa hệ thống về 10 hồ sơ nhân viên hàng không mẫu SKYPEC. Bạn có chắc chắn muốn thực hiện?'
    );
    if (confirmed) {
      storageService.resetToDemoData('Quản trị viên');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Cấu Hình Hệ Thống & Tham Số Nghiệp Vụ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập cảnh báo hạn chứng chỉ, quy tắc bảo mật dữ liệu CCCD và nhận diện thương hiệu SKYPEC.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu thành công!</span>
          </div>
        )}
      </div>

      {/* Main Settings Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
        {/* Section 1: Cảnh báo chứng chỉ */}
        <div>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-4">
            <Bell className="w-4 h-4 text-[#006C99]" />
            <h3 className="font-bold text-sm text-slate-900">
              1. Cấu Hình Khoảng Thời Gian Cảnh Báo Chứng Chỉ (Mục IX)
            </h3>
          </div>

          <div className="space-y-3">
            <label className="font-semibold text-slate-700 block">
              Cảnh báo trước khi chứng chỉ/chứng nhận hết hạn:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[30, 60, 90, 120].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setFormData({ ...formData, warningDays: days })}
                  className={`p-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    formData.warningDays === days
                      ? 'border-[#006C99] bg-blue-50 text-[#006C99] ring-2 ring-[#006C99]/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-lg">{days} ngày</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {days === 60 ? 'Mặc định hàng không' : 'Tùy chọn'}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Các chứng nhận có ngày hết hạn trong phạm vi này sẽ tự động chuyển sang trạng thái màu vàng: <strong className="text-amber-700">SẮP HẾT HẠN</strong>.
            </p>
          </div>
        </div>

        {/* Section 2: Bảo vệ thông tin CCCD */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-4">
            <Shield className="w-4 h-4 text-[#006C99]" />
            <h3 className="font-bold text-sm text-slate-900">
              2. Bảo Vệ Dữ Liệu Cá Nhân & CCCD (Mục XXVII)
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block text-xs">
                  Che một phần số Căn cước công dân khi quét QR công khai
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Khi bật, người quét QR bằng điện thoại sẽ chỉ thấy ví dụ: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-[#006C99]">0010******42</code>. File PDF nội bộ của cán bộ quản lý vẫn đầy đủ.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={formData.maskIdCardPublic}
                  onChange={(e) =>
                    setFormData({ ...formData, maskIdCardPublic: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006C99]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Tên cơ quan & Domain */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-4">
            <Building className="w-4 h-4 text-[#006C99]" />
            <h3 className="font-bold text-sm text-slate-900">
              3. Nhận Diện Doanh Nghiệp & Tên Đơn Vị Quản Lý
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Tên doanh nghiệp chính (In trên biểu mẫu A4)
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Đơn vị cấp trên
              </label>
              <input
                type="text"
                value={formData.companySubName}
                onChange={(e) => setFormData({ ...formData, companySubName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Danh Sách Tài Khoản Quản Trị */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 mb-4">
            <Shield className="w-4 h-4 text-[#006C99]" />
            <h3 className="font-bold text-sm text-slate-900">
              4. Danh Sách Tài Khoản Quản Trị Hệ Thống
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">admin</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Hoạt động
                  </span>
                </div>
                <div className="text-slate-500 mt-0.5">Quản trị viên 1 • daotao.skypec@gmail.com</div>
              </div>
              <span className="text-[11px] font-mono text-slate-400">••••••••</span>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#006C99] text-sm">admin2</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Hoạt động
                  </span>
                </div>
                <div className="text-slate-500 mt-0.5">Quản trị viên 2 • admin2@skypec.vn</div>
              </div>
              <span className="text-[11px] font-mono text-[#006C99]">admin2@skypec</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDemo}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục 10 hồ sơ mẫu</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white font-bold inline-flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Thay Đổi Cấu Hình</span>
          </button>
        </div>
      </div>
    </div>
  );
};
