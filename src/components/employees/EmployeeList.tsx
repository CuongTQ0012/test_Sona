import React, { useState, useMemo } from 'react';
import { Employee, SystemSettings } from '../../types';
import { storageService } from '../../services/storageService';
import {
  generateQrDataUrl,
  downloadQrPng,
  downloadQrSvg,
  getPublicUrlForToken,
} from '../../services/qrService';
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Printer,
  FileText,
  Eye,
  Edit,
  Trash2,
  QrCode,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  RotateCw,
  AlertTriangle,
  CheckSquare,
  GraduationCap,
} from 'lucide-react';
import { getEmployeeStatusInfo, formatDateVN } from '../../utils/helpers';
import { downloadSkypecExcelTemplate } from '../../utils/excelTemplate';
import { PETCardModal } from '../profile/PETCardModal';
import { EmployeeAuditDuplicateModal } from './EmployeeAuditDuplicateModal';

interface EmployeeListProps {
  employees: Employee[];
  settings: SystemSettings;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (emp: Employee) => void;
  onDeleteBatch?: (ids: string[]) => void;
  onDeleteAll?: () => void;
  onAddEmployee: () => void;
  onOpenPdfView: (emp: Employee) => void;
  onOpenPublicScanView: (token: string) => void;
  onOpenImportModal: () => void;
  onOpenTestRunner: () => void;
  onEmployeeSaved?: (saved: Employee) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  settings,
  onEditEmployee,
  onDeleteEmployee,
  onDeleteBatch,
  onDeleteAll,
  onAddEmployee,
  onOpenPdfView,
  onOpenPublicScanView,
  onOpenImportModal,
  onOpenTestRunner,
  onEmployeeSaved,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterJobTitle, setFilterJobTitle] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAirport, setFilterAirport] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [deleteModalEmp, setDeleteModalEmp] = useState<Employee | null>(null);
  const pageSize = 8;

  // Selected employee IDs for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states for batch delete & delete all
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState<boolean>(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);
  const [deleteAllConfirmInput, setDeleteAllConfirmInput] = useState<string>('');

  // Selected employee for PET Card Modal
  const [petCardEmp, setPetCardEmp] = useState<Employee | null>(null);

  // Selected QR Preview Popover
  const [activeQrModal, setActiveQrModal] = useState<{
    emp: Employee;
    qrUrl: string;
  } | null>(null);

  // Modal state for Audit Duplicate & Training Records
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [auditTargetCode, setAuditTargetCode] = useState<string>('');

  // Map of duplicate employee codes for real-time badges
  const duplicateCodesMap = useMemo(() => {
    const codeCounts = new Map<string, number>();
    employees.forEach((e) => {
      const code = e.employeeCode.trim().toUpperCase();
      if (code) {
        codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
      }
    });

    const duplicates = new Set<string>();
    codeCounts.forEach((count, code) => {
      if (count > 1) duplicates.add(code);
    });
    return duplicates;
  }, [employees]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        searchTerm === '' ||
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.aviationJobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.publicToken.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.regularAirport.toLowerCase().includes(searchTerm.toLowerCase());

      const matchJob = filterJobTitle === 'all' || emp.aviationJobTitle === filterJobTitle;
      const matchStatus = filterStatus === 'all' || emp.status === filterStatus;
      const matchAirport = filterAirport === 'all' || emp.regularAirport.includes(filterAirport);

      return matchSearch && matchJob && matchStatus && matchAirport;
    });
  }, [employees, searchTerm, filterJobTitle, filterStatus, filterAirport]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Selected Employees Objects List
  const selectedEmployeesList = useMemo(() => {
    return employees.filter((e) => selectedIds.has(e.id));
  }, [employees, selectedIds]);

  const isAllPageSelected =
    paginatedEmployees.length > 0 && paginatedEmployees.every((e) => selectedIds.has(e.id));
  const isSomePageSelected = paginatedEmployees.some((e) => selectedIds.has(e.id));

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        paginatedEmployees.forEach((e) => next.delete(e.id));
      } else {
        paginatedEmployees.forEach((e) => next.add(e.id));
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(new Set(filteredEmployees.map((e) => e.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleConfirmBatchDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (onDeleteBatch) {
      onDeleteBatch(ids);
    } else {
      storageService.deleteEmployeesBatch(ids, 'Quản trị viên');
    }

    setSelectedIds(new Set());
    setShowBatchDeleteModal(false);
  };

  const handleConfirmDeleteAll = () => {
    if (deleteAllConfirmInput.trim().toUpperCase() !== 'XÓA TẤT CẢ') {
      return;
    }

    if (onDeleteAll) {
      onDeleteAll();
    } else {
      storageService.deleteAllEmployees('Quản trị viên');
    }

    setSelectedIds(new Set());
    setShowDeleteAllModal(false);
    setDeleteAllConfirmInput('');
  };

  // Unique lists for filters
  const uniqueJobTitles = Array.from(new Set(employees.map((e) => e.aviationJobTitle)));
  const uniqueAirports = Array.from(new Set(employees.map((e) => e.regularAirport)));

  const handleOpenQrPreview = async (emp: Employee) => {
    const publicUrl = getPublicUrlForToken(emp.publicToken);
    const qrUrl = await generateQrDataUrl(publicUrl, { width: 320 });
    setActiveQrModal({ emp, qrUrl });
  };

  const handleRegenerateToken = (emp: Employee) => {
    const confirmed = window.confirm(
      `CẢNH BÁO AN TOÀN:\nBạn có chắc chắn muốn THU HỒI VÀ CẤP LẠI MÃ QR cho nhân viên ${emp.fullName} (${emp.employeeCode})?\n\nSau khi cấp lại, mã QR cũ trên thẻ PET sẽ KHÔNG CÒN HOẠT ĐỘNG và bắt buộc phải in lại thẻ PET mới!`
    );
    if (confirmed) {
      storageService.regenerateTokenExplicit(emp.id, 'Quản trị viên');
      alert(`Đã cấp lại mã QR mới cho nhân viên ${emp.fullName}.`);
    }
  };

  const handleDeleteEmployee = (emp: Employee) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa hồ sơ của nhân viên ${emp.fullName} (${emp.employeeCode})?\nHành động này không thể hoàn tác.`
    );
    if (confirmed) {
      storageService.deleteEmployee(emp.id, 'Quản trị viên');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1
            className="text-xl font-black tracking-tight"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              backgroundColor: '#ffffff',
              borderStyle: 'none',
              color: '#1575b0',
              borderColor: '#202f57',
            }}
          >
            Quản Lý Hồ Sơ Nhân Viên Hàng Không
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng cộng: <strong className="text-[#006C99]">{employees.length}</strong> hồ sơ người lao động • Mỗi nhân viên 01 mã QR cố định
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Kiểm Tra Thông Tin Học & Trùng Mã NV */}
          <button
            type="button"
            onClick={() => {
              setAuditTargetCode('');
              setShowAuditModal(true);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer ${
              duplicateCodesMap.size > 0
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-400 animate-pulse'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
            }`}
            title="Kiểm tra kỹ thông tin học, rà soát trùng mã nhân viên hoặc double hồ sơ"
          >
            <ShieldAlert className={`w-4 h-4 ${duplicateCodesMap.size > 0 ? 'text-rose-600' : 'text-indigo-600'}`} />
            <span>Check Học & Trùng Mã NV</span>
            {duplicateCodesMap.size > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
                {duplicateCodesMap.size} mã trùng
              </span>
            )}
          </button>

          <button
            onClick={onOpenTestRunner}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Chạy bài kiểm tra bắt buộc 7 bước của hệ thống"
          >
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Test 7 Bước (Mục III)</span>
          </button>

          <button
            type="button"
            onClick={downloadSkypecExcelTemplate}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-slate-800 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Tải biểu mẫu Excel chuẩn 15 cột quy định của SKYPEC"
          >
            <Download className="w-4 h-4 text-[#006C99]" />
            <span>Tải Biểu Mẫu Excel (.xlsx)</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Tải file Excel đã điền dữ liệu để nhập hàng loạt"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>Nhập Hồ Sơ Bằng Excel</span>
          </button>

          <button
            onClick={onAddEmployee}
            className="px-4 py-2 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-[#006C99]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Hồ Sơ (Biểu Mẫu)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeleteAllConfirmInput('');
              setShowDeleteAllModal(true);
            }}
            disabled={employees.length === 0}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed text-rose-800 border border-rose-300 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Xóa vĩnh viễn toàn bộ hồ sơ nhân viên trong hệ thống"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Xóa Tất Cả ({employees.length})</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo Tên, Mã NV, Token, Đơn vị..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#006C99] font-medium"
          />
        </div>

        {/* Filter Job Title */}
        <div>
          <select
            value={filterJobTitle}
            onChange={(e) => {
              setFilterJobTitle(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="all">Tất cả chức danh hàng không</option>
            {uniqueJobTitles.map((job) => (
              <option key={job} value={job}>
                {job}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Airport */}
        <div>
          <select
            value={filterAirport}
            onChange={(e) => {
              setFilterAirport(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="all">Tất cả cảng hàng không</option>
            <option value="HAN">Cảng HKQT Nội Bài (HAN)</option>
            <option value="SGN">Cảng HKQT Tân Sơn Nhất (SGN)</option>
            <option value="DAD">Cảng HKQT Đà Nẵng (DAD)</option>
            <option value="CXR">Cảng HKQT Cam Ranh (CXR)</option>
            <option value="PQC">Cảng HKQT Phú Quốc (PQC)</option>
            <option value="HPH">Cảng HKQT Cát Bi (HPH)</option>
          </select>
        </div>

        {/* Filter Status */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
          >
            <option value="all">Tất cả trạng thái hồ sơ</option>
            <option value="active">Đang làm việc</option>
            <option value="suspended">Tạm hoãn</option>
            <option value="resigned">Đã thôi việc</option>
            <option value="locked">Hồ sơ khóa</option>
          </select>
        </div>
      </div>

      {/* Selection Action Bar (Appears when 1+ employees are selected) */}
      {selectedIds.size > 0 && (
        <div className="bg-[#006C99] text-white px-5 py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-[#005377] animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-[#EECD2B] shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-2">
                <span>Đã tích chọn</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-[#006C99] font-black text-xs shadow-2xs">
                  {selectedIds.size}
                </span>
                <span>/ {employees.length} nhân viên</span>
              </div>
              <div className="text-[11px] text-blue-100 mt-0.5">
                {selectedIds.size < filteredEmployees.length ? (
                  <span>
                    (Đang chọn trên trang này.{' '}
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="underline hover:text-white font-bold cursor-pointer"
                    >
                      Bấm để chọn toàn bộ {filteredEmployees.length} kết quả lọc
                    </button>
                    )
                  </span>
                ) : (
                  <span>Đã chọn toàn bộ {filteredEmployees.length} nhân viên theo bộ lọc hiện tại</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>

            <button
              type="button"
              onClick={() => setShowBatchDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa {selectedIds.size} nhân viên đã chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table (100% responsive, perfectly balanced columns, no horizontal scrollbar) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="w-full">
          <table className="w-full table-fixed text-left border-collapse text-xs">
            <colgroup>
              <col style={{ width: '40px' }} />
              <col style={{ width: '42px' }} />
              <col style={{ width: '23%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '21%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '56px' }} />
              <col style={{ width: '78px' }} />
            </colgroup>
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
              <tr>
                <th className="py-3.5 pl-3.5 pr-1 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = isSomePageSelected && !isAllPageSelected;
                      }
                    }}
                    onChange={handleToggleSelectAllPage}
                    className="w-4 h-4 rounded border-slate-300 text-[#006C99] focus:ring-[#006C99] cursor-pointer"
                    title={isAllPageSelected ? "Bỏ chọn tất cả trang này" : "Tích chọn tất cả trên trang này"}
                  />
                </th>
                <th className="py-3.5 px-1 text-center">STT</th>
                <th className="py-3.5 px-3">Nhân Viên & Mã NV</th>
                <th className="py-3.5 px-3">Chức Danh Chuyên Môn</th>
                <th className="py-3.5 px-3">Phòng / Ban / Đội</th>
                <th className="py-3.5 px-3">Cảng Làm Việc</th>
                <th className="py-3.5 px-2 text-center">Trạng Thái</th>
                <th className="py-3.5 px-1 text-center">Mã QR</th>
                <th className="py-3.5 px-1 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEmployees.map((emp, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                const status = getEmployeeStatusInfo(emp.status);
                const isSelected = selectedIds.has(emp.id);

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 hover:bg-blue-100/60 font-medium'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 pl-3.5 pr-1 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(emp.id)}
                        className="w-4 h-4 rounded border-slate-300 text-[#006C99] focus:ring-[#006C99] cursor-pointer"
                        title={`Tích chọn ${emp.fullName}`}
                      />
                    </td>

                    {/* STT */}
                    <td className="py-3 px-1 text-center font-bold text-slate-400 font-mono">
                      {globalIndex}
                    </td>

                    {/* Employee Profile (Avatar + Name + Code + Token) */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 font-bold">
                              3x4
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 text-xs truncate leading-snug" title={emp.fullName}>
                            {emp.fullName}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] font-bold text-[#006C99]">
                              {emp.employeeCode}
                            </span>
                            {duplicateCodesMap.has(emp.employeeCode.trim().toUpperCase()) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAuditTargetCode(emp.employeeCode);
                                  setShowAuditModal(true);
                                }}
                                className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-300 hover:bg-rose-200 transition-colors cursor-pointer"
                                title="Mã này đang bị trùng trong hệ thống! Bấm để kiểm tra & hợp nhất"
                              >
                                Trùng mã
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate" title={`Token: ${emp.publicToken}`}>
                            #{emp.publicToken}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Job Title & Position */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 leading-snug line-clamp-2" title={emp.aviationJobTitle}>
                        {emp.aviationJobTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={`Chức vụ: ${emp.position}`}>
                        {emp.position}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3 px-3">
                      <div className="text-slate-600 line-clamp-2 leading-relaxed" title={emp.department}>
                        {emp.department}
                      </div>
                    </td>

                    {/* Regular Airport */}
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-700 block truncate" title={emp.regularAirport}>
                        {emp.regularAirport}
                      </span>
                      {emp.deployedAirports.length > 0 && (
                        <span className="inline-block text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1">
                          +{emp.deployedAirports.length} cảng tăng cường
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.colorClass} shadow-2xs`}
                      >
                        {status.label}
                      </span>
                    </td>

                    {/* QR Code thumbnail & quick view */}
                    <td className="py-3 px-1 text-center">
                      <button
                        onClick={() => handleOpenQrPreview(emp)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:border-[#006C99] hover:bg-blue-50/50 bg-white shadow-2xs transition-all inline-flex items-center justify-center text-[#006C99] group cursor-pointer"
                        title="Bấm để xem và tải mã QR cố định"
                      >
                        <QrCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                    </td>

                    {/* Actions (2 rows: top & bottom) */}
                    <td className="py-2 px-1 text-center">
                      <div className="grid grid-cols-2 gap-1 w-fit mx-auto">
                        {/* Hàng 1: Sửa & In A4 */}
                        <button
                          onClick={() => onEditEmployee(emp)}
                          className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                          title={`Chỉnh sửa hồ sơ ${emp.fullName}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenPdfView(emp)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer border border-slate-200 shadow-2xs flex items-center justify-center"
                          title="Xem & Xuất Lý Lịch Chuẩn A4 (PDF)"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#006C99]" />
                        </button>

                        {/* Hàng 2: Xem trang số hóa QR & Xóa */}
                        <button
                          onClick={() => onOpenPublicScanView(emp.publicToken)}
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#006C99] font-bold transition-colors cursor-pointer border border-blue-200 shadow-2xs flex items-center justify-center"
                          title="Xem giao diện quét mã QR số hóa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteModalEmp(emp)}
                          className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
                          title={`Xóa hồ sơ ${emp.fullName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedEmployees.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    Không tìm thấy nhân viên nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Hiển thị <strong>{paginatedEmployees.length}</strong> trên{' '}
            <strong>{filteredEmployees.length}</strong> hồ sơ
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-700">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Quick Modal */}
      {activeQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Mã QR Thẻ PET Cố Định
              </h3>
              <button
                onClick={() => setActiveQrModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="w-52 h-52 mx-auto bg-white p-2 rounded-2xl border-2 border-[#006C99] shadow-sm flex items-center justify-center">
              <img
                src={activeQrModal.qrUrl}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <div className="font-bold text-base uppercase text-slate-900">
                {activeQrModal.emp.fullName}
              </div>
              <div className="text-xs font-semibold text-[#006C99] mt-0.5">
                {activeQrModal.emp.aviationJobTitle}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-1">
                Token: <strong className="text-slate-800">{activeQrModal.emp.publicToken}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() =>
                  downloadQrPng(
                    activeQrModal.qrUrl,
                    `QR_${activeQrModal.emp.employeeCode}_${activeQrModal.emp.publicToken}`
                  )
                }
                className="py-2 px-3 bg-[#006C99] hover:bg-[#005377] text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Tải PNG
              </button>
              <button
                onClick={() => {
                  const emp = activeQrModal.emp;
                  setActiveQrModal(null);
                  setPetCardEmp(emp);
                }}
                className="py-2 px-3 bg-[#EECD2B] hover:bg-[#deb81f] text-slate-900 text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Thẻ PET
              </button>
            </div>

            <button
              onClick={() => {
                const token = activeQrModal.emp.publicToken;
                setActiveQrModal(null);
                onOpenPublicScanView(token);
              }}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-200" />
              <span>Mở Hồ Sơ Di Động (Xem Thử Quét QR)</span>
            </button>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <button
                onClick={() => {
                  const emp = activeQrModal.emp;
                  setActiveQrModal(null);
                  handleRegenerateToken(emp);
                }}
                className="text-rose-600 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                title="Chỉ dùng khi thẻ PET bị mất hoặc cần thu hồi mã cũ"
              >
                <RotateCw className="w-3 h-3" /> Thu hồi / Cấp lại QR
              </button>
              <span className="text-slate-400 font-mono text-[10px]">
                {activeQrModal.emp.employeeCode}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PET Card Modal */}
      {petCardEmp && (
        <PETCardModal
          isOpen={true}
          onClose={() => setPetCardEmp(null)}
          employee={petCardEmp}
          onOpenPublicScanView={onOpenPublicScanView}
        />
      )}

      {/* Delete Employee Confirmation Modal */}
      {deleteModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xác Nhận Xóa Hồ Sơ Nhân Viên
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ của nhân viên này khỏi hệ thống?
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs space-y-1.5">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200 mb-2">
                <div className="w-10 h-13 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                  {deleteModalEmp.avatarUrl ? (
                    <img src={deleteModalEmp.avatarUrl} alt={deleteModalEmp.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">3x4</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 uppercase truncate">{deleteModalEmp.fullName}</div>
                  <div className="text-[11px] font-mono text-[#006C99] font-bold">{deleteModalEmp.employeeCode}</div>
                  <div className="text-[11px] text-slate-600 truncate">{deleteModalEmp.aviationJobTitle}</div>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Đơn vị quản lý:</span>
                <span className="font-medium text-slate-800 text-right truncate ml-2">{deleteModalEmp.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã QR Token:</span>
                <span className="font-mono font-bold text-slate-700">{deleteModalEmp.publicToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số lượng chứng chỉ:</span>
                <span className="font-bold text-slate-900">{deleteModalEmp.trainingRecords.length} chứng nhận</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] text-left">
              <strong>Lưu ý quan trọng:</strong> Mã QR cố định in trên thẻ PET của nhân viên này sẽ lập tức mất hiệu lực tra cứu.
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalEmp(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  const emp = deleteModalEmp;
                  setDeleteModalEmp(null);
                  setSelectedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(emp.id);
                    return next;
                  });
                  onDeleteEmployee(emp);
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

      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteModal && selectedEmployeesList.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">
                Xác Nhận Xóa {selectedEmployeesList.length} Hồ Sơ Đã Chọn
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa vĩnh viễn các nhân viên sau khỏi hệ thống?
              </p>
            </div>

            {/* List preview of selected employees */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-xl p-2 text-left text-xs">
              {selectedEmployeesList.map((emp) => (
                <div key={emp.id} className="py-2 px-1 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-9 rounded bg-slate-200 overflow-hidden shrink-0">
                      {emp.avatarUrl ? (
                        <img src={emp.avatarUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[7px] text-slate-400">3x4</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{emp.fullName}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {emp.employeeCode} • {emp.aviationJobTitle}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    Token: {emp.publicToken}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] text-left">
              <strong>Lưu ý an toàn:</strong> Toàn bộ mã QR cố định in trên thẻ PET của {selectedEmployeesList.length} nhân viên này sẽ lập tức mất hiệu lực tra cứu. Hành động này không thể hoàn tác.
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors text-xs inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa {selectedEmployeesList.length} Người</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Employees Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-rose-300 max-w-md w-full p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border-4 border-rose-50 animate-pulse">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>

            <div>
              <h3 className="font-black text-base text-rose-900 uppercase tracking-tight">
                Cảnh Báo: Xóa Toàn Bộ {employees.length} Hồ Sơ Nhân Viên
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Thao tác này sẽ <strong className="text-rose-600">xóa sạch toàn bộ {employees.length} nhân sự</strong> và tất cả dữ liệu chứng chỉ trong hệ thống. Tất cả mã QR đã in trên thẻ PET sẽ bị vô hiệu hóa vĩnh viễn!
              </p>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs text-left space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Xác nhận bảo mật an toàn:</span>
              </div>
              <div className="text-slate-600">
                Để tránh thao tác nhầm lẫn, vui lòng nhập chính xác cụm từ sau vào ô bên dưới:
              </div>
              <div className="p-2 bg-white rounded-lg border border-rose-300 font-mono font-black text-center text-rose-700 tracking-wider select-all text-sm">
                XÓA TẤT CẢ
              </div>
            </div>

            <div>
              <input
                type="text"
                value={deleteAllConfirmInput}
                onChange={(e) => setDeleteAllConfirmInput(e.target.value)}
                placeholder="Nhập XÓA TẤT CẢ vào đây để mở khóa..."
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-rose-300 text-xs text-center font-bold tracking-wider focus:outline-hidden focus:border-rose-600 uppercase placeholder:normal-case placeholder:font-normal"
                autoFocus
              />
            </div>

            <div className="text-[11px] text-slate-500 italic text-left">
              * Ghi chú: Sau khi xóa sạch, bạn có thể tải lại danh sách nhân viên từ tệp Excel chuẩn hoặc khôi phục dữ liệu ban đầu.
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAllModal(false);
                  setDeleteAllConfirmInput('');
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
              >
                Hủy bỏ (Giữ lại)
              </button>
              <button
                type="button"
                disabled={deleteAllConfirmInput.trim().toUpperCase() !== 'XÓA TẤT CẢ'}
                onClick={handleConfirmDeleteAll}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-colors text-xs inline-flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác Nhận Xóa Hết</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KIỂM TRA THÔNG TIN HỌC & RÀ SOÁT TRÙNG LẶP */}
      {showAuditModal && (
        <EmployeeAuditDuplicateModal
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
          onOpenEmployeeDetail={onOpenPdfView}
          onEditEmployee={onEditEmployee}
          initialEmployeeCode={auditTargetCode}
        />
      )}
    </div>
  );
};
