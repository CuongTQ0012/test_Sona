import * as XLSX from 'xlsx';

export function downloadSkypecExcelTemplate() {
  // Chuẩn hóa theo 1 CÁCH DUY NHẤT:
  // Mỗi chứng chỉ / mỗi đợt chuyển công tác nhập trên 1 dòng riêng, giữ CÙNG MÃ NHÂN VIÊN.
  // Hệ thống tự động gộp thành 1 hồ sơ duy nhất và cấp 1 mã QR cố định.
  const sampleData = [
    // Nhân viên 1: Nguyễn Văn A (Có 3 dòng = 3 chứng chỉ, 2 đợt HLTC, 2 đợt chuyển công tác/điều động)
    {
      'STT': 1,
      'Họ và tên (*)': 'Nguyễn Văn A',
      'Mã nhân viên (*)': 'SKP-0125',
      'Sinh ngày (ngày/tháng/năm)': '15/08/1988',
      'Giới tính (Nam/Nữ)': 'Nam',
      'Số CCCD': '001088019842',
      'Ngày cấp CCCD': '10/05/2021',
      'Nơi cấp CCCD': 'Cục Cảnh sát QLHC về TTXH',
      'Ngày tuyển dụng': '01/06/2018',
      'Doanh nghiệp quản lý': 'Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam (SKYPEC)',
      'Chức danh nhân viên hàng không (*)': 'Nhân viên điều khiển phương tiện',
      'Phòng/Ban/Tổ/Đội': 'Chi nhánh ĐBSH / Phòng Kỹ thuật / Đội xe tra nạp Nội Bài',
      'Chức vụ': 'Nhân viên chính',
      'Cảng làm việc thường xuyên': 'Cảng hàng không quốc tế Nội Bài (HAN)',
      'Các nghiệp vụ chuyên môn': 'Điều khiển xe tra nạp bồn 45.000L; Vận hành xe truyền tiếp Hydrant Dispenser',
      'Nghiệp vụ huấn luyện tại chỗ': 'Quy trình kết nối họng nạp Hydrant & Vận hành xe truyền tiếp',
      'Cảng huấn luyện tại chỗ': 'Cảng HKQT Nội Bài (HAN)',
      'Thời gian huấn luyện tại chỗ': '01/02/2024 - 15/03/2024 (120 giờ)',
      'Số quyết định công nhận HLTC': 'Số 45/QĐ-SKYPEC-KT ngày 20/03/2024',
      'Tên cơ sở đào tạo': 'Học viện Hàng không Việt Nam',
      'Tên chứng chỉ / Thẻ nghiệp vụ': 'Chứng nhận An toàn khu bay cấp 2',
      'Số hiệu chứng chỉ': 'CAAV-ATKB-2024-0891',
      'Ngày cấp chứng chỉ': '20/02/2024',
      'Ngày hết hạn chứng chỉ': '20/02/2027',
      'Cảng điều động': 'Cảng HKQT Đà Nẵng: Tăng cường cao điểm Hè (01/06/2023 - 15/07/2023)',
      'Quá trình chuyển công tác': '06/2018 - 12/2020: Nhân viên phụ xe tra nạp, Đội xe tra nạp Nội Bài',
    },
    {
      'STT': 1,
      'Họ và tên (*)': 'Nguyễn Văn A',
      'Mã nhân viên (*)': 'SKP-0125',
      'Sinh ngày (ngày/tháng/năm)': '',
      'Giới tính (Nam/Nữ)': '',
      'Số CCCD': '',
      'Ngày cấp CCCD': '',
      'Nơi cấp CCCD': '',
      'Ngày tuyển dụng': '',
      'Doanh nghiệp quản lý': '',
      'Chức danh nhân viên hàng không (*)': '',
      'Phòng/Ban/Tổ/Đội': '',
      'Chức vụ': '',
      'Cảng làm việc thường xuyên': '',
      'Các nghiệp vụ chuyên môn': '',
      'Nghiệp vụ huấn luyện tại chỗ': 'Quy trình vận hành xe tra nạp bồn chuyên dụng dung tích lớn 45.000L',
      'Cảng huấn luyện tại chỗ': 'Cảng HKQT Nội Bài (HAN)',
      'Thời gian huấn luyện tại chỗ': '01/04/2024 - 15/05/2024 (100 giờ)',
      'Số quyết định công nhận HLTC': 'Số 72/QĐ-SKYPEC-KT ngày 20/05/2024',
      'Tên cơ sở đào tạo': 'Học viện Hàng không Việt Nam',
      'Tên chứng chỉ / Thẻ nghiệp vụ': 'CCCM Nhân viên Hàng không chuyên ngành tra nạp',
      'Số hiệu chứng chỉ': 'CAAV-CCCM-2024-0199',
      'Ngày cấp chứng chỉ': '20/01/2024',
      'Ngày hết hạn chứng chỉ': '20/01/2029',
      'Cảng điều động': '',
      'Quá trình chuyển công tác': '01/2021 - Đến nay: Nhân viên điều khiển xe tra nạp bồn và xe truyền tiếp',
    },
    {
      'STT': 1,
      'Họ và tên (*)': 'Nguyễn Văn A',
      'Mã nhân viên (*)': 'SKP-0125',
      'Sinh ngày (ngày/tháng/năm)': '',
      'Giới tính (Nam/Nữ)': '',
      'Số CCCD': '',
      'Ngày cấp CCCD': '',
      'Nơi cấp CCCD': '',
      'Ngày tuyển dụng': '',
      'Doanh nghiệp quản lý': '',
      'Chức danh nhân viên hàng không (*)': '',
      'Phòng/Ban/Tổ/Đội': '',
      'Chức vụ': '',
      'Cảng làm việc thường xuyên': '',
      'Các nghiệp vụ chuyên môn': '',
      'Nghiệp vụ huấn luyện tại chỗ': '',
      'Cảng huấn luyện tại chỗ': '',
      'Thời gian huấn luyện tại chỗ': '',
      'Số quyết định công nhận HLTC': '',
      'Tên cơ sở đào tạo': 'Học viện Hàng không Việt Nam',
      'Tên chứng chỉ / Thẻ nghiệp vụ': 'Chứng chỉ JIG Aviation Fuel Quality Control',
      'Số hiệu chứng chỉ': 'JIG-QC-2025-412',
      'Ngày cấp chứng chỉ': '28/05/2025',
      'Ngày hết hạn chứng chỉ': '28/05/2028',
      'Cảng điều động': 'Cảng Cam Ranh: Hỗ trợ tra nạp tàu bay (10/01/2024 - 28/02/2024)',
      'Quá trình chuyển công tác': '',
    },

    // Nhân viên 2: Trần Thị Mai Lan (Có 2 dòng = 2 chứng chỉ, 1 đợt HLTC, 1 cảng điều động)
    {
      'STT': 2,
      'Họ và tên (*)': 'Trần Thị Mai Lan',
      'Mã nhân viên (*)': 'SKP-0142',
      'Sinh ngày (ngày/tháng/năm)': '22/04/1992',
      'Giới tính (Nam/Nữ)': 'Nữ',
      'Số CCCD': '079192008741',
      'Ngày cấp CCCD': '14/11/2021',
      'Nơi cấp CCCD': 'Cục Cảnh sát QLHC về TTXH',
      'Ngày tuyển dụng': '15/09/2019',
      'Doanh nghiệp quản lý': 'Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam (SKYPEC)',
      'Chức danh nhân viên hàng không (*)': 'Nhân viên vận hành thiết bị',
      'Phòng/Ban/Tổ/Đội': 'Chi nhánh ĐBN / Phòng Kỹ thuật / Đội vận hành trạm nhiên liệu Tân Sơn Nhất',
      'Chức vụ': 'Kỹ thuật viên vận hành',
      'Cảng làm việc thường xuyên': 'Cảng hàng không quốc tế Tân Sơn Nhất (SGN)',
      'Các nghiệp vụ chuyên môn': 'Vận hành hệ thống bơm lọc và Scada kho nhiên liệu; Kiểm tra chất lượng nhiên liệu Jet A-1',
      'Nghiệp vụ huấn luyện tại chỗ': 'Vận hành hệ thống đo mức bồn tự động và kiểm tra tỷ trọng Jet A-1',
      'Cảng huấn luyện tại chỗ': 'Cảng HKQT Tân Sơn Nhất (SGN)',
      'Thời gian huấn luyện tại chỗ': '10/02/2024 - 25/03/2024 (120 giờ)',
      'Số quyết định công nhận HLTC': 'Số 38/QĐ-SKYPEC-KT ngày 30/03/2024',
      'Tên cơ sở đào tạo': 'Học viện Hàng không Việt Nam',
      'Tên chứng chỉ / Thẻ nghiệp vụ': 'Chứng chỉ JIG Aviation Fuel Quality Control',
      'Số hiệu chứng chỉ': 'JIG-QC-2025-501',
      'Ngày cấp chứng chỉ': '15/04/2024',
      'Ngày hết hạn chứng chỉ': '15/04/2027',
      'Cảng điều động': 'Cảng HKQT Phú Quốc: Hỗ trợ vận hành trạm cấp phát (15/03/2024 - 30/04/2024)',
      'Quá trình chuyển công tác': '09/2019 - 12/2021: Nhân viên kiểm nghiệm chất lượng, Kho TSN',
    },
    {
      'STT': 2,
      'Họ và tên (*)': 'Trần Thị Mai Lan',
      'Mã nhân viên (*)': 'SKP-0142',
      'Sinh ngày (ngày/tháng/năm)': '',
      'Giới tính (Nam/Nữ)': '',
      'Số CCCD': '',
      'Ngày cấp CCCD': '',
      'Nơi cấp CCCD': '',
      'Ngày tuyển dụng': '',
      'Doanh nghiệp quản lý': '',
      'Chức danh nhân viên hàng không (*)': '',
      'Phòng/Ban/Tổ/Đội': '',
      'Chức vụ': '',
      'Cảng làm việc thường xuyên': '',
      'Các nghiệp vụ chuyên môn': '',
      'Nghiệp vụ huấn luyện tại chỗ': '',
      'Cảng huấn luyện tại chỗ': '',
      'Thời gian huấn luyện tại chỗ': '',
      'Số quyết định công nhận HLTC': '',
      'Tên cơ sở đào tạo': 'Học viện Hàng không Việt Nam',
      'Tên chứng chỉ / Thẻ nghiệp vụ': 'Chứng nhận An toàn khu bay cấp 2',
      'Số hiệu chứng chỉ': 'CAAV-ATKB-2024-0518',
      'Ngày cấp chứng chỉ': '10/05/2024',
      'Ngày hết hạn chứng chỉ': '10/05/2027',
      'Cảng điều động': '',
      'Quá trình chuyển công tác': '01/2022 - Đến nay: Kỹ thuật viên vận hành trạm bơm Tân Sơn Nhất',
    },

    // Nhân viên 3: Lê Hoàng Nam (1 dòng = 1 chứng chỉ, 1 HLTC)
    {
      'STT': 3,
      'Họ và tên (*)': 'Lê Hoàng Nam',
      'Mã nhân viên (*)': 'SKP-0188',
      'Sinh ngày (ngày/tháng/năm)': '12/11/1985',
      'Giới tính (Nam/Nữ)': 'Nam',
      'Số CCCD': '048085002145',
      'Ngày cấp CCCD': '18/06/2021',
      'Nơi cấp CCCD': 'Cục Cảnh sát QLHC về TTXH',
      'Ngày tuyển dụng': '01/03/2015',
      'Doanh nghiệp quản lý': 'Công ty TNHH MTV Nhiên liệu Hàng không Việt Nam (SKYPEC)',
      'Chức danh nhân viên hàng không (*)': 'Nhân viên điều khiển phương tiện',
      'Phòng/Ban/Tổ/Đội': 'Chi nhánh ĐBMT / Đội xe tra nạp Đà Nẵng',
      'Chức vụ': 'Tổ trưởng tổ xe tra nạp',
      'Cảng làm việc thường xuyên': 'Cảng hàng không quốc tế Đà Nẵng (DAD)',
      'Các nghiệp vụ chuyên môn': 'Điều khiển xe tra nạp chuyên dụng FC-60; Đấu nối mỏ tra nạp cánh tàu bay',
      'Nghiệp vụ huấn luyện tại chỗ': 'Kỹ năng ứng phó sự cố tràn dầu và quy trình dừng khẩn cấp thiết bị nạp',
      'Cảng huấn luyện tại chỗ': 'Cảng HKQT Đà Nẵng (DAD)',
      'Thời gian huấn luyện tại chỗ': '05/03/2024 - 20/04/2024 (120 giờ)',
      'Số quyết định công nhận HLTC': 'Số 62/QĐ-SKYPEC-KT ngày 25/04/2024',
      'Tên cơ sở đào tạo': 'Học viện Hàng không Việt Nam',
      'Tên chứng chỉ / Thẻ nghiệp vụ': 'CCCM Nhân viên Hàng không chuyên ngành tra nạp',
      'Số hiệu chứng chỉ': 'CAAV-CCCM-2024-0312',
      'Ngày cấp chứng chỉ': '20/01/2024',
      'Ngày hết hạn chứng chỉ': '20/01/2029',
      'Cảng điều động': 'Cảng HKQT Chu Lai: Tăng cường phục vụ diễn tập bay (05/08/2023 - 20/08/2023)',
      'Quá trình chuyển công tác': '03/2015 - Đến nay: Tổ trưởng tổ xe tra nạp Đà Nẵng',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths for comfortable editing in Microsoft Excel
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 24 }, // Họ và tên
    { wch: 14 }, // Mã NV
    { wch: 16 }, // Sinh ngày
    { wch: 10 }, // Giới tính
    { wch: 16 }, // CCCD
    { wch: 14 }, // Ngày cấp
    { wch: 28 }, // Nơi cấp
    { wch: 16 }, // Ngày tuyển dụng
    { wch: 45 }, // Doanh nghiệp quản lý
    { wch: 34 }, // Chức danh hàng không
    { wch: 45 }, // Phòng ban
    { wch: 22 }, // Chức vụ
    { wch: 36 }, // Cảng thường xuyên
    { wch: 40 }, // Nghiệp vụ chuyên môn
    { wch: 45 }, // Nghiệp vụ huấn luyện tại chỗ
    { wch: 32 }, // Cảng huấn luyện tại chỗ
    { wch: 30 }, // Thời gian huấn luyện tại chỗ
    { wch: 36 }, // Số quyết định công nhận HLTC
    { wch: 30 }, // Cơ sở đào tạo
    { wch: 40 }, // Tên chứng chỉ
    { wch: 22 }, // Số hiệu chứng chỉ
    { wch: 16 }, // Ngày cấp chứng chỉ
    { wch: 16 }, // Ngày hết hạn chứng chỉ
    { wch: 50 }, // Cảng điều động
    { wch: 55 }, // Quá trình chuyển công tác
  ];

  // Sheet 2: Quy tắc nhập liệu chuẩn
  const guideData = [
    {
      'QUY TẮC NHẬP DUY NHẤT': 'Nguyên tắc cơ bản',
      'HƯỚNG DẪN CHI TIẾT': 'Khi 1 nhân viên có NHIỀU CHỨNG CHỈ, NHIỀU ĐỢT HUẤN LUYỆN TẠI CHỖ hoặc NHIỀU ĐỢT CHUYỂN CÔNG TÁC / ĐIỀU ĐỘNG CẢNG, bạn hãy nhập mỗi nội dung trên 1 DÒNG RIÊNG VỚI CÙNG [MÃ NHÂN VIÊN].',
    },
    {
      'QUY TẮC NHẬP DUY NHẤT': 'Mục 11: Huấn luyện tại chỗ (HLTC)',
      'HƯỚNG DẪN CHI TIẾT': 'Điền các cột: [Nghiệp vụ huấn luyện tại chỗ], [Cảng huấn luyện tại chỗ], [Thời gian huấn luyện tại chỗ] (VD: 01/02/2024 - 15/03/2024 (120 giờ)), [Số quyết định công nhận HLTC] (VD: Số 45/QĐ-SKYPEC-KT). Nếu có nhiều đợt HLTC, chỉ cần nhập thêm dòng với cùng Mã NV.',
    },
    {
      'QUY TẮC NHẬP DUY NHẤT': 'Cơ chế tự động gộp của hệ thống',
      'HƯỚNG DẪN CHI TIẾT': 'Hệ thống tự động phát hiện các dòng có cùng Mã nhân viên và GỘP THÀNH 1 HỒ SƠ DUY NHẤT, gom đủ toàn bộ chứng chỉ, đợt huấn luyện tại chỗ và đợt công tác vào hồ sơ, đồng thời cấp 1 mã QR cố định duy nhất.',
    },
    {
      'QUY TẮC NHẬP DUY NHẤT': 'Các dòng sau có cần điền lại họ tên, CCCD không?',
      'HƯỚNG DẪN CHI TIẾT': 'Ở các dòng sau của cùng nhân viên đó, bạn chỉ cần điền CÙNG MÃ NHÂN VIÊN (và Họ tên để dễ theo dõi), các cột thông tin nhân thân khác có thể để trống. Hệ thống sẽ lấy thông tin nhân thân từ dòng đầu tiên.',
    },
    {
      'QUY TẮC NHẬP DUY NHẤT': 'Nhân viên đã có sẵn trong phần mềm',
      'HƯỚNG DẪN CHI TIẾT': 'Nếu nhân viên đã có sẵn trong hệ thống, khi tải file Excel lên có cùng Mã nhân viên, hệ thống sẽ TỰ ĐỘNG BỔ SUNG thêm chứng chỉ, huấn luyện tại chỗ và các đợt công tác mới mà KHÔNG LÀM THAY ĐỔI MÃ QR VÀ TOKEN CỐ ĐỊNH của nhân viên đó.',
    },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 35 }, { wch: 90 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Nhan_Vien');
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Quy_Tac_Nhap_Lieu');
  XLSX.writeFile(wb, 'Bieu_Mau_Nhap_Ho_So_Nhan_Vien_SKYPEC.xlsx');
}
