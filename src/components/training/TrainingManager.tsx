import React, { useState, useMemo } from 'react';
import { Employee, SystemSettings, TrainingRecord } from '../../types';
import { getCertificateStatus, formatDateVN } from '../../utils/helpers';
import { storageService } from '../../services/storageService';
import {
  Award,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  Building,
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  Check,
  User,
  ShieldCheck,
} from 'lucide-react';

interface TrainingManagerProps {
  employees: Employee[];
  settings: SystemSettings;
  onOpenEmployee: (emp: Employee) => void;
  onCertificatesChanged?: () => void;
}

interface FlattenedCert {
  employee: Employee;
  record: TrainingRecord;
  statusInfo: ReturnType<typeof getCertificateStatus>;
}

export const TrainingManager: React.FC<TrainingManagerProps> = ({
  employees,
  settings,
  onOpenEmployee,
  onCertificatesChanged,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Batch selection state: Set of "employeeId:::certId"
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState<boolean>(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState<boolean>(false);

  // Modal states for Adding / Editing Certificate
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingCert, setEditingCert] = useState<{
    employeeId: string;
    record: TrainingRecord;
  } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    employeeId: string;
    employeeName: string;
    certId: string;
    certName: string;
  } | null>(null);

  // Form state for new / edit cert
  const [certFormData, setCertFormData] = useState<{
    employeeId: string;
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
    employeeId: '',
    certificateName: '',
    certificateNumber: '',
    trainingFacility: 'Học viện Hàng không Việt Nam (VAA)',
    trainingContent: 'An toàn hàng không & Quy tắc khai thác khu bay',
    trainingFormat: 'Tập trung chính quy',
    startDate: '',
    endDate: '',
    issueDate: '',
    expiryDate: '',
  });

  // Flatten all training records
  const allCerts: FlattenedCert[] = useMemo(() => {
    const list: FlattenedCert[] = [];
    employees.forEach((emp) => {
      (emp.trainingRecords || []).forEach((tr) => {
        const statusInfo = getCertificateStatus(tr.expiryDate, settings.warningDays);
        list.push({
          employee: emp,
          record: tr,
          statusInfo,
        });
      });
    });
    return list;
  }, [employees, settings.warningDays]);

  // Filter
  const filteredCerts = useMemo(() => {
    return allCerts.filter(({ employee, record, statusInfo }) => {
      const matchSearch =
        searchTerm === '' ||
        record.certificateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.trainingFacility.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.trainingContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.certificateNumber && record.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filterStatus === 'all' || statusInfo.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [allCerts, searchTerm, filterStatus]);

  const counts = useMemo(() => {
    return {
      all: allCerts.length,
      valid: allCerts.filter((c) => c.statusInfo.status === 'valid').length,
      expiring: allCerts.filter((c) => c.statusInfo.status === 'expiring').length,
      expired: allCerts.filter((c) => c.statusInfo.status === 'expired').length,
    };
  }, [allCerts]);

  // Open add modal
  const handleOpenAdd = () => {
    const defaultEmpId = employees[0]?.id || '';
    setCertFormData({
      employeeId: defaultEmpId,
      certificateName: '',
      certificateNumber: '',
      trainingFacility: 'Học viện Hàng không Việt Nam (VAA)',
      trainingContent: 'Nghiệp vụ tra nạp và an toàn khu bay',
      trainingFormat: 'Định kỳ',
      startDate: '01/01/2026',
      endDate: '15/01/2026',
      issueDate: '20/01/2026',
      expiryDate: '20/01/2028',
      certificateFileName: undefined,
      certificateFileUrl: undefined,
    });
    setShowAddModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (employeeId: string, record: TrainingRecord) => {
    setEditingCert({ employeeId, record });
    setCertFormData({
      employeeId,
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

  // Save new certificate
  const handleSaveAdd = () => {
    if (!certFormData.employeeId || !certFormData.certificateName.trim()) {
      return;
    }
    const newCert: TrainingRecord = {
      id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order: 1,
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

    storageService.addCertificate(certFormData.employeeId, newCert);
    setShowAddModal(false);
    onCertificatesChanged?.();
  };

  // Save edit certificate
  const handleSaveEdit = () => {
    if (!editingCert || !certFormData.certificateName.trim()) return;

    const updatedCert: TrainingRecord = {
      ...editingCert.record,
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

    storageService.updateCertificate(editingCert.employeeId, updatedCert);
    setEditingCert(null);
    onCertificatesChanged?.();
  };

  // Confirm single delete
  const handleExecuteDelete = () => {
    if (!deleteConfirm) return;
    storageService.deleteCertificate(deleteConfirm.employeeId, deleteConfirm.certId);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.delete(`${deleteConfirm.employeeId}:::${deleteConfirm.certId}`);
      return next;
    });
    setDeleteConfirm(null);
    onCertificatesChanged?.();
  };

  // Confirm batch delete
  const handleExecuteBatchDelete = () => {
    const items = Array.from(selectedKeys).map((k) => {
      const [employeeId, certId] = k.split(':::');
      return { employeeId, certId };
    });
    storageService.deleteCertificatesBatch(items);
    setSelectedKeys(new Set());
    setShowBatchDeleteConfirm(false);
    onCertificatesChanged?.();
  };

  // Confirm delete all
  const handleExecuteDeleteAll = () => {
    storageService.deleteAllCertificates();
    setSelectedKeys(new Set());
    setShowDeleteAllConfirm(false);
    onCertificatesChanged?.();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Quản Lý Đào Tạo & Chứng Chỉ Nhân Viên
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Điều chỉnh, thêm mới, tích chọn xóa hàng loạt hoặc xóa tất cả chứng chỉ • Ngưỡng cảnh báo: <strong>{settings.warningDays} ngày</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {allCerts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDeleteAllConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
              title="Xóa toàn bộ chứng chỉ của tất cả nhân viên"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Xóa Tất Cả ({allCerts.length})</span>
            </button>
          )}

          {/* Add Certificate Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#EECD2B]" />
            <span>Thêm Chứng Chỉ Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-blue-50/70 border-[#006C99] ring-2 ring-[#006C99]/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng chứng chỉ
            </span>
            <Award className="w-4 h-4 text-[#006C99]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{counts.all}</div>
          <div className="text-[10px] text-slate-400 mt-1">Toàn bộ hồ sơ</div>
        </div>

        <div
          onClick={() => setFilterStatus('valid')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'valid'
              ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Còn hiệu lực
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{counts.valid}</div>
          <div className="text-[10px] text-slate-400 mt-1">Đủ điều kiện làm việc</div>
        </div>

        <div
          onClick={() => setFilterStatus('expiring')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'expiring'
              ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Sắp hết hạn
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{counts.expiring}</div>
          <div className="text-[10px] text-slate-400 mt-1">Cần lên lịch huấn luyện lại</div>
        </div>

        <div
          onClick={() => setFilterStatus('expired')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'expired'
              ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Đã hết hạn
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{counts.expired}</div>
          <div className="text-[10px] text-slate-400 mt-1">Cảnh báo nghiêm ngặt</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên chứng chỉ, nhân viên, số hiệu, đơn vị cấp..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#006C99]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium w-full sm:w-auto"
          >
            <option value="all">Tất cả trạng thái ({allCerts.length})</option>
            <option value="valid">Còn hiệu lực ({counts.valid})</option>
            <option value="expiring">Sắp hết hạn ({counts.expiring})</option>
            <option value="expired">Đã hết hạn ({counts.expired})</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar when items selected */}
      {selectedKeys.size > 0 && (
        <div className="bg-blue-50 border-2 border-[#006C99] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#006C99] text-white font-black text-xs flex items-center justify-center shadow-xs">
              {selectedKeys.size}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                Đang chọn <span className="text-[#006C99] font-black">{selectedKeys.size}</span> / {allCerts.length} chứng chỉ
              </div>
              <div className="text-[11px] text-slate-500">
                Bạn có thể chọn xóa các chứng chỉ đã tích chọn này hoặc bỏ chọn
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedKeys(new Set())}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
            >
              Bỏ chọn tất cả
            </button>
            <button
              type="button"
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa {selectedKeys.size} Chứng Chỉ Đã Chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả chứng chỉ"
                    checked={filteredCerts.length > 0 && filteredCerts.every((c) => selectedKeys.has(`${c.employee.id}:::${c.record.id}`))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const next = new Set(selectedKeys);
                        filteredCerts.forEach((c) => next.add(`${c.employee.id}:::${c.record.id}`));
                        setSelectedKeys(next);
                      } else {
                        const next = new Set(selectedKeys);
                        filteredCerts.forEach((c) => next.delete(`${c.employee.id}:::${c.record.id}`));
                        setSelectedKeys(next);
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-[#006C99] focus:ring-[#006C99] cursor-pointer"
                  />
                </th>
                <th className="p-3.5 w-12 text-center">STT</th>
                <th className="p-3.5">Chứng Chỉ / Nghiệp Vụ</th>
                <th className="p-3.5">Cán Bộ / Nhân Viên</th>
                <th className="p-3.5">Cơ Sở Đào Tạo</th>
                <th className="p-3.5 w-28">Ngày Cấp</th>
                <th className="p-3.5 w-28">Ngày Hết Hạn</th>
                <th className="p-3.5 w-32 text-center">Tình Trạng</th>
                <th className="p-3.5 w-44 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCerts.map(({ employee, record, statusInfo }, idx) => {
                const itemKey = `${employee.id}:::${record.id}`;
                const isSelected = selectedKeys.has(itemKey);
                return (
                  <tr
                    key={itemKey}
                    className={`transition-colors ${
                      isSelected ? 'bg-blue-50/60 hover:bg-blue-50/80' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          const next = new Set(selectedKeys);
                          if (next.has(itemKey)) {
                            next.delete(itemKey);
                          } else {
                            next.add(itemKey);
                          }
                          setSelectedKeys(next);
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-[#006C99] focus:ring-[#006C99] cursor-pointer"
                      />
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{record.certificateName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{record.trainingContent}</div>
                      {record.certificateNumber && (
                        <div className="text-[10px] font-mono text-[#006C99] mt-0.5 font-bold">
                          Số: {record.certificateNumber}
                        </div>
                      )}
                      {record.certificateFileUrl && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                          📎 Có tệp đính kèm ({record.certificateFileName || 'Tệp số hóa'})
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => onOpenEmployee(employee)}
                        className="text-left group cursor-pointer"
                      >
                        <div className="font-bold text-slate-900 group-hover:text-[#006C99] transition-colors">
                          {employee.fullName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {employee.employeeCode} • {employee.department.split('/')[0]}
                        </div>
                      </button>
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">
                      {record.trainingFacility}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {formatDateVN(record.issueDate)}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">
                      {formatDateVN(record.expiryDate)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Edit Certificate Button */}
                        <button
                          onClick={() => handleOpenEdit(employee.id, record)}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                          title="Điều chỉnh thông tin hoặc tệp chứng chỉ này"
                        >
                          <Edit className="w-3 h-3 text-emerald-700" />
                          <span>Sửa</span>
                        </button>

                        {/* Delete Certificate Button */}
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              employeeId: employee.id,
                              employeeName: employee.fullName,
                              certId: record.id,
                              certName: record.certificateName,
                            });
                          }}
                          className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                          title="Xóa chứng chỉ này khỏi hồ sơ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCerts.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Không có chứng chỉ nào phù hợp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Thêm / Sửa Chứng Chỉ Cho Từng Người */}
      {(showAddModal || editingCert) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-[#006C99] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/10 text-[#EECD2B]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {editingCert ? 'Điều Chỉnh Thông Tin Chứng Chỉ' : 'Thêm Chứng Chỉ Mới Cho Nhân Viên'}
                  </h3>
                  <p className="text-xs text-blue-100">
                    Hệ thống số hóa hồ sơ & chứng chỉ hàng không SKYPEC
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCert(null);
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Employee Selection (Only when adding) */}
              {!editingCert ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Chọn Nhân viên áp dụng chứng chỉ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={certFormData.employeeId}
                    onChange={(e) => setCertFormData({ ...certFormData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-800 bg-white"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeCode}) - {emp.department}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Nhân viên sở hữu:</span>
                  <span className="font-bold text-slate-900">
                    {employees.find((e) => e.id === editingCert.employeeId)?.fullName} (
                    {employees.find((e) => e.id === editingCert.employeeId)?.employeeCode})
                  </span>
                </div>
              )}

              {/* Certificate Name */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tên chứng chỉ / CCCM / Thẻ nghiệp vụ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={certFormData.certificateName}
                  onChange={(e) => setCertFormData({ ...certFormData, certificateName: e.target.value })}
                  placeholder="Ví dụ: Giấy phép điều khiển phương tiện khu bay / Thẻ nghiệp vụ tra nạp"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-hidden focus:border-[#006C99]"
                />
              </div>

              {/* Certificate Number & Facility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Số hiệu văn bằng / chứng nhận
                  </label>
                  <input
                    type="text"
                    value={certFormData.certificateNumber}
                    onChange={(e) => setCertFormData({ ...certFormData, certificateNumber: e.target.value })}
                    placeholder="CAAV-CCCM-2025-09"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Hình thức đào tạo
                  </label>
                  <input
                    type="text"
                    value={certFormData.trainingFormat}
                    onChange={(e) => setCertFormData({ ...certFormData, trainingFormat: e.target.value })}
                    placeholder="Tập trung / Định kỳ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Training Facility */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Cơ sở đào tạo / Đơn vị cấp chứng chỉ
                </label>
                <input
                  type="text"
                  value={certFormData.trainingFacility}
                  onChange={(e) => setCertFormData({ ...certFormData, trainingFacility: e.target.value })}
                  placeholder="Học viện Hàng không Việt Nam / Trung tâm Huấn luyện SKYPEC"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Training Content */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nội dung đào tạo
                </label>
                <input
                  type="text"
                  value={certFormData.trainingContent}
                  onChange={(e) => setCertFormData({ ...certFormData, trainingContent: e.target.value })}
                  placeholder="An toàn khai thác mặt đất, kỹ thuật xe tra nạp..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Ngày cấp (dd/mm/yyyy)
                  </label>
                  <input
                    type="text"
                    value={certFormData.issueDate}
                    onChange={(e) => setCertFormData({ ...certFormData, issueDate: e.target.value })}
                    placeholder="15/09/2025"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Ngày hết hạn (dd/mm/yyyy)
                  </label>
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
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block text-xs">
                  Tệp đính kèm chứng chỉ (Ảnh chụp / Bản scan PDF)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#006C99] hover:bg-[#005377] text-white font-bold text-xs cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{certFormData.certificateFileUrl ? 'Đổi tệp khác' : 'Chọn tệp ảnh/PDF từ thiết bị'}</span>
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
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-medium truncate max-w-[200px]">{certFormData.certificateFileName || 'Đã đính kèm tệp'}</span>
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

            {/* Modal Actions */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCert(null);
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 cursor-pointer text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={editingCert ? handleSaveEdit : handleSaveAdd}
                className="px-5 py-2 rounded-xl bg-[#006C99] hover:bg-[#005377] text-white font-bold cursor-pointer text-xs shadow-xs"
              >
                {editingCert ? 'Lưu Thay Đổi' : 'Xác Nhận Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Xác nhận xóa chứng chỉ đơn lẻ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">
                Xác Nhận Xóa Chứng Chỉ?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Bạn có chắc chắn muốn xóa chứng chỉ <strong className="text-rose-600 font-semibold">{deleteConfirm.certName}</strong> của cán bộ nhân viên <strong>{deleteConfirm.employeeName}</strong>?
              </p>
              <p className="text-[11px] text-slate-400 mt-1 italic">
                Thao tác này sẽ cập nhật dữ liệu và ghi vào nhật ký thay đổi hệ thống.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Không, giữ lại
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Xác nhận xóa hàng loạt chứng chỉ đã chọn */}
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">
                Xác Nhận Xóa {selectedKeys.size} Chứng Chỉ Đã Chọn?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Bạn có chắc chắn muốn xóa vĩnh viễn <strong className="text-rose-600 font-bold">{selectedKeys.size} chứng chỉ</strong> đã tích chọn khỏi hồ sơ của các nhân viên tương ứng?
              </p>
              <p className="text-[11px] text-slate-400 mt-1 italic">
                Hành động này không thể hoàn tác sau khi thực hiện.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xác Nhận Xóa ({selectedKeys.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Xác nhận xóa tất cả chứng chỉ trong hệ thống */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">
                Cảnh Báo: Xóa Toàn Bộ Chứng Chỉ?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Bạn đang chuẩn bị xóa toàn bộ <strong className="text-rose-600 font-bold">{allCerts.length} chứng chỉ</strong> và hồ sơ đào tạo của tất cả nhân viên trong hệ thống.
              </p>
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[11px] p-2.5 rounded-xl mt-2 text-left">
                ⚠️ Thao tác này sẽ làm rỗng mục 14 (Đào tạo & chứng chỉ) của toàn bộ nhân viên. Vui lòng cân nhắc kỹ trước khi xác nhận!
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Hủy bỏ, quay lại
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Xóa Toàn Bộ Chứng Chỉ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
