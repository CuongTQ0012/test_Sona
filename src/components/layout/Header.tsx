import React, { useState } from 'react';
import {
  Search,
  Bell,
  User,
  QrCode,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { Employee, SystemSettings } from '../../types';

interface HeaderProps {
  settings: SystemSettings;
  employees: Employee[];
  onOpenTestRunner: () => void;
  onOpenPublicScanView: (token: string) => void;
  onOpenDocs: () => void;
  onOpenScannerModal: () => void;
  onLogout?: () => void;
  username?: string;
  expiringCertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  employees,
  onOpenTestRunner,
  onOpenPublicScanView,
  onOpenDocs,
  onOpenScannerModal,
  onLogout,
  username = 'admin',
  expiringCertCount,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left: System Title */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-[#006C99] uppercase tracking-wide">
              HỆ THỐNG QUẢN LÝ LÝ LỊCH NHÂN VIÊN & QR CỐ ĐỊNH
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam ( Skypec)
          </div>
        </div>
      </div>

      {/* Right: Quick Tools & User */}
      <div className="flex items-center gap-3">
        {/* Direct Image / Token QR Scanner button */}
        <button
          onClick={onOpenScannerModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          title="Tải ảnh hoặc nhập mã để tra cứu mã QR"
        >
          <QrCode className="w-4 h-4 text-[#EECD2B]" />
          <span>Quét Mã QR</span>
        </button>

        {/* Test runner shortcut */}
        <button
          onClick={onOpenTestRunner}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Test 7 Bước</span>
        </button>

        {/* Documentation shortcut */}
        <button
          onClick={onOpenDocs}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Tài liệu kiến trúc hệ thống"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200" />

        {/* User Account & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#006C99] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {username === 'admin2' ? 'A2' : 'AD'}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>Quản trị viên</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-[#006C99] font-mono">
                  {username}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {username === 'admin2' ? 'admin2@skypec.vn' : 'daotao.skypec@gmail.com'}
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
