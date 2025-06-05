export interface StartSessionByQrDto {
  qrData: string; // The scanned QR code data
  vehicleType?: string; // Optional, can be fetched from user's default if not provided
  plateNumber?: string; // Optional, can be fetched from user's default vehicle
}

export interface StartSessionByPlateDto {
  plateNumber: string;
  vehicleType?: string;
  // May also include parkingLocationId if user selects it manually
}

export interface EndSessionDto {
  sessionId: string;
  paymentMethodId?: string; // For card payment
  paymentMethodType: 'card' | 'wallet'; // from UI
}