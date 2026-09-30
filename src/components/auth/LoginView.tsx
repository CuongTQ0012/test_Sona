import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Plane,
  ShieldCheck,
  AlertCircle,
  LogIn,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import { SystemSettings } from '../../types';

interface LoginViewProps {
  settings: SystemSettings;
  onLoginSuccess: (username: string) => void;
  onOpenScanner: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  settings,
  onLoginSuccess,
  onOpenScanner,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const trimmedUser = username.trim();
      const trimmedPass = password.trim();

      // Danh sách tài khoản quản trị hệ thống SKYPEC
      const validAccounts: Record<string, { pass: string; role: string; email: string }> = {
        admin: {
          pass: 'skypec@123',
          role: 'Quản trị viên',
          email: 'daotao.skypec@gmail.com',
        },
        admin2: {
          pass: 'admin2@skypec',
          role: 'Quản trị viên',
          email: 'admin2@skypec.vn',
        },
      };

      const account = validAccounts[trimmedUser];

      if (account && trimmedPass === account.pass) {
        const sessionPayload = JSON.stringify({
          username: trimmedUser,
          role: account.role,
          email: account.email,
          loginAt: new Date().toISOString(),
          rememberMe,
        });

        if (rememberMe) {
          localStorage.setItem('skypec_auth_session', sessionPayload);
        }
        sessionStorage.setItem('skypec_auth_session', sessionPayload);

        setIsLoading(false);
        onLoginSuccess(trimmedUser);
      } else {
        setIsLoading(false);
        setError('Tài khoản hoặc mật khẩu không chính xác!');
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-[#003852] to-[#00557A] flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background Decorative Aviation Motifs */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-[#EECD2B] blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-[#006C99] blur-2xl" />
      </div>

      {/* Top Banner Navigation */}
      <header className="p-6 relative z-10 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-white font-black text-sm md:text-base tracking-wide flex items-center gap-2">
              <span>Vietnam Air Petrol</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#EECD2B] text-slate-900 shadow-xs">
                Nội bộ
              </span>
            </div>
            <div className="text-blue-100/70 text-xs hidden sm:block">
              Nhiên liệu Hàng không Việt Nam
            </div>
          </div>
        </div>

        {onOpenScanner && (
          <button
            type="button"
            onClick={onOpenScanner}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all cursor-pointer shadow-xs hover:border-[#EECD2B]"
            title="Quét mã QR để xem lý lịch nhân viên không cần đăng nhập"
          >
            <QrCode className="w-4 h-4 text-[#EECD2B]" />
            <span>Quét Mã QR Tra Cứu</span>
          </button>
        )}
      </header>

      {/* Center Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Card Top Brand Accent */}
          <div className="bg-linear-to-r from-[#006C99] to-[#004e70] px-6 py-5 text-white text-center relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md mb-2 shadow-inner border border-white/20">
              <ShieldCheck className="w-6 h-6 text-[#EECD2B]" />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase">
              Đăng Nhập Quản Trị
            </h1>
            <p className="text-xs text-blue-100/80 mt-1 font-medium">
              Quản lý Lý lịch Nhân viên & Cấp mã QR Thẻ PET
            </p>
          </div>

          {/* Form Area */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 block">
                Tài khoản đăng nhập <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="Nhập tên tài khoản..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-[#006C99] focus:ring-2 focus:ring-[#006C99]/20 transition-all font-medium text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 block">
                Mật khẩu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-[#006C99] focus:ring-2 focus:ring-[#006C99]/20 transition-all font-medium text-slate-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-[#EECD2B]" />
                  <span>Đăng Nhập Vào Hệ Thống</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-blue-100/60 relative z-10">
        <p>© {new Date().getFullYear()} Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam (SKYPEC)</p>
        <p className="text-[11px] text-blue-100/40 mt-0.5">
          Hệ thống Quản lý Lý lịch chuyên ngành & Mã QR Cố định kiểm tra Thẻ PET
        </p>
      </footer>
    </div>
  );
};
