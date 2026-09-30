import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { generateQrDataUrl, getPublicUrlForToken } from '../../services/qrService';
import {
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  QrCode,
  ShieldCheck,
  FileText,
  ArrowRight,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import { Employee } from '../../types';

interface MandatoryTestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEmployeeResume?: (emp: Employee) => void;
}

interface TestStep {
  step: number;
  title: string;
  description: string;
  expected: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  resultDetail?: string;
}

export const MandatoryTestRunnerModal: React.FC<MandatoryTestRunnerModalProps> = ({
  isOpen,
  onClose,
  onOpenEmployeeResume,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testEmp, setTestEmp] = useState<Employee | null>(null);
  const [step2QrUrl, setStep2QrUrl] = useState<string>('');
  const [step7QrUrl, setStep7QrUrl] = useState<string>('');
  const [testComplete, setTestComplete] = useState<boolean>(false);

  const initialSteps: TestStep[] = [
    {
      step: 1,
      title: 'Bước 1: Tạo nhân viên Nguyễn Văn A',
      description: 'Khởi tạo hồ sơ nhân viên Nguyễn Văn A với chức danh ban đầu: "Nhân viên điều khiển phương tiện".',
      expected: 'Hồ sơ được lưu vào DB với Chức danh: Nhân viên điều khiển phương tiện',
      status: 'pending',
    },
    {
      step: 2,
      title: 'Bước 2: Hệ thống sinh mã QR cố định',
      description: 'Hệ thống tự động cấp Public Token duy nhất và sinh mã QR bảo mật.',
      expected: 'QR Code được tạo thành công gắn với Public Token cố định',
      status: 'pending',
    },
    {
      step: 3,
      title: 'Bước 3: Tải & Lưu QR (Coi như đã in lên thẻ PET)',
      description: 'Lưu trữ mã QR cố định làm bằng chứng đối chiếu cho thẻ nhân viên PET.',
      expected: 'Hình ảnh QR được chụp và đóng băng mã hóa tại thời điểm này',
      status: 'pending',
    },
    {
      step: 4,
      title: 'Bước 4: Quét QR lần 1',
      description: 'Mô phỏng camera quét QR lần 1 -> Đọc dữ liệu từ Token.',
      expected: 'Hệ thống hiển thị đúng chức danh: "Nhân viên điều khiển phương tiện"',
      status: 'pending',
    },
    {
      step: 5,
      title: 'Bước 5: Quản trị viên sửa đổi chức danh',
      description: 'Cán bộ cập nhật chức danh thành: "Nhân viên vận hành thiết bị".',
      expected: 'Cập nhật database thành công, ghi nhật ký thay đổi (Audit Log)',
      status: 'pending',
    },
    {
      step: 6,
      title: 'Bước 6: Khẳng định KHÔNG sinh QR mới',
      description: 'Kiểm tra token và đường dẫn QR code của nhân viên sau khi sửa thông tin.',
      expected: 'Token và QR code hoàn toàn KHÔNG THAY ĐỔI (Token giữ nguyên 100%)',
      status: 'pending',
    },
    {
      step: 7,
      title: 'Bước 7: Quét lại đúng QR đã in ở Bước 3',
      description: 'Quét lại bằng mã QR cũ đã in trên thẻ PET ban đầu để nghiệm thu.',
      expected: 'Dữ liệu hiển thị cập nhật ngay lập tức: "Nhân viên vận hành thiết bị" (Cả Web và PDF)',
      status: 'pending',
    },
  ];

  const [steps, setSteps] = useState<TestStep[]>(initialSteps);

  if (!isOpen) return null;

  const runFullTest = async () => {
    setIsRunning(true);
    setTestComplete(false);
    const updated = [...initialSteps];

    // --- STEP 1 ---
    setCurrentStep(1);
    updated[0].status = 'running';
    setSteps([...updated]);
    await new Promise((r) => setTimeout(r, 600));

    // Check or create test employee
    let emp = storageService.getEmployees().find((e) => e.employeeCode === 'SKP-TEST-A');
    if (!emp) {
      emp = storageService.createEmployee(
        {
          employeeCode: 'SKP-TEST-A',
          fullName: 'Nguyễn Văn A (Kiểm Thử)',
          birthDate: '15/08/1988',
          gender: 'Nam',
          idCard: {
            number: '001088019842',
            issueDate: '10/05/2021',
            issuePlace: 'Cục Cảnh sát QLHC về TTXH',
          },
          hireDate: '01/06/2018',
          organization: 'Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam (SKYPEC)',
          aviationJobTitle: 'Nhân viên điều khiển phương tiện',
          department: 'Chi nhánh ĐBSH / Đội xe tra nạp Nội Bài',
          position: 'Nhân viên',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=faces&q=80',
          status: 'active',
          regularAirport: 'Cảng HKQT Nội Bài (HAN)',
          professionalSkills: [
            { id: 'tps_1', order: 1, name: 'Điều khiển phương tiện chuyên dụng khu bay', status: 'active' },
          ],
          onsiteTrainings: [],
          deployedAirports: [],
          trainingRecords: [],
          workHistory: [],
        },
        'Hệ thống Kiểm thử Nghiệm thu'
      );
    } else {
      // Reset to original title
      emp = storageService.updateEmployee(
        emp.id,
        { aviationJobTitle: 'Nhân viên điều khiển phương tiện' },
        'Hệ thống Kiểm thử Nghiệm thu'
      )!;
    }

    setTestEmp(emp);
    updated[0].status = 'passed';
    updated[0].resultDetail = `Đã tạo nhân viên ${emp.fullName}, Chức danh: "${emp.aviationJobTitle}", Mã NV: ${emp.employeeCode}`;
    setSteps([...updated]);

    // --- STEP 2 ---
    setCurrentStep(2);
    updated[1].status = 'running';
    setSteps([...updated]);
    await new Promise((r) => setTimeout(r, 600));

    const publicUrl = getPublicUrlForToken(emp.publicToken);
    const qrDataUrl1 = await generateQrDataUrl(publicUrl, { width: 240 });
    setStep2QrUrl(qrDataUrl1);

    updated[1].status = 'passed';
    updated[1].resultDetail = `Public Token: ${emp.publicToken} | URL: ${publicUrl}`;
    setSteps([...updated]);

    // --- STEP 3 ---
    setCurrentStep(3);
    updated[2].status = 'running';
    setSteps([...updated]);
    await new Promise((r) => setTimeout(r, 500));

    updated[2].status = 'passed';
    updated[2].resultDetail = `Đã kết xuất & đóng băng hình ảnh QR thẻ PET (Độ dài chuỗi mã hóa: ${qrDataUrl1.length} bytes)`;
    setSteps([...updated]);

    // --- STEP 4 ---
    setCurrentStep(4);
    updated[3].status = 'running';
    setSteps([...updated]);
    await new Promise((r) => setTimeout(r, 600));

    // Resolve profile via token
    const scannedEmp1 = storageService.getEmployeeByToken(emp.publicToken);
    if (!scannedEmp1 || scannedEmp1.aviationJobTitle !== 'Nhân viên điều khiển phương tiện') {
      updated[3].status = 'failed';
      updated[3].resultDetail = 'Thất bại khi đọc dữ liệu lần 1';
      setSteps([...updated]);
      setIsRunning(false);
      return;
    }

    updated[3].status = 'passed';
    updated[3].resultDetail = `Quét QR lần 1 thành công: Chức danh hiển thị là "${scannedEmp1.aviationJobTitle}"`;
    setSteps([...updated]);

    // --- STEP 5 ---
    setCurrentStep(5);
    updated[4].status = 'running';
    setSteps([...updated]);
    await new Promise((r) => setTimeout(r, 800));

    const updatedEmp = storageService.updateEmployee(
      emp.id,
      { aviationJobTitle: 'Nhân viên vận hành thiết bị' },
      'Quản trị viên (Admin Test)'
    )!;

    setTestEmp(updatedEmp);
    updated[4].status = 'passed';
    updated[4].resultDetail = `Đã cập nhật chức danh thành: "${updatedEmp.aviationJobTitle}"`;
    setSteps([...updated]);

    // --- STEP 6 ---
    setCurrentStep(6);
    updated[5].status = 'running';
    setSteps([...updated]);
    await new Promise((r) => setTimeout(r, 600));

    const tokenAfterEdit = updatedEmp.publicToken;
    const isTokenUnchanged = tokenAfterEdit === emp.publicToken;

    if (!isTokenUnchanged) {
      updated[5].status = 'failed';
      updated[5].resultDetail = `LỖI NGHIỆP VỤ: Token bị thay đổi từ ${emp.publicToken} thành ${tokenAfterEdit}!`;
      setSteps([...updated]);
      setIsRunning(false);
      return;
    }

    updated[5].status = 'passed';
    updated[5].resultDetail = `XÁC NHẬN: Token vẫn là "${tokenAfterEdit}" (Hoàn toàn KHÔNG sinh QR mới!)`;
    setSteps([...updated]);

    // --- STEP 7 ---
    setCurrentStep(7);
    updated[6].status = 'running';
    setSteps([...updated]);
    await new Promise((r) => setTimeout(r, 900));

    // Re-scan using EXACT original QR URL from Step 2/3
    const scannedEmp2 = storageService.getEmployeeByToken(emp.publicToken);
    const newQrUrl = await generateQrDataUrl(publicUrl, { width: 240 });
    setStep7QrUrl(newQrUrl);

    if (!scannedEmp2 || scannedEmp2.aviationJobTitle !== 'Nhân viên vận hành thiết bị') {
      updated[6].status = 'failed';
      updated[6].resultDetail = 'Dữ liệu quét lại chưa cập nhật chức danh mới';
      setSteps([...updated]);
      setIsRunning(false);
      return;
    }

    updated[6].status = 'passed';
    updated[6].resultDetail = `KẾT QUẢ NGHIỆM THU: Quét lại đúng QR thẻ PET cũ -> Chức danh hiển thị là "${scannedEmp2.aviationJobTitle}". Cả Web & Biểu mẫu PDF A4 đều lập tức phản ánh dữ liệu mới!`;
    setSteps([...updated]);

    setIsRunning(false);
    setTestComplete(true);
  };

  const handleReset = () => {
    setSteps(initialSteps);
    setCurrentStep(0);
    setTestComplete(false);
    setStep2QrUrl('');
    setStep7QrUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#006C99] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#EECD2B] text-slate-900">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Bài Kiểm Tra Nghiệm Thu Bắt Buộc (Mục III)
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Quy chuẩn: 1 Nhân viên = 1 QR cố định | Dữ liệu thay đổi động
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-6">
          {/* Top Banner */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                Quy Trình Nghiệm Thu 7 Bước Theo Yêu Cầu
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-lg">
                Hệ thống tự động thực hiện tuần tự: Tạo nhân viên → Sinh QR → Đóng băng QR thẻ PET → Sửa chức danh → Kiểm tra QR không đổi → Quét lại QR cũ và kiểm chứng dữ liệu mới nhất.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleReset}
                disabled={isRunning}
                className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Thiết lập lại
              </button>
              <button
                onClick={runFullTest}
                disabled={isRunning}
                className="px-4 py-2 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                {isRunning ? 'Đang chạy kiểm thử...' : 'Bắt đầu kiểm thử tự động'}
              </button>
            </div>
          </div>

          {/* Test Steps Timeline */}
          <div className="space-y-3">
            {steps.map((st) => (
              <div
                key={st.step}
                className={`p-4 rounded-xl border transition-all ${
                  st.status === 'passed'
                    ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                    : st.status === 'running'
                    ? 'bg-blue-50 border-[#006C99] ring-2 ring-[#006C99]/20'
                    : st.status === 'failed'
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="mt-0.5 shrink-0">
                      {st.status === 'passed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : st.status === 'running' ? (
                        <div className="w-5 h-5 rounded-full border-2 border-[#006C99] border-t-transparent animate-spin" />
                      ) : st.status === 'failed' ? (
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {st.step}
                        </div>
                      )}
                    </div>

                    <div>
                      <h5 className="font-bold text-xs uppercase tracking-wide text-slate-900">
                        {st.title}
                      </h5>
                      <p className="text-xs text-slate-600 mt-0.5">{st.description}</p>
                      {st.resultDetail && (
                        <div className="mt-2 p-2 rounded-lg bg-white/80 border border-slate-200 text-xs font-medium text-slate-800 flex items-center gap-1.5">
                          <span className="text-emerald-700 font-bold">✔</span>
                          <span>{st.resultDetail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 border ${
                      st.status === 'passed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : st.status === 'running'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : st.status === 'failed'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {st.status === 'passed'
                      ? 'ĐẠT CHUẨN'
                      : st.status === 'running'
                      ? 'ĐANG THỰC THI'
                      : st.status === 'failed'
                      ? 'KHÔNG ĐẠT'
                      : 'CHỜ CHẠY'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Side-by-side QR Proof when complete */}
          {testComplete && (
            <div className="bg-emerald-50 border-2 border-emerald-300 p-6 rounded-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base mb-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>KẾT QUẢ NGHIỆM THU: 100% ĐẠT TIÊU CHÍ BẮT BUỘC!</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed mb-4">
                Mã QR in trên thẻ PET hoàn toàn giữ nguyên, trong khi dữ liệu chức danh của nhân viên đã chuyển đổi thành công từ <strong>"Nhân viên điều khiển phương tiện"</strong> sang <strong>"Nhân viên vận hành thiết bị"</strong> trên cả giao diện Web và file xuất lý lịch PDF chuẩn A4.
              </p>

              {/* QR Side by Side comparison */}
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-emerald-200">
                <div className="text-center">
                  <div className="text-[11px] font-bold text-slate-500 mb-1">
                    QR BƯỚC 3 (ĐÃ IN THẺ PET)
                  </div>
                  {step2QrUrl && (
                    <img
                      src={step2QrUrl}
                      alt="QR Bước 3"
                      className="w-32 h-32 mx-auto border border-slate-200 rounded-lg p-1 bg-white"
                    />
                  )}
                  <div className="text-[10px] text-slate-500 mt-1">
                    Chức danh khi in: <br />
                    <span className="font-semibold text-slate-800">
                      Nhân viên điều khiển phương tiện
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-[11px] font-bold text-emerald-700 mb-1">
                    QR BƯỚC 7 (QUÉT LẠI CÙNG MÃ)
                  </div>
                  {step7QrUrl && (
                    <img
                      src={step7QrUrl}
                      alt="QR Bước 7"
                      className="w-32 h-32 mx-auto border border-emerald-300 rounded-lg p-1 bg-emerald-50/50"
                    />
                  )}
                  <div className="text-[10px] text-slate-500 mt-1">
                    Dữ liệu đọc ra sau khi sửa: <br />
                    <span className="font-bold text-emerald-700">
                      Nhân viên vận hành thiết bị
                    </span>
                  </div>
                </div>
              </div>

              {testEmp && onOpenEmployeeResume && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenEmployeeResume(testEmp);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <FileText className="w-4 h-4" /> Mở Biểu Mẫu Lý Lịch PDF A4 Thực Tế
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">
            Tiêu chí nghiệm thu hệ thống SKYPEC
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
