/**
 * SKYPEC - Hệ Thống Quản Lý Lý Lịch & QR Nhân Viên Hàng Không
 * Ứng dụng số hóa hồ sơ người lao động với mã QR cố định
 */
import React, { useState, useEffect } from 'react';
import { Employee, SystemSettings } from './types';
import { storageService } from './services/storageService';
import { Sidebar, NavigationPage } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { EmployeeList } from './components/employees/EmployeeList';
import { TrainingManager } from './components/training/TrainingManager';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { QrLogsView } from './components/qr-logs/QrLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { EmployeeFormModal } from './components/employees/EmployeeFormModal';
import { ExcelImportModal } from './components/employees/ExcelImportModal';
import { MandatoryTestRunnerModal } from './components/test-runner/MandatoryTestRunnerModal';
import { ArchitectureDocsModal } from './components/docs/ArchitectureDocsModal';
import { PublicProfileView } from './components/profile/PublicProfileView';
import { OfficialResumePrintView } from './components/profile/OfficialResumePrintView';
import { QrScannerModal } from './components/scanner/QrScannerModal';
import { LoginView } from './components/auth/LoginView';
import { getCertificateStatus, extractToken } from './utils/helpers';

export default function App() {
  // Authentication State (read from persisted storage on startup)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem('skypec_auth_session') || sessionStorage.getItem('skypec_auth_session');
      return !!s;
    } catch {
      return false;
    }
  });
  const [authUser, setAuthUser] = useState<string>(() => {
    try {
      const s = localStorage.getItem('skypec_auth_session') || sessionStorage.getItem('skypec_auth_session');
      if (s) {
        const parsed = JSON.parse(s);
        return parsed.username || parsed.user || 'admin';
      }
    } catch {}
    return 'admin';
  });

  const handleLogout = () => {
    try {
      localStorage.removeItem('skypec_auth_session');
      sessionStorage.removeItem('skypec_auth_session');
    } catch (e) {
      // ignore
    }
    setIsAuthenticated(false);
  };

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(storageService.getSettings());
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');

  // URL / QR Scan Routing
  const [scannedToken, setScannedToken] = useState<string | null>(null);

  // Modals
  const [showEmployeeForm, setShowEmployeeForm] = useState<boolean>(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showTestRunner, setShowTestRunner] = useState<boolean>(false);
  const [showDocsModal, setShowDocsModal] = useState<boolean>(false);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);

  // Official PDF Print Preview
  const [viewingPdfEmployee, setViewingPdfEmployee] = useState<Employee | null>(null);

  // Function to inspect current window URL and resolve any token
  const parseTokenFromUrl = (): string | null => {
    // 1. Check pathname (e.g. /q/A7K9X2M8)
    const path = window.location.pathname;
    if (path.includes('/q/')) {
      const t = extractToken(path);
      if (t) return t;
    }

    // 2. Check query params (e.g. ?token=A7K9X2M8 or ?q=A7K9X2M8)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token') || urlParams.get('q') || urlParams.get('id');
    if (tokenParam) {
      const t = extractToken(tokenParam);
      if (t) return t;
    }

    // 3. Check hash (e.g. #q/A7K9X2M8 or #/q/A7K9X2M8)
    const hash = window.location.hash;
    if (hash.includes('q/')) {
      const t = extractToken(hash);
      if (t) return t;
    }

    return null;
  };

  // Load state and subscribe to changes
  useEffect(() => {
    const updateData = () => {
      setEmployees(storageService.getEmployees());
      setSettings(storageService.getSettings());
    };

    updateData();
    const unsubscribe = storageService.subscribe(updateData);

    // Always fetch fresh synchronized data from server on startup
    storageService.syncFromServer();

    // Initial check for QR scan token from URL
    const detectedToken = parseTokenFromUrl();
    if (detectedToken) {
      setScannedToken(detectedToken);
      storageService.logQrAccess(detectedToken);
      storageService.fetchEmployeeByTokenRemote(detectedToken).then((remoteEmp) => {
        if (remoteEmp) {
          setEmployees(storageService.getEmployees());
          setSettings(storageService.getSettings());
        }
      });
    }

    // Listen to browser navigation (back/forward)
    const handleLocationChange = () => {
      const t = parseTokenFromUrl();
      setScannedToken(t);
      if (t) {
        storageService.logQrAccess(t);
        storageService.fetchEmployeeByTokenRemote(t).then((remoteEmp) => {
          if (remoteEmp) {
            setEmployees(storageService.getEmployees());
            setSettings(storageService.getSettings());
          }
        });
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Compute expiring certificates count for badges
  const expiringCount = employees.reduce((total, emp) => {
    return (
      total +
      emp.trainingRecords.filter(
        (tr) => getCertificateStatus(tr.expiryDate, settings.warningDays).status === 'expiring'
      ).length
    );
  }, 0);

  // --- HANDLERS ---

  const handleOpenPdfView = (emp: Employee) => {
    setViewingPdfEmployee(emp);
  };

  const handleOpenPublicScanView = (tokenOrUrl: string) => {
    const clean = extractToken(tokenOrUrl) || tokenOrUrl.trim();
    setScannedToken(clean);
    storageService.logQrAccess(clean);
    // Update browser URL without reloading
    try {
      const newUrl = `${window.location.origin}/?token=${encodeURIComponent(clean)}`;
      window.history.pushState({ token: clean }, '', newUrl);
    } catch (e) {
      // ignore in iframe
    }
  };

  const handleEditEmployee = (emp: Employee) => {
    setEmployeeToEdit(emp);
    setShowEmployeeForm(true);
  };

  const handleDeleteEmployee = (emp: Employee) => {
    storageService.deleteEmployee(emp.id, 'Quản trị viên');
    setEmployees(storageService.getEmployees());
    if (viewingPdfEmployee && viewingPdfEmployee.id === emp.id) {
      setViewingPdfEmployee(null);
    }
    if (scannedToken) {
      setScannedToken(null);
    }
  };

  const handleDeleteBatch = (ids: string[]) => {
    storageService.deleteEmployeesBatch(ids, 'Quản trị viên');
    setEmployees(storageService.getEmployees());
    if (viewingPdfEmployee && ids.includes(viewingPdfEmployee.id)) {
      setViewingPdfEmployee(null);
    }
  };

  const handleDeleteAll = () => {
    storageService.deleteAllEmployees('Quản trị viên');
    setEmployees(storageService.getEmployees());
    setViewingPdfEmployee(null);
    setScannedToken(null);
  };

  const handleAddEmployee = () => {
    setEmployeeToEdit(null);
    setShowEmployeeForm(true);
  };

  const handleEmployeeSaved = (savedEmp: Employee) => {
    setEmployees(storageService.getEmployees());
    setShowEmployeeForm(false);
    setEmployeeToEdit(null);
  };

  // 1. Priority 1: When scanning QR (or URL has token), display Employee Resume directly without login!
  if (scannedToken) {
    const matchedEmployee = storageService.getEmployeeByToken(scannedToken) || null;
    return (
      <>
        <PublicProfileView
          employee={matchedEmployee}
          token={scannedToken}
          settings={settings}
          onAdminLogin={() => {
            setScannedToken(null);
            // clean URL query to root
            try {
              window.history.pushState({}, '', window.location.origin + '/');
            } catch (e) {
              // ignore
            }
          }}
          onEditEmployee={isAuthenticated ? handleEditEmployee : undefined}
          onDeleteEmployee={isAuthenticated ? handleDeleteEmployee : undefined}
        />
        {/* Render EmployeeFormModal if authenticated admin edits while in QR view */}
        {isAuthenticated && showEmployeeForm && (
          <EmployeeFormModal
            isOpen={showEmployeeForm}
            onClose={() => {
              setShowEmployeeForm(false);
              setEmployeeToEdit(null);
            }}
            employeeToEdit={employeeToEdit}
            onSaved={handleEmployeeSaved}
            onOpenPdfView={handleOpenPdfView}
            onOpenImportModal={() => setShowImportModal(true)}
          />
        )}
      </>
    );
  }

  // 2. Priority 2: Official 1:1 PDF Print View (available when authenticated)
  if (viewingPdfEmployee) {
    return (
      <OfficialResumePrintView
        employee={viewingPdfEmployee}
        onBack={() => setViewingPdfEmployee(null)}
        maskIdCard={false} // Internal admin print has full CCCD
        onOpenPublicScanView={handleOpenPublicScanView}
        onEditEmployee={(emp) => {
          setViewingPdfEmployee(null);
          handleEditEmployee(emp);
        }}
        onDeleteEmployee={handleDeleteEmployee}
      />
    );
  }

  // 3. Priority 3: For all management access, require Admin Login (admin / skypec@123)
  if (!isAuthenticated) {
    return (
      <>
        <LoginView
          settings={settings}
          onLoginSuccess={(user) => {
            setIsAuthenticated(true);
            setAuthUser(user);
          }}
          onOpenScanner={() => setShowScannerModal(true)}
        />

        {showScannerModal && (
          <QrScannerModal
            isOpen={true}
            onClose={() => setShowScannerModal(false)}
            onScanSuccess={(token) => {
              setShowScannerModal(false);
              handleOpenPublicScanView(token);
            }}
            employees={employees}
          />
        )}
      </>
    );
  }

  // Admin Dashboard and Management Shell
  return (
    <div className="flex h-screen bg-[#F7F9FA] text-slate-800 font-sans overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenTestRunner={() => setShowTestRunner(true)}
        onOpenDocs={() => setShowDocsModal(true)}
        onOpenScannerModal={() => setShowScannerModal(true)}
        employeeCount={employees.length}
        expiringCertCount={expiringCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          settings={settings}
          employees={employees}
          onOpenTestRunner={() => setShowTestRunner(true)}
          onOpenPublicScanView={handleOpenPublicScanView}
          onOpenDocs={() => setShowDocsModal(true)}
          onOpenScannerModal={() => setShowScannerModal(true)}
          onLogout={handleLogout}
          username={authUser}
          expiringCertCount={expiringCount}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && (
              <Dashboard
                employees={employees}
                settings={settings}
                onNavigateToEmployees={() => setCurrentPage('employees')}
                onNavigateToCertificates={() => setCurrentPage('training')}
                onAddEmployee={handleAddEmployee}
                onOpenImportModal={() => setShowImportModal(true)}
                onOpenTestRunner={() => setShowTestRunner(true)}
                onOpenPdfView={handleOpenPdfView}
              />
            )}

            {currentPage === 'employees' && (
              <EmployeeList
                employees={employees}
                settings={settings}
                onEditEmployee={handleEditEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onDeleteBatch={handleDeleteBatch}
                onDeleteAll={handleDeleteAll}
                onAddEmployee={handleAddEmployee}
                onOpenPdfView={handleOpenPdfView}
                onOpenPublicScanView={handleOpenPublicScanView}
                onOpenImportModal={() => setShowImportModal(true)}
                onOpenTestRunner={() => setShowTestRunner(true)}
              />
            )}

            {currentPage === 'training' && (
              <TrainingManager
                employees={employees}
                settings={settings}
                onOpenEmployee={(emp) => handleEditEmployee(emp)}
                onCertificatesChanged={() => setEmployees(storageService.getEmployees())}
              />
            )}

            {currentPage === 'audit' && (
              <AuditLogsView logs={storageService.getAuditLogs()} />
            )}

            {currentPage === 'qr-logs' && (
              <QrLogsView logs={storageService.getQrLogs()} />
            )}

            {currentPage === 'settings' && (
              <SettingsView
                settings={settings}
                onSettingsUpdated={(newSettings) => setSettings(newSettings)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals & Dialogs */}
      {showEmployeeForm && (
        <EmployeeFormModal
          isOpen={true}
          onClose={() => {
            setShowEmployeeForm(false);
            setEmployeeToEdit(null);
          }}
          employeeToEdit={employeeToEdit}
          onSaved={(savedEmp) => {
            setEmployees(storageService.getEmployees());
          }}
          onOpenPdfView={handleOpenPdfView}
          onOpenImportModal={() => setShowImportModal(true)}
          onOpenPublicScanView={handleOpenPublicScanView}
        />
      )}

      {showImportModal && (
        <ExcelImportModal
          isOpen={true}
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            setEmployees(storageService.getEmployees());
            setCurrentPage('employees');
          }}
        />
      )}

      {showTestRunner && (
        <MandatoryTestRunnerModal
          isOpen={true}
          onClose={() => setShowTestRunner(false)}
          onOpenEmployeeResume={(emp) => handleOpenPdfView(emp)}
        />
      )}

      {showDocsModal && (
        <ArchitectureDocsModal
          isOpen={true}
          onClose={() => setShowDocsModal(false)}
        />
      )}

      {showScannerModal && (
        <QrScannerModal
          isOpen={true}
          onClose={() => setShowScannerModal(false)}
          onScanSuccess={handleOpenPublicScanView}
          employees={employees}
        />
      )}
    </div>
  );
}
