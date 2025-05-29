export interface ChargeCardOptions {
    amount: number;
    currency: string;
    source?: string;
    customerId?: string;
    email: string;
    reference: string;
    metadata?: Record<string, any>;
}
export interface ChargeResult {
    successful: boolean;
    gatewayReference?: string;
    message?: string;
    authorizationUrl?: string;
    receiptUrl?: string;
    rawResponse?: any;
}
export declare class PaymentGatewayService {
    static chargeCard(options: ChargeCardOptions): Promise<ChargeResult>;
    static createCustomer(email: string, name: string): Promise<{
        customerId: string;
    } | null>;
    static addPaymentMethodToCustomer(customerId: string, paymentMethodToken: string): Promise<{
        paymentMethodId: string;
        cardLast4: string;
        cardBrand: string;
        expMonth: number;
        expYear: number;
    } | null>;
}
