import axios from 'axios';
import { config } from '../config';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export interface ChargeCardOptions {
  amount: number; // In smallest currency unit (naira)
  currency?: string; // Default to NGN
  email: string;
  reference?: string; // Optional - will be generated if not provided
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
  private static paystackApi = axios.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: {
      Authorization: `Bearer sk_test_97e94ee550b9583d662dde51107b3a915b696872`,
      'Content-Type': 'application/json'
    }
  });

  static async chargeCard(options: ChargeCardOptions): Promise<ChargeResult> {
    try {
      const response = await this.paystackApi.post('/transaction/initialize', {
        amount: options.amount * 100, // Convert to kobo
        email: options.email,
        reference: options.reference || `ref_${Date.now()}`,
        metadata: options.metadata,
        callback_url: config.PAYSTACK_CALLBACK_URL
      });

      const data = response.data.data;
      return {
        successful: true,
        gatewayReference: data.reference,
        message: 'Payment initialization successful',
        authorizationUrl: data.authorization_url,
        rawResponse: response.data
      };
    } catch (error: any) {
      return {
        successful: false,
        message: error.response?.data?.message || 'Payment initialization failed',
        rawResponse: error.response?.data
      };
    }
  }
  static async verifyTransaction(reference: string): Promise<{
    successful: boolean;
    amount?: number;
    metadata?: any;
    message?: string;
  }> {
    try {
      const response = await this.paystackApi.get(`/transaction/verify/${reference}`);
      const data = response.data.data;
      
      return {
        successful: data.status === 'success',
        amount: data.amount / 100, // Convert from kobo to naira
        metadata: data.metadata,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        successful: false,
        message: error.response?.data?.message || 'Transaction verification failed'
      };
    }
  }

  static async createCustomer(email: string, name: string): Promise<{ customerId: string } | null> {
    try {
      const response = await this.paystackApi.post('/customer', {
        email,
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ')
      });

      return {
        customerId: response.data.data.customer_code
      };
    } catch (error) {
      console.error('Failed to create customer:', error);
      return null;
    }
  }
}