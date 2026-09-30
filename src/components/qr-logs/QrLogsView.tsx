import React, { useState } from 'react';
import { QrAccessLog } from '../../types';
import { QrCode, Search, Smartphone, Monitor, Globe, Clock } from 'lucide-react';

interface QrLogsViewProps {
  logs: QrAccessLog[];
}

export const QrLogsView: React.FC<QrLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredLogs = logs.filter(
    (l) =>
      searchTerm === '' ||
      l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.publicToken.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.browser.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Nhật Ký Quét QR Code Thẻ PET (Access Logs)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận lịch sử kiểm tra, đối soát qua camera di động tại các cổng an ninh và trạm tra nạp sân bay.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Token, Nhân viên, Thiết bị..."
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
                <th className="p-3.5 w-36">Thời Gian Quét</th>
                <th className="p-3.5 w-40">Mã Token Cố Định</th>
                <th className="p-3.5">Hồ Sơ Nhân Viên Được Truy Cập</th>
                <th className="p-3.5">Loại Thiết Bị Quét</th>
                <th className="p-3.5">Trình Duyệt / Ứng Dụng</th>
                <th className="p-3.5">Địa Điểm / IP Truy Cập</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-[#006C99]">
                    {log.publicToken}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">
                    {log.employeeName}
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {log.deviceType.includes('Mobile') ? (
                        <Smartphone className="w-3.5 h-3.5 text-[#006C99]" />
                      ) : (
                        <Monitor className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      {log.deviceType}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 truncate max-w-xs font-mono text-[11px]">
                    {log.browser}
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px]">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Chưa có lượt quét QR nào.
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
