import React, { useState, useEffect } from 'react';
import { Employee } from '../../types';
import { formatDateVN } from '../../utils/helpers';
import { generateQrDataUrl, getPublicUrlForToken } from '../../services/qrService';
import {
  Printer,
  Download,
  ArrowLeft,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Type,
  ExternalLink,
} from 'lucide-react';

interface OfficialResumePrintViewProps {
  employee: Employee;
  onBack?: () => void;
  maskIdCard?: boolean;
  onOpenPublicScanView?: (token: string) => void;
  onEditEmployee?: (emp: Employee) => void;
  onDeleteEmployee?: (emp: Employee) => void;
}

export const OfficialResumePrintView: React.FC<OfficialResumePrintViewProps> = ({
  employee,
  onBack,
  maskIdCard = false,
  onOpenPublicScanView,
}) => {
  // Fixed font Times New Roman (chuẩn Nghị định 30/2020/NĐ-CP)
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (employee) {
      const publicUrl = getPublicUrlForToken(employee.publicToken);
      generateQrDataUrl(publicUrl, { width: 260, margin: 1 }).then(setQrDataUrl);
    }
  }, [employee]);

  const handlePrint = () => {
    window.print();
  };

  const idCardDisplay = maskIdCard
    ? `${employee.idCard.number.slice(0, 4)}******${employee.idCard.number.slice(-2)}`
    : employee.idCard.number;

  const fontClass = 'font-vn-admin';

  const textSizeClass =
    fontSize === 'sm'
      ? 'text-[12px]'
      : fontSize === 'lg'
      ? 'text-[15px]'
      : 'text-[13.5px]';

  return (
    <div className={`min-h-screen bg-slate-200 py-6 px-4 print:p-0 print:bg-white text-black ${fontClass}`}>
      {/* Control Bar (hidden during print) */}
      <div className="no-print max-w-4xl mx-auto mb-6 bg-white p-4 rounded-xl shadow-md border border-slate-300 flex flex-wrap items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
          )}
          <div>
            <h2 className="font-bold text-slate-900 text-sm">
              Biểu Mẫu Chuẩn A4: Lý Lịch Nhân Viên Hàng Không
            </h2>
            <p className="text-[11px] text-slate-500">
              Mã hồ sơ: <strong className="text-[#006C99]">{employee.employeeCode}</strong> • Token: <strong className="font-mono text-slate-700">{employee.publicToken}</strong> • Phông chữ: <span className="font-semibold text-slate-700">Times New Roman</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Font Size controls */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                fontSize === 'sm' ? 'bg-white font-bold text-[#006C99]' : 'text-slate-600'
              }`}
              title="Cỡ chữ 12px"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                fontSize === 'base' ? 'bg-white font-bold text-[#006C99]' : 'text-slate-600'
              }`}
              title="Cỡ chữ chuẩn 13.5px"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                fontSize === 'lg' ? 'bg-white font-bold text-[#006C99]' : 'text-slate-600'
              }`}
              title="Cỡ chữ 15px"
            >
              A+
            </button>
          </div>

          {onOpenPublicScanView && (
            <button
              onClick={() => onOpenPublicScanView(employee.publicToken)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-colors cursor-pointer"
              title="Xem hồ sơ di động sau khi quét QR"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Xem Thử Quét QR</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#EECD2B]" />
            <span>In / Lưu PDF A4</span>
          </button>
        </div>
      </div>

      {/* A4 Document Container */}
      <div
        id="printable-resume"
        className={`max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-12 print:p-0 leading-[1.6] ${textSizeClass} border border-slate-200 print:border-none ${fontClass}`}
      >
        {/* PAGE 1 CONTENT */}
        <div className="relative">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div
              className="text-left w-[46%] leading-tight"
              style={{
                marginLeft: '0px',
                paddingLeft: '42px',
              }}
            >
              <div className="font-bold text-[12px] uppercase text-slate-900">
                TỔNG CÔNG TY HÀNG KHÔNG VIỆT NAM
              </div>
              <div className="font-bold text-[12px] uppercase text-black mt-0.5">
                CÔNG TY TNHH MTV NHIÊN LIỆU HÀNG KHÔNG VIỆT NAM (SKYPEC)
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Mã hồ sơ: <span className="font-bold">{employee.employeeCode}</span>
              </div>
            </div>

            <div
              className="text-center w-[50%] leading-tight"
              style={{
                marginTop: '2px',
                textAlign: 'center',
                fontSize: '12px',
                lineHeight: '15px',
                paddingLeft: '0px',
                width: '287.934px',
              }}
            >
              <div className="font-bold text-[12px] uppercase text-black">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="font-bold text-[12px] border-b border-black inline-block pb-0.5 mt-0.5">
                Độc lập - Tự do - Hạnh phúc
              </div>
            </div>
          </div>

          {/* Form Title */}
          <div className="text-center my-6">
            <h1 className="text-[19px] font-bold uppercase tracking-wide mb-1 text-black">
              LÝ LỊCH NHÂN VIÊN
            </h1>
            <h2 className="text-[13.5px] font-bold uppercase tracking-wide text-black">
              ĐIỀU KHIỂN PHƯƠNG TIỆN, VẬN HÀNH THIẾT BỊ TẠI SÂN BAY
            </h2>
          </div>

          {/* Photo & Basic Details & Fixed QR (Mục 1 - 4) */}
          <div className="flex gap-5 mb-4 items-start">
            {/* Photo 3x4 */}
            <div className="w-[32mm] h-[42mm] border-2 border-slate-400 shrink-0 flex flex-col items-center justify-center p-1 bg-slate-50 relative overflow-hidden">
              {employee.avatarUrl ? (
                <img
                  src={employee.avatarUrl}
                  alt={employee.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-slate-500 text-center">
                  Ảnh màu<br />3x4
                </span>
              )}
            </div>

            {/* Items 1 - 4 */}
            <div className="flex-1 space-y-1.5 leading-relaxed">
              <div>
                <span className="font-bold">1) Họ và tên:</span>{' '}
                <span className="font-bold uppercase text-[15px]">{employee.fullName}</span>
              </div>
              <div>
                <span className="font-bold">2) Sinh ngày:</span>{' '}
                <span>{employee.birthDate}</span> (ngày/tháng/năm)
              </div>
              <div>
                <span className="font-bold">3) Giới tính (nam, nữ):</span>{' '}
                <span>{employee.gender}</span>
              </div>
              <div className="leading-relaxed">
                <span className="font-bold">4) Số căn cước công dân:</span>{' '}
                <span className="font-semibold">{idCardDisplay}</span>
                <span className="ml-4 font-bold">Ngày cấp:</span>{' '}
                <span>{employee.idCard.issueDate}</span>
                <span className="ml-4 font-bold">Nơi cấp:</span>{' '}
                <span>{employee.idCard.issuePlace}</span>
              </div>
            </div>

            {/* Fixed QR Code on Official Resume */}
            <div className="w-[32mm] h-[42mm] border-2 border-slate-300 p-1.5 bg-white flex flex-col items-center justify-between text-center shrink-0 shadow-2xs">
              <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code Lý Lịch" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-[8px] text-slate-400">Đang tải QR...</div>
                )}
              </div>
              <div className="w-full border-t border-slate-200 pt-0.5 mt-0.5">
                <div className="text-[7.5px] font-bold text-[#006C99] uppercase tracking-tighter leading-none">
                  MÃ QR TRA CỨU
                </div>
                <div className="text-[7px] font-mono font-bold text-slate-600 mt-0.5">
                  {employee.publicToken}
                </div>
              </div>
            </div>
          </div>

          {/* Items 5 - 10 */}
          <div className="space-y-1.5 mb-4 leading-relaxed">
            <div>
              <span className="font-bold">5) Ngày tuyển dụng:</span>{' '}
              <span>{employee.hireDate}</span> (ngày/tháng/năm)
            </div>
            <div>
              <span className="font-bold">6) Doanh nghiệp/cơ quan quản lý nhân viên:</span>{' '}
              <span>{employee.organization}</span>
            </div>
            <div>
              <span className="font-bold">7) Chức danh nhân viên hàng không:</span>{' '}
              <span className="font-bold">{employee.aviationJobTitle}</span>
            </div>
            <div>
              <span className="font-bold">8) Phòng/ ban/ tổ/ đội:</span>{' '}
              <span>{employee.department}</span>
            </div>
            <div>
              <span className="font-bold">9) Chức vụ:</span>{' '}
              <span>{employee.position}</span>
            </div>
            <div>
              <span className="font-bold">10) Các nghiệp vụ chuyên môn:</span>
              <div className="ml-4 mt-1">
                {employee.professionalSkills.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5">
                    {employee.professionalSkills.map((s) => (
                      <li key={s.id}>
                        {s.name} {s.status === 'suspended' ? '(Tạm ngưng)' : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="italic text-slate-500">Chưa có thông tin</span>
                )}
              </div>
            </div>
          </div>

          {/* Item 11: Thông tin huấn luyện tại chỗ */}
          <div className="mb-4">
            <div className="font-bold mb-1.5">11) Thông tin huấn luyện tại chỗ:</div>
            <table className="w-full border-collapse border border-black text-[12px] text-center">
              <thead>
                <tr className="bg-slate-50 font-bold">
                  <th className="border border-black p-1.5 w-10">STT</th>
                  <th className="border border-black p-1.5 w-[30%]">
                    Nghiệp vụ được đào tạo tại chỗ
                  </th>
                  <th className="border border-black p-1.5 w-[25%]">
                    Cảng hàng không được huấn luyện nghiệp vụ tại chỗ
                  </th>
                  <th className="border border-black p-1.5 w-[20%]">
                    Thời gian huấn luyện nghiệp vụ tại chỗ
                  </th>
                  <th className="border border-black p-1.5">
                    Quyết định công nhận hoàn thành huấn luyện nghiệp vụ tại chỗ
                  </th>
                </tr>
              </thead>
              <tbody>
                {employee.onsiteTrainings.length > 0 ? (
                  employee.onsiteTrainings.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="border border-black p-1.5 font-bold">{idx + 1}</td>
                      <td className="border border-black p-1.5 text-left">{item.skillName}</td>
                      <td className="border border-black p-1.5">{item.airport}</td>
                      <td className="border border-black p-1.5">{item.duration}</td>
                      <td className="border border-black p-1.5 font-medium">
                        {item.decisionNumber}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="border border-black p-2 italic text-slate-500">
                      Chưa có dữ liệu huấn luyện tại chỗ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Item 12: Cảng hàng không làm việc thường xuyên */}
          <div className="mb-6">
            <span className="font-bold">12) Cảng hàng không làm việc thường xuyên:</span>{' '}
            <span className="font-semibold">{employee.regularAirport}</span>
          </div>
        </div>

        {/* PAGE BREAK FOR CLEAN PRINTING */}
        <div className="page-break-after"></div>

        {/* PAGE 2 CONTENT */}
        <div className="pt-6 print:pt-4">
          {/* Item 13: Cảng hàng không được tăng cường (nếu có) */}
          <div className="mb-5">
            <div className="font-bold mb-1.5">
              13) Cảng hàng không được tăng cường (nếu có):
            </div>
            <table className="w-full border-collapse border border-black text-[12px] text-center">
              <thead>
                <tr className="bg-slate-50 font-bold">
                  <th className="border border-black p-1.5 w-10">STT</th>
                  <th className="border border-black p-1.5 w-[30%]">
                    Cảng hàng không được tăng cường
                  </th>
                  <th className="border border-black p-1.5 w-[35%]">
                    Nghiệp vụ được giao được tăng cường
                  </th>
                  <th className="border border-black p-1.5" colSpan={2}>
                    Thời gian được tăng cường
                  </th>
                </tr>
                <tr className="bg-slate-50 font-bold text-[11px]">
                  <th colSpan={3} className="border border-black p-1"></th>
                  <th className="border border-black p-1 w-[15%]">Từ ngày</th>
                  <th className="border border-black p-1 w-[15%]">Đến ngày</th>
                </tr>
              </thead>
              <tbody>
                {employee.deployedAirports.length > 0 ? (
                  employee.deployedAirports.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="border border-black p-1.5 font-bold">{idx + 1}</td>
                      <td className="border border-black p-1.5 text-left">{item.airport}</td>
                      <td className="border border-black p-1.5 text-left">{item.assignedSkill}</td>
                      <td className="border border-black p-1.5">{item.startDate}</td>
                      <td className="border border-black p-1.5">{item.endDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="border border-black p-2 italic text-slate-500">
                      Không có thời gian tăng cường
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Item 14: Đào tạo, huấn luyện nhân viên hàng không */}
          <div className="mb-5">
            <div className="font-bold mb-1.5">
              14) Đào tạo, huấn luyện nhân viên hàng không:
            </div>
            <table className="w-full border-collapse border border-black text-[11.5px] text-center">
              <thead>
                <tr className="bg-slate-50 font-bold">
                  <th className="border border-black p-1 w-8">STT</th>
                  <th className="border border-black p-1 w-[18%]">Tên Cơ sở đào tạo</th>
                  <th className="border border-black p-1 w-[20%]">Nội dung đào tạo/Nghiệp vụ chuyên môn</th>
                  <th className="border border-black p-1 w-[16%]">Từ ngày tháng, năm - đến ngày tháng, năm</th>
                  <th className="border border-black p-1 w-[22%]">
                    CCCM/ Chứng nhận/Thẻ nghiệp vụ
                  </th>
                  <th className="border border-black p-1 w-[10%]">Hình thức đào tạo</th>
                  <th className="border border-black p-1 w-[10%]">Ngày cấp</th>
                  <th className="border border-black p-1 w-[10%]">Ngày hết hạn</th>
                </tr>
              </thead>
              <tbody>
                {employee.trainingRecords.length > 0 ? (
                  employee.trainingRecords.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="border border-black p-1 font-bold">{idx + 1}</td>
                      <td className="border border-black p-1 text-left">{item.trainingFacility}</td>
                      <td className="border border-black p-1 text-left">{item.trainingContent}</td>
                      <td className="border border-black p-1">
                        {item.startDate} - {item.endDate}
                      </td>
                      <td className="border border-black p-1 text-left">
                        <span className="font-semibold text-slate-900">
                          {item.certificateName}
                        </span>
                        {item.certificateNumber && (
                          <div className="text-[10px] text-slate-600">
                            Số: {item.certificateNumber}
                          </div>
                        )}
                      </td>
                      <td className="border border-black p-1">{item.trainingFormat}</td>
                      <td className="border border-black p-1">{formatDateVN(item.issueDate)}</td>
                      <td className="border border-black p-1 font-medium">{formatDateVN(item.expiryDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="border border-black p-2 italic text-slate-500">
                      Chưa có hồ sơ đào tạo huấn luyện
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Item 15: Tóm tắt quá trình công tác */}
          <div className="mb-6">
            <div className="font-bold mb-1.5">15) Tóm tắt quá trình công tác:</div>
            <table className="w-full border-collapse border border-black text-[12px] text-center">
              <thead>
                <tr className="bg-slate-50 font-bold">
                  <th className="border border-black p-1.5 w-[30%]">
                    Từ tháng, năm đến tháng, năm
                  </th>
                  <th className="border border-black p-1.5">
                    Chức danh, chức vụ, đơn vị công tác, cảng hàng không làm việc
                  </th>
                </tr>
              </thead>
              <tbody>
                {employee.workHistory.length > 0 ? (
                  employee.workHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-black p-1.5 font-medium">{item.period}</td>
                      <td className="border border-black p-1.5 text-left">{item.description}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="border border-black p-2 italic text-slate-500">
                      Chưa ghi nhận quá trình công tác
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
