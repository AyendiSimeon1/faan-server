"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionHistoryStatus = exports.WalletTransactionType = exports.CardProvider = exports.PaymentMethodType = exports.PaymentStatus = exports.ParkingSessionStatus = exports.OtpType = exports.UserRole = void 0;
// common/types.ts (or a similar shared location)
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["GUEST"] = "guest";
    UserRole["ADMIN"] = "admin";
    UserRole["AGENT"] = "agent";
})(UserRole || (exports.UserRole = UserRole = {}));
var OtpType;
(function (OtpType) {
    OtpType["EMAIL_VERIFICATION"] = "email_verification";
    OtpType["PASSWORD_RESET"] = "password_reset";
    OtpType["LOGIN_2FA"] = "login_2fa";
})(OtpType || (exports.OtpType = OtpType = {}));
var ParkingSessionStatus;
(function (ParkingSessionStatus) {
    ParkingSessionStatus["ACTIVE"] = "active";
    ParkingSessionStatus["PENDING_PAYMENT"] = "pending_payment";
    ParkingSessionStatus["COMPLETED"] = "completed";
    ParkingSessionStatus["ENDED"] = "ended";
    ParkingSessionStatus["CANCELLED"] = "cancelled";
    ParkingSessionStatus["PAID_BY_AGENT"] = "paid_by_agent";
    ParkingSessionStatus["LOADING_EXIT"] = "LOADING_EXIT";
})(ParkingSessionStatus || (exports.ParkingSessionStatus = ParkingSessionStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["SUCCESSFUL"] = "successful";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CARD"] = "card";
    PaymentMethodType["WALLET"] = "wallet";
    PaymentMethodType["AGENT_POS"] = "agent_pos";
})(PaymentMethodType || (exports.PaymentMethodType = PaymentMethodType = {}));
var CardProvider;
(function (CardProvider) {
    CardProvider["VISA"] = "visa";
    CardProvider["MASTERCARD"] = "mastercard";
    CardProvider["PAYPAL"] = "paypal";
})(CardProvider || (exports.CardProvider = CardProvider = {}));
var WalletTransactionType;
(function (WalletTransactionType) {
    WalletTransactionType["DEPOSIT"] = "deposit";
    WalletTransactionType["WITHDRAWAL"] = "withdrawal";
    WalletTransactionType["PARKING_FEE"] = "parking_fee";
    WalletTransactionType["REFUND"] = "refund";
    WalletTransactionType["CREDIT"] = "credit";
    WalletTransactionType["DEBIT"] = "debit";
    WalletTransactionType["ADJUSTMENT"] = "adjustment"; // For admin corrections
})(WalletTransactionType || (exports.WalletTransactionType = WalletTransactionType = {}));
var TransactionHistoryStatus;
(function (TransactionHistoryStatus) {
    TransactionHistoryStatus["ALL"] = "all";
    TransactionHistoryStatus["SUCCESSFUL"] = "successful";
    TransactionHistoryStatus["PENDING"] = "pending";
    TransactionHistoryStatus["FAILED"] = "failed";
})(TransactionHistoryStatus || (exports.TransactionHistoryStatus = TransactionHistoryStatus = {}));
// Other enums as needed
//# sourceMappingURL=common.js.map