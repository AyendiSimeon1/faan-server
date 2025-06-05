import QRCode from 'qrcode';
import crypto from 'crypto';

export interface IQRCodeData {
  locationId: string;
  spotId?: string;
  code: string;
  timestamp: number;
}

export class QRCodeService {
  // Generate a unique code for a parking location/spot
  static generateUniqueCode(locationId: string, spotId?: string): string {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(4).toString('hex');
    return `${locationId}_${spotId || 'any'}_${timestamp}_${randomBytes}`;
  }

  // Generate QR code data
  static generateQRCodeData(locationId: string, spotId?: string): IQRCodeData {
    return {
      locationId,
      spotId,
      code: this.generateUniqueCode(locationId, spotId),
      timestamp: Date.now()
    };
  }

  // Generate QR code as data URL
  static async generateQRCodeDataURL(data: IQRCodeData): Promise<string> {
    const jsonString = JSON.stringify(data);
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(jsonString, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300
      });
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error}`);
    }
  }

  // Verify if a QR code is valid and not expired
  static verifyQRCode(qrData: IQRCodeData): boolean {
    const now = Date.now();
    const validityPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
    return (now - qrData.timestamp) <= validityPeriod;
  }

  // Parse QR code data from string
  static parseQRCodeData(qrString: string): IQRCodeData {
    try {
      return JSON.parse(qrString) as IQRCodeData;
    } catch (error) {
      throw new Error('Invalid QR code data format');
    }
  }
}
