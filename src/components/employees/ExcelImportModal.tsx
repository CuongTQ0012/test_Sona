import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Employee, ProfessionalSkill, TrainingRecord, WorkHistoryItem, DeployedAirport, OnsiteTraining } from '../../types';
import { storageService } from '../../services/storageService';
import { downloadSkypecExcelTemplate } from '../../utils/excelTemplate';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Award,
  Clock,
  MapPin,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  GraduationCap,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedRawRow {
  stt: number;
  fullName: string;
  employeeCode: string;
  birthDate: string;
  gender: 'Nam' | 'Nữ';
  idCardNumber: string;
  idCardDate: string;
  idCardPlace: string;
  hireDate: string;
  organization: string;
  aviationJobTitle: string;
  department: string;
  position: string;
  regularAirport: string;
  skillsRaw?: string;
  onsiteSkill?: string;
  onsiteAirport?: string;
  onsiteDuration?: string;
  onsiteDecision?: string;
  onsiteRaw?: string;
  facility?: string;
  certName?: string;
  certNumber?: string;
  certIssueDate?: string;
  certExpiryDate?: string;
  deployedAirportsRaw?: string;
  workHistoryRaw?: string;
  isValid: boolean;
  errors: string[];
}

interface GroupedEmployeeImport {
  employeeCode: string;
  fullName: string;
  birthDate: string;
  gender: 'Nam' | 'Nữ';
  idCardNumber: string;
  idCardDate: string;
  idCardPlace: string;
  hireDate: string;
  organization: string;
  aviationJobTitle: string;
  department: string;
  position: string;
  regularAirport: string;
  professionalSkills: ProfessionalSkill[];
  onsiteTrainings: OnsiteTraining[];
  trainingRecords: TrainingRecord[];
  workHistory: WorkHistoryItem[];
  deployedAirports: DeployedAirport[];
  isExisting: boolean;
  rowIndices: number[];
  errors: string[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [rawRows, setRawRows] = useState<ParsedRawRow[]>([]);
  const [groupedList, setGroupedList] = useState<GroupedEmployeeImport[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importedCount, setImportedCount] = useState<number>(0);
  const [updatedCount, setUpdatedCount] = useState<number>(0);
  const [showGuide, setShowGuide] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        const currentEmployees = storageService.getEmployees();

        // 1. Parse raw rows
        const parsed: ParsedRawRow[] = data.map((row, idx) => {
          const errors: string[] = [];

          const fullName = String(
            row['Họ và tên (*)'] || row['Họ và tên'] || row['Ho va ten'] || row['fullName'] || ''
          ).trim();

          const employeeCode = String(
            row['Mã nhân viên (*)'] || row['Mã nhân viên'] || row['Ma nhan vien'] || row['employeeCode'] || ''
          ).trim();

          const birthDate = String(
            row['Sinh ngày (ngày/tháng/năm)'] || row['Sinh ngày'] || row['birthDate'] || '15/08/1990'
          ).trim();

          const gender = (String(
            row['Giới tính (Nam/Nữ)'] || row['Giới tính'] || row['gender'] || 'Nam'
          ).trim() === 'Nữ' ? 'Nữ' : 'Nam') as 'Nam' | 'Nữ';

          const idCardNumber = String(
            row['Số CCCD'] || row['CCCD'] || row['So CCCD'] || ''
          ).trim();

          const idCardDate = String(row['Ngày cấp CCCD'] || '10/05/2021').trim();
          const idCardPlace = String(row['Nơi cấp CCCD'] || 'Cục Cảnh sát QLHC về TTXH').trim();

          const hireDate = String(
            row['Ngày tuyển dụng'] || row['hireDate'] || '01/01/2020'
          ).trim();

          const organization = String(
            row['Doanh nghiệp quản lý'] || 'Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam (SKYPEC)'
          ).trim();

          const aviationJobTitle = String(
            row['Chức danh nhân viên hàng không (*)'] || row['Chức danh'] || row['Chuc danh'] || 'Nhân viên điều khiển phương tiện'
          ).trim();

          const department = String(
            row['Phòng/Ban/Tổ/Đội'] || row['Phòng ban'] || 'Chi nhánh ĐBSH / Đội xe tra nạp Nội Bài'
          ).trim();

          const position = String(row['Chức vụ'] || 'Nhân viên').trim();

          const regularAirport = String(
            row['Cảng làm việc thường xuyên'] || row['Cảng làm việc'] || 'Cảng hàng không quốc tế Nội Bài (HAN)'
          ).trim();

          const skillsRaw = String(
            row['Các nghiệp vụ chuyên môn (cách nhau dấu ;)'] || row['Nghiệp vụ'] || ''
          ).trim();

          const onsiteSkill = String(
            row['Nghiệp vụ huấn luyện tại chỗ'] ||
            row['Nội dung huấn luyện tại chỗ'] ||
            row['Huấn luyện tại chỗ (Nghiệp vụ)'] ||
            row['Huấn luyện tại chỗ'] ||
            row['Nghiệp vụ HLTC'] ||
            row['HLTC'] || ''
          ).trim();

          const onsiteAirport = String(
            row['Cảng huấn luyện tại chỗ'] ||
            row['Cảng HLTC'] ||
            row['Cảng thực hiện huấn luyện'] || ''
          ).trim();

          const onsiteDuration = String(
            row['Thời gian huấn luyện tại chỗ'] ||
            row['Thời gian HLTC'] || ''
          ).trim();

          const onsiteDecision = String(
            row['Số quyết định công nhận HLTC'] ||
            row['Số quyết định HLTC'] ||
            row['Quyết định công nhận HLTC'] ||
            row['Quyết định công nhận'] ||
            row['Quyết định HLTC'] || ''
          ).trim();

          const onsiteRaw = String(
            row['Huấn luyện tại chỗ (Nội dung; Cảng; Thời gian; Số QĐ)'] || ''
          ).trim();

          const facility = String(row['Tên cơ sở đào tạo'] || '').trim();
          const certName = String(row['Tên chứng chỉ / Thẻ nghiệp vụ'] || row['Tên chứng chỉ'] || '').trim();
          const certNumber = String(row['Số hiệu chứng chỉ'] || '').trim();
          const certIssueDate = String(row['Ngày cấp chứng chỉ'] || '').trim();
          const certExpiryDate = String(row['Ngày hết hạn chứng chỉ'] || '').trim();

          const deployedAirportsRaw = String(
            row['Cảng điều động (Cảng: Nhiệm vụ, từ ngày - đến ngày; cách nhau dấu ;)'] ||
            row['Cảng điều động'] ||
            row['Điều động cảng'] || ''
          ).trim();

          const workHistoryRaw = String(
            row['Quá trình công tác / Chuyển công tác (Thời gian: Nội dung, đơn vị; cách nhau dấu ;)'] ||
            row['Quá trình công tác'] ||
            row['Chuyển công tác'] || ''
          ).trim();

          if (!employeeCode) errors.push('Thiếu mã nhân viên');
          if (!fullName && idx === 0) errors.push('Thiếu họ và tên');

          return {
            stt: idx + 1,
            fullName,
            employeeCode,
            birthDate,
            gender,
            idCardNumber,
            idCardDate,
            idCardPlace,
            hireDate,
            organization,
            aviationJobTitle,
            department,
            position,
            regularAirport,
            skillsRaw,
            onsiteSkill,
            onsiteAirport,
            onsiteDuration,
            onsiteDecision,
            onsiteRaw,
            facility,
            certName,
            certNumber,
            certIssueDate,
            certExpiryDate,
            deployedAirportsRaw,
            workHistoryRaw,
            isValid: errors.length === 0,
            errors,
          };
        });

        setRawRows(parsed);

        // 2. Intelligent Grouping by Employee Code (or CCCD)
        const groupsMap = new Map<string, GroupedEmployeeImport>();

        parsed.forEach((row) => {
          if (!row.employeeCode) return;
          const key = row.employeeCode.toUpperCase().trim();

          if (!groupsMap.has(key)) {
            const existingInDb = currentEmployees.find(
              (e) => e.employeeCode.toUpperCase() === key
            );

            groupsMap.set(key, {
              employeeCode: row.employeeCode,
              fullName: row.fullName || (existingInDb ? existingInDb.fullName : 'Chưa có họ tên'),
              birthDate: row.birthDate,
              gender: row.gender,
              idCardNumber: row.idCardNumber || (existingInDb ? existingInDb.idCard.number : ''),
              idCardDate: row.idCardDate,
              idCardPlace: row.idCardPlace,
              hireDate: row.hireDate,
              organization: row.organization,
              aviationJobTitle: row.aviationJobTitle,
              department: row.department,
              position: row.position,
              regularAirport: row.regularAirport,
              professionalSkills: [],
              onsiteTrainings: [],
              trainingRecords: [],
              workHistory: [],
              deployedAirports: [],
              isExisting: !!existingInDb,
              rowIndices: [row.stt],
              errors: [...row.errors],
            });
          } else {
            const grp = groupsMap.get(key)!;
            grp.rowIndices.push(row.stt);
            // Fill blanks if later row has info
            if (!grp.fullName && row.fullName) grp.fullName = row.fullName;
            if (!grp.idCardNumber && row.idCardNumber) grp.idCardNumber = row.idCardNumber;
            if (row.errors.length > 0) {
              grp.errors.push(...row.errors);
            }
          }

          const targetGroup = groupsMap.get(key)!;

          // A. Process Professional Skills
          if (row.skillsRaw) {
            const skillTokens = row.skillsRaw.split(/;|,\s*(?=[A-ZÀ-Ỹ])/).map((s) => s.trim()).filter(Boolean);
            skillTokens.forEach((skName) => {
              const already = targetGroup.professionalSkills.some(
                (p) => p.name.toLowerCase() === skName.toLowerCase()
              );
              if (!already) {
                targetGroup.professionalSkills.push({
                  id: `ps_imp_${Date.now()}_${targetGroup.professionalSkills.length}`,
                  order: targetGroup.professionalSkills.length + 1,
                  name: skName,
                  status: 'active',
                });
              }
            });
          }

          // B. Process On-the-job Training (Mục 11: Huấn luyện tại chỗ)
          if (row.onsiteSkill) {
            const already = targetGroup.onsiteTrainings.some(
              (ot) => ot.skillName.toLowerCase() === row.onsiteSkill!.toLowerCase()
            );
            if (!already) {
              targetGroup.onsiteTrainings.push({
                id: `ot_imp_${Date.now()}_${targetGroup.onsiteTrainings.length}`,
                order: targetGroup.onsiteTrainings.length + 1,
                skillName: row.onsiteSkill,
                airport: row.onsiteAirport || targetGroup.regularAirport || 'Cảng HKQT Nội Bài (HAN)',
                duration: row.onsiteDuration || '01/01/2024 - 15/02/2024 (120 giờ)',
                decisionNumber: row.onsiteDecision || 'QĐ-SKYPEC-KT',
                decisionFileName: 'QD_CongNhan_HLTC.pdf',
              });
            }
          } else if (row.onsiteRaw) {
            const otTokens = row.onsiteRaw.split(/;|\n/).map((s) => s.trim()).filter(Boolean);
            otTokens.forEach((tok) => {
              const already = targetGroup.onsiteTrainings.some(
                (ot) => ot.skillName.toLowerCase() === tok.toLowerCase()
              );
              if (!already) {
                targetGroup.onsiteTrainings.push({
                  id: `ot_imp_${Date.now()}_${targetGroup.onsiteTrainings.length}`,
                  order: targetGroup.onsiteTrainings.length + 1,
                  skillName: tok,
                  airport: targetGroup.regularAirport || 'Cảng HKQT Nội Bài (HAN)',
                  duration: '120 giờ',
                  decisionNumber: 'QĐ-SKYPEC-KT',
                  decisionFileName: 'QD_CongNhan_HLTC.pdf',
                });
              }
            });
          }

          // C. Process Certificates / Training Records
          if (row.certName) {
            // Support multiple certs in single cell separated by ;
            const certTokens = row.certName.includes(';') ? row.certName.split(';').map(c => c.trim()).filter(Boolean) : [row.certName];
            
            certTokens.forEach((cName, cIdx) => {
              const certNum = cIdx === 0 && row.certNumber ? row.certNumber : `CAAV-SKP-${Math.floor(1000 + Math.random() * 9000)}`;
              const already = targetGroup.trainingRecords.some(
                (tr) => tr.certificateName.toLowerCase() === cName.toLowerCase()
              );
              if (!already) {
                targetGroup.trainingRecords.push({
                  id: `tr_imp_${Date.now()}_${targetGroup.trainingRecords.length}`,
                  order: targetGroup.trainingRecords.length + 1,
                  trainingFacility: row.facility || 'Học viện Hàng không Việt Nam',
                  trainingContent: 'An toàn hàng không & Khai thác chuyên môn khu bay',
                  startDate: '10/01/2024',
                  endDate: '15/01/2024',
                  certificateName: cName,
                  certificateNumber: certNum,
                  certificateFileName: 'ChungChi_DienTu.pdf',
                  trainingFormat: 'Tập trung',
                  issueDate: row.certIssueDate || '20/01/2024',
                  expiryDate: row.certExpiryDate || '20/01/2027',
                });
              }
            });
          }

          // D. Process Work History / Transfers
          if (row.workHistoryRaw) {
            const whTokens = row.workHistoryRaw.split(/;|\n/).map((w) => w.trim()).filter(Boolean);
            whTokens.forEach((token) => {
              let period = `${row.hireDate.slice(-4)} - Đến nay`;
              let description = token;
              if (token.includes(':')) {
                const parts = token.split(':');
                period = parts[0].trim();
                description = parts.slice(1).join(':').trim();
              }
              const already = targetGroup.workHistory.some(
                (wh) => wh.description.toLowerCase() === description.toLowerCase()
              );
              if (!already) {
                targetGroup.workHistory.push({
                  id: `wh_imp_${Date.now()}_${targetGroup.workHistory.length}`,
                  period,
                  description,
                });
              }
            });
          }

          // E. Process Deployed Airports
          if (row.deployedAirportsRaw) {
            const daTokens = row.deployedAirportsRaw.split(/;|\n/).map((d) => d.trim()).filter(Boolean);
            daTokens.forEach((token) => {
              let airport = token;
              let assignedSkill = 'Tăng cường khai thác theo yêu cầu điều động';
              let startDate = '01/06/2023';
              let endDate = '30/06/2023';

              if (token.includes(':')) {
                const parts = token.split(':');
                airport = parts[0].trim();
                const rest = parts.slice(1).join(':').trim();
                if (rest.includes(',')) {
                  const subParts = rest.split(',');
                  assignedSkill = subParts[0].trim();
                  const dateStr = subParts.slice(1).join(',').trim();
                  if (dateStr.includes('-')) {
                    const dates = dateStr.split('-');
                    startDate = dates[0].trim();
                    endDate = dates[1].trim();
                  }
                } else {
                  assignedSkill = rest;
                }
              }

              const already = targetGroup.deployedAirports.some(
                (da) => da.airport.toLowerCase() === airport.toLowerCase()
              );
              if (!already) {
                targetGroup.deployedAirports.push({
                  id: `da_imp_${Date.now()}_${targetGroup.deployedAirports.length}`,
                  order: targetGroup.deployedAirports.length + 1,
                  airport,
                  assignedSkill,
                  startDate,
                  endDate,
                });
              }
            });
          }
        });

        // Ensure default work history if empty
        groupsMap.forEach((grp) => {
          if (grp.workHistory.length === 0) {
            grp.workHistory.push({
              id: `wh_imp_${Date.now()}_0`,
              period: `${grp.hireDate.slice(-4)} - Đến nay`,
              description: `${grp.aviationJobTitle}, ${grp.department}, ${grp.regularAirport}`,
            });
          }
          if (grp.professionalSkills.length === 0) {
            grp.professionalSkills.push({
              id: `ps_imp_${Date.now()}_0`,
              order: 1,
              name: 'Quy trình an toàn tra nạp nhiên liệu hàng không',
              status: 'active',
            });
          }
        });

        setGroupedList(Array.from(groupsMap.values()));
        setStep('preview');
      } catch (err) {
        alert('Không thể đọc file Excel. Vui lòng kiểm tra định dạng .xlsx, .xls!');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (groupedList.length === 0) {
      alert('Không có dữ liệu hợp lệ để nhập!');
      return;
    }

    let created = 0;
    let updated = 0;
    const currentEmployees = storageService.getEmployees();

    groupedList.forEach((grp) => {
      const existing = currentEmployees.find(
        (e) => e.employeeCode.toUpperCase() === grp.employeeCode.toUpperCase()
      );

      if (existing) {
        // --- MERGE / UPDATE INTO EXISTING EMPLOYEE (PRESERVES QR TOKEN!) ---
        const mergedCerts = [...existing.trainingRecords];
        grp.trainingRecords.forEach((newTr) => {
          const exists = mergedCerts.some(
            (c) =>
              c.certificateName.toLowerCase() === newTr.certificateName.toLowerCase() ||
              (c.certificateNumber && c.certificateNumber === newTr.certificateNumber)
          );
          if (!exists) {
            mergedCerts.push({
              ...newTr,
              order: mergedCerts.length + 1,
            });
          }
        });

        const mergedOnsite = [...(existing.onsiteTrainings || [])];
        grp.onsiteTrainings.forEach((newOt) => {
          const exists = mergedOnsite.some(
            (o) => o.skillName.toLowerCase() === newOt.skillName.toLowerCase()
          );
          if (!exists) {
            mergedOnsite.push({
              ...newOt,
              order: mergedOnsite.length + 1,
            });
          }
        });

        const mergedWork = [...existing.workHistory];
        grp.workHistory.forEach((newWh) => {
          const exists = mergedWork.some(
            (w) => w.description.toLowerCase() === newWh.description.toLowerCase()
          );
          if (!exists) {
            mergedWork.push(newWh);
          }
        });

        const mergedAirports = [...existing.deployedAirports];
        grp.deployedAirports.forEach((newDa) => {
          const exists = mergedAirports.some(
            (a) => a.airport.toLowerCase() === newDa.airport.toLowerCase()
          );
          if (!exists) {
            mergedAirports.push({
              ...newDa,
              order: mergedAirports.length + 1,
            });
          }
        });

        const mergedSkills = [...existing.professionalSkills];
        grp.professionalSkills.forEach((newSk) => {
          const exists = mergedSkills.some(
            (s) => s.name.toLowerCase() === newSk.name.toLowerCase()
          );
          if (!exists) {
            mergedSkills.push({
              ...newSk,
              order: mergedSkills.length + 1,
            });
          }
        });

        storageService.updateEmployee(
          existing.id,
          {
            trainingRecords: mergedCerts,
            onsiteTrainings: mergedOnsite,
            workHistory: mergedWork,
            deployedAirports: mergedAirports,
            professionalSkills: mergedSkills,
            // Update personal details if filled in Excel
            fullName: grp.fullName || existing.fullName,
            aviationJobTitle: grp.aviationJobTitle || existing.aviationJobTitle,
            department: grp.department || existing.department,
            position: grp.position || existing.position,
            regularAirport: grp.regularAirport || existing.regularAirport,
          },
          'Cán bộ nghiệp vụ (Import Excel - Bổ sung chứng chỉ, HLTC & công tác)'
        );
        updated++;
      } else {
        // --- CREATE BRAND NEW EMPLOYEE ---
        storageService.createEmployee(
          {
            employeeCode: grp.employeeCode,
            fullName: grp.fullName,
            birthDate: grp.birthDate,
            gender: grp.gender,
            idCard: {
              number: grp.idCardNumber || '001088' + Math.floor(100000 + Math.random() * 900000),
              issueDate: grp.idCardDate || '10/05/2021',
              issuePlace: grp.idCardPlace || 'Cục Cảnh sát QLHC về TTXH',
            },
            hireDate: grp.hireDate,
            organization: grp.organization,
            aviationJobTitle: grp.aviationJobTitle,
            department: grp.department,
            position: grp.position,
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=faces&q=80',
            status: 'active',
            regularAirport: grp.regularAirport,
            professionalSkills: grp.professionalSkills,
            onsiteTrainings: grp.onsiteTrainings,
            deployedAirports: grp.deployedAirports,
            trainingRecords: grp.trainingRecords,
            workHistory: grp.workHistory,
          },
          'Cán bộ nghiệp vụ (Import Excel)'
        );
        created++;
      }
    });

    setImportedCount(created);
    setUpdatedCount(updated);
    setStep('success');
  };

  const totalCertsDetected = groupedList.reduce(
    (acc, g) => acc + g.trainingRecords.length,
    0
  );
  const totalOnsiteDetected = groupedList.reduce(
    (acc, g) => acc + g.onsiteTrainings.length,
    0
  );
  const totalTransfersDetected = groupedList.reduce(
    (acc, g) => acc + g.deployedAirports.length + g.workHistory.length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#006C99] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-[#EECD2B]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Nhập Hồ Sơ Nhân Viên Bằng File Excel & Tải Biểu Mẫu Chuẩn
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Hỗ trợ 1 người nhiều chứng chỉ, nhiều đợt chuyển công tác • Tự động gộp dòng & Cấp QR cố định
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 text-xs">
          {/* STEP 1: UPLOAD & TEMPLATE DOWNLOAD */}
          {step === 'upload' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Template Download Prominent Card */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-[#EECD2B] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-[#EECD2B] text-slate-900 rounded-xl shrink-0 mt-0.5 shadow-xs">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">
                        Biểu Mẫu Nhập Excel Chuẩn SKYPEC (.xlsx) Mới Nhất
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#006C99] text-white">
                        CHUẨN HÀNG KHÔNG
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                      Đã bổ sung đầy đủ: <strong>Huấn luyện tại chỗ (Mục 11)</strong>, <strong>Cảng điều động</strong> và <strong>Quá trình công tác / Chuyển công tác</strong>. Kèm theo Sheet hướng dẫn chi tiết cách nhập 1 người có nhiều chứng chỉ & HLTC.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadSkypecExcelTemplate}
                  className="px-4 py-2.5 bg-[#006C99] hover:bg-[#005377] text-white font-bold rounded-xl shrink-0 inline-flex items-center gap-2 shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4 text-[#EECD2B]" />
                  <span>Tải Biểu Mẫu Mới (.xlsx)</span>
                </button>
              </div>

              {/* Explanatory Collapsible: Quy tắc nhập duy nhất */}
              <div className="bg-white rounded-2xl border-2 border-emerald-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="w-full px-4 py-3 bg-emerald-50/70 hover:bg-emerald-50 flex items-center justify-between font-bold text-slate-900 text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Quy tắc nhập: 1 người có nhiều chứng chỉ, đợt huấn luyện tại chỗ & chuyển công tác</span>
                  </div>
                  {showGuide ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {showGuide && (
                  <div className="p-4 space-y-3 bg-white text-slate-700 leading-relaxed text-[11px] border-t border-emerald-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                        <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-600" />
                          1. Chứng chỉ đào tạo
                        </div>
                        <p className="text-slate-600">
                          Nếu có nhiều chứng chỉ, nhập thành <strong>nhiều dòng trong Excel</strong> với <strong>cùng Mã nhân viên</strong>.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-1">
                        <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-indigo-600" />
                          2. Huấn luyện tại chỗ
                        </div>
                        <p className="text-slate-600">
                          Điền các cột <strong>Nghiệp vụ HLTC</strong>, <strong>Cảng HLTC</strong>, <strong>Thời gian</strong> và <strong>Số QĐ công nhận</strong> (Mục 11 chuẩn CAAV).
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1">
                        <div className="font-bold text-[#006C99] flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#006C99]" />
                          3. Công tác & điều động
                        </div>
                        <p className="text-slate-600">
                          Mỗi đợt chuyển công tác hoặc cảng điều động điền tương ứng từng dòng với <strong>cùng Mã nhân viên</strong>.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
                        <div className="font-bold text-amber-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                          4. Gộp 1 QR duy nhất
                        </div>
                        <p className="text-slate-600">
                          Hệ thống tự động gom các dòng có cùng Mã NV vào <strong>1 hồ sơ duy nhất</strong> và gắn <strong>1 mã QR cố định</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Dropzone */}
              <div className="p-7 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:border-[#006C99] transition-colors flex flex-col items-center shadow-xs text-center">
                <Upload className="w-10 h-10 text-[#006C99] mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">
                  Tải Lên File Excel Đã Điền Dữ Liệu
                </h4>
                <p className="text-slate-500 text-xs mt-0.5 mb-3">
                  Hỗ trợ định dạng .xlsx, .xls • Hệ thống sẽ tự động phân tích và gộp dữ liệu
                </p>
                <label className="px-6 py-2.5 bg-[#006C99] hover:bg-[#005377] text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Chọn File Excel Từ Máy Tính</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & GROUPED SUMMARY */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Tệp tin: {fileName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      Đã gộp theo Mã NV
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                    <span>Đọc được: <strong>{rawRows.length}</strong> dòng Excel</span>
                    <span>•</span>
                    <span className="text-[#006C99] font-bold">
                      Gộp thành: {groupedList.length} hồ sơ nhân sự
                    </span>
                    <span>•</span>
                    <span className="text-indigo-700 font-semibold">
                      Tổng {totalOnsiteDetected} huấn luyện tại chỗ
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">
                      Tổng {totalCertsDetected} chứng chỉ
                    </span>
                    <span>•</span>
                    <span className="text-amber-700 font-medium">
                      Tổng {totalTransfersDetected} mốc công tác & điều động
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('upload')}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Chọn file khác
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={groupedList.length === 0}
                    className="px-4 py-1.5 rounded-lg bg-[#006C99] hover:bg-[#005377] text-white font-bold disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#EECD2B]" />
                    <span>Xác nhận nhập ({groupedList.length} nhân viên)</span>
                  </button>
                </div>
              </div>

              {/* Grouped Data Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto max-h-[420px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="p-2.5 w-10 text-center">STT</th>
                        <th className="p-2.5">Loại xử lý</th>
                        <th className="p-2.5">Mã NV</th>
                        <th className="p-2.5">Họ và tên</th>
                        <th className="p-2.5">Chức danh / Đơn vị</th>
                        <th className="p-2.5">HL tại chỗ ({totalOnsiteDetected}) & Chứng chỉ ({totalCertsDetected})</th>
                        <th className="p-2.5">Chuyển công tác & Cảng điều động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupedList.map((grp, idx) => (
                        <tr key={grp.employeeCode} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center text-slate-500 font-bold">{idx + 1}</td>
                          <td className="p-2.5 whitespace-nowrap">
                            {grp.isExisting ? (
                              <span className="inline-flex items-center gap-1 text-blue-700 font-bold text-[10px] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                <RefreshCw className="w-3 h-3" /> Cập nhật hồ sơ cũ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Thêm mới + Cấp QR
                              </span>
                            )}
                            {grp.rowIndices.length > 1 && (
                              <span className="ml-1 text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-200">
                                Gộp {grp.rowIndices.length} dòng
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-[#006C99]">{grp.employeeCode}</td>
                          <td className="p-2.5 font-bold text-slate-900">{grp.fullName}</td>
                          <td className="p-2.5 text-slate-600 max-w-[180px]">
                            <div className="font-medium text-slate-800">{grp.aviationJobTitle}</div>
                            <div className="text-[10px] text-slate-500 truncate">{grp.department}</div>
                          </td>
                          <td className="p-2.5 max-w-[280px]">
                            {/* Onsite Trainings */}
                            {grp.onsiteTrainings.length > 0 && (
                              <div className="space-y-1 mb-2">
                                <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                                  <GraduationCap className="w-3 h-3 text-indigo-600" />
                                  <span>HL tại chỗ ({grp.onsiteTrainings.length})</span>
                                </div>
                                {grp.onsiteTrainings.map((ot, i) => (
                                  <div key={i} className="text-[11px] text-slate-700 bg-indigo-50/70 p-1.5 rounded border border-indigo-100">
                                    <div className="font-semibold text-indigo-900 truncate" title={ot.skillName}>{ot.skillName}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">{ot.airport} • {ot.duration}</div>
                                    {ot.decisionNumber && (
                                      <div className="text-[9px] text-slate-400 font-mono truncate">{ot.decisionNumber}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Certificates */}
                            {grp.trainingRecords.length > 0 ? (
                              <div className="space-y-1">
                                <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                                  <Award className="w-3 h-3 text-amber-600" />
                                  <span>Chứng chỉ ({grp.trainingRecords.length})</span>
                                </div>
                                {grp.trainingRecords.map((tr, i) => (
                                  <div key={i} className="flex items-center gap-1 text-[11px] text-[#006C99]">
                                    <Award className="w-3 h-3 shrink-0 text-amber-500" />
                                    <span className="truncate font-medium">{tr.certificateName}</span>
                                  </div>
                                ))}
                              </div>
                            ) : grp.onsiteTrainings.length === 0 ? (
                              <span className="text-slate-400 italic">Chưa có chứng chỉ / HLTC</span>
                            ) : null}
                          </td>
                          <td className="p-2.5 max-w-[240px]">
                            <div className="space-y-1 text-[11px] text-slate-700">
                              {grp.deployedAirports.length > 0 && (
                                <div className="flex items-center gap-1 text-emerald-700">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span>{grp.deployedAirports.length} cảng điều động</span>
                                </div>
                              )}
                              {grp.workHistory.length > 0 && (
                                <div className="flex items-center gap-1 text-slate-600">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{grp.workHistory[0].period}: {grp.workHistory[0].description}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div className="max-w-md mx-auto py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">
                Xử Lý Dữ Liệu Excel Thành Công!
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tạo mới nhân viên (cấp QR cố định):</span>
                  <strong className="text-emerald-600">{importedCount} hồ sơ</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bổ sung vào nhân viên có sẵn:</span>
                  <strong className="text-[#006C99]">{updatedCount} hồ sơ</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                  <span className="text-slate-800">Tổng chứng chỉ & đào tạo đã gộp:</span>
                  <span className="text-amber-600">{totalCertsDetected} chứng chỉ</span>
                </div>
              </div>
              <p className="text-slate-500 text-[11px]">
                Mã QR cố định và liên kết hồ sơ số hóa đã được bảo toàn và cập nhật đồng bộ lên toàn hệ thống.
              </p>
              <button
                onClick={() => {
                  onImportComplete();
                  onClose();
                }}
                className="px-6 py-2.5 bg-[#006C99] hover:bg-[#005377] text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                Hoàn tất & Xem Danh Sách Nhân Viên
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
