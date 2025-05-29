export interface StartSessionByQrDto {
  qrCodeId: string;
  vehicleType?: string; // Optional, can be fetched from user's default if not provided
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