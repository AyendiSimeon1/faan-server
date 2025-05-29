export declare enum UserRole {
    USER = "user",
    GUEST = "guest",// For sessions initiated without login
    ADMIN = "admin",
    AGENT = "agent"
}
export declare enum OtpType {
    EMAIL_VERIFICATION = "email_verification",
    PASSWORD_RESET = "password_reset",
    LOGIN_2FA = "login_2fa"
}
export declare enum ParkingSessionStatus {
    ACTIVE = "active",
    PENDING_PAYMENT = "pending_payment",// User is about to pay
    COMPLETED = "completed",// Paid and exited
    CANCELLED = "cancelled",
    PAID_BY_AGENT = "paid_by_agent",
    LOADING_EXIT = "loading_exit"
}
export declare enum PaymentMethodType {
    CARD = "card",
    WALLET = "wallet",
    AGENT_POS = "agent_pos"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    SUCCESSFUL = "successful",
    FAILED = "failed",
    REFUNDED = "refunded"
}
export declare enum CardProvider {
    VISA = "visa",
    MASTERCARD = "mastercard",
    PAYPAL = "paypal"
}
export declare enum WalletTransactionType {
    DEPOSIT = "deposit",// Top-up
    WITHDRAWAL = "withdrawal",// Not in mockups, but good to consider
    PARKING_FEE = "parking_fee",
    REFUND = "refund",
    ADJUSTMENT = "adjustment"
}
export declare enum TransactionHistoryStatus {
    ALL = "all",
    SUCCESSFUL = "successful",
    PENDING = "pending",
    FAILED = "failed"
}
