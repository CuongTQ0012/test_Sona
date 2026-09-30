import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Employee,
  ProfessionalSkill,
  OnsiteTraining,
  DeployedAirport,
  TrainingRecord,
  WorkHistoryItem,
} from '../../types';
import { storageService } from '../../services/storageService';
import {
  generateQrDataUrl,
  downloadQrPng,
  downloadQrSvg,
  getPublicUrlForToken,
} from '../../services/qrService';
import {
  X,
  Save,
  Plus,
  Trash2,
  QrCode,
  Download,
  Printer,
  FileText,
  User,
  Briefcase,
  Plane,
  Award,
  Clock,
  MapPin,
  Upload,
  Eye,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Copy,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { PETCardModal } from '../profile/PETCardModal';
import { getCertificateStatus } from '../../utils/helpers';
import { downloadSkypecExcelTemplate } from '../../utils/excelTemplate';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
  onSaved: (emp: Employee) => void;
  onOpenPdfView: (emp: Employee) => void;
  onOpenImportModal?: () => void;
  onOpenPublicScanView?: (token: string) => void;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
  onSaved,
  onOpenPdfView,
  onOpenImportModal,
  onOpenPublicScanView,
}) => {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [formData, setFormData] = useState<Omit<Employee, 'id' | 'publicToken' | 'createdAt' | 'updatedAt'>>({
    employeeCode: '',
    fullName: '',
    birthDate: '',
    gender: 'Nam',
    idCard: {
      number: '',
      issueDate: '',
      issuePlace: 'Cục Cảnh sát QLHC về TTXH',
    },
    hireDate: '',
    organization: 'Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam (SKYPEC)',
    aviationJobTitle: 'Nhân viên điều khiển phương tiện',
    department: 'Chi nhánh ĐBSH / Phòng Kỹ thuật / Đội xe tra nạp Nội Bài',
    position: 'Nhân viên',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=faces&q=80',
    status: 'active',
    regularAirport: 'Cảng hàng không quốc tế Nội Bài (HAN)',
    professionalSkills: [],
    onsiteTrainings: [],
    deployedAirports: [],
    trainingRecords: [],
    workHistory: [],
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showPetModal, setShowPetModal] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [inputMethod, setInputMethod] = useState<'form' | 'excel'>('form');
  const [selectedTab5CertIds, setSelectedTab5CertIds] = useState<Set<string>>(new Set());

  // Check if current employeeCode is duplicate of another employee
  const duplicateCodeWarning = useMemo(() => {
    const clean = formData.employeeCode.trim().toUpperCase();
    if (!clean) return null;
    const allEmps = storageService.getEmployees();
    const existing = allEmps.find(
      (e) => e.employeeCode.trim().toUpperCase() === clean && e.id !== employeeToEdit?.id
    );
    return existing || null;
  }, [formData.employeeCode, employeeToEdit]);

  // Excel in-modal import state
  const [excelRows, setExcelRows] = useState<{
    stt: number;
    fullName: string;
    employeeCode: string;
    birthDate: string;
    gender: 'Nam' | 'Nữ';
    idCardNumber: string;
    hireDate: string;
    organization: string;
    aviationJobTitle: string;
    department: string;
    position: string;
    regularAirport: string;
    skillsRaw?: string;
    facility?: string;
    certName?: string;
    certNumber?: string;
    certIssueDate?: string;
    certExpiryDate?: string;
    isValid: boolean;
    errors: string[];
  }[]>([]);
  const [excelFileName, setExcelFileName] = useState<string>('');
  const [excelProcessing, setExcelProcessing] = useState<boolean>(false);

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    setExcelProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        const rows = data.map((row, idx) => {
          const errors: string[] = [];
          const fullName = String(
            row['Họ và tên (*)'] || row['Họ và tên'] || row['fullName'] || ''
          ).trim();
          const employeeCode = String(
            row['Mã nhân viên (*)'] || row['Mã nhân viên'] || row['employeeCode'] || ''
          ).trim();
          const birthDate = String(row['Sinh ngày (ngày/tháng/năm)'] || row['Sinh ngày'] || '15/08/1990').trim();
          const gender = (String(row['Giới tính (Nam/Nữ)'] || row['Giới tính'] || 'Nam').trim() === 'Nữ' ? 'Nữ' : 'Nam') as 'Nam' | 'Nữ';
          const idCardNumber = String(row['Số CCCD'] || row['CCCD'] || '001090001234').trim();
          const hireDate = String(row['Ngày tuyển dụng'] || '01/01/2020').trim();
          const organization = String(
            row['Doanh nghiệp quản lý'] || 'Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam (SKYPEC)'
          ).trim();
          const aviationJobTitle = String(
            row['Chức danh nhân viên hàng không (*)'] || row['Chức danh'] || 'Nhân viên điều khiển phương tiện'
          ).trim();
          const department = String(row['Phòng/Ban/Tổ/Đội'] || row['Phòng ban'] || 'Chi nhánh ĐBSH / Đội xe tra nạp').trim();
          const position = String(row['Chức vụ'] || 'Nhân viên').trim();
          const regularAirport = String(row['Cảng làm việc thường xuyên'] || 'Cảng hàng không quốc tế Nội Bài (HAN)').trim();
          const skillsRaw = String(row['Các nghiệp vụ chuyên môn (cách nhau dấu ;)'] || row['Nghiệp vụ'] || '').trim();
          const facility = String(row['Tên cơ sở đào tạo'] || '').trim();
          const certName = String(row['Tên chứng chỉ / Thẻ nghiệp vụ'] || '').trim();
          const certNumber = String(row['Số hiệu chứng chỉ'] || '').trim();
          const certIssueDate = String(row['Ngày cấp chứng chỉ'] || '').trim();
          const certExpiryDate = String(row['Ngày hết hạn chứng chỉ'] || '').trim();

          if (!fullName) errors.push('Thiếu họ và tên');
          if (!employeeCode) errors.push('Thiếu mã nhân viên');

          return {
            stt: idx + 1,
            fullName,
            employeeCode,
            birthDate,
            gender,
            idCardNumber,
            hireDate,
            organization,
            aviationJobTitle,
            department,
            position,
            regularAirport,
            skillsRaw,
            facility,
            certName,
            certNumber,
            certIssueDate,
            certExpiryDate,
            isValid: errors.length === 0,
            errors,
          };
        });

        setExcelRows(rows);
      } catch (err) {
        alert('Không thể đọc file Excel. Vui lòng kiểm tra định dạng .xlsx!');
      } finally {
        setExcelProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteExcelImport = () => {
    const validRows = excelRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('Không có dòng dữ liệu hợp lệ trong file!');
      return;
    }

    let lastSaved: Employee | null = null;
    validRows.forEach((row) => {
      const professionalSkills: ProfessionalSkill[] = [];
      if (row.skillsRaw) {
        row.skillsRaw.split(';').map((s) => s.trim()).filter(Boolean).forEach((sk, i) => {
          professionalSkills.push({
            id: `ps_imp_${Date.now()}_${i}`,
            order: i + 1,
            name: sk,
            status: 'active',
          });
        });
      } else {
        professionalSkills.push({
          id: `ps_imp_${Date.now()}_0`,
          order: 1,
          name: 'Quy trình an toàn tra nạp nhiên liệu hàng không',
          status: 'active',
        });
      }

      const trainingRecords: TrainingRecord[] = [];
      if (row.certName) {
        trainingRecords.push({
          id: `tr_imp_${Date.now()}`,
          order: 1,
          trainingFacility: row.facility || 'Học viện Hàng không Việt Nam',
          trainingContent: 'An toàn hàng không & Quy tắc khai thác khu bay',
          startDate: '10/01/2024',
          endDate: '15/01/2024',
          certificateName: row.certName,
          certificateNumber: row.certNumber || 'CAAV-SKP-2024',
          trainingFormat: 'Tập trung',
          issueDate: row.certIssueDate || '15/01/2024',
          expiryDate: row.certExpiryDate || '15/01/2027',
          certificateFileName: 'ChungChi_DienTu.pdf',
        });
      }

      const newEmp = storageService.createEmployee({
        employeeCode: row.employeeCode,
        fullName: row.fullName,
        birthDate: row.birthDate,
        gender: row.gender,
        idCard: {
          number: row.idCardNumber,
          issueDate: '10/05/2021',
          issuePlace: 'Cục Cảnh sát QLHC về TTXH',
        },
        hireDate: row.hireDate,
        organization: 'Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam (SKYPEC)',
        aviationJobTitle: row.aviationJobTitle,
        department: row.department,
        position: row.position,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=faces&q=80',
        status: 'active',
        regularAirport: row.regularAirport,
        professionalSkills,
        onsiteTrainings: [],
        deployedAirports: [],
        trainingRecords,
        workHistory: [
          {
            id: `wh_${Date.now()}`,
            period: `${row.hireDate} - Đến nay`,
            description: `Công tác tại ${row.department} - ${row.organization}`,
          },
        ],
      });
      lastSaved = newEmp;
    });

    if (lastSaved) {
      onSaved(lastSaved);
    }
    alert(`Đã nhập thành công ${validRows.length} hồ sơ nhân viên vào hệ thống và tự động cấp mã QR cố định!`);
    onClose();
  };

  // Initial load
  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        employeeCode: employeeToEdit.employeeCode,
        fullName: employeeToEdit.fullName,
        birthDate: employeeToEdit.birthDate,
        gender: employeeToEdit.gender,
        idCard: { ...employeeToEdit.idCard },
        hireDate: employeeToEdit.hireDate,
        organization: employeeToEdit.organization,
        aviationJobTitle: employeeToEdit.aviationJobTitle,
        department: employeeToEdit.department,
        position: employeeToEdit.position,
        avatarUrl: employeeToEdit.avatarUrl,
        status: employeeToEdit.status,
        regularAirport: employeeToEdit.regularAirport,
        professionalSkills: [...employeeToEdit.professionalSkills],
        onsiteTrainings: [...employeeToEdit.onsiteTrainings],
        deployedAirports: [...employeeToEdit.deployedAirports],
        trainingRecords: [...employeeToEdit.trainingRecords],
        workHistory: [...employeeToEdit.workHistory],
      });

      // Generate QR for preview
      const publicUrl = getPublicUrlForToken(employeeToEdit.publicToken);
      generateQrDataUrl(publicUrl, { width: 280 }).then(setQrDataUrl);
    } else {
      // New employee template
      const nextCode = `SKP-0${Math.floor(100 + Math.random() * 900)}`;
      setFormData({
        employeeCode: nextCode,
        fullName: '',
        birthDate: '15/08/1990',
        gender: 'Nam',
        idCard: {
          number: '00109000' + Math.floor(1000 + Math.random() * 9000),
          issueDate: '10/05/2021',
          issuePlace: 'Cục Cảnh sát QLHC về TTXH',
        },
        hireDate: '01/06/2020',
        organization: 'Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam (SKYPEC)',
        aviationJobTitle: 'Nhân viên điều khiển phương tiện',
        department: 'Chi nhánh ĐBSH / Phòng Kỹ thuật / Đội xe tra nạp Nội Bài',
        position: 'Nhân viên',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=faces&q=80',
        status: 'active',
        regularAirport: 'Cảng hàng không quốc tế Nội Bài (HAN)',
        professionalSkills: [
          {
            id: `ps_${Date.now()}_1`,
            order: 1,
            name: 'Điều khiển phương tiện chuyên dụng chở và nạp nhiên liệu hàng không',
            status: 'active',
          },
        ],
        onsiteTrainings: [],
        deployedAirports: [],
        trainingRecords: [
          {
            id: `tr_${Date.now()}_1`,
            order: 1,
            trainingFacility: 'Học viện Hàng không Việt Nam',
            trainingContent: 'An toàn hàng không & Quy tắc khai thác khu bay',
            startDate: '10/01/2024',
            endDate: '15/01/2024',
            certificateName: 'Chứng nhận An toàn khu bay cấp 2',
            certificateNumber: 'CAAV-ATKB-2024-88',
            certificateFileName: 'ChungChi_AnToan.pdf',
            trainingFormat: 'Tập trung',
            issueDate: '20/01/2024',
            expiryDate: '20/01/2027',
          },
        ],
        workHistory: [
          {
            id: `wh_${Date.now()}_1`,
            period: '06/2020 - Đến nay',
            description: 'Nhân viên điều khiển xe tra nạp tại Cảng HKQT Nội Bài, SKYPEC',
          },
        ],
      });
      setQrDataUrl('');
    }
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Basic validation
    if (!formData.fullName.trim()) {
      setValidationError('Vui lòng nhập Họ và tên nhân viên.');
      setActiveTab(1);
      return;
    }
    if (!formData.employeeCode.trim()) {
      setValidationError('Vui lòng nhập Mã nhân viên.');
      setActiveTab(1);
      return;
    }
    if (duplicateCodeWarning) {
      setValidationError(
        `Mã nhân viên "${formData.employeeCode}" đã tồn tại trên hệ thống (thuộc về: ${duplicateCodeWarning.fullName} - ${duplicateCodeWarning.department}). Vui lòng kiểm tra lại để tránh bị trùng / double nhân viên!`
      );
      setActiveTab(1);
      return;
    }
    if (!formData.aviationJobTitle.trim()) {
      setValidationError('Vui lòng nhập hoặc chọn Chức danh nhân viên hàng không.');
      setActiveTab(1);
      return;
    }

    setValidationError('');

    let saved: Employee;
    if (employeeToEdit) {
      saved = storageService.updateEmployee(employeeToEdit.id, formData)!;
    } else {
      saved = storageService.createEmployee(formData);
    }

    onSaved(saved);
    onClose();
  };

  const currentToken = employeeToEdit?.publicToken || 'SẼ_TỰ_ĐỘNG_SINH_KHI_LƯU';
  const publicUrl = employeeToEdit ? getPublicUrlForToken(employeeToEdit.publicToken) : '';

  const copyPublicLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // --- Sub-items handlers ---

  // Tab 2: Skills
  const addSkill = () => {
    setFormData((prev) => ({
      ...prev,
      professionalSkills: [
        ...prev.professionalSkills,
        {
          id: `ps_${Date.now()}`,
          order: prev.professionalSkills.length + 1,
          name: '',
          status: 'active',
        },
      ],
    }));
  };

  const removeSkill = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      professionalSkills: prev.professionalSkills.filter((s) => s.id !== id),
    }));
  };

  // Tab 3: Onsite Training
  const addOnsiteTraining = () => {
    setFormData((prev) => ({
      ...prev,
      onsiteTrainings: [
        ...prev.onsiteTrainings,
        {
          id: `ot_${Date.now()}`,
          order: prev.onsiteTrainings.length + 1,
          skillName: '',
          airport: formData.regularAirport || 'Cảng HKQT Nội Bài (HAN)',
          duration: '01/01/2024 - 15/02/2024',
          decisionNumber: 'QĐ-SKYPEC số .../QĐ-KT',
          decisionFileName: 'Quyet_Dinh_Cong_Nhan.pdf',
        },
      ],
    }));
  };

  const removeOnsiteTraining = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      onsiteTrainings: prev.onsiteTrainings.filter((o) => o.id !== id),
    }));
  };

  // Tab 4: Deployed Airports
  const addDeployedAirport = () => {
    setFormData((prev) => ({
      ...prev,
      deployedAirports: [
        ...prev.deployedAirports,
        {
          id: `da_${Date.now()}`,
          order: prev.deployedAirports.length + 1,
          airport: 'Cảng HKQT Cam Ranh (CXR)',
          assignedSkill: 'Hỗ trợ tra nạp tàu bay cao điểm',
          startDate: '01/06/2024',
          endDate: '30/06/2024',
        },
      ],
    }));
  };

  const removeDeployedAirport = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      deployedAirports: prev.deployedAirports.filter((d) => d.id !== id),
    }));
  };

  // Tab 5: Training Records
  const addTrainingRecord = () => {
    setFormData((prev) => ({
      ...prev,
      trainingRecords: [
        ...prev.trainingRecords,
        {
          id: `tr_${Date.now()}`,
          order: prev.trainingRecords.length + 1,
          trainingFacility: 'Học viện Hàng không Việt Nam',
          trainingContent: '',
          startDate: '01/01/2025',
          endDate: '10/01/2025',
          certificateName: '',
          certificateNumber: '',
          certificateFileName: 'ChungChi_DienTu.pdf',
          trainingFormat: 'Tập trung',
          issueDate: '15/01/2025',
          expiryDate: '15/01/2028',
        },
      ],
    }));
  };

  const removeTrainingRecord = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      trainingRecords: prev.trainingRecords.filter((t) => t.id !== id),
    }));
    setSelectedTab5CertIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const removeSelectedTrainingRecords = () => {
    setFormData((prev) => ({
      ...prev,
      trainingRecords: prev.trainingRecords.filter((t) => !selectedTab5CertIds.has(t.id)),
    }));
    setSelectedTab5CertIds(new Set());
  };

  const removeAllTrainingRecords = () => {
    setFormData((prev) => ({
      ...prev,
      trainingRecords: [],
    }));
    setSelectedTab5CertIds(new Set());
  };

  // Tab 6: Work History
  const addWorkHistory = () => {
    setFormData((prev) => ({
      ...prev,
      workHistory: [
        ...prev.workHistory,
        {
          id: `wh_${Date.now()}`,
          period: '01/2023 - Đến nay',
          description: '',
        },
      ],
    }));
  };

  const removeWorkHistory = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      workHistory: prev.workHistory.filter((w) => w.id !== id),
    }));
  };

  const tabs = [
    { id: 1, label: '1. Thông tin chung', icon: User },
    { id: 2, label: '2. Nghiệp vụ chuyên môn', icon: Briefcase },
    { id: 3, label: '3. Huấn luyện tại chỗ', icon: Plane },
    { id: 4, label: '4. Cảng hàng không', icon: MapPin },
    { id: 5, label: '5. Đào tạo & chứng chỉ', icon: Award },
    { id: 6, label: '6. Quá trình công tác', icon: Clock },
    { id: 7, label: '7. QR & Thẻ PET', icon: QrCode },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-[#006C99] text-white gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-[#EECD2B]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {employeeToEdit
                  ? `Chỉnh Sửa Hồ Sơ: ${employeeToEdit.fullName} (${employeeToEdit.employeeCode})`
                  : 'Thêm Mới Hồ Sơ Lý Lịch & Cấp QR Cố Định'}
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Biểu mẫu: Điều khiển phương tiện, vận hành thiết bị tại sân bay - SKYPEC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!employeeToEdit && (
              <div className="flex bg-black/20 p-1 rounded-xl text-xs font-bold gap-1">
                <button
                  type="button"
                  onClick={() => setInputMethod('form')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    inputMethod === 'form'
                      ? 'bg-white text-[#006C99] shadow-xs'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  📝 Biểu Mẫu Chi Tiết
                </button>
                <button
                  type="button"
                  onClick={() => setInputMethod('excel')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    inputMethod === 'excel'
                      ? 'bg-[#EECD2B] text-slate-900 shadow-xs'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  📊 Nhập Bằng Excel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={downloadSkypecExcelTemplate}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#EECD2B] text-xs font-bold transition-colors cursor-pointer border border-white/20"
              title="Tải biểu mẫu Excel chuẩn 15 cột quy định của SKYPEC"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Mẫu Excel (.xlsx)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Only visible in 'form' mode) */}
        {inputMethod === 'form' && (
          <div className="flex overflow-x-auto bg-slate-100 border-b border-slate-200 px-4 py-2 gap-1 text-xs font-semibold scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#006C99] shadow-xs font-bold border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#006C99]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Validation Alert */}
        {validationError && inputMethod === 'form' && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Quick Excel Import & Template Download Banner (Only in 'form' mode for new employee) */}
        {!employeeToEdit && inputMethod === 'form' && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-blue-50 border border-[#EECD2B] flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#EECD2B] text-slate-900 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900">
                  Bạn muốn nhập nhanh danh sách hồ sơ bằng File Excel?
                </span>
                <span className="text-slate-600 block text-[11px]">
                  Tải biểu mẫu Excel chuẩn 15 mục SKYPEC (.xlsx), điền dữ liệu và hệ thống sẽ tự động cấp QR cố định cho từng người.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={downloadSkypecExcelTemplate}
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Tải biểu mẫu Excel chuẩn 15 cột"
              >
                <Download className="w-3.5 h-3.5 text-[#006C99]" />
                <span>Tải Biểu Mẫu (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setInputMethod('excel')}
                className="px-3.5 py-1.5 rounded-lg bg-[#006C99] hover:bg-[#005377] text-white font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-[#EECD2B]" />
                <span>Chuyển Sang Nhập Excel</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode: EXCEL IMPORT IN-MODAL */}
        {inputMethod === 'excel' && (
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50 text-xs space-y-4">
            {/* Template Download Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Biểu Mẫu Nhập Hồ Sơ Chuẩn SKYPEC (.xlsx)
                  </h4>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Tệp Excel gồm 15 cột quy định: Họ tên, Mã NV, CCCD, Ngày sinh, Chức danh khu bay, Cảng làm việc, Nghiệp vụ, Chứng chỉ đào tạo...
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadSkypecExcelTemplate}
                className="px-4 py-2.5 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white font-bold inline-flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#EECD2B]" />
                <span>Tải Biểu Mẫu Excel Chuẩn (.xlsx)</span>
              </button>
            </div>

            {/* Dropzone Upload */}
            <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#006C99] transition-colors text-center">
              <Upload className="w-10 h-10 text-[#006C99] mx-auto mb-2" />
              <div className="font-bold text-slate-800 text-sm">
                Chọn hoặc kéo thả tệp Excel hồ sơ cần nhập
              </div>
              <div className="text-slate-500 text-xs mt-1 mb-4">
                Hỗ trợ tệp định dạng .xlsx, .xls • Tự động mã hóa và cấp mã QR cố định
              </div>
              <label className="px-5 py-2.5 bg-[#006C99] hover:bg-[#005377] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Chọn File Excel Trên Máy Tính</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleExcelFileChange}
                />
              </label>
              {excelProcessing && (
                <div className="mt-3 text-slate-500 font-medium">Đang đọc dữ liệu bảng tính...</div>
              )}
              {excelFileName && !excelProcessing && (
                <div className="mt-3 font-semibold text-slate-700">
                  Đã tải tệp: <strong className="text-[#006C99]">{excelFileName}</strong> ({excelRows.length} dòng hồ sơ)
                </div>
              )}
            </div>

            {/* Preview table if rows exist */}
            {excelRows.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-slate-900 text-sm">
                    Xem trước danh sách ({excelRows.filter((r) => r.isValid).length}/{excelRows.length} dòng hợp lệ)
                  </div>
                  <button
                    type="button"
                    onClick={handleExecuteExcelImport}
                    disabled={excelRows.filter((r) => r.isValid).length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Xác Nhận Nhập {excelRows.filter((r) => r.isValid).length} Hồ Sơ Vào Hệ Thống</span>
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 sticky top-0 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-10 text-center">STT</th>
                        <th className="p-2">Họ và tên</th>
                        <th className="p-2">Mã NV</th>
                        <th className="p-2">Chức danh</th>
                        <th className="p-2">Cảng làm việc</th>
                        <th className="p-2 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {excelRows.map((row) => (
                        <tr key={row.stt} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                          <td className="p-2 text-center font-bold text-slate-500">{row.stt}</td>
                          <td className="p-2 font-bold text-slate-900">{row.fullName || '(Chưa có)'}</td>
                          <td className="p-2 font-mono text-[#006C99] font-bold">{row.employeeCode || '(Chưa có)'}</td>
                          <td className="p-2 text-slate-700">{row.aviationJobTitle}</td>
                          <td className="p-2 text-slate-600">{row.regularAirport}</td>
                          <td className="p-2 text-center">
                            {row.isValid ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Hợp lệ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold" title={row.errors.join(', ')}>
                                {row.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode: FORM ENTRY (7 TABS) */}
        {inputMethod === 'form' && (
          <div className="p-6 overflow-y-auto flex-1 bg-white text-xs">
            {/* TAB 1: THÔNG TIN CHUNG (MỤC 1 - 9) */}
            {activeTab === 1 && (
              <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* 3x4 Photo Upload & Preview */}
                <div className="w-36 shrink-0 flex flex-col items-center">
                  <div className="w-28 h-36 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden bg-slate-50 flex flex-col items-center justify-center relative group shadow-xs">
                    {formData.avatarUrl ? (
                      <img
                        src={formData.avatarUrl}
                        alt="Ảnh 3x4"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <Upload className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <span>Ảnh màu 3x4</span>
                      </div>
                    )}
                  </div>
                  <label className="mt-2 text-[11px] font-bold text-[#006C99] hover:underline cursor-pointer">
                    Đổi ảnh 3x4
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setFormData((prev) => ({
                                ...prev,
                                avatarUrl: event.target!.result as string,
                              }));
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Form fields 1 - 4 */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      1) Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99] font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Mã nhân viên (Employee Code) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.employeeCode}
                      onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                      placeholder="SKP-0125"
                      className={`w-full px-3 py-2 rounded-lg border font-mono font-semibold focus:outline-hidden ${
                        duplicateCodeWarning
                          ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-600'
                          : 'border-slate-300 focus:border-[#006C99]'
                      }`}
                    />
                    {duplicateCodeWarning && (
                      <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5 animate-in fade-in">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-rose-700">Cảnh báo trùng mã:</strong> Mã &ldquo;{formData.employeeCode}&rdquo; đang thuộc về{' '}
                          <strong>{duplicateCodeWarning.fullName}</strong> ({duplicateCodeWarning.department}). Vui lòng nhập mã khác để tránh tạo double nhân viên!
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      2) Sinh ngày (ngày/tháng/năm)
                    </label>
                    <input
                      type="text"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      placeholder="15/08/1988"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99]"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      3) Giới tính
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99] bg-white"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      4) Số căn cước công dân (CCCD)
                    </label>
                    <input
                      type="text"
                      value={formData.idCard.number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          idCard: { ...formData.idCard, number: e.target.value },
                        })
                      }
                      placeholder="001088019842"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99] font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Ngày cấp CCCD
                      </label>
                      <input
                        type="text"
                        value={formData.idCard.issueDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            idCard: { ...formData.idCard, issueDate: e.target.value },
                          })
                        }
                        placeholder="10/05/2021"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Nơi cấp CCCD
                      </label>
                      <input
                        type="text"
                        value={formData.idCard.issuePlace}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            idCard: { ...formData.idCard, issuePlace: e.target.value },
                          })
                        }
                        placeholder="Cục CS QLHC về TTXH"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form fields 5 - 9 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    5) Ngày tuyển dụng (ngày/tháng/năm)
                  </label>
                  <input
                    type="text"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    placeholder="01/06/2018"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    6) Doanh nghiệp/cơ quan quản lý nhân viên
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam (SKYPEC)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    7) Chức danh nhân viên hàng không <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.aviationJobTitle}
                    onChange={(e) => setFormData({ ...formData, aviationJobTitle: e.target.value })}
                    placeholder="Ví dụ: Nhân viên điều khiển phương tiện / Nhân viên vận hành thiết bị"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99] font-semibold text-[#006C99]"
                  />
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {[
                      'Nhân viên điều khiển phương tiện',
                      'Nhân viên vận hành thiết bị',
                      'Nhân viên kiểm soát chất lượng nhiên liệu',
                      'Nhân viên bảo dưỡng thiết bị tra nạp',
                    ].map((title) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => setFormData({ ...formData, aviationJobTitle: title })}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] transition-colors"
                      >
                        + {title}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    8) Phòng/ ban/ tổ/ đội
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Chi nhánh ĐBSH / Phòng Kỹ thuật / Đội xe tra nạp Nội Bài"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    9) Chức vụ
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Nhân viên / Tổ trưởng / Đội phó"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Trạng thái làm việc
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'active' | 'suspended' | 'resigned' | 'locked',
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99] bg-white"
                  >
                    <option value="active">Đang làm việc (Active)</option>
                    <option value="suspended">Tạm hoãn (Suspended)</option>
                    <option value="resigned">Đã thôi việc (Resigned)</option>
                    <option value="locked">Khóa hồ sơ (Locked - Khi quét QR thông báo không còn hiệu lực)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NGHIỆP VỤ CHUYÊN MÔN (MỤC 10) */}
          {activeTab === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    10) Các nghiệp vụ chuyên môn
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Quản lý danh sách các nghiệp vụ hàng không mà nhân viên đã được cấp phép thao tác.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSkill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006C99] text-white rounded-lg hover:bg-[#005377] transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm nghiệp vụ
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5 w-12 text-center">STT</th>
                      <th className="p-2.5">Nghiệp vụ chuyên môn</th>
                      <th className="p-2.5 w-36">Trạng thái</th>
                      <th className="p-2.5 w-16 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {formData.professionalSkills.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={s.name}
                            onChange={(e) => {
                              const updated = [...formData.professionalSkills];
                              updated[idx].name = e.target.value;
                              setFormData({ ...formData, professionalSkills: updated });
                            }}
                            placeholder="Tên nghiệp vụ chuyên môn hàng không..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99]"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={s.status}
                            onChange={(e) => {
                              const updated = [...formData.professionalSkills];
                              updated[idx].status = e.target.value as 'active' | 'suspended';
                              setFormData({ ...formData, professionalSkills: updated });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="active">Còn hiệu lực</option>
                            <option value="suspended">Tạm ngưng</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeSkill(s.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.professionalSkills.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                          Chưa có nghiệp vụ nào. Bấm "+ Thêm nghiệp vụ" để khai báo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: THÔNG TIN HUẤN LUYỆN TẠI CHỖ (MỤC 11) */}
          {activeTab === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    11) Thông tin huấn luyện tại chỗ
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Khai báo các đợt huấn luyện tại chỗ kèm quyết định công nhận và tệp đính kèm.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addOnsiteTraining}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006C99] text-white rounded-lg hover:bg-[#005377] transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm khóa huấn luyện tại chỗ
                </button>
              </div>

              <div className="space-y-3">
                {formData.onsiteTrainings.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 relative"
                  >
                    <div className="flex justify-between items-center font-bold text-[#006C99]">
                      <span>Đợt huấn luyện #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeOnsiteTraining(item.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Nghiệp vụ được đào tạo tại chỗ
                        </label>
                        <input
                          type="text"
                          value={item.skillName}
                          onChange={(e) => {
                            const updated = [...formData.onsiteTrainings];
                            updated[idx].skillName = e.target.value;
                            setFormData({ ...formData, onsiteTrainings: updated });
                          }}
                          placeholder="Ví dụ: Huấn luyện vận hành hệ thống van Pit Hydrant..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Cảng hàng không được huấn luyện
                        </label>
                        <input
                          type="text"
                          value={item.airport}
                          onChange={(e) => {
                            const updated = [...formData.onsiteTrainings];
                            updated[idx].airport = e.target.value;
                            setFormData({ ...formData, onsiteTrainings: updated });
                          }}
                          placeholder="Cảng HKQT Nội Bài (HAN)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Thời gian huấn luyện nghiệp vụ tại chỗ
                        </label>
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) => {
                            const updated = [...formData.onsiteTrainings];
                            updated[idx].duration = e.target.value;
                            setFormData({ ...formData, onsiteTrainings: updated });
                          }}
                          placeholder="15/01/2023 - 28/02/2023"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 block mb-1">
                          Quyết định công nhận hoàn thành
                        </label>
                        <input
                          type="text"
                          value={item.decisionNumber}
                          onChange={(e) => {
                            const updated = [...formData.onsiteTrainings];
                            updated[idx].decisionNumber = e.target.value;
                            setFormData({ ...formData, onsiteTrainings: updated });
                          }}
                          placeholder="QĐ-SKYPEC/ĐBSH số 45/QĐ-KT"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                    </div>

                    {/* File Attachment for Onsite Training */}
                    <div className="pt-2 border-t border-slate-200">
                      <label className="font-semibold text-slate-700 block mb-1 text-xs">
                        Tệp đính kèm Quyết định (Bản scan / Ảnh chụp)
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#006C99] border border-blue-200 font-bold text-xs cursor-pointer transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{item.decisionFileUrl ? 'Đổi tệp' : 'Tải lên tệp ảnh/PDF'}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const updated = [...formData.onsiteTrainings];
                                  updated[idx].decisionFileUrl = event.target?.result as string;
                                  updated[idx].decisionFileName = file.name;
                                  setFormData({ ...formData, onsiteTrainings: updated });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {item.decisionFileUrl && (
                          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-medium truncate max-w-[200px]">{item.decisionFileName || 'Đã đính kèm tệp'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...formData.onsiteTrainings];
                                updated[idx].decisionFileUrl = undefined;
                                updated[idx].decisionFileName = undefined;
                                setFormData({ ...formData, onsiteTrainings: updated });
                              }}
                              className="text-rose-500 hover:text-rose-700 ml-1"
                              title="Xóa tệp đính kèm"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {formData.onsiteTrainings.length === 0 && (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    Chưa có thông tin huấn luyện tại chỗ. Bấm "+ Thêm khóa huấn luyện tại chỗ" để nhập.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CẢNG HÀNG KHÔNG LÀM VIỆC (MỤC 12 - 13) */}
          {activeTab === 4 && (
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-1">
                  12) Cảng hàng không làm việc thường xuyên
                </h4>
                <input
                  type="text"
                  value={formData.regularAirport}
                  onChange={(e) => setFormData({ ...formData, regularAirport: e.target.value })}
                  placeholder="Cảng hàng không quốc tế Nội Bài (HAN)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:border-[#006C99] font-medium"
                />
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {[
                    'Cảng hàng không quốc tế Nội Bài (HAN)',
                    'Cảng hàng không quốc tế Tân Sơn Nhất (SGN)',
                    'Cảng hàng không quốc tế Đà Nẵng (DAD)',
                    'Cảng hàng không quốc tế Cam Ranh (CXR)',
                    'Cảng hàng không quốc tế Phú Quốc (PQC)',
                    'Cảng hàng không quốc tế Cát Bi (HPH)',
                  ].map((ap) => (
                    <button
                      key={ap}
                      type="button"
                      onClick={() => setFormData({ ...formData, regularAirport: ap })}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px]"
                    >
                      {ap.split('(')[1]?.replace(')', '') || ap}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      13) Cảng hàng không được tăng cường (nếu có)
                    </h4>
                    <p className="text-slate-500 text-[11px]">
                      Quản lý các đợt điều động tăng cường cao điểm tại các sân bay khác.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addDeployedAirport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006C99] text-white rounded-lg hover:bg-[#005377] transition-colors font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm cảng tăng cường
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                      <tr>
                        <th className="p-2.5 w-10 text-center">STT</th>
                        <th className="p-2.5 w-1/4">Cảng hàng không tăng cường</th>
                        <th className="p-2.5">Nghiệp vụ được giao</th>
                        <th className="p-2.5 w-28">Từ ngày</th>
                        <th className="p-2.5 w-28">Đến ngày</th>
                        <th className="p-2.5 w-12 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.deployedAirports.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="p-2 text-center font-bold text-slate-500">{idx + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.airport}
                              onChange={(e) => {
                                const updated = [...formData.deployedAirports];
                                updated[idx].airport = e.target.value;
                                setFormData({ ...formData, deployedAirports: updated });
                              }}
                              className="w-full px-2 py-1 rounded border border-slate-300"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.assignedSkill}
                              onChange={(e) => {
                                const updated = [...formData.deployedAirports];
                                updated[idx].assignedSkill = e.target.value;
                                setFormData({ ...formData, deployedAirports: updated });
                              }}
                              className="w-full px-2 py-1 rounded border border-slate-300"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.startDate}
                              onChange={(e) => {
                                const updated = [...formData.deployedAirports];
                                updated[idx].startDate = e.target.value;
                                setFormData({ ...formData, deployedAirports: updated });
                              }}
                              className="w-full px-2 py-1 rounded border border-slate-300"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.endDate}
                              onChange={(e) => {
                                const updated = [...formData.deployedAirports];
                                updated[idx].endDate = e.target.value;
                                setFormData({ ...formData, deployedAirports: updated });
                              }}
                              className="w-full px-2 py-1 rounded border border-slate-300"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeDeployedAirport(item.id)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {formData.deployedAirports.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                            Chưa có dữ liệu tăng cường.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ĐÀO TẠO & CHỨNG CHỈ (MỤC 14) */}
          {activeTab === 5 && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    14) Đào tạo, huấn luyện nhân viên hàng không
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Bảng 8 cột theo biểu mẫu: Cơ sở đào tạo, nghiệp vụ, thời gian, CCCM/chứng nhận, ngày cấp, ngày hết hạn.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {formData.trainingRecords.length > 0 && (
                    <button
                      type="button"
                      onClick={removeAllTrainingRecords}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      title="Xóa toàn bộ các khóa đào tạo trong hồ sơ này"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả ({formData.trainingRecords.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={addTrainingRecord}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006C99] text-white rounded-lg hover:bg-[#005377] transition-colors font-medium text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm khóa đào tạo & chứng chỉ
                  </button>
                </div>
              </div>

              {/* Bulk selection control for Tab 5 */}
              {formData.trainingRecords.length > 0 && (
                <div className="flex items-center justify-between p-2.5 bg-slate-100/90 rounded-xl border border-slate-200 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={
                        formData.trainingRecords.length > 0 &&
                        formData.trainingRecords.every((t) => selectedTab5CertIds.has(t.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTab5CertIds(new Set(formData.trainingRecords.map((t) => t.id)));
                        } else {
                          setSelectedTab5CertIds(new Set());
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-[#006C99] focus:ring-[#006C99] cursor-pointer"
                    />
                    <span>Chọn tất cả ({formData.trainingRecords.length} khóa)</span>
                  </label>

                  {selectedTab5CertIds.size > 0 && (
                    <button
                      type="button"
                      onClick={removeSelectedTrainingRecords}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa {selectedTab5CertIds.size} khóa đã chọn
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {formData.trainingRecords.map((item, idx) => {
                  const status = getCertificateStatus(item.expiryDate);
                  const isChecked = selectedTab5CertIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border space-y-3 relative transition-colors ${
                        isChecked
                          ? 'border-[#006C99] bg-blue-50/50 ring-1 ring-[#006C99]/30'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedTab5CertIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) {
                                  next.delete(item.id);
                                } else {
                                  next.add(item.id);
                                }
                                return next;
                              });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-[#006C99] focus:ring-[#006C99] cursor-pointer"
                          />
                          <span className="font-bold text-[#006C99]">Khóa #{idx + 1}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${status.badgeClass}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTrainingRecord(item.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Xóa khóa đào tạo này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="font-semibold text-slate-700 block mb-1">
                            Tên Cơ sở đào tạo
                          </label>
                          <input
                            type="text"
                            value={item.trainingFacility}
                            onChange={(e) => {
                              const updated = [...formData.trainingRecords];
                              updated[idx].trainingFacility = e.target.value;
                              setFormData({ ...formData, trainingRecords: updated });
                            }}
                            placeholder="Học viện Hàng không Việt Nam / Trung tâm HL SKYPEC"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Hình thức đào tạo
                          </label>
                          <input
                            type="text"
                            value={item.trainingFormat}
                            onChange={(e) => {
                              const updated = [...formData.trainingRecords];
                              updated[idx].trainingFormat = e.target.value;
                              setFormData({ ...formData, trainingRecords: updated });
                            }}
                            placeholder="Tập trung / Định kỳ"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="font-semibold text-slate-700 block mb-1">
                            Nội dung đào tạo / Nghiệp vụ chuyên môn
                          </label>
                          <input
                            type="text"
                            value={item.trainingContent}
                            onChange={(e) => {
                              const updated = [...formData.trainingRecords];
                              updated[idx].trainingContent = e.target.value;
                              setFormData({ ...formData, trainingRecords: updated });
                            }}
                            placeholder="An toàn hàng không & Quy tắc khai thác khu bay..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Thời gian đào tạo (Từ - Đến)
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              value={item.startDate}
                              onChange={(e) => {
                                const updated = [...formData.trainingRecords];
                                updated[idx].startDate = e.target.value;
                                setFormData({ ...formData, trainingRecords: updated });
                              }}
                              placeholder="Từ ngày"
                              className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                            />
                            <input
                              type="text"
                              value={item.endDate}
                              onChange={(e) => {
                                const updated = [...formData.trainingRecords];
                                updated[idx].endDate = e.target.value;
                                setFormData({ ...formData, trainingRecords: updated });
                              }}
                              placeholder="Đến ngày"
                              className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            CCCM / Chứng nhận / Thẻ nghiệp vụ
                          </label>
                          <input
                            type="text"
                            value={item.certificateName}
                            onChange={(e) => {
                              const updated = [...formData.trainingRecords];
                              updated[idx].certificateName = e.target.value;
                              setFormData({ ...formData, trainingRecords: updated });
                            }}
                            placeholder="Chứng nhận An toàn khu bay cấp 2"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">
                            Số hiệu chứng nhận (nếu có)
                          </label>
                          <input
                            type="text"
                            value={item.certificateNumber || ''}
                            onChange={(e) => {
                              const updated = [...formData.trainingRecords];
                              updated[idx].certificateNumber = e.target.value;
                              setFormData({ ...formData, trainingRecords: updated });
                            }}
                            placeholder="CAAV-ATKB-2024-88"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="font-semibold text-slate-700 block mb-1">
                              Ngày cấp (dd/mm/yyyy)
                            </label>
                            <input
                              type="text"
                              value={item.issueDate}
                              onChange={(e) => {
                                const updated = [...formData.trainingRecords];
                                updated[idx].issueDate = e.target.value;
                                setFormData({ ...formData, trainingRecords: updated });
                              }}
                              placeholder="20/01/2024"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-700 block mb-1">
                              Ngày hết hạn
                            </label>
                            <input
                              type="text"
                              value={item.expiryDate}
                              onChange={(e) => {
                                const updated = [...formData.trainingRecords];
                                updated[idx].expiryDate = e.target.value;
                                setFormData({ ...formData, trainingRecords: updated });
                              }}
                              placeholder="20/01/2027"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                            />
                          </div>
                        </div>

                        {/* Certificate File Attachment Upload */}
                        <div className="pt-2 border-t border-slate-200 col-span-1 sm:col-span-3">
                          <label className="font-semibold text-slate-700 block mb-1 text-xs">
                            Tệp đính kèm chứng chỉ (Bản scan / Ảnh chụp CCCM / File PDF)
                          </label>
                          <div className="flex items-center gap-2 flex-wrap">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#006C99] border border-blue-200 font-bold text-xs cursor-pointer transition-colors shadow-2xs">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{item.certificateFileUrl ? 'Đổi tệp khác' : 'Tải lên ảnh/PDF chứng chỉ'}</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      const updated = [...formData.trainingRecords];
                                      updated[idx].certificateFileUrl = event.target?.result as string;
                                      updated[idx].certificateFileName = file.name;
                                      setFormData({ ...formData, trainingRecords: updated });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>

                            {item.certificateFileUrl && (
                              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="font-medium truncate max-w-[220px]">{item.certificateFileName || 'Đã đính kèm tệp chứng chỉ'}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formData.trainingRecords];
                                    updated[idx].certificateFileUrl = undefined;
                                    updated[idx].certificateFileName = undefined;
                                    setFormData({ ...formData, trainingRecords: updated });
                                  }}
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
                    </div>
                  );
                })}

                {formData.trainingRecords.length === 0 && (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    Chưa có khóa đào tạo hoặc chứng chỉ nào. Bấm "+ Thêm khóa đào tạo & chứng chỉ" để tạo mới.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: TÓM TẮT QUÁ TRÌNH CÔNG TÁC (MỤC 15) */}
          {activeTab === 6 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    15) Tóm tắt quá trình công tác
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Khai báo mốc thời gian và chức danh, chức vụ, đơn vị công tác, cảng hàng không làm việc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addWorkHistory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#006C99] text-white rounded-lg hover:bg-[#005377] transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm giai đoạn công tác
                </button>
              </div>

              <div className="space-y-3">
                {formData.workHistory.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3"
                  >
                    <div className="w-40 shrink-0">
                      <label className="font-semibold text-slate-700 block mb-1">
                        Từ tháng/năm - Đến
                      </label>
                      <input
                        type="text"
                        value={item.period}
                        onChange={(e) => {
                          const updated = [...formData.workHistory];
                          updated[idx].period = e.target.value;
                          setFormData({ ...formData, workHistory: updated });
                        }}
                        placeholder="06/2018 - 12/2020"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="font-semibold text-slate-700 block mb-1">
                        Chức danh, chức vụ, đơn vị công tác, cảng hàng không làm việc
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...formData.workHistory];
                          updated[idx].description = e.target.value;
                          setFormData({ ...formData, workHistory: updated });
                        }}
                        placeholder="Nhân viên lái xe tra nạp bồn, Đội xe tra nạp, Chi nhánh ĐBSH - SKYPEC, Cảng HKQT Nội Bài"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeWorkHistory(item.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 mt-5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {formData.workHistory.length === 0 && (
                  <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    Chưa có lịch sử quá trình công tác.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: QR CODE & THẺ PET & XUẤT LÝ LỊCH */}
          {activeTab === 7 && (
            <div className="space-y-6">
              <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006C99] text-white text-[11px] font-bold mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#EECD2B]" />
                    <span>MÃ QR CỐ ĐỊNH DUY NHẤT</span>
                  </div>
                  <h4 className="font-black text-lg text-slate-900 uppercase">
                    {formData.fullName || 'Nhân viên mới'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Public Token: <strong className="font-mono text-[#006C99]">{currentToken}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 max-w-md">
                    Mã QR này được in cố định một lần trên thẻ PET. Mọi thay đổi về chức danh, đơn vị, đào tạo... trong các tab trên sẽ tự động phản ánh khi quét lại mà <strong>không làm thay đổi QR này</strong>.
                  </p>

                  {/* Public URL copy */}
                  {publicUrl && (
                    <div className="mt-3 flex items-center gap-2 max-w-sm">
                      <input
                        type="text"
                        readOnly
                        value={publicUrl}
                        className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] font-mono w-64 truncate text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={copyPublicLink}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-xs inline-flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedUrl ? 'Đã sao chép' : 'Sao chép'}
                      </button>
                    </div>
                  )}
                </div>

                {/* QR Display */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-44 h-44 bg-white p-2 rounded-2xl border-2 border-[#006C99]/30 shadow-md flex items-center justify-center">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center p-3 text-slate-400">
                        <QrCode className="w-12 h-12 mx-auto mb-1 text-slate-300" />
                        <span>Mã QR sẽ sẵn sàng sau khi lưu hồ sơ</span>
                      </div>
                    )}
                  </div>

                  {qrDataUrl && (
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() =>
                          downloadQrPng(qrDataUrl, `QR_${formData.employeeCode}_${currentToken}`)
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-[#006C99] text-white hover:bg-[#005377] text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3 h-3" /> Tải PNG
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPetModal(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#EECD2B] text-slate-900 hover:bg-[#deb81f] text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Xem Thẻ PET
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct A4 PDF Preview Action */}
              {employeeToEdit && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">
                      Xuất Biểu Mẫu Lý Lịch Chuẩn A4 (PDF)
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Đưa dữ liệu mới nhất vào chính xác biểu mẫu 2 trang quy định.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPdfView(employeeToEdit);
                    }}
                    className="px-4 py-2 bg-[#006C99] hover:bg-[#005377] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs"
                  >
                    <FileText className="w-4 h-4 text-[#EECD2B]" />
                    <span>Xem & In Lý Lịch A4</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-mono">
            {inputMethod === 'excel'
              ? `Chế độ: Nhập Excel hàng loạt (${excelRows.filter((r) => r.isValid).length} hồ sơ hợp lệ)`
              : employeeToEdit
              ? `ID: ${employeeToEdit.id} | Token: ${employeeToEdit.publicToken}`
              : 'Hồ sơ mới chưa lưu'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            {inputMethod === 'form' ? (
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Hồ Sơ (Giữ QR Cố Định)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecuteExcelImport}
                disabled={excelRows.filter((r) => r.isValid).length === 0}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Hoàn Tất Nhập ({excelRows.filter((r) => r.isValid).length} Hồ Sơ)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PET Card Modal */}
      {showPetModal && employeeToEdit && (
        <PETCardModal
          isOpen={true}
          onClose={() => setShowPetModal(false)}
          employee={employeeToEdit}
          onOpenPublicScanView={onOpenPublicScanView}
        />
      )}
    </div>
  );
};
