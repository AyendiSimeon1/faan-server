// src/services/payment.gateway.service.ts
// This would integrate with Stripe, Paystack, etc.

export interface ChargeCardOptions {
  amount: number; // In smallest currency unit (e.g., kobo, cents)
  currency: string;
  source?: string; // Card token or payment method ID from gateway
  customerId?: string; // Gateway customer ID
  email: string;
  reference: string; // Your internal unique reference
  metadata?: Record<string, any>;
}

export interface ChargeResult {
  successful: boolean;
  gatewayReference?: string;
  message?: string;
  authorizationUrl?: string; // For 3DS or other redirect flows
  receiptUrl?: string;
  rawResponse?: any;
}

export class PaymentGatewayService {
  static async chargeCard(options: ChargeCardOptions): Promise<ChargeResult> {
    console.log(`[Payment Gateway] Attempting to charge ${options.amount} ${options.currency} for ref: ${options.reference}`);
    // TODO: Integrate with actual payment gateway
    // Simulate success for now
    if (options.amount > 0) {
      return {
        successful: true,
        gatewayReference: `gw_${Date.now()}`,
        message: "Payment successful (simulated)",
        receiptUrl: `https://example.com/receipt/${options.reference}`,
        rawResponse: { simulated: true },
      };
    }
    return { successful: false, message: "Invalid amount (simulated)" };
  }

  static async createCustomer(email: string, name: string): Promise<{ customerId: string } | null> {
    console.log(`[Payment Gateway] Creating customer for ${email}`);
    // TODO: Integrate
    return { customerId: `cus_${Date.now()}`};
  }

  static async addPaymentMethodToCustomer(customerId: string, paymentMethodToken: string): Promise<{ paymentMethodId: string; cardLast4: string; cardBrand: string; expMonth: number; expYear: number } | null> {
    console.log(`[Payment Gateway] Adding payment method to customer ${customerId}`);
    // TODO: Integrate
    return { paymentMethodId: `pm_${Date.now()}`, cardLast4: "4242", cardBrand: "visa", expMonth: 12, expYear: 2030};
  }
}