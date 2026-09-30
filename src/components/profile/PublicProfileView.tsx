import React, { useState } from 'react';
import { Employee, SystemSettings, TrainingRecord } from '../../types';
import { SkypecLogo } from '../common/SkypecLogo';
import { storageService } from '../../services/storageService';
import {
  formatDateVN,
  getCertificateStatus,
  maskIdCard,
  getEmployeeStatusInfo,
} from '../../utils/helpers';
import {
  FileText,
  Shield,
  Plane,
  Award,
  Calendar,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  Lock,
  ExternalLink,
  Printer,
  CheckCircle,
  Eye,
  EyeOff,
  MapPin,
  Building2,
  Clock,
  UserCheck,
  Edit,
  Trash2,
  Plus,
  Upload,
  X,
  RefreshCw,
} from 'lucide-react';
import { OfficialResumePrintView } from './OfficialResumePrintView';

interface PublicProfileViewProps {
  employee: Employee | null;
  token: string;
  settings: SystemSettings;
  onAdminLogin?: () => void;
  onEditEmployee?: (emp: Employee) => void;
  onDeleteEmployee?: (emp: Employee) => void;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  employee,
  token,
  settings,
  onAdminLogin,
  onEditEmployee,
  onDeleteEmployee,
}) => {
  const [showFullResume, setShowFullResume] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [revealIdCard, setRevealIdCard] = useState<boolean>(false);
  const [activeAccordion, setActiveAccordion] = useState<Record<string, boolean>>({
    skills: true,
    onsite: true,
    airports: true,
    certs: true,
    history: true,
  });

  // Certificate Add & Edit State for this employee
  const [showAddCertModal, setShowAddCertModal] = useState<boolean>(false);
  const [editingCert, setEditingCert] = useState<TrainingRecord | null>(null);
  const [deleteCertId, setDeleteCertId] = useState<string | null>(null);

  const [certFormData, setCertFormData] = useState<{
    certificateName: string;
    certificateNumber: string;
    trainingFacility: string;
    trainingContent: string;
    trainingFormat: string;
    startDate: string;
    endDate: string;
    issueDate: string;
    expiryDate: string;
    certificateFileName?: string;
    certificateFileUrl?: string;
  }>({
    certificateName: '',
    certificateNumber: '',
    trainingFacility: 'Học viện Hàng không Việt Nam (VAA)',
    trainingContent: 'An toàn hàng không & Quy trình tra nạp',
    trainingFormat: 'Tập trung chính quy',
    startDate: '01/01/2026',
    endDate: '15/01/2026',
    issueDate: '20/01/2026',
    expiryDate: '20/01/2028',
  });

  const handleOpenAddCert = () => {
    setCertFormData({
      certificateName: '',
      certificateNumber: '',
      trainingFacility: 'Học viện Hàng không Việt Nam (VAA)',
      trainingContent: 'Nghiệp vụ kỹ thuật hàng không & an toàn sân đỗ',
      trainingFormat: 'Định kỳ',
      startDate: '01/01/2026',
      endDate: '15/01/2026',
      issueDate: '20/01/2026',
      expiryDate: '20/01/2028',
      certificateFileName: undefined,
      certificateFileUrl: undefined,
    });
    setShowAddCertModal(true);
  };

  const handleOpenEditCert = (record: TrainingRecord) => {
    setEditingCert(record);
    setCertFormData({
      certificateName: record.certificateName,
      certificateNumber: record.certificateNumber || '',
      trainingFacility: record.trainingFacility,
      trainingContent: record.trainingContent,
      trainingFormat: record.trainingFormat,
      startDate: record.startDate,
      endDate: record.endDate,
      issueDate: record.issueDate,
      expiryDate: record.expiryDate,
      certificateFileName: record.certificateFileName,
      certificateFileUrl: record.certificateFileUrl,
    });
  };

  const handleSaveAddCert = () => {
    if (!employee || !certFormData.certificateName.trim()) return;
    const newRecord: TrainingRecord = {
      id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order: (employee.trainingRecords?.length || 0) + 1,
      trainingFacility: certFormData.trainingFacility,
      trainingContent: certFormData.trainingContent,
      startDate: certFormData.startDate,
      endDate: certFormData.endDate,
      certificateName: certFormData.certificateName,
      certificateNumber: certFormData.certificateNumber || undefined,
      trainingFormat: certFormData.trainingFormat,
      issueDate: certFormData.issueDate,
      expiryDate: certFormData.expiryDate,
      certificateFileName: certFormData.certificateFileName,
      certificateFileUrl: certFormData.certificateFileUrl,
    };
    storageService.addCertificate(employee.id, newRecord);
    setShowAddCertModal(false);
  };

  const handleSaveEditCert = () => {
    if (!employee || !editingCert || !certFormData.certificateName.trim()) return;
    const updated: TrainingRecord = {
      ...editingCert,
      trainingFacility: certFormData.trainingFacility,
      trainingContent: certFormData.trainingContent,
      startDate: certFormData.startDate,
      endDate: certFormData.endDate,
      certificateName: certFormData.certificateName,
      certificateNumber: certFormData.certificateNumber || undefined,
      trainingFormat: certFormData.trainingFormat,
      issueDate: certFormData.issueDate,
      expiryDate: certFormData.expiryDate,
      certificateFileName: certFormData.certificateFileName,
      certificateFileUrl: certFormData.certificateFileUrl,
    };
    storageService.updateCertificate(employee.id, updated);
    setEditingCert(null);
  };

  const handleDeleteCertConfirm = () => {
    if (!employee || !deleteCertId) return;
    storageService.deleteCertificate(employee.id, deleteCertId);
    setDeleteCertId(null);
  };

  const toggleAccordion = (key: string) => {
    setActiveAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // If in full 1:1 Official A4 Print mode
  if (showFullResume && employee) {
    return (
      <OfficialResumePrintView
        employee={employee}
        onBack={() => setShowFullResume(false)}
        maskIdCard={settings.maskIdCardPublic}
        onEditEmployee={onEditEmployee}
        onDeleteEmployee={onDeleteEmployee}
      />
    );
  }

  // Handle case: Employee not found with this token
  if (!employee) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] flex flex-col justify-between p-4">
        <div className="max-w-md mx-auto w-full pt-10 text-center">
          <div className="flex justify-center mb-6">
            <SkypecLogo size="lg" />
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Không Tìm Thấy Hồ Sơ Hợp Lệ
            </h1>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Mã QR hoặc Token <strong className="font-mono text-[#006C99]">{token}</strong> không tồn tại trong hệ thống quản lý nhân viên SKYPEC, hoặc mã này đã bị thu hồi.
            </p>
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 text-left space-y-1 mb-6">
              <div>• Vui lòng liên hệ Phòng Tổ chức - Đào tạo SKYPEC.</div>
              <div>• Kiểm tra lại thẻ PET hoặc văn bản cấp phép tương ứng.</div>
            </div>
            {onAdminLogin && (
              <button
                onClick={onAdminLogin}
                className="w-full py-2.5 px-4 bg-[#006C99] hover:bg-[#005377] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Vào Bảng Quản Trị Hệ Thống
              </button>
            )}
          </div>
        </div>
        <div className="text-center text-xs text-slate-400 py-4">
          Hệ Thống Quản Lý Lý Lịch & QR Nhân Viên SKYPEC © {new Date().getFullYear()}
        </div>
      </div>
    );
  }

  // Handle case: Profile is locked / suspended (Section XXXVII)
  const isLocked = employee.status === 'locked' || employee.status === 'resigned';
  const statusInfo = getEmployeeStatusInfo(employee.status);

  return (
    <div className="min-h-screen bg-[#F7F9FA] flex flex-col pb-12 font-sans">
      {/* Top Mobile Corporate Header */}
      <header className="bg-[#006C99] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <div className="text-xs font-black tracking-wider text-[#EECD2B]">
                Vietnam Air Petrol
              </div>
              <div className="text-[11px] font-bold text-white tracking-tight uppercase">
                HỒ SƠ NGƯỜI LAO ĐỘNG
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFullResume(true)}
              className="inline-flex items-center gap-1 bg-[#EECD2B] hover:bg-[#deb81f] text-slate-900 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs"
              title="Xuất biểu mẫu lý lịch chuẩn"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Biểu Mẫu A4</span>
            </button>
            {onAdminLogin && (
              <button
                onClick={onAdminLogin}
                className="text-white/80 hover:text-white p-1.5 rounded-lg bg-white/10 text-xs font-medium"
                title="Quản trị"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Mobile-First Container */}
      <main className="max-w-xl mx-auto w-full px-4 pt-4 space-y-4">
        {/* Administrator Quick Controls Bar */}
        {(onEditEmployee || onDeleteEmployee) && (
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Quản lý hồ sơ cá nhân
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {employee.employeeCode} • Token: {employee.publicToken}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {onEditEmployee && (
                <button
                  onClick={() => onEditEmployee(employee)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Edit className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Sửa thông tin</span>
                </button>
              )}
              {onDeleteEmployee && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Xóa hồ sơ</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Warning if locked */}
        {isLocked && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3 text-rose-800 shadow-sm animate-in fade-in">
            <Lock className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm">Hồ Sơ Hiện Không Còn Hiệu Lực</h3>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                Người lao động đã nghỉ việc hoặc hồ sơ đang bị tạm khóa theo quy định an toàn hàng không của SKYPEC. Vui lòng liên hệ Phòng Tổ chức - Đào tạo để biết thêm chi tiết.
              </p>
            </div>
          </div>
        )}

        {/* 1. Main Employee Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#006C99] to-[#0088BF] p-4 text-white">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full font-mono font-semibold">
                MÃ NV: {employee.employeeCode}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.colorClass}`}>
                {statusInfo.label}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-2">
              {/* Photo 3x4 */}
              <div className="w-20 h-26 rounded-xl overflow-hidden border-2 border-white/80 bg-white/10 shrink-0 shadow-md">
                {employee.avatarUrl ? (
                  <img
                    src={employee.avatarUrl}
                    alt={employee.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-white/70">
                    Ảnh 3x4
                  </div>
                )}
              </div>

              {/* Title & Organization */}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-black tracking-tight text-white uppercase truncate">
                  {employee.fullName}
                </h1>
                <div className="text-sm font-bold text-[#EECD2B] mt-0.5 leading-snug">
                  {employee.aviationJobTitle}
                </div>
                <div className="text-xs text-blue-100 mt-1 flex items-center gap-1 truncate">
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{employee.department}</span>
                </div>
                <div className="text-xs text-blue-100 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{employee.regularAirport}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Badges below card */}
          <div className="grid grid-cols-2 divide-x divide-slate-200 bg-slate-50 border-t border-slate-200 text-xs py-3 px-4 text-slate-600">
            <div className="pr-3">
              <span className="text-slate-400 block text-[11px]">Ngày tuyển dụng:</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{formatDateVN(employee.hireDate)}</span>
            </div>
            <div className="pl-3">
              <span className="text-slate-400 block text-[11px]">Public Token cố định:</span>
              <span className="font-mono font-bold text-[#006C99] mt-0.5 block">{employee.publicToken}</span>
            </div>
          </div>
        </section>

        {/* 2. THÔNG TIN NGƯỜI LAO ĐỘNG (Section V) */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            <UserCheck className="w-4 h-4 text-[#006C99]" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Thông Tin Người Lao Động
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-slate-500 text-[11px] font-medium">1) Sinh ngày</span>
              <span className="font-bold text-slate-900 mt-1">{employee.birthDate || '—'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-slate-500 text-[11px] font-medium">2) Giới tính</span>
              <span className="font-bold text-slate-900 mt-1">{employee.gender || '—'}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-slate-500 text-[11px] font-medium">3) Căn cước công dân (CCCD)</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-bold font-mono text-slate-900">
                  {settings.maskIdCardPublic && !revealIdCard
                    ? maskIdCard(employee.idCard?.number || '', true)
                    : employee.idCard?.number || '—'}
                </span>
                {settings.maskIdCardPublic && (
                  <button
                    type="button"
                    onClick={() => setRevealIdCard(!revealIdCard)}
                    className="text-slate-400 hover:text-[#006C99] p-0.5 transition-colors cursor-pointer"
                    title={revealIdCard ? 'Ẩn bớt số CCCD' : 'Xem toàn bộ số CCCD'}
                  >
                    {revealIdCard ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
                {settings.maskIdCardPublic && !revealIdCard && (
                  <span className="text-[10px] text-amber-600 font-semibold">(Đã che)</span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-slate-500 text-[11px] font-medium">4) Chức vụ</span>
              <span className="font-bold text-slate-900 mt-1">{employee.position || '—'}</span>
            </div>

            <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <span className="text-slate-500 text-[11px] font-medium">5) Doanh nghiệp quản lý</span>
              <span className="font-bold text-slate-900 mt-1">{employee.organization || '—'}</span>
            </div>
          </div>
        </section>

        {/* 3. NGHIỆP VỤ CHUYÊN MÔN (Section V.10) */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleAccordion('skills')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#006C99]" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Nghiệp Vụ Chuyên Môn ({employee.professionalSkills.length})
              </h2>
            </div>
            {activeAccordion.skills ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {activeAccordion.skills && (
            <div className="p-4 pt-0 border-t border-slate-100">
              {employee.professionalSkills.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {employee.professionalSkills.map((s, idx) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#006C99] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 leading-snug">{s.name}</div>
                        <div className="text-[10px] text-emerald-700 mt-0.5">
                          Trạng thái: Đạt chuẩn nghiệp vụ khu bay
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">Chưa có nghiệp vụ chuyên môn</p>
              )}
            </div>
          )}
        </section>

        {/* 4. HUẤN LUYỆN TẠI CHỖ (Section VI) */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleAccordion('onsite')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-[#006C99]" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Thông Tin Huấn Luyện Tại Chỗ ({employee.onsiteTrainings.length})
              </h2>
            </div>
            {activeAccordion.onsite ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {activeAccordion.onsite && (
            <div className="p-4 pt-0 border-t border-slate-100">
              {employee.onsiteTrainings.length > 0 ? (
                <div className="space-y-3 mt-2">
                  {employee.onsiteTrainings.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#006C99]">#0{idx + 1}. {item.airport}</span>
                        <span className="text-[10px] text-slate-500">{item.duration}</span>
                      </div>
                      <div className="font-semibold text-slate-800">{item.skillName}</div>
                      <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200 mt-1">
                        <span className="text-slate-600 truncate">Số QĐ: {item.decisionNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">Không có dữ liệu huấn luyện tại chỗ</p>
              )}
            </div>
          )}
        </section>

        {/* 5. CẢNG HÀNG KHÔNG LÀM VIỆC & TĂNG CƯỜNG (Section VII) */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleAccordion('airports')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#006C99]" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Cảng Hàng Không Làm Việc & Tăng Cường
              </h2>
            </div>
            {activeAccordion.airports ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {activeAccordion.airports && (
            <div className="p-4 pt-0 border-t border-slate-100 text-xs space-y-3 mt-2">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="text-slate-500 block text-[11px]">Cảng làm việc thường xuyên:</span>
                <span className="font-bold text-[#006C99] text-sm">{employee.regularAirport}</span>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-2">
                  Cảng hàng không từng được tăng cường:
                </span>
                {employee.deployedAirports.length > 0 ? (
                  <div className="space-y-2">
                    {employee.deployedAirports.map((da, idx) => (
                      <div
                        key={da.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>{da.airport}</span>
                          <span className="text-[10px] text-slate-500">{da.startDate} - {da.endDate}</span>
                        </div>
                        <div className="text-slate-600 mt-1">{da.assignedSkill}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Chưa có điều động tăng cường</p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* 6. ĐÀO TẠO & CHỨNG CHỈ (Section XVIII: Card style with auto-status) */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors">
            <button
              onClick={() => toggleAccordion('certs')}
              className="flex items-center gap-2 flex-1 cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#006C99]" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Chứng Chỉ, Chứng Nhận & Đào Tạo ({employee.trainingRecords.length})
              </h2>
              {activeAccordion.certs ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Quick Add Certificate for this person (Admin only) */}
            {onEditEmployee && (
              <button
                onClick={handleOpenAddCert}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#006C99] hover:bg-[#005377] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer ml-2 shrink-0"
                title="Thêm chứng chỉ mới cho nhân viên này"
              >
                <Plus className="w-3.5 h-3.5 text-[#EECD2B]" />
                <span>Thêm Chứng Chỉ</span>
              </button>
            )}
          </div>

          {activeAccordion.certs && (
            <div className="p-4 pt-0 border-t border-slate-100">
              {employee.trainingRecords.length > 0 ? (
                <div className="space-y-3 mt-2">
                  {employee.trainingRecords.map((tr) => {
                    const status = getCertificateStatus(tr.expiryDate, settings.warningDays);
                    return (
                      <div
                        key={tr.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5 relative overflow-hidden"
                      >
                        {/* Status bar */}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight truncate max-w-[60%]">
                            {tr.trainingFacility}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${status.badgeClass}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        {/* Title */}
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug">
                            {tr.certificateName}
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5">{tr.trainingContent}</p>
                          {tr.certificateNumber && (
                            <div className="text-[11px] font-mono text-[#006C99] mt-0.5 font-bold">
                              Số hiệu: {tr.certificateNumber}
                            </div>
                          )}
                          {tr.certificateFileUrl && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                              📎 Có tệp đính kèm: {tr.certificateFileName || 'Tệp số hóa'}
                            </div>
                          )}
                        </div>

                        {/* Dates grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Ngày cấp:</span>
                            <span className="font-semibold">{formatDateVN(tr.issueDate)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Ngày hết hạn:</span>
                            <span className="font-semibold">{formatDateVN(tr.expiryDate)}</span>
                          </div>
                        </div>

                        {/* Actions: Edit, Delete (Admin only) */}
                        {onEditEmployee && (
                          <div className="pt-1 flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleOpenEditCert(tr)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                              title="Sửa thông tin chứng chỉ này"
                            >
                              <Edit className="w-3 h-3 text-emerald-700" />
                              <span>Sửa</span>
                            </button>

                            <button
                              onClick={() => setDeleteCertId(tr.id)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                              title="Xóa chứng chỉ này khỏi hồ sơ"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">Chưa có thông tin chứng chỉ</p>
              )}
            </div>
          )}
        </section>

        {/* 7. QUÁ TRÌNH CÔNG TÁC (Section X) */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleAccordion('history')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#006C99]" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Tóm Tắt Quá Trình Công Tác ({employee.workHistory.length})
              </h2>
            </div>
            {activeAccordion.history ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {activeAccordion.history && (
            <div className="p-4 pt-0 border-t border-slate-100">
              {employee.workHistory.length > 0 ? (
                <div className="relative border-l-2 border-[#006C99]/30 ml-2 my-2 space-y-4 pl-4 text-xs">
                  {employee.workHistory.map((wh) => (
                    <div key={wh.id} className="relative">
                      <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-[#006C99] border-2 border-white shadow-xs" />
                      <div className="font-bold text-[#006C99]">{wh.period}</div>
                      <div className="text-slate-700 mt-0.5 leading-relaxed">{wh.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">Chưa có dữ liệu quá trình công tác</p>
              )}
            </div>
          )}
        </section>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setShowFullResume(true)}
            className="w-full py-3 px-4 bg-[#006C99] hover:bg-[#005377] text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#EECD2B]" />
            <span>Xem & Xuất Lý Lịch Chuẩn A4 (PDF)</span>
          </button>

          <p className="text-center text-[11px] text-slate-500">
            Hệ thống dữ liệu bảo mật SKYPEC • Tra cứu từ mã QR cố định: <strong className="font-mono text-slate-700">{employee.publicToken}</strong>
          </p>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xác Nhận Xóa Hồ Sơ Cá Nhân
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ của {employee.fullName} ({employee.employeeCode})?
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Họ và tên:</span>
                <span className="font-bold text-slate-900 uppercase">{employee.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã nhân viên:</span>
                <span className="font-mono font-bold text-[#006C99]">{employee.employeeCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chức danh:</span>
                <span className="font-semibold text-slate-800">{employee.aviationJobTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã QR Token:</span>
                <span className="font-mono font-bold text-slate-700">{employee.publicToken}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  if (onDeleteEmployee) {
                    onDeleteEmployee(employee);
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors text-xs inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa Vĩnh Viễn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Thêm / Sửa Chứng Chỉ Cá Nhân */}
      {(showAddCertModal || editingCert) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="px-5 py-3.5 bg-[#006C99] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#EECD2B]" />
                <h3 className="font-bold text-sm sm:text-base">
                  {editingCert ? 'Sửa Chứng Chỉ' : 'Thêm Chứng Chỉ Mới'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddCertModal(false);
                  setEditingCert(null);
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tên chứng chỉ / CCCM <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={certFormData.certificateName}
                  onChange={(e) => setCertFormData({ ...certFormData, certificateName: e.target.value })}
                  placeholder="Ví dụ: Giấy phép điều khiển phương tiện khu bay"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-hidden focus:border-[#006C99]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số hiệu văn bằng</label>
                  <input
                    type="text"
                    value={certFormData.certificateNumber}
                    onChange={(e) => setCertFormData({ ...certFormData, certificateNumber: e.target.value })}
                    placeholder="CAAV-CCCM-2025"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hình thức</label>
                  <input
                    type="text"
                    value={certFormData.trainingFormat}
                    onChange={(e) => setCertFormData({ ...certFormData, trainingFormat: e.target.value })}
                    placeholder="Định kỳ / Tập trung"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cơ sở đào tạo / Đơn vị cấp</label>
                <input
                  type="text"
                  value={certFormData.trainingFacility}
                  onChange={(e) => setCertFormData({ ...certFormData, trainingFacility: e.target.value })}
                  placeholder="Học viện Hàng không VN / SKYPEC"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung đào tạo</label>
                <input
                  type="text"
                  value={certFormData.trainingContent}
                  onChange={(e) => setCertFormData({ ...certFormData, trainingContent: e.target.value })}
                  placeholder="Nghiệp vụ an toàn kỹ thuật sân đỗ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày cấp (dd/mm/yyyy)</label>
                  <input
                    type="text"
                    value={certFormData.issueDate}
                    onChange={(e) => setCertFormData({ ...certFormData, issueDate: e.target.value })}
                    placeholder="15/09/2025"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày hết hạn (dd/mm/yyyy)</label>
                  <input
                    type="text"
                    value={certFormData.expiryDate}
                    onChange={(e) => setCertFormData({ ...certFormData, expiryDate: e.target.value })}
                    placeholder="15/09/2027"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* File Attachment Upload */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="font-bold text-slate-800 block text-xs">
                  Tệp đính kèm chứng chỉ (Ảnh chụp / Bản scan)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#006C99] hover:bg-[#005377] text-white font-bold text-xs cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{certFormData.certificateFileUrl ? 'Đổi tệp khác' : 'Tải lên ảnh/PDF'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setCertFormData((prev) => ({
                              ...prev,
                              certificateFileUrl: event.target?.result as string,
                              certificateFileName: file.name,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {certFormData.certificateFileUrl && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-medium truncate max-w-[180px]">{certFormData.certificateFileName || 'Đã có tệp'}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCertFormData((prev) => ({
                            ...prev,
                            certificateFileUrl: undefined,
                            certificateFileName: undefined,
                          }))
                        }
                        className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer"
                        title="Xóa tệp đính kèm"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddCertModal(false);
                  setEditingCert(null);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={editingCert ? handleSaveEditCert : handleSaveAddCert}
                className="px-4 py-1.5 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                {editingCert ? 'Lưu Thay Đổi' : 'Xác Nhận Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Xác nhận xóa chứng chỉ */}
      {deleteCertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-3 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">Xóa Chứng Chỉ Này?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa chứng chỉ đã chọn khỏi hồ sơ của cán bộ nhân viên này?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteCertId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCertConfirm}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
