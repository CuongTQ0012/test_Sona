import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Layers,
  Database,
  QrCode,
  FileText,
  Shield,
  Server,
  Code,
  CheckCircle2,
  Workflow,
} from 'lucide-react';

interface ArchitectureDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<ArchitectureDocsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeSection, setActiveSection] = useState<string>('part8');

  if (!isOpen) return null;

  const sections = [
    { id: 'part1', title: '1. Phân Tích Nghiệp Vụ & User Flow' },
    { id: 'part2', title: '2. Sơ Đồ Kiến Trúc Hệ Thống' },
    { id: 'part3', title: '3. Thiết Kế Cơ Sở Dữ Liệu Chuẩn' },
    { id: 'part7', title: '4. Đặc Tả Restful API' },
    { id: 'part8', title: '5. Cơ Chế QR Cố Định – Dữ Liệu Động' },
    { id: 'part9', title: '6. Cơ Chế Tạo PDF Lý Lịch Động' },
    { id: 'part10', title: '7. Kiến Trúc Bảo Mật & Phân Quyền' },
    { id: 'part12', title: '8. Hướng Dẫn Triển Khai Doanh Nghiệp' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#006C99] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-[#EECD2B]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Tài Liệu Phân Tích Nghiệp Vụ & Kiến Trúc Giải Pháp SKYPEC
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Đóng vai: Business Analyst • Senior UI/UX • Senior Full-stack Developer • Solution Architect
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content with Sidebar Tabs */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Nav */}
          <div className="w-64 bg-slate-50 border-r border-slate-200 p-3 space-y-1 overflow-y-auto text-xs shrink-0">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl font-medium transition-all ${
                  activeSection === sec.id
                    ? 'bg-[#006C99] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {sec.title}
              </button>
            ))}
          </div>

          {/* Right Content */}
          <div className="flex-1 p-6 overflow-y-auto text-slate-800 text-xs leading-relaxed space-y-6">
            {/* PART 1 */}
            {activeSection === 'part1' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#006C99] border-b pb-2">
                  PHẦN 1 – PHÂN TÍCH NGHIỆP VỤ & CÁC USER FLOW
                </h2>
                <p>
                  Hệ thống quản lý lý lịch nhân viên SKYPEC là phần mềm nghiệp vụ chuyên ngành hàng không, quản lý đội ngũ nhân sự vận hành phương tiện đặc chủng (xe tra nạp bồn 35.000L - 60.000L, xe truyền tiếp nhiên liệu Hydrant Dispenser) và thiết bị kho cảng tại các sân bay trọng yếu (Nội Bài, Tân Sơn Nhất, Đà Nẵng, Cam Ranh, Phú Quốc, v.v.).
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">3 Luồng Người Dùng Chính:</h3>
                  <div className="space-y-2">
                    <div className="font-semibold text-[#006C99]">1. Luồng Cán bộ Quản trị & Nghiệp vụ Đào tạo (Admin/Officer):</div>
                    <p className="ml-4 text-slate-600">
                      Tạo hồ sơ nhân viên → Nhập thông tin theo đúng 15 mục biểu mẫu → Hệ thống sinh 1 Public Token ngẫu nhiên duy nhất (e.g. <code>A7K9X2M8</code>) → Sinh QR code → Tải QR để in cố định lên thẻ nhựa PET đeo cổ. Khi nhân viên được đào tạo nâng bậc, chuyển cảng hoặc gia hạn chứng chỉ: Cán bộ vào Web App cập nhật dữ liệu → Lưu DB → QR code trên thẻ PET cũ vẫn giữ nguyên vẹn.
                    </p>

                    <div className="font-semibold text-[#006C99]">2. Luồng Kiểm tra Tại Khu Bay (Security / Inspector Scan Flow):</div>
                    <p className="ml-4 text-slate-600">
                      Thanh tra Cục Hàng không (CAAV), Cảng vụ hoặc Đội trưởng an ninh dùng camera điện thoại quét mã QR trên thẻ PET của nhân viên → Trình duyệt mở đường dẫn công khai bảo mật <code>https://hoso.skypec.vn/q/A7K9X2M8</code> → Backend kiểm tra Token, tải hồ sơ mới nhất → Hiển thị giao diện Mobile First với ảnh 3x4, chức danh hiện tại, chứng chỉ còn hiệu lực/sắp hết hạn và các quyết định công nhận huấn luyện.
                    </p>

                    <div className="font-semibold text-[#006C99]">3. Luồng Xuất Lý Lịch Chuẩn A4 (Dynamic PDF Generation Flow):</div>
                    <p className="ml-4 text-slate-600">
                      Tại bất kỳ thời điểm nào, người dùng bấm "Xuất Lý Lịch PDF" → Hệ thống tải dữ liệu thời gian thực, chèn vào đúng biểu mẫu 2 trang quy định ("LÝ LỊCH NHÂN VIÊN ĐIỀU KHIỂN PHƯƠNG TIỆN, VẬN HÀNH THIẾT BỊ TẠI SÂN BAY"), tự động ngắt trang A4 và xuất file in chính xác.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PART 2 */}
            {activeSection === 'part2' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#006C99] border-b pb-2">
                  PHẦN 2 – SƠ ĐỒ KIẾN TRÚC HỆ THỐNG
                </h2>
                <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto space-y-1">
                  <div>┌─────────────────────────────────────────────────────────────┐</div>
                  <div>│           MÃ QR CỐ ĐỊNH TRÊN THẺ PET NHÂN VIÊN             │</div>
                  <div>│   https://hoso.skypec.vn/q/A7K9X2M8 (Public Token Cố Định)   │</div>
                  <div>└──────────────────────────────┬──────────────────────────────┘</div>
                  <div>                               │ (Camera điện thoại quét QR)</div>
                  <div>                               ▼</div>
                  <div>┌─────────────────────────────────────────────────────────────┐</div>
                  <div>│             CỔNG TRA CỨU DI ĐỘNG (MOBILE FIRST VIEW)        │</div>
                  <div>│   - Xác thực Public Token                                   │</div>
                  <div>│   - Ghi nhận nhật ký quét (Device, UserAgent, IP, Time)     │</div>
                  <div>│   - Áp dụng chính sách bảo vệ CCCD (Masking 0010******42)   │</div>
                  <div>└──────────────────────────────┬──────────────────────────────┘</div>
                  <div>                               │</div>
                  <div>                               ▼</div>
                  <div>┌─────────────────────────────────────────────────────────────┐</div>
                  <div>│           BACKEND ENGINE & BUSINESS LOGIC SERVICES          │</div>
                  <div>│   - Storage & State Manager (Audit Logging, Dynamic Hash)   │</div>
                  <div>│   - Certificate Expiry Engine (Tự động tính 30/60/90 ngày) │</div>
                  <div>│   - Dynamic PDF Renderer (Map dữ liệu mới nhất vào Biểu Mẫu)│</div>
                  <div>└──────────────────────────────┬──────────────────────────────┘</div>
                  <div>                               │</div>
                  <div>                               ▼</div>
                  <div>┌─────────────────────────────────────────────────────────────┐</div>
                  <div>│            CƠ SỞ DỮ LIỆU & LƯU TRỮ TÀI LIỆU SỐ HÓA          │</div>
                  <div>│   - PostgreSQL / Structured Schema                          │</div>
                  <div>│   - Chứng chỉ số hóa (PDF, JPG, PNG Quyết định hoàn thành)  │</div>
                  <div>└─────────────────────────────────────────────────────────────┘</div>
                </div>
              </div>
            )}

            {/* PART 8 */}
            {activeSection === 'part8' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#006C99] border-b pb-2">
                  PHẦN 8 – CƠ CHẾ QR CỐ ĐỊNH: VÌ SAO DỮ LIỆU ĐỔI MÀ QR KHÔNG ĐỔI?
                </h2>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                  <div className="font-bold text-amber-950 text-sm">
                    Nguyên lý Bất biến của QR Code:
                  </div>
                  <p className="text-amber-900 leading-relaxed">
                    Sai lầm phổ biến của các hệ sinh QR truyền thống là mã hóa trực tiếp thông tin cá nhân (Họ tên, CCCD, Chức danh, Khóa đào tạo) vào nội dung chuỗi của QR. Khi đó, chỉ cần đổi chức danh là chuỗi thay đổi, dẫn đến ma trận các điểm đen/trắng (modules) của QR bị thay đổi hoàn toàn, làm hỏng thẻ PET đã in.
                  </p>
                  <p className="text-amber-900 leading-relaxed font-semibold">
                    Giải pháp SKYPEC: Sử dụng kiến trúc "Tách rời Mã định danh (Token Indirection)":
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-amber-950 font-medium">
                    <li>QR Code CHỈ mã hóa một đường dẫn duy nhất: <code>https://hoso.skypec.vn/q/[PUBLIC_TOKEN]</code>.</li>
                    <li><code>PUBLIC_TOKEN</code> là chuỗi ngẫu nhiên tĩnh 8 ký tự (ví dụ: <code>A7K9X2M8</code>) sinh ra một lần duy nhất lúc tạo hồ sơ.</li>
                    <li>Mọi chỉnh sửa trong Admin (đổi chức danh sang "Nhân viên vận hành thiết bị", thêm khóa học, đổi ngày hết hạn, chuyển cảng công tác) chỉ cập nhật các trường nội dung trong Database mà <strong>tuyệt đối không bao giờ cập nhật Token</strong>.</li>
                    <li>Khi quét lại đúng thẻ PET cũ, URL không đổi → Token không đổi → Backend query Database lấy dữ liệu hiện tại nhất → Hiển thị dữ liệu mới nhất.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* PART 9 */}
            {activeSection === 'part9' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#006C99] border-b pb-2">
                  PHẦN 9 – CƠ CHẾ TẠO LÝ LỊCH PDF ĐỘNG
                </h2>
                <p>
                  Hệ thống không lưu trữ các file PDF tĩnh định sẵn trên máy chủ. Thay vào đó, mỗi khi người dùng bấm "Xem & Xuất Lý Lịch PDF A4", hệ thống kích hoạt cơ chế Dynamic Form Compilation:
                </p>
                <ol className="list-decimal list-inside space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <li><strong>Truy vấn dữ liệu mới nhất:</strong> Đọc bản ghi nhân viên hiện hành cùng danh sách nghiệp vụ (10), huấn luyện tại chỗ (11), cảng làm việc & tăng cường (12, 13), đào tạo & chứng chỉ (14), quá trình công tác (15).</li>
                  <li><strong>Inject vào Biểu mẫu chuẩn 1:1:</strong> Dữ liệu được đưa vào component <code>OfficialResumePrintView</code> với đúng kích thước khổ A4 chuẩn in ấn Việt Nam (Quốc hiệu, Tiêu ngữ, Tên SKYPEC, Tiêu đề form, Khung ảnh 3x4).</li>
                  <li><strong>Tự động co giãn số dòng bảng:</strong> Bảng đào tạo có bao nhiêu dòng thì hiển thị bấy nhiêu dòng; tự động chia trang A4 bằng CSS <code>page-break-after: always</code> khi vượt quá 1 trang, không giới hạn cứng dòng.</li>
                  <li><strong>Xuất PDF qua Native Print Engine:</strong> Sử dụng trình kết xuất đồ họa vector của trình duyệt, hỗ trợ in trực tiếp hoặc lưu PDF sắc nét 300 DPI.</li>
                </ol>
              </div>
            )}

            {/* PART 3 */}
            {activeSection === 'part3' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#006C99] border-b pb-2">
                  PHẦN 3 – THIẾT KẾ CƠ SỞ DỮ LIỆU CHUẨN (SCHEMA)
                </h2>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <span className="font-bold text-[#006C99]">1. Bảng `employees`:</span>
                    <p className="text-slate-600 mt-0.5">
                      <code>id (PK)</code>, <code>employee_code (UNIQUE)</code>, <code>public_token (UNIQUE, IMMUTABLE)</code>, <code>full_name</code>, <code>birth_date</code>, <code>gender</code>, <code>id_card_number</code>, <code>id_card_date</code>, <code>id_card_place</code>, <code>hire_date</code>, <code>organization</code>, <code>aviation_job_title</code>, <code>department</code>, <code>position</code>, <code>avatar_url</code>, <code>status</code>, <code>regular_airport</code>, <code>created_at</code>, <code>updated_at</code>.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <span className="font-bold text-[#006C99]">2. Bảng `training_records`:</span>
                    <p className="text-slate-600 mt-0.5">
                      <code>id (PK)</code>, <code>employee_id (FK)</code>, <code>facility_name</code>, <code>training_content</code>, <code>start_date</code>, <code>end_date</code>, <code>certificate_name</code>, <code>certificate_number</code>, <code>training_format</code>, <code>issue_date</code>, <code>expiry_date</code>, <code>file_attachment_url</code>.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <span className="font-bold text-[#006C99]">3. Bảng `audit_logs` & `qr_access_logs`:</span>
                    <p className="text-slate-600 mt-0.5">
                      Ghi nhận chi tiết từng lần thay đổi trường dữ liệu và từng lượt quét QR từ thiết bị di động.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PART 7 */}
            {activeSection === 'part7' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#006C99] border-b pb-2">
                  PHẦN 7 – ĐẶC TẢ RESTFUL API
                </h2>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2 bg-slate-100 rounded border border-slate-200">
                    <span className="font-bold text-emerald-700">GET</span> /api/employees - Lấy danh sách nhân viên (kèm tìm kiếm, lọc, phân trang)
                  </div>
                  <div className="p-2 bg-slate-100 rounded border border-slate-200">
                    <span className="font-bold text-blue-700">POST</span> /api/employees - Tạo nhân viên mới (tự động sinh Public Token cố định & QR)
                  </div>
                  <div className="p-2 bg-slate-100 rounded border border-slate-200">
                    <span className="font-bold text-amber-700">PUT</span> /api/employees/:id - Cập nhật nhân viên (giữ nguyên Public Token)
                  </div>
                  <div className="p-2 bg-slate-100 rounded border border-slate-200">
                    <span className="font-bold text-emerald-700">GET</span> /api/public/profile/:token - API công khai khi quét QR thẻ PET
                  </div>
                  <div className="p-2 bg-slate-100 rounded border border-slate-200">
                    <span className="font-bold text-purple-700">POST</span> /api/employees/:id/regenerate-token - Thu hồi & cấp lại QR (chỉ Admin)
                  </div>
                </div>
              </div>
            )}

            {/* PART 10 */}
            {activeSection === 'part10' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#006C99] border-b pb-2">
                  PHẦN 10 – BẢO MẬT & BẢO VỆ DỮ LIỆU CÁ NHÂN
                </h2>
                <div className="space-y-3">
                  <p>
                    Biểu mẫu nhân viên hàng không chứa các thông tin nhạy cảm theo Luật An toàn thông tin mạng và Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân (CCCD, ngày sinh, quá trình công tác):
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-700">
                    <li><strong>Không đưa dữ liệu cá nhân vào mã QR:</strong> QR chỉ là con trỏ dẫn đến token ngẫu nhiên, không thể giải mã thông tin nhân viên trực tiếp từ hình ảnh QR.</li>
                    <li><strong>Che bảo mật CCCD trên trang công khai:</strong> Mặc định che số CCCD <code>0010******42</code> khi người ngoài quét QR.</li>
                    <li><strong>Kiểm soát hồ sơ đã khóa:</strong> Khi nhân viên nghỉ việc hoặc bị đình chỉ, hệ thống chuyển trạng thái sang <code>locked</code>. Khi quét QR, giao diện thông báo "Hồ sơ hiện không còn hiệu lực" và không làm lộ chi tiết nghiệp vụ.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* PART 12 */}
            {activeSection === 'part12' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#006C99] border-b pb-2">
                  PHẦN 12 – HƯỚNG DẪN TRIỂN KHAI DOANH NGHIỆP TẠI SKYPEC
                </h2>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border rounded-lg">
                    <div className="font-bold text-slate-900">1. Quy chuẩn in thẻ PET:</div>
                    <p className="text-slate-600 mt-1">
                      Kích thước thẻ tiêu chuẩn CR80 (85.6mm × 54mm × 0.76mm). Mã QR được xuất dưới dạng vector SVG hoặc PNG độ phân giải cao 300 DPI, vùng Quiet Zone tối thiểu 4 modules để máy quét quang học hoặc camera di động bắt mã tức thì dưới ánh nắng sân đỗ.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-lg">
                    <div className="font-bold text-slate-900">2. Triển khai máy chủ & Tên miền:</div>
                    <p className="text-slate-600 mt-1">
                      Hệ thống cấu hình reverse-proxy tại <code>https://hoso.skypec.vn</code> kèm chứng chỉ SSL/TLS Let's Encrypt hoặc EV SSL, đảm bảo tốc độ phản hồi dưới 200ms khi quét QR tại các chốt an ninh khu bay.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-500">Tài liệu phân tích & thiết kế hệ thống SKYPEC</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#006C99] text-white font-bold hover:bg-[#005377] transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
