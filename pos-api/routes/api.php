<?php

use App\Http\Controllers\Api\AccountingController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\BusinessSettingsController;
use App\Http\Controllers\Api\CashBookController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DebtorController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ManagerDashboardController;
use App\Http\Controllers\Api\ModuleController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentProofController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\RemoteOrderController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\SmsController;
use App\Http\Controllers\Api\StaffDashboardController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TillController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/signup', [AuthController::class, 'signup']);

Route::middleware('auth.session')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/me', [AuthController::class, 'updateMe']);
    Route::patch('/me/theme', [AuthController::class, 'updateTheme']);
    Route::get('/modules', [ModuleController::class, 'index']);
    Route::get('/branches', [BranchController::class, 'index']);
    Route::get('/branches/list', [BranchController::class, 'list']);
    Route::post('/branches', [BranchController::class, 'store']);
    Route::patch('/branches/{branch}', [BranchController::class, 'update']);
    Route::post('/branches/{branch}/status', [BranchController::class, 'setStatus']);
    Route::get('/branches/{branch}/dashboard', [BranchController::class, 'dashboard']);
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Inventory
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/summary', [ProductController::class, 'summary']);
    Route::get('/products/analytics', [ProductController::class, 'analytics']);
    Route::get('/products/expiring', [ProductController::class, 'expiring']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::patch('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    Route::get('/categories', [CategoryController::class, 'index']);

    // POS / Sales
    Route::get('/sales', [SaleController::class, 'index']);
    Route::get('/sales/stats', [SaleController::class, 'stats']);
    Route::get('/sales/analytics', [SaleController::class, 'analytics']);
    Route::get('/sales/receipt', [SaleController::class, 'receipt']);
    Route::post('/sales', [SaleController::class, 'store']);
    Route::get('/remote-orders', [RemoteOrderController::class, 'index']);
    Route::post('/remote-orders/complete', [RemoteOrderController::class, 'complete']);
    Route::post('/remote-orders/{remoteOrder}/cancel', [RemoteOrderController::class, 'cancel']);
    Route::get('/payment-proofs', [PaymentProofController::class, 'index']);
    Route::post('/payment-proofs', [PaymentProofController::class, 'store']);
    Route::post('/payment-proofs/{paymentProof}/review', [PaymentProofController::class, 'review']);
    Route::get('/tills', [TillController::class, 'index']);
    Route::post('/tills', [TillController::class, 'store']);
    Route::get('/till-removals', [TillController::class, 'removals']);
    Route::post('/tills/remove-cash', [TillController::class, 'removeCash']);

    // Procurement
    Route::get('/suppliers', [SupplierController::class, 'index']);
    Route::post('/suppliers', [SupplierController::class, 'store']);
    Route::patch('/suppliers/{supplier}', [SupplierController::class, 'update']);
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy']);
    Route::post('/suppliers/{supplier}/pay', [SupplierController::class, 'pay']);
    Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
    Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);
    Route::get('/purchase-orders/{purchaseOrder}/items', [PurchaseOrderController::class, 'items']);
    Route::post('/purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive']);
    Route::post('/purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::patch('/customers/{customer}', [CustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
    Route::get('/customers/{customer}/file', [CustomerController::class, 'file']);
    Route::get('/debtors', [DebtorController::class, 'index']);
    Route::post('/debtors', [DebtorController::class, 'store']);
    Route::post('/debtors/{debtor}/pay', [DebtorController::class, 'pay']);
    Route::get('/debtors/{debtor}/payments', [DebtorController::class, 'payments']);
    Route::delete('/debtors/{debtor}', [DebtorController::class, 'destroy']);

    // HR
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::get('/employees/unlinked-users', [EmployeeController::class, 'unlinkedUsers']);
    Route::get('/employees/{employee}', [EmployeeController::class, 'show']);
    Route::patch('/employees/{employee}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy']);

    // Attendance
    Route::get('/attendance/today', [AttendanceController::class, 'today']);
    Route::post('/attendance/clock-in', [AttendanceController::class, 'clockIn']);
    Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut']);
    Route::get('/attendance/board', [AttendanceController::class, 'board']);
    Route::get('/attendance/history', [AttendanceController::class, 'history']);
    Route::get('/attendance/roster', [AttendanceController::class, 'roster']);
    Route::post('/attendance/employees/{employee}/pin', [AttendanceController::class, 'setPin']);
    Route::post('/attendance/pin-clock', [AttendanceController::class, 'pinClock']);
    Route::post('/attendance/correction', [AttendanceController::class, 'correction']);

    // Payroll
    Route::get('/payroll', [PayrollController::class, 'index']);
    Route::post('/payroll/generate', [PayrollController::class, 'generate']);
    Route::post('/payroll', [PayrollController::class, 'upsert']);
    Route::post('/payroll/{payrollRecord}/mark-paid', [PayrollController::class, 'markPaid']);
    Route::get('/payroll/{payrollRecord}', [PayrollController::class, 'show']);

    // Accounting
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::get('/cash-book', [CashBookController::class, 'index']);
    Route::post('/cash-book', [CashBookController::class, 'store']);
    Route::get('/accounting/trial-balance', [AccountingController::class, 'trialBalance']);
    Route::get('/accounting/balance-sheet', [AccountingController::class, 'balanceSheet']);
    Route::get('/accounting/income-statement', [AccountingController::class, 'incomeStatement']);
    Route::get('/accounting/accounts', [AccountingController::class, 'accounts']);
    Route::post('/accounting/accounts', [AccountingController::class, 'createAccount']);
    Route::get('/accounting/accounts/{ledgerAccount}/ledger', [AccountingController::class, 'ledger']);

    // Reports
    Route::get('/reports/summary', [ReportController::class, 'summary']);
    Route::get('/reports/generate', [ReportController::class, 'generate']);

    // Notifications / order alerts
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/count', [NotificationController::class, 'count']);
    Route::post('/notifications/dismiss', [NotificationController::class, 'dismiss']);
    Route::post('/notifications/snooze', [NotificationController::class, 'snooze']);

    // SMS centre
    Route::get('/sms', [SmsController::class, 'index']);
    Route::post('/sms/send', [SmsController::class, 'send']);

    // Manager view
    Route::get('/manager-dashboard', [ManagerDashboardController::class, 'index']);

    // Staff view
    Route::get('/staff-dashboard', [StaffDashboardController::class, 'index']);

    // Business settings
    Route::get('/business-settings', [BusinessSettingsController::class, 'show']);
    Route::patch('/business-settings', [BusinessSettingsController::class, 'update']);
    Route::get('/subscription', [BusinessSettingsController::class, 'subscription']);
});
