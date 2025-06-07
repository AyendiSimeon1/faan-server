// common/types.ts (or a similar shared location)
export enum UserRole {
  USER = 'user',
  GUEST = 'guest', // For sessions initiated without login
  ADMIN = 'admin',
  AGENT = 'agent', // For parking attendants
}

export enum OtpType {
  
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  LOGIN_2FA = 'login_2fa',
}

export enum ParkingSessionStatus {
  ACTIVE = 'active',
  PENDING_PAYMENT = 'pending_payment', // User is about to pay
  COMPLETED = 'completed', // Paid and exited
  ENDED = 'ended', // Session ended, pending payment
  CANCELLED = 'cancelled',
  PAID_BY_AGENT = 'paid_by_agent',
  LOADING_EXIT = "LOADING_EXIT"
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum PaymentMethodType {
  CARD = 'card',
  WALLET = 'wallet',
  AGENT_POS = 'agent_pos'
}

export enum CardProvider {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  PAYPAL = 'paypal'
}

export enum WalletTransactionType {
  DEPOSIT = 'deposit', // Top-up
  WITHDRAWAL = 'withdrawal',
  PARKING_FEE = 'parking_fee',
  REFUND = 'refund',
  CREDIT = 'credit',
  DEBIT = 'debit',
  ADJUSTMENT = 'adjustment' // For admin corrections
}

export enum TransactionHistoryStatus {
    ALL = 'all',
    SUCCESSFUL = 'successful',
    PENDING = 'pending',
    FAILED = 'failed',
}

// Other enums as needed