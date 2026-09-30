import React, { useEffect, useState, useRef } from 'react';
import { Employee, PETCardCustomization } from '../../types';
import {
  X,
  Download,
  Shield,
  CheckCircle,
  QrCode,
  Edit3,
  Save,
  RotateCw,
  Printer,
  Upload,
  RefreshCw,
  Palette,
  User,
  FileText,
  Phone,
  Check,
} from 'lucide-react';
import { generateQrDataUrl, downloadQrPng, getPublicUrlForToken } from '../../services/qrService';
import { storageService } from '../../services/storageService';

interface PETCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onOpenPublicScanView?: (token: string) => void;
  onEmployeeUpdated?: (updated: Employee) => void;
}

const PRESET_COLORS = [
  { name: 'Xanh SKYPEC', theme: '#006C99', secondary: '#EECD2B' },
  { name: 'Xanh Navy Hàng Không', theme: '#0A2540', secondary: '#00D4B2' },
  { name: 'Đỏ An Ninh Sân Bay', theme: '#B91C1C', secondary: '#FCD34D' },
  { name: 'Xanh Lục Khai Thác', theme: '#047857', secondary: '#FDE047' },
  { name: 'Xám Titanium', theme: '#334155', secondary: '#38BDF8' },
];

export const PETCardModal: React.FC<PETCardModalProps> = ({
  isOpen,
  onClose,
  employee,
  onOpenPublicScanView,
  onEmployeeUpdated,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Editable fields initialized from employee
  const [fullName, setFullName] = useState<string>(employee.fullName);
  const [employeeCode, setEmployeeCode] = useState<string>(employee.employeeCode);
  const [aviationJobTitle, setAviationJobTitle] = useState<string>(employee.aviationJobTitle);
  const [regularAirport, setRegularAirport] = useState<string>(employee.regularAirport);
  const [avatarUrl, setAvatarUrl] = useState<string>(employee.avatarUrl);

  // Customization fields
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(
    employee.petCardCustomization?.logoUrl || ''
  );
  const [cardTitle, setCardTitle] = useState<string>(
    employee.petCardCustomization?.cardTitle || 'THẺ NHÂN VIÊN KHU BAY'
  );
  const [companyName, setCompanyName] = useState<string>(
    employee.petCardCustomization?.companyName || 'CÔNG TY TNHH MTV NHIÊN LIỆU HÀNG KHÔNG VIỆT NAM'
  );
  const [brandShortName, setBrandShortName] = useState<string>(
    employee.petCardCustomization?.brandShortName || 'Vietnam Air Petrol'
  );
  const [badgeText, setBadgeText] = useState<string>(
    employee.petCardCustomization?.badgeText || 'NHÂN VIÊN CHÍNH THỨC'
  );
  const [badgeColor, setBadgeColor] = useState<'emerald' | 'blue' | 'amber' | 'rose' | 'indigo'>(
    employee.petCardCustomization?.badgeColor || 'emerald'
  );
  const [themeColor, setThemeColor] = useState<string>(
    employee.petCardCustomization?.themeColor || '#006C99'
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    employee.petCardCustomization?.secondaryColor || '#EECD2B'
  );
  const [backNotes, setBackNotes] = useState<string>(
    employee.petCardCustomization?.backNotes ||
      '1. Thẻ chỉ có giá trị khi còn hiệu lực và phải đeo trước ngực trong khu bay.\n2. Tuyệt đối không cho người khác mượn hoặc sử dụng sai mục đích.\n3. Nếu nhặt được thẻ, vui lòng gửi về Trung tâm Khai thác hoặc Cảng hàng không gần nhất.'
  );
  const [backEmergencyPhone, setBackEmergencyPhone] = useState<string>(
    employee.petCardCustomization?.backEmergencyPhone || '024.3884.2222 (P. An ninh)'
  );

  // Sync when employee prop changes
  useEffect(() => {
    if (employee) {
      setFullName(employee.fullName);
      setEmployeeCode(employee.employeeCode);
      setAviationJobTitle(employee.aviationJobTitle);
      setRegularAirport(employee.regularAirport);
      setAvatarUrl(employee.avatarUrl);

      setCustomLogoUrl(employee.petCardCustomization?.logoUrl || '');
      setCardTitle(employee.petCardCustomization?.cardTitle || 'THẺ NHÂN VIÊN KHU BAY');
      setCompanyName(
        employee.petCardCustomization?.companyName ||
          'CÔNG TY TNHH MTV NHIÊN LIỆU HÀNG KHÔNG VIỆT NAM'
      );
      setBrandShortName(
        employee.petCardCustomization?.brandShortName || 'Vietnam Air Petrol'
      );
      setBadgeText(employee.petCardCustomization?.badgeText || 'NHÂN VIÊN CHÍNH THỨC');
      setBadgeColor(employee.petCardCustomization?.badgeColor || 'emerald');
      setThemeColor(employee.petCardCustomization?.themeColor || '#006C99');
      setSecondaryColor(employee.petCardCustomization?.secondaryColor || '#EECD2B');
      setBackNotes(
        employee.petCardCustomization?.backNotes ||
          '1. Thẻ chỉ có giá trị khi còn hiệu lực và phải đeo trước ngực trong khu bay.\n2. Tuyệt đối không cho người khác mượn hoặc sử dụng sai mục đích.\n3. Nếu nhặt được thẻ, vui lòng gửi về Trung tâm Khai thác hoặc Cảng hàng không gần nhất.'
      );
      setBackEmergencyPhone(
        employee.petCardCustomization?.backEmergencyPhone || '024.3884.2222 (P. An ninh)'
      );

      // Build clean absolute public URL
      const publicUrl = getPublicUrlForToken(employee.publicToken);
      generateQrDataUrl(publicUrl, { width: 300, margin: 2 }).then(setQrUrl);
    }
  }, [employee]);

  // Handle avatar image upload from computer
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh (.jpg, .png, .jpeg)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle custom logo upload from computer
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh logo (.png, .jpg, .svg, .webp)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setCustomLogoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save changes to storage
  const handleSavePETCard = () => {
    const updatedCustomization: PETCardCustomization = {
      cardTitle,
      companyName,
      brandShortName,
      logoUrl: customLogoUrl,
      badgeText,
      badgeColor,
      themeColor,
      secondaryColor,
      backNotes,
      backEmergencyPhone,
    };

    const updated = storageService.updateEmployee(
      employee.id,
      {
        fullName,
        employeeCode,
        aviationJobTitle,
        regularAirport,
        avatarUrl,
        petCardCustomization: updatedCustomization,
      },
      'Chỉnh sửa và cập nhật quy cách thẻ PET'
    );

    if (updated) {
      if (onEmployeeUpdated) {
        onEmployeeUpdated(updated);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Reset to original employee state
  const handleResetToProfile = () => {
    setFullName(employee.fullName);
    setEmployeeCode(employee.employeeCode);
    setAviationJobTitle(employee.aviationJobTitle);
    setRegularAirport(employee.regularAirport);
    setAvatarUrl(employee.avatarUrl);
    setCustomLogoUrl('');
    setCardTitle('THẺ NHÂN VIÊN KHU BAY');
    setCompanyName('CÔNG TY TNHH MTV NHIÊN LIỆU HÀNG KHÔNG VIỆT NAM');
    setBrandShortName('Vietnam Air Petrol');
    setBadgeText('NHÂN VIÊN CHÍNH THỨC');
    setBadgeColor('emerald');
    setThemeColor('#006C99');
    setSecondaryColor('#EECD2B');
    setBackNotes(
      '1. Thẻ chỉ có giá trị khi còn hiệu lực và phải đeo trước ngực trong khu bay.\n2. Tuyệt đối không cho người khác mượn hoặc sử dụng sai mục đích.\n3. Nếu nhặt được thẻ, vui lòng gửi về Trung tâm Khai thác hoặc Cảng hàng không gần nhất.'
    );
    setBackEmergencyPhone('024.3884.2222 (P. An ninh)');
  };

  // Print PET Card (CR80 standard)
  const handlePrintCard = () => {
    window.print();
  };

  if (!isOpen) return null;

  const badgeColorClass =
    badgeColor === 'emerald'
      ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300'
      : badgeColor === 'blue'
      ? 'bg-blue-100/90 text-blue-800 border-blue-300'
      : badgeColor === 'amber'
      ? 'bg-amber-100/90 text-amber-800 border-amber-300'
      : badgeColor === 'rose'
      ? 'bg-rose-100/90 text-rose-800 border-rose-300'
      : 'bg-indigo-100/90 text-indigo-800 border-indigo-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#006C99] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-[#EECD2B]" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                Thiết Kế & Chỉnh Sửa Quy Cách Thẻ PET Nhân Viên
              </h3>
              <p className="text-[11px] text-white/80">
                Kích thước tiêu chuẩn CR80 (85.6mm × 54mm) • Mã QR cố định liên kết hồ sơ số hóa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const formEl = document.getElementById('pet-card-customization-form');
                if (formEl) {
                  formEl.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-[#EECD2B] hover:bg-[#F5BE2C] text-slate-950 shadow-xs cursor-pointer"
              title="Chỉnh sửa thông tin và quy cách thẻ PET"
            >
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh Sửa Thẻ</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast banner */}
        {saveSuccess && (
          <div className="bg-emerald-500 text-white px-6 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Đã lưu thành công quy cách và thông tin thẻ PET vào hồ sơ nhân viên!</span>
            </div>
          </div>
        )}

        {/* Content Body: 2 Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Live Interactive Preview (CR80) */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-4">
            {/* View Switcher: Front / Back */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveSide('front')}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeSide === 'front'
                    ? 'bg-[#006C99] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mặt Trước (Front)
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('back')}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeSide === 'back'
                    ? 'bg-[#006C99] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mặt Sau (Back)
              </button>
              <button
                type="button"
                onClick={() => setActiveSide(activeSide === 'front' ? 'back' : 'front')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ml-1 cursor-pointer"
                title="Lật thẻ"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Card Container */}
            <div className="relative group perspective">
              {/* FRONT SIDE */}
              {activeSide === 'front' && (
                <div
                  className="w-[380px] h-[240px] rounded-2xl shadow-xl border-2 border-slate-300 relative overflow-hidden p-4 flex flex-col justify-between select-none transition-all duration-300 bg-white"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 60%, #f1f5f9 100%)',
                    fontFamily: '"Times New Roman", Times, serif',
                  }}
                >
                  {/* Top Corporate Stripe: Dual-Color SKYPEC with Blue occupying 3/4 */}
                  <div
                    className="absolute top-0 left-0 right-0 overflow-hidden"
                    style={{
                      height: '15px',
                    }}
                  >
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 1000 100"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="frontStripeBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={themeColor || '#006C99'} />
                          <stop offset="100%" stopColor="#005B86" />
                        </linearGradient>
                        <linearGradient id="frontStripeGold" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={secondaryColor || '#F5BE2C'} />
                          <stop offset="100%" stopColor="#DC9907" />
                        </linearGradient>
                      </defs>

                      {/* Left 3/4: SKYPEC Petroleum Blue */}
                      <polygon points="0,0 760,0 740,100 0,100" fill="url(#frontStripeBlue)" />

                      {/* Diagonal White Dividing Stripe */}
                      <polygon points="760,0 768,0 748,100 740,100" fill="#FFFFFF" />

                      {/* Right 1/4: SKYPEC Aviation Gold */}
                      <polygon points="768,0 1000,0 1000,100 748,100" fill="url(#frontStripeGold)" />
                    </svg>
                  </div>

                  {/* Card Header with Logo & Title */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center">
                      <img
                        src={customLogoUrl || '/skypec-logo.svg'}
                        alt="Logo Thẻ PET"
                        className="h-8 w-auto max-w-[130px] object-contain select-none"
                      />
                    </div>
                    <div className="text-right">
                      <span
                        className="text-[9px] font-bold text-slate-400 block tracking-wider uppercase"
                        style={{ fontFamily: '"Times New Roman", Times, serif' }}
                      >
                        {cardTitle}
                      </span>
                      <span className="text-xs font-mono font-bold" style={{ color: themeColor }}>
                        {employeeCode}
                      </span>
                    </div>
                  </div>

                  {/* Card Center Info & QR */}
                  <div className="flex items-center gap-3 my-auto">
                    {/* Photo 3x4 */}
                    <div
                      className="w-20 h-26 rounded-lg border-2 overflow-hidden bg-slate-200 shrink-0 shadow-xs relative group/photo"
                      style={{ borderColor: themeColor }}
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                          Ảnh 3x4
                        </div>
                      )}
                    </div>

                    {/* Employee text details */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div
                        className="text-sm font-black uppercase text-slate-900 tracking-tight truncate"
                        style={{ fontFamily: '"Times New Roman", Times, serif' }}
                      >
                        {fullName}
                      </div>
                      <div
                        className="font-bold mt-0.5 line-clamp-2 leading-tight"
                        style={{
                          color: themeColor,
                          fontFamily: '"Times New Roman", Times, serif',
                          fontSize: '13px',
                        }}
                      >
                        {aviationJobTitle}
                      </div>
                      <div
                        className="text-slate-500 mt-1 truncate"
                        style={{
                          fontFamily: '"Times New Roman", Times, serif',
                          fontSize: '8px',
                        }}
                      >
                        {regularAirport}
                      </div>
                      <div
                        className={`mt-2 inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full w-max border ${badgeColorClass}`}
                        style={{ fontFamily: '"Times New Roman", Times, serif' }}
                      >
                        {badgeText}
                      </div>
                    </div>

                    {/* Fixed QR Code Target */}
                    <div className="w-22 h-22 p-1 bg-white rounded-lg border border-slate-300 shadow-xs flex flex-col items-center justify-center shrink-0">
                      {qrUrl ? (
                        <img src={qrUrl} alt="QR Nhân viên" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-[8px] text-slate-400">Đang tải QR...</div>
                      )}
                      <span className="text-[7px] font-mono text-slate-500 mt-0.5 truncate max-w-[80px]">
                        {employee.publicToken}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Bar */}
                  <div className="border-t border-slate-200 pt-1 flex items-center text-[8px] text-slate-500">
                    <span className="truncate w-full">{companyName}</span>
                  </div>
                </div>
              )}

              {/* BACK SIDE */}
              {activeSide === 'back' && (
                <div
                  className="w-[380px] h-[240px] rounded-2xl shadow-xl border-2 border-slate-300 relative overflow-hidden p-4 flex flex-col justify-between select-none transition-all duration-300 bg-white"
                  style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 60%, #f1f5f9 100%)',
                    fontFamily: '"Times New Roman", Times, serif',
                  }}
                >
                  {/* SKYPEC Dual-Color Corporate Stripe with Diagonal Divider */}
                  <div className="absolute top-3 left-0 right-0 h-9 shadow-inner overflow-hidden flex">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 1000 100"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="backStripeBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#006C99" />
                          <stop offset="100%" stopColor="#005B86" />
                        </linearGradient>
                        <linearGradient id="backStripeGold" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#F5BE2C" />
                          <stop offset="100%" stopColor="#DC9907" />
                        </linearGradient>
                      </defs>

                      {/* Left: SKYPEC Petroleum Blue */}
                      <polygon points="0,0 525,0 475,100 0,100" fill="url(#backStripeBlue)" />

                      {/* Diagonal White Dividing Stripe */}
                      <polygon points="525,0 545,0 495,100 475,100" fill="#FFFFFF" />

                      {/* Right: SKYPEC Aviation Gold */}
                      <polygon points="545,0 1000,0 1000,100 495,100" fill="url(#backStripeGold)" />
                    </svg>
                  </div>

                  {/* Card Back Content */}
                  <div className="pt-10 flex-1 flex flex-col justify-between text-left">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                        <span>Quy định sử dụng thẻ</span>
                        <span className="font-mono text-slate-400 text-[9px]" style={{ fontSize: '9px' }}>
                          HOTLINE: {backEmergencyPhone}
                        </span>
                      </div>
                      <div
                        className="text-[10px] text-slate-700 leading-relaxed whitespace-pre-line p-2 rounded-lg border border-slate-200"
                        style={{
                          backgroundColor: '#f9f9f9',
                          fontSize: '10px',
                        }}
                      >
                        {backNotes}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-[9px]">
                      <div>
                        <span className="text-slate-400 block font-semibold text-[8px]">ĐƠN VỊ CẤP THẺ:</span>
                        <span className="font-bold text-slate-700">{companyName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Card Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
              <button
                type="button"
                onClick={handlePrintCard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-all shadow-xs cursor-pointer"
                title="In thẻ PET theo khổ chuẩn CR80"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Thẻ (CR80)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (qrUrl) downloadQrPng(qrUrl, `QR_PET_${employeeCode}_${employee.publicToken}`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition-all shadow-2xs cursor-pointer"
                title="Tải mã QR gốc cho xưởng in thẻ"
              >
                <Download className="w-3.5 h-3.5 text-[#006C99]" />
                <span>Tải QR Gốc</span>
              </button>

              {onOpenPublicScanView && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPublicScanView(employee.publicToken);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold transition-all shadow-2xs cursor-pointer"
                  title="Mở giao diện khi thanh tra quét mã QR này"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Test Quét QR</span>
                </button>
              )}
            </div>

            <div className="text-center px-4 py-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px] leading-relaxed">
              💡 <strong>Lưu ý quan trọng:</strong> Mã QR trên thẻ PET được tạo cố định theo mã Token riêng biệt. Bạn có thể tự do điều chỉnh chức danh, ảnh thẻ, màu sắc mà <strong>không cần phải in lại mã QR</strong>!
            </div>
          </div>

          {/* RIGHT: Edit Form Controls */}
          <div
            id="pet-card-customization-form"
            className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#006C99]" />
                <span className="font-bold text-slate-900 text-sm">
                  Tùy Biến Thông Tin & Mẫu Thẻ PET
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetToProfile}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                title="Khôi phục thông tin từ hồ sơ gốc"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Khôi phục gốc</span>
              </button>
            </div>

            {/* Tab/Section 1: Thông tin in trên mặt thẻ */}
            <div className="space-y-3">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <User className="w-3.5 h-3.5 text-[#006C99]" />
                <span>1. Thông tin cá nhân in trên thẻ</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Họ và tên in trên thẻ
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:border-[#006C99] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Mã nhân viên (Code)
                  </label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-[#006C99] focus:border-[#006C99] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Chức danh in trên thẻ (rút gọn nếu cần)
                </label>
                <input
                  type="text"
                  value={aviationJobTitle}
                  onChange={(e) => setAviationJobTitle(e.target.value)}
                  placeholder="Nhân viên điều khiển phương tiện tra nạp..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium focus:border-[#006C99] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Cảng hàng không / Sân bay
                  </label>
                  <input
                    type="text"
                    value={regularAirport}
                    onChange={(e) => setRegularAirport(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-[#006C99] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Thay ảnh thẻ 3x4
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#006C99]" />
                    <span>Tải ảnh từ máy tính</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Quy cách & Nhận diện thẻ */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Palette className="w-3.5 h-3.5 text-[#006C99]" />
                <span>2. Nhận diện & Màu sắc thương hiệu</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    Logo thương hiệu góc trái
                  </label>
                  {customLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomLogoUrl('')}
                      className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                      title="Dùng lại logo gốc SKYPEC"
                    >
                      Khôi phục gốc
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="h-8 w-20 bg-white rounded border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={customLogoUrl || '/skypec-logo.svg'}
                      alt="Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#006C99]" />
                    <span>{customLogoUrl ? 'Thay logo khác từ máy tính' : 'Tải tệp logo lên từ máy tính'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Tiêu đề thẻ góc trên (bên phải)
                </label>
                <input
                  type="text"
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  placeholder="THẺ NHÂN VIÊN KHU BAY"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium focus:border-[#006C99] focus:outline-hidden uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Chữ trên nhãn trạng thái
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="NHÂN VIÊN CHÍNH THỨC"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold focus:border-[#006C99] focus:outline-hidden uppercase"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Màu sắc nhãn trạng thái
                  </label>
                  <select
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium focus:border-[#006C99] focus:outline-hidden"
                  >
                    <option value="emerald">Xanh Lục (Chính thức)</option>
                    <option value="blue">Xanh Dương (Kỹ thuật)</option>
                    <option value="amber">Vàng Cam (Cán bộ giám sát)</option>
                    <option value="rose">Đỏ (Đặc nhiệm / An ninh)</option>
                    <option value="indigo">Tím Indigo (Quản lý)</option>
                  </select>
                </div>
              </div>

              {/* Color Preset Palette */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Dải màu chủ đạo thẻ (Theme Color)
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {PRESET_COLORS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setThemeColor(p.theme);
                        setSecondaryColor(p.secondary);
                      }}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                        themeColor === p.theme
                          ? 'border-slate-800 bg-slate-100 ring-1 ring-slate-800'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: p.theme }}
                      />
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Tên đơn vị chân thẻ
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] focus:border-[#006C99] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Section 3: Mặt sau thẻ */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5 text-[#006C99]" />
                <span>3. Nội dung quy định mặt sau thẻ</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Hotline an ninh / liên hệ khẩn cấp
                </label>
                <input
                  type="text"
                  value={backEmergencyPhone}
                  onChange={(e) => setBackEmergencyPhone(e.target.value)}
                  placeholder="024.3884.2222"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-medium focus:border-[#006C99] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Các điều khoản & quy định sử dụng thẻ
                </label>
                <textarea
                  rows={3}
                  value={backNotes}
                  onChange={(e) => setBackNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] focus:border-[#006C99] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap justify-between items-center gap-2 shrink-0">
          <div className="text-xs text-slate-500">
            Token mã hóa cố định: <strong className="font-mono text-[#006C99]">{employee.publicToken}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSavePETCard}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#EECD2B]" />
              <span>Lưu Quy Cách Thẻ PET</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
