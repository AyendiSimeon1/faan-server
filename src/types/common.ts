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
  CANCELLED = 'cancelled',
  PAID_BY_AGENT = 'paid_by_agent',
  LOADING_EXIT = 'loading_exit', // Corresponds to auto-debit loading screen
}

export enum PaymentMethodType {
  CARD = 'card',
  WALLET = 'wallet',
  AGENT_POS = 'agent_pos',
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum CardProvider {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  PAYPAL = 'paypal', // Though not a card, it's a payment option
  // Add others like AMEX, DISCOVER
}

export enum WalletTransactionType {
  DEPOSIT = 'deposit', // Top-up
  WITHDRAWAL = 'withdrawal', // Not in mockups, but good to consider
  PARKING_FEE = 'parking_fee',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment', // For admin corrections
}

export enum TransactionHistoryStatus {
    ALL = 'all',
    SUCCESSFUL = 'successful',
    PENDING = 'pending',
    FAILED = 'failed',
}

// Other enums as needed