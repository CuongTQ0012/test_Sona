/**
 * Storage Service for SKYPEC Employee Profile & QR Management System
 * Provides transactional persistence, reactivity, audit logging, and QR access tracking.
 */
import { Employee, AuditLog, QrAccessLog, SystemSettings } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_SETTINGS } from '../data/initialData';
import { generatePublicToken, extractToken } from '../utils/helpers';

const EMPLOYEES_STORAGE_KEY = 'skypec_aviation_employees_v1';
const AUDIT_LOGS_STORAGE_KEY = 'skypec_aviation_audit_logs_v1';
const QR_LOGS_STORAGE_KEY = 'skypec_aviation_qr_logs_v1';
const SETTINGS_STORAGE_KEY = 'skypec_aviation_settings_v1';

class StorageService {
  private employees: Employee[] = [];
  private auditLogs: AuditLog[] = [];
  private qrLogs: QrAccessLog[] = [];
  private settings: SystemSettings = INITIAL_SETTINGS;
  private listeners: Array<() => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      // 1. Employees: Load cached from localStorage for instant display
      const storedEmployees = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
      if (storedEmployees) {
        try {
          this.employees = JSON.parse(storedEmployees);
        } catch {
          this.employees = INITIAL_EMPLOYEES;
        }
      } else {
        // Fallback in memory ONLY, DO NOT call saveEmployees() so we don't overwrite server!
        this.employees = INITIAL_EMPLOYEES;
      }

      // 2. Settings: Load cached from localStorage
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        try {
          this.settings = JSON.parse(storedSettings);
        } catch {
          this.settings = INITIAL_SETTINGS;
        }
      } else {
        this.settings = INITIAL_SETTINGS;
      }

      // 3. Audit Logs
      const storedAuditLogs = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
      if (storedAuditLogs) {
        try {
          this.auditLogs = JSON.parse(storedAuditLogs);
        } catch {
          this.auditLogs = [];
        }
      } else {
        this.auditLogs = [];
      }

      // 4. QR Access Logs
      const storedQrLogs = localStorage.getItem(QR_LOGS_STORAGE_KEY);
      if (storedQrLogs) {
        try {
          this.qrLogs = JSON.parse(storedQrLogs);
        } catch {
          this.qrLogs = [];
        }
      } else {
        this.qrLogs = [];
      }

      // 5. Asynchronously synchronize with server backend immediately
      this.syncFromServer();
    } catch (e) {
      console.error('Storage initialization error:', e);
      this.employees = INITIAL_EMPLOYEES;
      this.settings = INITIAL_SETTINGS;
    }
  }

  public syncFromServer(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    return fetch('/api/sync')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !data.success) return;

        let hasChanges = false;

        // 1. Sync employees
        if (Array.isArray(data.employees)) {
          this.employees = data.employees;
          try {
            localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(this.employees));
          } catch (err) {}
          hasChanges = true;
        }

        // 2. Sync settings
        if (data.settings) {
          this.settings = { ...this.settings, ...data.settings };
          try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
          } catch (err) {}
          hasChanges = true;
        }

        // 3. Sync audit logs
        if (Array.isArray(data.auditLogs)) {
          this.auditLogs = data.auditLogs;
          try {
            localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(this.auditLogs));
          } catch (err) {}
          hasChanges = true;
        }

        // 4. Sync QR logs
        if (Array.isArray(data.qrLogs)) {
          this.qrLogs = data.qrLogs;
          try {
            localStorage.setItem(QR_LOGS_STORAGE_KEY, JSON.stringify(this.qrLogs));
          } catch (err) {}
          hasChanges = true;
        }

        if (hasChanges) {
          this.notify();
        }
      })
      .catch((err) => {
        console.warn('Sync from server error:', err);
      });
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private saveEmployees() {
    try {
      localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(this.employees));
      this.notify();
      // Sync to backend server so mobile devices scanning QR receive the exact data
      if (typeof window !== 'undefined') {
        fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employees: this.employees }),
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Save employees error:', e);
    }
  }

  private saveAuditLogs() {
    try {
      localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(this.auditLogs));
      this.notify();
    } catch (e) {
      console.error('Save audit logs error:', e);
    }
  }

  private saveQrLogs() {
    try {
      localStorage.setItem(QR_LOGS_STORAGE_KEY, JSON.stringify(this.qrLogs));
      this.notify();
    } catch (e) {
      console.error('Save QR logs error:', e);
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
      this.notify();
      // Sync settings to server backend so all devices scanning QR see the change
      if (typeof window !== 'undefined') {
        fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: this.settings }),
        }).catch((err) => {
          console.warn('Could not sync settings to server:', err);
        });
      }
    } catch (e) {
      console.error('Save settings error:', e);
    }
  }

  // --- EMPLOYEE API ---

  public getEmployees(): Employee[] {
    return [...this.employees];
  }

  public getEmployeeById(id: string): Employee | undefined {
    return this.employees.find((e) => e.id === id);
  }

  public getEmployeeByToken(tokenOrUrl: string): Employee | undefined {
    if (!tokenOrUrl) return undefined;
    const clean = extractToken(tokenOrUrl).toUpperCase().trim();
    if (!clean) return undefined;

    // 1. Direct match on publicToken
    let emp = this.employees.find((e) => e.publicToken.toUpperCase() === clean);
    if (emp) return emp;

    // 2. Direct match on employeeCode (e.g. SKP-0125)
    emp = this.employees.find((e) => e.employeeCode.toUpperCase() === clean);
    if (emp) return emp;

    // 3. Match normalized alphanumeric (e.g. SKP0125 matching SKP-0125)
    const strippedClean = clean.replace(/[^A-Z0-9]/g, '');
    if (strippedClean.length >= 4) {
      emp = this.employees.find((e) => {
        const strippedToken = e.publicToken.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const strippedCode = e.employeeCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
        return strippedToken === strippedClean || strippedCode === strippedClean;
      });
      if (emp) return emp;
    }

    // 4. Direct match on ID
    emp = this.employees.find((e) => e.id.toLowerCase() === clean.toLowerCase());
    if (emp) return emp;

    // 5. Fallback search inside string
    const rawUpper = tokenOrUrl.toUpperCase();
    emp = this.employees.find(
      (e) => rawUpper.includes(e.publicToken.toUpperCase()) || rawUpper.includes(e.employeeCode.toUpperCase())
    );
    return emp;
  }

  public createEmployee(
    data: Omit<Employee, 'id' | 'publicToken' | 'createdAt' | 'updatedAt'> & {
      publicToken?: string;
    },
    user: string = 'Cán bộ quản trị'
  ): Employee {
    const id = `emp_${Date.now()}`;
    const token = data.publicToken && data.publicToken.trim() ? data.publicToken.trim().toUpperCase() : generatePublicToken(8);
    const now = new Date().toISOString();

    const newEmp: Employee = {
      ...data,
      id,
      publicToken: token,
      createdAt: now,
      updatedAt: now,
    };

    this.employees.unshift(newEmp);
    this.saveEmployees();

    this.addAuditLog({
      userName: user,
      employeeId: newEmp.id,
      employeeName: newEmp.fullName,
      fieldChanged: 'Tạo hồ sơ mới',
      oldValue: '—',
      newValue: `Mã: ${newEmp.employeeCode}, Chức danh: ${newEmp.aviationJobTitle}, Token: ${newEmp.publicToken}`,
      note: 'Khởi tạo hồ sơ người lao động có QR Code cố định',
    });

    return newEmp;
  }

  /**
   * CRITICAL ARCHITECTURAL GUARANTEE:
   * Updating an employee NEVER alters the publicToken or QR code URL!
   */
  public updateEmployee(
    id: string,
    data: Partial<Employee>,
    user: string = 'Cán bộ quản trị'
  ): Employee | undefined {
    const index = this.employees.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    const oldEmp = this.employees[index];

    // Ensure publicToken is NEVER modified during standard profile edits
    const preservedToken = oldEmp.publicToken;

    // Detect key changes for audit logging
    const changes: Array<{ field: string; oldVal: string; newVal: string }> = [];

    if (data.aviationJobTitle && data.aviationJobTitle !== oldEmp.aviationJobTitle) {
      changes.push({
        field: 'Chức danh nhân viên hàng không',
        oldVal: oldEmp.aviationJobTitle,
        newVal: data.aviationJobTitle,
      });
    }

    if (data.fullName && data.fullName !== oldEmp.fullName) {
      changes.push({
        field: 'Họ và tên',
        oldVal: oldEmp.fullName,
        newVal: data.fullName,
      });
    }

    if (data.department && data.department !== oldEmp.department) {
      changes.push({
        field: 'Phòng/Ban/Tổ/Đội',
        oldVal: oldEmp.department,
        newVal: data.department,
      });
    }

    if (data.position && data.position !== oldEmp.position) {
      changes.push({
        field: 'Chức vụ',
        oldVal: oldEmp.position,
        newVal: data.position,
      });
    }

    if (data.status && data.status !== oldEmp.status) {
      changes.push({
        field: 'Trạng thái hồ sơ',
        oldVal: oldEmp.status,
        newVal: data.status,
      });
    }

    if (data.trainingRecords && JSON.stringify(data.trainingRecords) !== JSON.stringify(oldEmp.trainingRecords)) {
      changes.push({
        field: 'Hồ sơ đào tạo, huấn luyện & chứng chỉ',
        oldVal: `${oldEmp.trainingRecords.length} khóa đào tạo`,
        newVal: `${data.trainingRecords.length} khóa đào tạo`,
      });
    }

    const updatedEmp: Employee = {
      ...oldEmp,
      ...data,
      id: oldEmp.id,
      publicToken: preservedToken, // GUARANTEED IMMUTABLE
      updatedAt: new Date().toISOString(),
    };

    this.employees[index] = updatedEmp;
    this.saveEmployees();

    // Log detected changes
    if (changes.length > 0) {
      changes.forEach((c) => {
        this.addAuditLog({
          userName: user,
          employeeId: updatedEmp.id,
          employeeName: updatedEmp.fullName,
          fieldChanged: c.field,
          oldValue: c.oldVal,
          newValue: c.newVal,
          note: 'Cập nhật thông tin lý lịch (Mã QR cố định được giữ nguyên)',
        });
      });
    } else {
      this.addAuditLog({
        userName: user,
        employeeId: updatedEmp.id,
        employeeName: updatedEmp.fullName,
        fieldChanged: 'Cập nhật chi tiết hồ sơ',
        oldValue: 'Dữ liệu trước sửa',
        newValue: 'Dữ liệu mới cập nhật',
        note: 'Cập nhật các mục nghiệp vụ / huấn luyện / quá trình công tác',
      });
    }

    return updatedEmp;
  }

  /**
   * Section XXIV: QR regeneration is an EXPLICIT exceptional admin action
   * requiring separate confirmation and safety audit.
   */
  public regenerateTokenExplicit(id: string, user: string = 'Administrator'): string | undefined {
    const index = this.employees.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    const oldToken = this.employees[index].publicToken;
    const newToken = generatePublicToken(8);

    this.employees[index].publicToken = newToken;
    this.employees[index].updatedAt = new Date().toISOString();
    this.saveEmployees();

    this.addAuditLog({
      userName: user,
      employeeId: this.employees[index].id,
      employeeName: this.employees[index].fullName,
      fieldChanged: 'Thu hồi & Cấp lại mã QR (Public Token)',
      oldValue: oldToken,
      newValue: newToken,
      note: 'THAO TÁC ĐẶC BIỆT: Mã QR cũ đã bị vô hiệu hóa; thẻ PET cũ cần in lại!',
    });

    return newToken;
  }

  public deleteEmployee(id: string, user: string = 'Administrator'): boolean {
    const emp = this.employees.find((e) => e.id === id);
    if (!emp) return false;

    this.employees = this.employees.filter((e) => e.id !== id);
    this.saveEmployees();

    this.addAuditLog({
      userName: user,
      employeeId: id,
      employeeName: emp.fullName,
      fieldChanged: 'Xóa hồ sơ nhân viên',
      oldValue: emp.employeeCode,
      newValue: 'Đã xóa khỏi hệ thống',
      note: 'Xóa vĩnh viễn hồ sơ và mã QR',
    });

    if (typeof window !== 'undefined') {
      fetch(`/api/employee/${id}`, { method: 'DELETE' }).catch(() => {});
    }

    return true;
  }

  /**
   * Merge duplicate employee records into a primary employee record:
   * Consolidates trainingRecords, onsiteTrainings, workHistory, deployedAirports, professionalSkills.
   * Fills in missing fields in primary if available in duplicate records.
   * Permanently removes duplicate records and creates an audit log.
   */
  public mergeDuplicateEmployees(
    primaryId: string,
    duplicateIds: string[],
    user: string = 'Cán bộ quản trị'
  ): Employee | undefined {
    const primaryIndex = this.employees.findIndex((e) => e.id === primaryId);
    if (primaryIndex === -1) return undefined;

    const primary = { ...this.employees[primaryIndex] };
    const mergedTraining = [...(primary.trainingRecords || [])];
    const mergedOnsite = [...(primary.onsiteTrainings || [])];
    const mergedWork = [...(primary.workHistory || [])];
    const mergedAirports = [...(primary.deployedAirports || [])];
    const mergedSkills = [...(primary.professionalSkills || [])];

    const duplicateEmps: Employee[] = [];

    duplicateIds.forEach((dupId) => {
      const dup = this.employees.find((e) => e.id === dupId);
      if (!dup || dup.id === primaryId) return;
      duplicateEmps.push(dup);

      // Merge training records (by certificateNumber or certificateName)
      (dup.trainingRecords || []).forEach((tr) => {
        const exists = mergedTraining.some(
          (t) =>
            (t.certificateNumber && tr.certificateNumber && t.certificateNumber.trim().toLowerCase() === tr.certificateNumber.trim().toLowerCase()) ||
            (t.certificateName.trim().toLowerCase() === tr.certificateName.trim().toLowerCase() && t.issueDate === tr.issueDate)
        );
        if (!exists) {
          mergedTraining.push({
            ...tr,
            id: `tr_mrg_${Date.now()}_${mergedTraining.length}`,
            order: mergedTraining.length + 1,
          });
        }
      });

      // Merge onsite trainings (by skillName)
      (dup.onsiteTrainings || []).forEach((ot) => {
        const exists = mergedOnsite.some(
          (o) => o.skillName.trim().toLowerCase() === ot.skillName.trim().toLowerCase()
        );
        if (!exists) {
          mergedOnsite.push({
            ...ot,
            id: `ot_mrg_${Date.now()}_${mergedOnsite.length}`,
            order: mergedOnsite.length + 1,
          });
        }
      });

      // Merge work history
      (dup.workHistory || []).forEach((wh) => {
        const exists = mergedWork.some(
          (w) => w.period.trim().toLowerCase() === wh.period.trim().toLowerCase() && w.description.trim().toLowerCase() === wh.description.trim().toLowerCase()
        );
        if (!exists) {
          mergedWork.push({
            ...wh,
            id: `wh_mrg_${Date.now()}_${mergedWork.length}`,
          });
        }
      });

      // Merge deployed airports
      (dup.deployedAirports || []).forEach((da) => {
        const exists = mergedAirports.some((a) => a.airport.toLowerCase() === da.airport.toLowerCase());
        if (!exists) {
          mergedAirports.push({
            ...da,
            id: `da_mrg_${Date.now()}_${mergedAirports.length}`,
            order: mergedAirports.length + 1,
          });
        }
      });

      // Merge professional skills
      (dup.professionalSkills || []).forEach((ps) => {
        const exists = mergedSkills.some(
          (s) => s.name.trim().toLowerCase() === ps.name.trim().toLowerCase()
        );
        if (!exists) {
          mergedSkills.push({
            ...ps,
            id: `ps_mrg_${Date.now()}_${mergedSkills.length}`,
            order: mergedSkills.length + 1,
          });
        }
      });

      // Fill missing personal info in primary if primary lacks it
      if (!primary.avatarUrl && dup.avatarUrl) primary.avatarUrl = dup.avatarUrl;
      if ((!primary.idCard || !primary.idCard.number) && dup.idCard && dup.idCard.number) {
        primary.idCard = { ...dup.idCard };
      }
    });

    primary.trainingRecords = mergedTraining;
    primary.onsiteTrainings = mergedOnsite;
    primary.workHistory = mergedWork;
    primary.deployedAirports = mergedAirports;
    primary.professionalSkills = mergedSkills;
    primary.updatedAt = new Date().toISOString();

    // Remove duplicates from list
    const dupIdSet = new Set(duplicateIds);
    this.employees = this.employees.filter((e) => !dupIdSet.has(e.id) || e.id === primaryId);
    const targetIdx = this.employees.findIndex((e) => e.id === primaryId);
    if (targetIdx !== -1) {
      this.employees[targetIdx] = primary;
    }

    this.saveEmployees();

    this.addAuditLog({
      userName: user,
      employeeId: primary.id,
      employeeName: primary.fullName,
      fieldChanged: 'Hợp nhất hồ sơ trùng (Merge Duplicate Records)',
      oldValue: `Gộp ${duplicateEmps.length} hồ sơ phụ`,
      newValue: `Hồ sơ chính: ${primary.employeeCode}, tổng ${primary.trainingRecords.length} chứng chỉ, ${primary.onsiteTrainings.length} HLTC`,
      note: `Hợp nhất từ các hồ sơ trùng lặp: ${duplicateEmps.map((d) => `${d.employeeCode} (${d.fullName})`).join(', ')}`,
    });

    // Notify backend if available
    duplicateIds.forEach((dupId) => {
      if (dupId !== primaryId && typeof window !== 'undefined') {
        fetch(`/api/employee/${dupId}`, { method: 'DELETE' }).catch(() => {});
      }
    });

    return primary;
  }

  public deleteEmployeesBatch(ids: string[], user: string = 'Administrator'): number {
    if (!ids || ids.length === 0) return 0;
    const toDeleteSet = new Set(ids);
    const toDeleteEmps = this.employees.filter((e) => toDeleteSet.has(e.id));
    if (toDeleteEmps.length === 0) return 0;

    this.employees = this.employees.filter((e) => !toDeleteSet.has(e.id));
    this.saveEmployees();

    toDeleteEmps.forEach((emp) => {
      this.addAuditLog({
        userName: user,
        employeeId: emp.id,
        employeeName: emp.fullName,
        fieldChanged: 'Xóa hồ sơ nhân viên (Xóa hàng loạt)',
        oldValue: emp.employeeCode,
        newValue: 'Đã xóa khỏi hệ thống',
        note: `Đã xóa trong nhóm ${toDeleteEmps.length} nhân viên được chọn`,
      });
    });

    if (typeof window !== 'undefined') {
      fetch('/api/employees/delete-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(toDeleteSet) }),
      }).catch(() => {});
    }

    return toDeleteEmps.length;
  }

  public deleteAllEmployees(user: string = 'Administrator'): number {
    const count = this.employees.length;
    if (count === 0) return 0;

    this.employees = [];
    this.saveEmployees();

    this.addAuditLog({
      userName: user,
      employeeId: 'ALL',
      employeeName: 'Toàn bộ nhân viên',
      fieldChanged: 'Xóa tất cả nhân viên',
      oldValue: `${count} nhân viên`,
      newValue: '0 nhân viên (Đã xóa toàn bộ CSDL)',
      note: 'Quản trị viên đã thực hiện thao tác xóa toàn bộ hồ sơ nhân sự',
    });

    if (typeof window !== 'undefined') {
      fetch('/api/employees/delete-all', {
        method: 'POST',
      }).catch(() => {});
    }

    return count;
  }

  // --- CERTIFICATE CRUD PER EMPLOYEE ---

  public addCertificate(
    employeeId: string,
    cert: import('../types').TrainingRecord,
    user: string = 'Quản trị viên'
  ): Employee | undefined {
    const emp = this.employees.find((e) => e.id === employeeId);
    if (!emp) return undefined;

    const records = [...(emp.trainingRecords || [])];
    // Assign order if needed
    const newRecord = {
      ...cert,
      order: cert.order || records.length + 1,
    };
    records.push(newRecord);

    const updated = this.updateEmployee(
      employeeId,
      { trainingRecords: records },
      user
    );

    if (typeof window !== 'undefined') {
      fetch(`/api/employee/${employeeId}/certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      }).catch(() => {});
    }

    return updated;
  }

  public updateCertificate(
    employeeId: string,
    cert: import('../types').TrainingRecord,
    user: string = 'Quản trị viên'
  ): Employee | undefined {
    const emp = this.employees.find((e) => e.id === employeeId);
    if (!emp) return undefined;

    const records = (emp.trainingRecords || []).map((c) =>
      c.id === cert.id ? cert : c
    );

    const updated = this.updateEmployee(
      employeeId,
      { trainingRecords: records },
      user
    );

    if (typeof window !== 'undefined') {
      fetch(`/api/employee/${employeeId}/certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cert),
      }).catch(() => {});
    }

    return updated;
  }

  public deleteCertificate(
    employeeId: string,
    certId: string,
    user: string = 'Quản trị viên'
  ): Employee | undefined {
    const emp = this.employees.find((e) => e.id === employeeId);
    if (!emp) return undefined;

    const removedCert = (emp.trainingRecords || []).find((c) => c.id === certId);
    const records = (emp.trainingRecords || []).filter((c) => c.id !== certId);

    const updated = this.updateEmployee(
      employeeId,
      { trainingRecords: records },
      user
    );

    this.addAuditLog({
      userName: user,
      employeeId,
      employeeName: emp.fullName,
      fieldChanged: 'Xóa chứng chỉ / hồ sơ đào tạo',
      oldValue: removedCert?.certificateName || certId,
      newValue: 'Đã xóa chứng chỉ',
      note: 'Xóa chứng chỉ đào tạo của nhân viên',
    });

    if (typeof window !== 'undefined') {
      fetch(`/api/employee/${employeeId}/certificate/${certId}`, {
        method: 'DELETE',
      }).catch(() => {});
    }

    return updated;
  }

  public deleteCertificatesBatch(
    items: Array<{ employeeId: string; certId: string }>,
    user: string = 'Quản trị viên'
  ): number {
    if (!items || items.length === 0) return 0;

    let deletedCount = 0;
    // Group by employeeId
    const byEmp: Record<string, string[]> = {};
    items.forEach(({ employeeId, certId }) => {
      if (!byEmp[employeeId]) byEmp[employeeId] = [];
      byEmp[employeeId].push(certId);
    });

    Object.entries(byEmp).forEach(([empId, certIds]) => {
      const emp = this.employees.find((e) => e.id === empId);
      if (!emp) return;

      const certIdSet = new Set(certIds);
      const remaining = (emp.trainingRecords || []).filter((c) => !certIdSet.has(c.id));
      const countRemoved = (emp.trainingRecords || []).length - remaining.length;
      deletedCount += countRemoved;

      this.updateEmployee(empId, { trainingRecords: remaining }, user);

      if (typeof window !== 'undefined') {
        certIds.forEach((cId) => {
          fetch(`/api/employee/${empId}/certificate/${cId}`, {
            method: 'DELETE',
          }).catch(() => {});
        });
      }
    });

    this.addAuditLog({
      userName: user,
      employeeId: 'BATCH',
      employeeName: 'Nhiều nhân viên',
      fieldChanged: 'Xóa chứng chỉ hàng loạt',
      oldValue: `${items.length} chứng chỉ được chọn`,
      newValue: 'Đã xóa khỏi hệ thống',
      note: `Xóa thành công ${deletedCount} chứng chỉ`,
    });

    return deletedCount;
  }

  public deleteAllCertificates(user: string = 'Quản trị viên'): number {
    let count = 0;
    this.employees.forEach((emp) => {
      count += (emp.trainingRecords || []).length;
      emp.trainingRecords = [];
    });
    this.saveEmployees();

    this.addAuditLog({
      userName: user,
      employeeId: 'ALL',
      employeeName: 'Toàn bộ nhân viên',
      fieldChanged: 'Xóa tất cả chứng chỉ & đào tạo',
      oldValue: `${count} chứng chỉ`,
      newValue: '0 chứng chỉ',
      note: 'Xóa toàn bộ chứng chỉ và đào tạo trong hệ thống',
    });

    return count;
  }

  public async fetchEmployeeByTokenRemote(token: string): Promise<Employee | undefined> {
    try {
      const res = await fetch(`/api/employee-by-token/${encodeURIComponent(token.trim().toUpperCase())}`);
      if (res.ok) {
        const data = await res.json();
        // 1. Sync settings so mobile device gets server settings in real-time
        if (data && data.settings) {
          this.settings = { ...this.settings, ...data.settings };
          try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
          } catch (err) {}
          this.notify();
        }
        // 2. Sync employee
        if (data && data.employee) {
          const emp = data.employee as Employee;
          const idx = this.employees.findIndex((e) => e.id === emp.id);
          if (idx >= 0) {
            this.employees[idx] = emp;
          } else {
            this.employees.unshift(emp);
          }
          try {
            localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(this.employees));
          } catch (err) {}
          this.notify();
          return emp;
        }
      }
    } catch (e) {
      console.warn('Could not fetch token remotely:', e);
    }
    return this.getEmployeeByToken(token);
  }

  // --- LOGGING API ---

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLog: AuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formattedDate,
    };

    this.auditLogs.unshift(newLog);
    // Keep max 200 logs
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
    this.saveAuditLogs();

    if (typeof window !== 'undefined') {
      fetch('/api/audit-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      }).catch(() => {});
    }
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public logQrAccess(token: string, metadata?: Partial<QrAccessLog>) {
    const emp = this.getEmployeeByToken(token);
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const userAgent = navigator.userAgent;
    let device = 'Desktop';
    if (/Mobi|Android/i.test(userAgent)) {
      device = 'Điện thoại di động (Mobile)';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      device = 'Máy tính bảng (Tablet)';
    }

    let browser = 'Trình duyệt Web';
    if (userAgent.includes('Chrome')) browser = 'Google Chrome';
    else if (userAgent.includes('Safari')) browser = 'Apple Safari';
    else if (userAgent.includes('Firefox')) browser = 'Mozilla Firefox';

    const newLog: QrAccessLog = {
      id: `qr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formattedDate,
      employeeId: emp ? emp.id : 'unknown',
      employeeName: emp ? emp.fullName : `Không tìm thấy (Token: ${token})`,
      publicToken: token,
      deviceType: metadata?.deviceType || device,
      browser: metadata?.browser || browser,
      ipAddress: metadata?.ipAddress || 'Mạng nội bộ / Khu bay SKYPEC',
    };

    this.qrLogs.unshift(newLog);
    if (this.qrLogs.length > 200) {
      this.qrLogs = this.qrLogs.slice(0, 200);
    }
    this.saveQrLogs();

    if (typeof window !== 'undefined') {
      fetch('/api/qr-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      }).catch(() => {});
    }
  }

  public getQrLogs(): QrAccessLog[] {
    return [...this.qrLogs];
  }

  // --- SETTINGS API ---

  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<SystemSettings>, user: string = 'Administrator'): SystemSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    this.addAuditLog({
      userName: user,
      employeeId: 'SYSTEM',
      employeeName: 'Cấu hình hệ thống',
      fieldChanged: 'Thay đổi tham số hệ thống',
      oldValue: 'Tham số cũ',
      newValue: JSON.stringify(newSettings),
      note: 'Cập nhật cấu hình cảnh báo / bảo vệ CCCD',
    });

    return this.settings;
  }

  public resetToDemoData(user: string = 'Administrator') {
    this.employees = INITIAL_EMPLOYEES;
    this.settings = INITIAL_SETTINGS;
    this.saveEmployees();
    this.saveSettings();

    this.addAuditLog({
      userName: user,
      employeeId: 'SYSTEM',
      employeeName: 'Cơ sở dữ liệu',
      fieldChanged: 'Khôi phục dữ liệu mẫu',
      oldValue: '—',
      newValue: '10 hồ sơ nhân viên hàng không chuẩn SKYPEC',
      note: 'Reset dữ liệu về trạng thái mẫu',
    });
  }
}

export const storageService = new StorageService();
