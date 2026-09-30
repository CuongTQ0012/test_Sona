import React from 'react';
import {
  LayoutDashboard,
  Users,
  Award,
  FileText,
  QrCode,
  History,
  Smartphone,
  Settings,
  ShieldCheck,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

export type NavigationPage =
  | 'dashboard'
  | 'employees'
  | 'training'
  | 'audit'
  | 'qr-logs'
  | 'settings';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  onOpenTestRunner: () => void;
  onOpenDocs: () => void;
  onOpenScannerModal: () => void;
  employeeCount: number;
  expiringCertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onOpenTestRunner,
  onOpenDocs,
  onOpenScannerModal,
  employeeCount,
  expiringCertCount,
}) => {
  const menuItems: Array<{
    id: NavigationPage;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: LayoutDashboard,
    },
    {
      id: 'employees',
      label: 'Hồ sơ nhân viên',
      icon: Users,
      badge: employeeCount,
      badgeColor: 'bg-[#006C99] text-white',
    },
    {
      id: 'training',
      label: 'Đào tạo & Chứng chỉ',
      icon: Award,
      badge: expiringCertCount > 0 ? expiringCertCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'audit',
      label: 'Nhật ký thay đổi',
      icon: History,
    },
    {
      id: 'qr-logs',
      label: 'Nhật ký quét QR',
      icon: Smartphone,
    },
    {
      id: 'settings',
      label: 'Cấu hình hệ thống',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-base font-black tracking-tight text-[#006C99] flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5A412]"></span>
            <span>SKYPEC</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            Quản Lý Hồ Sơ & QR
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto text-xs">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          QUẢN TRỊ NGHIỆP VỤ
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#006C99] text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#EECD2B]' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          CÔNG CỤ QUÉT QR
        </div>

        {/* Image / Token QR Scanner button */}
        <button
          onClick={onOpenScannerModal}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white bg-[#006C99] hover:bg-[#005377] font-bold shadow-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <QrCode className="w-4 h-4 text-[#EECD2B]" />
            <span className="truncate">Quét / Nhận Diện QR</span>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
            Mới
          </span>
        </button>

        <div className="px-3 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          KIỂM THỬ & TÀI LIỆU
        </div>

        {/* Mandatory 7-step test button */}
        <button
          onClick={onOpenTestRunner}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-amber-900 bg-amber-50/80 hover:bg-amber-100 font-bold border border-amber-200 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span className="truncate">Kiểm thử 7 bước</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
            Mục III
          </span>
        </button>

        {/* Documentation Modal button */}
        <button
          onClick={onOpenDocs}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-[#006C99]" />
            <span className="truncate">Tài liệu kiến trúc</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/80">
        <div className="text-[11px] font-bold text-slate-800 leading-snug">
          Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam ( Skypec)
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          Hồ sơ lý lịch nhân viên hàng không
        </div>
        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
          <span>Phiên bản v2.4</span>
          <span className="text-emerald-600 font-bold">● Đang chạy</span>
        </div>
      </div>
    </aside>
  );
};
