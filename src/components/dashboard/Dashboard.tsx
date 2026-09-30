import React, { useMemo } from 'react';
import { Employee, SystemSettings } from '../../types';
import { getCertificateStatus } from '../../utils/helpers';
import {
  Users,
  Award,
  AlertTriangle,
  Clock,
  ShieldCheck,
  QrCode,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building,
  Plus,
  Download,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import { downloadSkypecExcelTemplate } from '../../utils/excelTemplate';

interface DashboardProps {
  employees: Employee[];
  settings: SystemSettings;
  onNavigateToEmployees: () => void;
  onNavigateToCertificates: () => void;
  onAddEmployee: () => void;
  onOpenImportModal: () => void;
  onOpenTestRunner: () => void;
  onOpenPdfView: (emp: Employee) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  employees,
  settings,
  onNavigateToEmployees,
  onNavigateToCertificates,
  onAddEmployee,
  onOpenImportModal,
  onOpenTestRunner,
  onOpenPdfView,
}) => {
  // Aggregate metrics
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.status === 'active').length;

    let totalCerts = 0;
    let validCerts = 0;
    let expiringCerts = 0;
    let expiredCerts = 0;

    const expiringList: Array<{
      employee: Employee;
      certName: string;
      facility: string;
      expiryDate: string;
      daysRemaining: number;
    }> = [];

    const missingPhotoList: Employee[] = [];

    employees.forEach((emp) => {
      if (!emp.avatarUrl) {
        missingPhotoList.push(emp);
      }

      emp.trainingRecords.forEach((tr) => {
        totalCerts++;
        const certEval = getCertificateStatus(tr.expiryDate, settings.warningDays);
        if (certEval.status === 'expired') {
          expiredCerts++;
        } else if (certEval.status === 'expiring') {
          expiringCerts++;
          expiringList.push({
            employee: emp,
            certName: tr.certificateName,
            facility: tr.trainingFacility,
            expiryDate: tr.expiryDate,
            daysRemaining: certEval.daysRemaining,
          });
        } else {
          validCerts++;
        }
      });
    });

    // Sort expiring list ascending (closest first)
    expiringList.sort((a, b) => a.daysRemaining - b.daysRemaining);

    return {
      totalEmployees,
      activeEmployees,
      totalCerts,
      validCerts,
      expiringCerts,
      expiredCerts,
      expiringList,
      missingPhotoList,
    };
  }, [employees, settings.warningDays]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#006C99] to-[#0088BF] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#EECD2B] text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>HỆ THỐNG QUẢN LÝ LÝ LỊCH NHÂN VIÊN HÀNG KHÔNG SKYPEC</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Trung Tâm Giám Sát Hồ Sơ Đào Tạo & QR Thẻ PET
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
              Nguyên tắc kiến trúc: <strong>Mỗi nhân viên 01 mã QR cố định</strong> • Dữ liệu đào tạo, chứng chỉ, chức danh và quá trình công tác cập nhật tự động mà không cần in lại thẻ PET.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenTestRunner}
              className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-slate-900" />
              <span>Test 7 Bước (Mục III)</span>
            </button>

            <button
              type="button"
              onClick={downloadSkypecExcelTemplate}
              className="px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer border border-white/30"
              title="Tải biểu mẫu Excel chuẩn 15 cột quy định của SKYPEC"
            >
              <Download className="w-4 h-4 text-[#EECD2B]" />
              <span>Tải Mẫu Excel (.xlsx)</span>
            </button>

            <button
              onClick={onOpenImportModal}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#006C99] font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
              title="Nhập danh sách nhân viên từ file Excel"
            >
              <Upload className="w-4 h-4 text-[#006C99]" />
              <span>Nhập File Excel</span>
            </button>

            <button
              onClick={onAddEmployee}
              className="px-3.5 py-2.5 rounded-xl bg-[#EECD2B] hover:bg-[#deb81f] text-slate-900 font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-900" />
              <span>Thêm Hồ Sơ Mới</span>
            </button>
          </div>
        </div>

        {/* Subtle background flight path decoration */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
          <QrCode className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng hồ sơ */}
        <div
          onClick={onNavigateToEmployees}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#006C99] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Hồ Sơ</span>
            <div className="p-2 rounded-xl bg-blue-50 text-[#006C99] group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats.totalEmployees}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{stats.activeEmployees} đang làm việc</span>
          </div>
        </div>

        {/* Card 2: Chứng nhận hiệu lực */}
        <div
          onClick={onNavigateToCertificates}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#006C99] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Chứng Nhận Hiệu Lực</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {stats.validCerts}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Trên tổng số {stats.totalCerts} chứng chỉ
          </div>
        </div>

        {/* Card 3: Sắp hết hạn */}
        <div
          onClick={onNavigateToCertificates}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Sắp Hết Hạn (&lt;{settings.warningDays} ngày)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {stats.expiringCerts}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            Cần lên kế hoạch huấn luyện lại
          </div>
        </div>

        {/* Card 4: Đã hết hạn */}
        <div
          onClick={onNavigateToCertificates}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Đã Hết Hạn</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {stats.expiredCerts}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">
            Tạm dừng thao tác khu bay
          </div>
        </div>
      </div>

      {/* Two Columns: Section XIV "Cần xử lý" & Recent Profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: CẦN XỬ LÝ (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Cảnh Báo Nghiệp Vụ Cần Xử Lý ({stats.expiringCerts + stats.expiredCerts})
                </h3>
              </div>
              <button
                onClick={onNavigateToCertificates}
                className="text-xs font-bold text-[#006C99] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả chứng chỉ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {stats.expiringList.slice(0, 5).map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm leading-snug">
                      {item.certName}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Nhân viên: <strong className="text-slate-800">{item.employee.fullName}</strong> ({item.employee.employeeCode}) • {item.employee.department}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Còn {item.daysRemaining} ngày
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Hết hạn: {item.expiryDate}
                    </div>
                  </div>
                </div>
              ))}

              {stats.expiringList.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <span>Không có chứng chỉ nào sắp hết hạn trong ngưỡng cảnh báo ({settings.warningDays} ngày).</span>
                </div>
              )}
            </div>
          </div>

          {/* Verification Reminder Card */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-emerald-950 text-sm">
                Quy Trình Quét Thẻ PET Định Kỳ Tại Sân Bay
              </h4>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Khi thanh tra Cục Hàng không hoặc An ninh khu bay quét mã QR trên thẻ PET, hệ thống luôn truy vấn trực tiếp cơ sở dữ liệu thời gian thực. Bất kỳ quyết định công nhận huấn luyện mới hay chứng chỉ định kỳ nào vừa cập nhật trên hệ thống đều hiển thị lập tức.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={onOpenTestRunner}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Chạy kiểm tra tính bất biến của QR</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hồ Sơ Mới Cập Nhật */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Hồ Sơ Vừa Cập Nhật
              </h3>
              <button
                onClick={onNavigateToEmployees}
                className="text-xs font-bold text-[#006C99] hover:underline"
              >
                Tất cả
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {employees.slice(0, 5).map((emp) => (
                <div key={emp.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
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
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {emp.fullName}
                      </div>
                      <div className="text-[11px] text-[#006C99] truncate font-medium">
                        {emp.aviationJobTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Token: {emp.publicToken}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenPdfView(emp)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#006C99] hover:bg-slate-100 transition-colors shrink-0"
                    title="Xem biểu mẫu lý lịch chuẩn A4"
                  >
                    <FileText className="w-4 h-4 text-[#006C99]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
