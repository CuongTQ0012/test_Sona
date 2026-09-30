/**
 * Types & Domain Models for SKYPEC Employee Aviation Profile & QR System
 */

export interface ProfessionalSkill {
  id: string;
  order: number;
  name: string;
  status: 'active' | 'suspended';
}

export interface OnsiteTraining {
  id: string;
  order: number;
  skillName: string;
  airport: string;
  duration: string;
  decisionNumber: string;
  decisionFileName?: string;
  decisionFileUrl?: string;
}

export interface DeployedAirport {
  id: string;
  order: number;
  airport: string;
  assignedSkill: string;
  startDate: string;
  endDate: string;
}

export type CertificateStatus = 'valid' | 'expiring' | 'expired';

export interface TrainingRecord {
  id: string;
  order: number;
  trainingFacility: string;
  trainingContent: string;
  startDate: string;
  endDate: string;
  certificateName: string;
  certificateNumber?: string;
  certificateFileName?: string;
  certificateFileUrl?: string;
  trainingFormat: string;
  issueDate: string;
  expiryDate: string; // YYYY-MM-DD or DD/MM/YYYY
}

export interface WorkHistoryItem {
  id: string;
  period: string; // "Từ tháng, năm đến tháng, năm"
  description: string; // "Chức danh, chức vụ, đơn vị công tác, cảng hàng không làm việc"
}

export interface IdCardInfo {
  number: string;
  issueDate: string;
  issuePlace: string;
}

export interface PETCardCustomization {
  cardTitle?: string; // Tiêu đề thẻ (VD: THẺ NHÂN VIÊN KHU BAY)
  companyName?: string; // Tên công ty chân thẻ
  brandShortName?: string; // Tên viết tắt (VD: Vietnam Air Petrol)
  logoUrl?: string; // Logo tùy chỉnh (Base64 hoặc URL)
  badgeText?: string; // Nhãn trạng thái (VD: NHÂN VIÊN CHÍNH THỨC)
  badgeColor?: 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo';
  themeColor?: string; // Màu dải chủ đạo (mặc định: #006C99)
  secondaryColor?: string; // Màu dải phụ (mặc định: #EECD2B)
  backNotes?: string; // Quy định mặt sau thẻ
  backEmergencyPhone?: string; // Hotline an ninh / cứu nạn
}

export type EmployeeStatus = 'active' | 'suspended' | 'resigned' | 'locked';

export interface Employee {
  id: string;
  employeeCode: string;
  publicToken: string;
  fullName: string;
  birthDate: string; // dd/mm/yyyy
  gender: 'Nam' | 'Nữ';
  idCard: IdCardInfo;
  hireDate: string; // dd/mm/yyyy
  organization: string; // Doanh nghiệp/cơ quan quản lý
  aviationJobTitle: string; // Chức danh nhân viên hàng không
  department: string; // Phòng/ ban/ tổ/ đội
  position: string; // Chức vụ
  avatarUrl: string; // Ảnh 3x4
  status: EmployeeStatus;
  regularAirport: string; // 12) Cảng hàng không làm việc thường xuyên
  professionalSkills: ProfessionalSkill[]; // 10)
  onsiteTrainings: OnsiteTraining[]; // 11)
  deployedAirports: DeployedAirport[]; // 13)
  trainingRecords: TrainingRecord[]; // 14)
  workHistory: WorkHistoryItem[]; // 15)
  petCardCustomization?: PETCardCustomization;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  employeeId: string;
  employeeName: string;
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  note?: string;
}

export interface QrAccessLog {
  id: string;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  publicToken: string;
  deviceType: string;
  browser: string;
  ipAddress: string;
}

export interface SystemSettings {
  warningDays: number; // 30, 60, 90 days
  maskIdCardPublic: boolean;
  companyName: string;
  companySubName: string;
  enablePublicPdfDownload: boolean;
  qrDomain: string;
}
