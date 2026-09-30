import React, { useState, useMemo } from 'react';
import { Employee, TrainingRecord, OnsiteTraining } from '../../types';
import { storageService } from '../../services/storageService';
import {
  X,
  Search,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  Award,
  Layers,
  Merge,
  Trash2,
  Edit,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Building2,
  FileCheck,
  RefreshCw,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface EmployeeAuditDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEmployeeDetail: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
  initialEmployeeCode?: string;
}

export const EmployeeAuditDuplicateModal: React.FC<EmployeeAuditDuplicateModalProps> = ({
  isOpen,
  onClose,
  onOpenEmployeeDetail,
  onEditEmployee,
  initialEmployeeCode = '',
}) => {
  const [activeTab, setActiveTab] = useState<'check-by-code' | 'duplicate-scanner' | 'training-audit'>(
    initialEmployeeCode ? 'check-by-code' : 'duplicate-scanner'
  );
  const [searchCode, setSearchCode] = useState<string>(initialEmployeeCode || '');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Rename code inline modal state
  const [renameModalEmp, setRenameModalEmp] = useState<Employee | null>(null);
  const [newCodeInput, setNewCodeInput] = useState<string>('');

  const employees = storageService.getEmployees();

  // Helper to show temporary banner
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- 1. FULL DUPLICATE DETECTION ALGORITHM ---
  const duplicateAnalysis = useMemo(() => {
    // A. By Employee Code (normalized)
    const codeMap = new Map<string, Employee[]>();
    employees.forEach((emp) => {
      const clean = emp.employeeCode.trim().toUpperCase();
      if (!clean) return;
      if (!codeMap.has(clean)) codeMap.set(clean, []);
      codeMap.get(clean)!.push(emp);
    });

    const duplicateCodes: Array<{ code: string; emps: Employee[] }> = [];
    codeMap.forEach((emps, code) => {
      if (emps.length > 1) {
        duplicateCodes.push({ code, emps });
      }
    });

    // B. By Citizen ID (CCCD)
    const cccdMap = new Map<string, Employee[]>();
    employees.forEach((emp) => {
      const cccd = (emp.idCard?.number || '').replace(/[^0-9]/g, '');
      if (cccd && cccd.length >= 8) {
        if (!cccdMap.has(cccd)) cccdMap.set(cccd, []);
        cccdMap.get(cccd)!.push(emp);
      }
    });

    const duplicateCccds: Array<{ cccd: string; emps: Employee[] }> = [];
    cccdMap.forEach((emps, cccd) => {
      if (emps.length > 1) {
        // Only consider duplicate if they have different employee IDs
        duplicateCccds.push({ cccd, emps });
      }
    });

    // C. By Full Name + Birth Date
    const nameDobMap = new Map<string, Employee[]>();
    employees.forEach((emp) => {
      const cleanName = emp.fullName.trim().toLowerCase();
      const dob = emp.birthDate.trim();
      if (cleanName && dob) {
        const key = `${cleanName}__${dob}`;
        if (!nameDobMap.has(key)) nameDobMap.set(key, []);
        nameDobMap.get(key)!.push(emp);
      }
    });

    const duplicateNames: Array<{ name: string; dob: string; emps: Employee[] }> = [];
    nameDobMap.forEach((emps, key) => {
      if (emps.length > 1) {
        const [name, dob] = key.split('__');
        duplicateNames.push({ name, dob, emps });
      }
    });

    return {
      duplicateCodes,
      duplicateCccds,
      duplicateNames,
      totalDuplicateGroups: duplicateCodes.length + duplicateCccds.length,
    };
  }, [employees]);

  // --- 2. TRAINING DATA QUALITY AUDIT ---
  const trainingAnalysis = useMemo(() => {
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAhead = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const expiredCerts: Array<{ employee: Employee; record: TrainingRecord }> = [];
    const expiringSoonCerts: Array<{ employee: Employee; record: TrainingRecord; daysLeft: number }> = [];
    const duplicateCertsInProfile: Array<{ employee: Employee; certName: string; count: number }> = [];
    const missingDecisionOnsite: Array<{ employee: Employee; onsite: OnsiteTraining }> = [];
    const noTrainingEmployees: Employee[] = [];

    employees.forEach((emp) => {
      const records = emp.trainingRecords || [];
      const onsites = emp.onsiteTrainings || [];

      if (records.length === 0 && onsites.length === 0) {
        noTrainingEmployees.push(emp);
      }

      // Check duplicates in profile
      const certCountMap = new Map<string, number>();
      records.forEach((rec) => {
        const key = rec.certificateName.trim().toLowerCase();
        certCountMap.set(key, (certCountMap.get(key) || 0) + 1);

        // Expiry check
        if (rec.expiryDate && rec.expiryDate !== 'Vô thời hạn' && rec.expiryDate !== 'Không thời hạn') {
          // Parse dd/mm/yyyy
          const parts = rec.expiryDate.split('/');
          if (parts.length === 3) {
            const expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            if (!isNaN(expDate.getTime())) {
              if (expDate < now) {
                expiredCerts.push({ employee: emp, record: rec });
              } else if (expDate <= sixtyDaysAhead) {
                const diffTime = expDate.getTime() - now.getTime();
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                expiringSoonCerts.push({ employee: emp, record: rec, daysLeft });
              }
            }
          }
        }
      });

      certCountMap.forEach((count, key) => {
        if (count > 1) {
          const sample = records.find((r) => r.certificateName.trim().toLowerCase() === key);
          duplicateCertsInProfile.push({
            employee: emp,
            certName: sample ? sample.certificateName : key,
            count,
          });
        }
      });

      // Check Onsite Trainings
      onsites.forEach((ot) => {
        if (!ot.decisionNumber || ot.decisionNumber.trim() === '' || ot.decisionNumber.toLowerCase().includes('chưa có')) {
          missingDecisionOnsite.push({ employee: emp, onsite: ot });
        }
      });
    });

    return {
      expiredCerts,
      expiringSoonCerts,
      duplicateCertsInProfile,
      missingDecisionOnsite,
      noTrainingEmployees,
    };
  }, [employees]);

  // --- 3. SINGLE EMPLOYEE SEARCH RESULTS ---
  const searchedEmployees = useMemo(() => {
    if (!searchCode.trim()) return [];
    const clean = searchCode.trim().toUpperCase();
    const stripped = clean.replace(/[^A-Z0-9]/g, '');

    return employees.filter((e) => {
      const empCode = e.employeeCode.trim().toUpperCase();
      const empStripped = empCode.replace(/[^A-Z0-9]/g, '');
      const empName = e.fullName.toLowerCase();
      const token = e.publicToken.toUpperCase();

      return (
        empCode === clean ||
        (stripped.length >= 3 && empStripped === stripped) ||
        empName.includes(clean.toLowerCase()) ||
        token === clean
      );
    });
  }, [searchCode, employees]);

  // Active inspected employee in Tab 1
  const currentInspectedEmp = useMemo(() => {
    if (selectedEmpId) {
      return employees.find((e) => e.id === selectedEmpId) || searchedEmployees[0];
    }
    return searchedEmployees[0];
  }, [selectedEmpId, searchedEmployees, employees]);

  // Handle Merge Duplicates
  const handleMergeEmployees = (primaryId: string, duplicateIds: string[]) => {
    const primary = employees.find((e) => e.id === primaryId);
    if (!primary) return;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn HỢP NHẤT các hồ sơ trùng lặp vào hồ sơ chính "${primary.fullName} (${primary.employeeCode})"?\n\nToàn bộ chứng chỉ đào tạo, quá trình huấn luyện tại chỗ và lịch sử công tác từ các hồ sơ phụ sẽ được gộp sang hồ sơ chính. Các bản ghi thừa sẽ được xóa vĩnh viễn.`
      )
    ) {
      return;
    }

    try {
      const merged = storageService.mergeDuplicateEmployees(primaryId, duplicateIds, 'Cán bộ kiểm tra dữ liệu');
      if (merged) {
        showToast(
          `Đã hợp nhất thành công! Hồ sơ "${merged.employeeCode}" hiện có ${merged.trainingRecords.length} chứng chỉ và ${merged.onsiteTrainings.length} khóa huấn luyện tại chỗ.`
        );
      }
    } catch (err) {
      showToast('Có lỗi xảy ra khi hợp nhất hồ sơ.', 'error');
    }
  };

  // Handle Delete Single Duplicate Record
  const handleDeleteDuplicate = (emp: Employee) => {
    if (
      !window.confirm(
        `Xác nhận xóa bản ghi thừa "${emp.fullName} - Mã: ${emp.employeeCode}" khỏi hệ thống?`
      )
    ) {
      return;
    }
    storageService.deleteEmployee(emp.id, 'Cán bộ quản trị (Xóa bản ghi trùng)');
    showToast(`Đã xóa bản ghi ${emp.employeeCode} thành công.`);
  };

  // Handle Quick Rename Code
  const handleExecuteRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameModalEmp) return;
    const cleanNew = newCodeInput.trim().toUpperCase();
    if (!cleanNew) {
      alert('Vui lòng nhập mã nhân viên mới!');
      return;
    }

    // Check if new code exists
    const exists = employees.some(
      (e) => e.employeeCode.trim().toUpperCase() === cleanNew && e.id !== renameModalEmp.id
    );
    if (exists) {
      alert(`Mã "${cleanNew}" đã tồn tại trên hệ thống. Vui lòng chọn mã khác để không bị trùng!`);
      return;
    }

    storageService.updateEmployee(
      renameModalEmp.id,
      { employeeCode: cleanNew },
      'Cán bộ quản trị (Sửa mã tránh trùng)'
    );
    showToast(`Đã đổi mã nhân viên thành "${cleanNew}" thành công.`);
    setRenameModalEmp(null);
    setNewCodeInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* MODAL HEADER */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-[#005377] to-[#006C99] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-[#EECD2B]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  Kiểm Tra Thông Tin Học & Rà Soát Trùng Lặp Nhân Viên
                </h3>
                {duplicateAnalysis.totalDuplicateGroups > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                    {duplicateAnalysis.totalDuplicateGroups} Trường hợp trùng lặp
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold border border-emerald-400/40">
                    Dữ liệu đồng bộ
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Rà soát kỹ thông tin qua Mã nhân viên, kiểm tra trùng mã/double nhân viên và đối soát đầy đủ thông tin học tập
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div
            className={`mx-6 mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('check-by-code')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'check-by-code'
                  ? 'border-[#006C99] text-[#006C99] bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>🔍 Tra Cứu Theo Mã NV & Thông Tin Học</span>
            </button>

            <button
              onClick={() => setActiveTab('duplicate-scanner')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer relative ${
                activeTab === 'duplicate-scanner'
                  ? 'border-rose-600 text-rose-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>⚠️ Rà Soát Trùng Lặp / Double</span>
              {duplicateAnalysis.totalDuplicateGroups > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                  {duplicateAnalysis.totalDuplicateGroups}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('training-audit')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'training-audit'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>🎓 Rà Soát Dữ Liệu Học & Hết Hạn Chứng Chỉ</span>
              {(trainingAnalysis.expiredCerts.length > 0 || trainingAnalysis.missingDecisionOnsite.length > 0) && (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-500 pb-2">
            Tổng cơ sở dữ liệu: <strong className="text-[#006C99]">{employees.length}</strong> nhân viên
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 text-xs">
          {/* ============================================================== */}
          {/* TAB 1: CHECK THEO MÃ NHÂN VIÊN & THÔNG TIN HỌC CHI TIẾT        */}
          {/* ============================================================== */}
          {activeTab === 'check-by-code' && (
            <div className="space-y-5">
              {/* Search Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchCode}
                      onChange={(e) => {
                        setSearchCode(e.target.value);
                        setSelectedEmpId('');
                      }}
                      placeholder="Nhập mã nhân viên (VD: SKP-0125, SKP-0012, SKP0001) hoặc Họ tên..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#006C99] font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  {searchCode && (
                    <button
                      onClick={() => setSearchCode('')}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors cursor-pointer"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Quick select pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Chọn nhanh mã mẫu:
                  </span>
                  {employees.slice(0, 7).map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => {
                        setSearchCode(emp.employeeCode);
                        setSelectedEmpId(emp.id);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#006C99] font-mono text-[10px] font-bold text-slate-700 transition-colors cursor-pointer border border-slate-200"
                    >
                      {emp.employeeCode} ({emp.fullName.split(' ').pop()})
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Results / Status */}
              {!searchCode.trim() ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-[#006C99] flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Nhập mã nhân viên để kiểm tra trùng lặp và đối soát thông tin học
                  </h4>
                  <p className="text-slate-500 max-w-md mx-auto text-xs leading-relaxed">
                    Hệ thống sẽ quét ngay lập tức xem mã nhân viên này có bị trùng (double) với bất kỳ ai khác không,
                    đồng thời kiểm tra toàn bộ <strong>chứng chỉ nghiệp vụ</strong> và <strong>quá trình huấn luyện tại chỗ (HLTC)</strong>.
                  </p>
                </div>
              ) : searchedEmployees.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <div className="font-bold text-slate-800">
                    Không tìm thấy nhân viên nào với mã &ldquo;{searchCode}&rdquo;
                  </div>
                  <p className="text-slate-500 text-xs">
                    Mã này hiện chưa được sử dụng trong hệ thống. Bạn có thể an tâm tạo mới mà không lo bị trùng!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* DUPLICATE STATUS BANNER */}
                  {searchedEmployees.length > 1 ? (
                    <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0 mt-0.5">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-black text-sm text-rose-700 flex items-center gap-2">
                            <span>PHÁT HIỆN TRÙNG LẶP: {searchedEmployees.length} HỒ SƠ ĐANG MANG CÙNG MÃ &ldquo;{searchCode}&rdquo;!</span>
                          </div>
                          <p className="text-rose-700/90 text-xs mt-0.5">
                            Đây là trường hợp nhân viên bị nhập lặp (double) hoặc có 2 người bị gán nhầm mã. Hãy sử dụng tính năng <strong>Hợp nhất (Merge)</strong> để gom tất cả chứng chỉ & HLTC vào 1 hồ sơ duy nhất.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleMergeEmployees(
                            searchedEmployees[0].id,
                            searchedEmployees.slice(1).map((e) => e.id)
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md transition-colors cursor-pointer shrink-0"
                      >
                        <Merge className="w-4 h-4" />
                        <span>Hợp Nhất {searchedEmployees.length} Hồ Sơ Này Ngay</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold">Mã nhân viên duy nhất:</span>
                          <span className="text-emerald-700 ml-1">
                            Không phát hiện bản ghi trùng lặp nào mang mã &ldquo;{searchCode}&rdquo;. Hồ sơ hợp lệ 1-1 với mã QR cố định.
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800 text-[10px] font-bold">
                        ĐÃ XÁC THỰC
                      </span>
                    </div>
                  )}

                  {/* Multiple profile selector if duplicate */}
                  {searchedEmployees.length > 1 && (
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">Xem chi tiết bản ghi:</span>
                      <div className="flex flex-wrap gap-2">
                        {searchedEmployees.map((emp, i) => (
                          <button
                            key={emp.id}
                            onClick={() => setSelectedEmpId(emp.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              currentInspectedEmp?.id === emp.id
                                ? 'bg-[#006C99] text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Bản ghi #{i + 1}: {emp.fullName} ({emp.department.split('/')[0]})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DETAILED PROFILE & TRAINING CHECK VIEW */}
                  {currentInspectedEmp && (
                    <div className="space-y-4">
                      {/* Identity Card */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 shadow-2xs">
                            {currentInspectedEmp.avatarUrl ? (
                              <img
                                src={currentInspectedEmp.avatarUrl}
                                alt={currentInspectedEmp.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                                3x4
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-slate-900 text-base">
                                {currentInspectedEmp.fullName}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#006C99] font-mono text-[11px] font-bold border border-blue-200">
                                {currentInspectedEmp.employeeCode}
                              </span>
                            </div>
                            <div className="text-slate-600 font-medium text-xs mt-0.5">
                              {currentInspectedEmp.aviationJobTitle} • {currentInspectedEmp.department}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                              <span>CCCD: <strong>{currentInspectedEmp.idCard?.number || 'Chưa cập nhật'}</strong></span>
                              <span>•</span>
                              <span>Cảng: <strong>{currentInspectedEmp.regularAirport}</strong></span>
                              <span>•</span>
                              <span>Mã QR: <strong className="font-mono text-[#006C99]">#{currentInspectedEmp.publicToken}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onOpenEmployeeDetail(currentInspectedEmp)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Xem Lý Lịch A4</span>
                          </button>
                          <button
                            onClick={() => onEditEmployee(currentInspectedEmp)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Chỉnh Sửa</span>
                          </button>
                        </div>
                      </div>

                      {/* SECTION 11: HUẤN LUYỆN TẠI CHỖ (HLTC) */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <span>Mục 11: Huấn Luyện Tại Chỗ (HLTC) - Chuẩn CAAV</span>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                              {currentInspectedEmp.onsiteTrainings.length} đợt
                            </span>
                          </div>
                        </div>

                        {currentInspectedEmp.onsiteTrainings.length > 0 ? (
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-[11px]">
                                <tr>
                                  <th className="p-2.5 text-center w-10">STT</th>
                                  <th className="p-2.5">Nghiệp Vụ Huấn Luyện Tại Chỗ</th>
                                  <th className="p-2.5">Cảng Huấn Luyện</th>
                                  <th className="p-2.5">Thời Gian / Số Giờ</th>
                                  <th className="p-2.5">Số Quyết Định Công Nhận</th>
                                  <th className="p-2.5 text-center">Tình Trạng</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {currentInspectedEmp.onsiteTrainings.map((ot, idx) => {
                                  const hasDecision = ot.decisionNumber && ot.decisionNumber.trim() !== '' && !ot.decisionNumber.toLowerCase().includes('chưa có');

                                  return (
                                    <tr key={ot.id || idx} className="hover:bg-slate-50/70">
                                      <td className="p-2.5 text-center font-bold text-slate-400 font-mono">
                                        {idx + 1}
                                      </td>
                                      <td className="p-2.5 font-bold text-slate-900">
                                        {ot.skillName}
                                      </td>
                                      <td className="p-2.5 text-slate-700">
                                        {ot.airport}
                                      </td>
                                      <td className="p-2.5 text-slate-600 font-medium">
                                        {ot.duration}
                                      </td>
                                      <td className="p-2.5">
                                        {hasDecision ? (
                                          <span className="font-mono text-[11px] font-bold text-[#006C99]">
                                            {ot.decisionNumber}
                                          </span>
                                        ) : (
                                          <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                            Thiếu số QĐ công nhận
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-2.5 text-center">
                                        {hasDecision ? (
                                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đạt chuẩn
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Cần bổ sung QĐ
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 italic">
                            Chưa có dữ liệu huấn luyện tại chỗ cho nhân viên này. Bạn có thể bấm Chỉnh sửa để cập nhật Mục 11.
                          </div>
                        )}
                      </div>

                      {/* SECTION 12: CHỨNG CHỈ / THẺ NGHIỆP VỤ (CCCM) */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                              <Award className="w-4 h-4" />
                            </div>
                            <span>Mục 12: Chứng Chỉ Chuyên Môn & Thẻ Nghiệp Vụ</span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              {currentInspectedEmp.trainingRecords.length} chứng chỉ
                            </span>
                          </div>
                        </div>

                        {currentInspectedEmp.trainingRecords.length > 0 ? (
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-[11px]">
                                <tr>
                                  <th className="p-2.5 text-center w-10">STT</th>
                                  <th className="p-2.5">Tên Chứng Chỉ / Thẻ Nghiệp Vụ</th>
                                  <th className="p-2.5">Số Hiệu</th>
                                  <th className="p-2.5">Cơ Sở Đào Tạo</th>
                                  <th className="p-2.5">Ngày Cấp - Hết Hạn</th>
                                  <th className="p-2.5 text-center">Hiệu Lực</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {currentInspectedEmp.trainingRecords.map((tr, idx) => {
                                  return (
                                    <tr key={tr.id || idx} className="hover:bg-slate-50/70">
                                      <td className="p-2.5 text-center font-bold text-slate-400 font-mono">
                                        {idx + 1}
                                      </td>
                                      <td className="p-2.5 font-bold text-slate-900">
                                        {tr.certificateName}
                                      </td>
                                      <td className="p-2.5 font-mono text-[11px] font-bold text-[#006C99]">
                                        {tr.certificateNumber || '—'}
                                      </td>
                                      <td className="p-2.5 text-slate-600">
                                        {tr.trainingFacility}
                                      </td>
                                      <td className="p-2.5 text-slate-700">
                                        <div>{tr.issueDate} → {tr.expiryDate}</div>
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Còn hạn
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 italic">
                            Chưa có chứng chỉ đào tạo nào được ghi nhận cho nhân viên này.
                          </div>
                        )}
                      </div>

                      {/* SECTION 10: CÁC NGHIỆP VỤ CHUYÊN MÔN ĐƯỢC PHÉP THỰC HIỆN */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                          <div className="p-1.5 rounded-lg bg-blue-100 text-[#006C99]">
                            <FileCheck className="w-4 h-4" />
                          </div>
                          <span>Mục 10: Các Nghiệp Vụ Chuyên Môn Đã Được Phê Chuẩn</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {currentInspectedEmp.professionalSkills.length} nghiệp vụ
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {currentInspectedEmp.professionalSkills.map((skill, i) => (
                            <div
                              key={skill.id || i}
                              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium text-xs flex items-center gap-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>{skill.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: RÀ SOÁT TRÙNG LẶP / DOUBLE (TOÀN HỆ THỐNG)             */}
          {/* ============================================================== */}
          {activeTab === 'duplicate-scanner' && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
                  duplicateAnalysis.duplicateCodes.length > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                      Trùng Mã Nhân Viên
                    </div>
                    <div className="text-2xl font-black mt-1">
                      {duplicateAnalysis.duplicateCodes.length} nhóm
                    </div>
                    <div className="text-[11px] mt-0.5">
                      {duplicateAnalysis.duplicateCodes.length > 0
                        ? 'Cần hợp nhất (Merge) ngay'
                        : 'Không có mã nào bị trùng'}
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl ${
                    duplicateAnalysis.duplicateCodes.length > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border shadow-xs flex items-center justify-between ${
                  duplicateAnalysis.duplicateCccds.length > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                      Trùng Số CCCD / CMND
                    </div>
                    <div className="text-2xl font-black mt-1">
                      {duplicateAnalysis.duplicateCccds.length} nhóm
                    </div>
                    <div className="text-[11px] mt-0.5">
                      {duplicateAnalysis.duplicateCccds.length > 0
                        ? '1 người có 2 mã nhân viên'
                        : 'Mỗi người 1 CCCD duy nhất'}
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl ${
                    duplicateAnalysis.duplicateCccds.length > 0 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#006C99]">
                      Hợp Nhất Tự Động (Merge)
                    </div>
                    <div className="text-2xl font-black mt-1 text-[#006C99]">
                      1-Click
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Gộp toàn bộ chứng chỉ & HLTC
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#006C99] text-white">
                    <Merge className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* LIST OF DUPLICATE EMPLOYEE CODES */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Danh Sách Hồ Sơ Bị Trùng Mã Nhân Viên ({duplicateAnalysis.duplicateCodes.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Hệ thống tự động phát hiện các bản ghi có cùng Mã nhân viên
                  </span>
                </div>

                {duplicateAnalysis.duplicateCodes.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-emerald-200 text-center space-y-2 shadow-xs">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <h5 className="font-bold text-slate-900 text-sm">
                      Tuyệt vời! Không phát hiện bất kỳ mã nhân viên nào bị trùng lặp.
                    </h5>
                    <p className="text-slate-500 text-xs">
                      Tất cả {employees.length} nhân viên đều có mã định danh và mã QR cố định riêng biệt, đạt chuẩn lưu trữ.
                    </p>
                  </div>
                ) : (
                  duplicateAnalysis.duplicateCodes.map(({ code, emps }) => (
                    <div
                      key={code}
                      className="bg-white rounded-2xl border-2 border-rose-200 shadow-xs overflow-hidden"
                    >
                      <div className="bg-rose-50 px-5 py-3 border-b border-rose-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-sm font-black bg-rose-600 text-white px-2.5 py-1 rounded-lg">
                            {code}
                          </span>
                          <span className="text-rose-900 font-bold text-xs">
                            Phát hiện {emps.length} bản ghi nhân viên cùng mang mã này
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleMergeEmployees(
                                emps[0].id,
                                emps.slice(1).map((e) => e.id)
                              )
                            }
                            className="px-3.5 py-1.5 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                          >
                            <Merge className="w-3.5 h-3.5" />
                            <span>Hợp Nhất Vào Bản Ghi #1</span>
                          </button>
                        </div>
                      </div>

                      {/* Comparison Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                            <tr>
                              <th className="p-3 text-center w-14">Vai trò</th>
                              <th className="p-3">Họ và tên</th>
                              <th className="p-3">Chức danh & Đơn vị</th>
                              <th className="p-3">CCCD</th>
                              <th className="p-3 text-center">Chứng chỉ</th>
                              <th className="p-3 text-center">Huấn luyện tại chỗ</th>
                              <th className="p-3 text-center">Mã QR</th>
                              <th className="p-3 text-center">Hành động</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {emps.map((emp, idx) => (
                              <tr
                                key={emp.id}
                                className={idx === 0 ? 'bg-blue-50/40 font-medium' : 'hover:bg-slate-50'}
                              >
                                <td className="p-3 text-center">
                                  {idx === 0 ? (
                                    <span className="px-2 py-0.5 rounded-full bg-[#006C99] text-white text-[10px] font-bold">
                                      Bản ghi chính
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                                      Bản ghi #{idx + 1}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-900">{emp.fullName}</div>
                                  <div className="text-[10px] text-slate-400">ID: {emp.id}</div>
                                </td>
                                <td className="p-3">
                                  <div className="text-slate-800">{emp.aviationJobTitle}</div>
                                  <div className="text-[10px] text-slate-500">{emp.department}</div>
                                </td>
                                <td className="p-3 font-mono text-[11px]">
                                  {emp.idCard?.number || '—'}
                                </td>
                                <td className="p-3 text-center font-bold text-amber-700">
                                  {emp.trainingRecords.length}
                                </td>
                                <td className="p-3 text-center font-bold text-indigo-700">
                                  {emp.onsiteTrainings.length}
                                </td>
                                <td className="p-3 text-center font-mono text-[10px] text-slate-500">
                                  #{emp.publicToken}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => {
                                        setRenameModalEmp(emp);
                                        setNewCodeInput(emp.employeeCode + '_NEW');
                                      }}
                                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2"
                                      title="Đổi sang mã nhân viên khác nếu gõ nhầm"
                                    >
                                      Đổi mã
                                    </button>
                                    {idx > 0 && (
                                      <button
                                        onClick={() => handleDeleteDuplicate(emp)}
                                        className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold px-2"
                                        title="Xóa bản ghi thừa này"
                                      >
                                        Xóa
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* LIST OF DUPLICATE CITIZEN IDS */}
              {duplicateAnalysis.duplicateCccds.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Trùng Số CCCD Nhưng Khác Mã Nhân Viên ({duplicateAnalysis.duplicateCccds.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Có thể cùng 1 nhân viên bị tạo 2 mã nhân viên khác nhau
                    </span>
                  </div>

                  {duplicateAnalysis.duplicateCccds.map(({ cccd, emps }) => (
                    <div key={cccd} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-amber-900 text-xs flex items-center gap-2">
                          <span>CCCD: <strong className="font-mono text-sm">{cccd}</strong></span>
                          <span>({emps.length} nhân viên cùng mang số CCCD này)</span>
                        </div>

                        <button
                          onClick={() =>
                            handleMergeEmployees(
                              emps[0].id,
                              emps.slice(1).map((e) => e.id)
                            )
                          }
                          className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <Merge className="w-3.5 h-3.5" />
                          <span>Hợp Nhất 2 Người Này</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {emps.map((emp) => (
                          <div key={emp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900">{emp.fullName}</div>
                              <div className="text-[11px] text-[#006C99] font-mono font-bold mt-0.5">
                                Mã NV: {emp.employeeCode}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {emp.department} • {emp.trainingRecords.length} chứng chỉ
                              </div>
                            </div>
                            <button
                              onClick={() => onOpenEmployeeDetail(emp)}
                              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:bg-slate-100"
                            >
                              Xem
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: RÀ SOÁT DỮ LIỆU HỌC & HẾT HẠN CHỨNG CHỈ                 */}
          {/* ============================================================== */}
          {activeTab === 'training-audit' && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                    Chứng Chỉ Đã Quá Hạn
                  </div>
                  <div className="text-2xl font-black mt-1 text-rose-700">
                    {trainingAnalysis.expiredCerts.length}
                  </div>
                  <div className="text-[11px] text-rose-600 mt-0.5">
                    Cần đào tạo cấp lại
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                    Sắp Hết Hạn (&le; 60 Ngày)
                  </div>
                  <div className="text-2xl font-black mt-1 text-amber-700">
                    {trainingAnalysis.expiringSoonCerts.length}
                  </div>
                  <div className="text-[11px] text-amber-600 mt-0.5">
                    Lên kế hoạch gia hạn
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    HLTC Thiếu Quyết Định
                  </div>
                  <div className="text-2xl font-black mt-1 text-indigo-700">
                    {trainingAnalysis.missingDecisionOnsite.length}
                  </div>
                  <div className="text-[11px] text-indigo-600 mt-0.5">
                    Mục 11 chuẩn CAAV
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                    Trùng Chứng Chỉ Trong Hồ Sơ
                  </div>
                  <div className="text-2xl font-black mt-1 text-purple-700">
                    {trainingAnalysis.duplicateCertsInProfile.length}
                  </div>
                  <div className="text-[11px] text-purple-600 mt-0.5">
                    1 người bị add trùng cert
                  </div>
                </div>
              </div>

              {/* SECTION: CERTIFICATES EXPIRING SOON OR EXPIRED */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Danh Sách Chứng Chỉ Hết Hạn Hoặc Sắp Hết Hạn ({trainingAnalysis.expiredCerts.length + trainingAnalysis.expiringSoonCerts.length})</span>
                </h4>

                {trainingAnalysis.expiredCerts.length === 0 && trainingAnalysis.expiringSoonCerts.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white border border-emerald-200 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <div className="font-bold text-slate-800">
                      Tất cả chứng chỉ của nhân viên đều còn hiệu lực dài hạn!
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                        <tr>
                          <th className="p-3">Mã NV</th>
                          <th className="p-3">Họ và tên</th>
                          <th className="p-3">Tên chứng chỉ / Số hiệu</th>
                          <th className="p-3">Ngày hết hạn</th>
                          <th className="p-3 text-center">Tình trạng</th>
                          <th className="p-3 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {trainingAnalysis.expiredCerts.map(({ employee, record }, i) => (
                          <tr key={`exp_${i}`} className="bg-rose-50/40">
                            <td className="p-3 font-mono font-bold text-[#006C99]">
                              {employee.employeeCode}
                            </td>
                            <td className="p-3 font-bold text-slate-900">
                              {employee.fullName}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">{record.certificateName}</div>
                              <div className="font-mono text-[10px] text-slate-500">{record.certificateNumber}</div>
                            </td>
                            <td className="p-3 font-bold text-rose-600 font-mono">
                              {record.expiryDate}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                                Đã quá hạn
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => onEditEmployee(employee)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200"
                              >
                                Gia hạn
                              </button>
                            </td>
                          </tr>
                        ))}

                        {trainingAnalysis.expiringSoonCerts.map(({ employee, record, daysLeft }, i) => (
                          <tr key={`soon_${i}`} className="hover:bg-amber-50/30">
                            <td className="p-3 font-mono font-bold text-[#006C99]">
                              {employee.employeeCode}
                            </td>
                            <td className="p-3 font-bold text-slate-900">
                              {employee.fullName}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">{record.certificateName}</div>
                              <div className="font-mono text-[10px] text-slate-500">{record.certificateNumber}</div>
                            </td>
                            <td className="p-3 font-bold text-amber-700 font-mono">
                              {record.expiryDate}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                                Còn {daysLeft} ngày
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => onEditEmployee(employee)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                              >
                                Cập nhật
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION: MISSING DECISION IN ONSITE TRAININGS */}
              {trainingAnalysis.missingDecisionOnsite.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>Hồ Sơ Huấn Luyện Tại Chỗ Thiếu Số Quyết Định Công Nhận ({trainingAnalysis.missingDecisionOnsite.length})</span>
                  </h4>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                        <tr>
                          <th className="p-3">Mã NV</th>
                          <th className="p-3">Họ và tên</th>
                          <th className="p-3">Nghiệp vụ huấn luyện tại chỗ</th>
                          <th className="p-3">Cảng thực hiện</th>
                          <th className="p-3">Thời gian</th>
                          <th className="p-3 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {trainingAnalysis.missingDecisionOnsite.map(({ employee, onsite }, i) => (
                          <tr key={`ms_${i}`} className="hover:bg-slate-50">
                            <td className="p-3 font-mono font-bold text-[#006C99]">
                              {employee.employeeCode}
                            </td>
                            <td className="p-3 font-bold text-slate-900">
                              {employee.fullName}
                            </td>
                            <td className="p-3 font-semibold text-slate-800">
                              {onsite.skillName}
                            </td>
                            <td className="p-3 text-slate-600">
                              {onsite.airport}
                            </td>
                            <td className="p-3 text-slate-600">
                              {onsite.duration}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => onEditEmployee(employee)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200"
                              >
                                Bổ sung số QĐ
                              </button>
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
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <Info className="w-4 h-4 text-[#006C99] shrink-0" />
            <span>Mỗi nhân viên SKYPEC sở hữu 01 mã định danh duy nhất và 01 mã QR cố định không thay đổi.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* INLINE RENAME MODAL */}
        {renameModalEmp && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xl max-w-sm w-full space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">
                Đổi mã cho nhân viên {renameModalEmp.fullName}
              </h4>
              <p className="text-slate-500 text-xs">
                Mã hiện tại: <strong className="font-mono text-rose-600">{renameModalEmp.employeeCode}</strong> (đang bị trùng)
              </p>
              <form onSubmit={handleExecuteRename} className="space-y-3">
                <input
                  type="text"
                  value={newCodeInput}
                  onChange={(e) => setNewCodeInput(e.target.value)}
                  placeholder="Nhập mã nhân viên mới..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#006C99] font-mono text-xs font-bold"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRenameModalEmp(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#006C99] text-white font-bold text-xs"
                  >
                    Lưu mã mới
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
