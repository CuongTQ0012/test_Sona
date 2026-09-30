import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { History, Search, ShieldCheck, User, Calendar, ArrowRight } from 'lucide-react';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredLogs = logs.filter(
    (l) =>
      searchTerm === '' ||
      l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.fieldChanged.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.oldValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.newValue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Nhật Ký Thay Đổi Hồ Sơ & Kiểm Toán (Audit Logs)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận toàn bộ biến động dữ liệu nhân viên, đảm bảo tính toàn vẹn và nguyên tắc QR Code cố định.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm nhật ký theo tên, trường..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#006C99]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 w-36">Thời Gian</th>
                <th className="p-3.5 w-48">Người Thực Hiện</th>
                <th className="p-3.5 w-48">Hồ Sơ Nhân Viên</th>
                <th className="p-3.5">Trường Dữ Liệu Thay Đổi</th>
                <th className="p-3.5">Giá Trị Cũ</th>
                <th className="p-3.5">Giá Trị Mới</th>
                <th className="p-3.5">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">
                    {log.userName}
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-[#006C99]">{log.employeeName}</span>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900">
                    {log.fieldChanged}
                  </td>
                  <td className="p-3.5 text-rose-700 bg-rose-50/40 rounded max-w-xs truncate">
                    {log.oldValue}
                  </td>
                  <td className="p-3.5 text-emerald-800 bg-emerald-50/40 rounded max-w-xs truncate font-medium">
                    {log.newValue}
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px] italic">
                    {log.note || '—'}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Không có nhật ký nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
