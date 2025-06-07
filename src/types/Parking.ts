export interface StartSessionByQrDto {
  qrData: string; // The scanned QR code data
  vehicleType?: string; // Optional, can be fetched from user's default if not provided
  plateNumber?: string; // Optional, can be fetched from user's default vehicle
  displayPlateNumber?: string; // Original format for display
}

export interface StartSessionByPlateDto {
  plateNumber: string;
  vehicleType?: string;
  displayPlateNumber?: string; // Original format for display
  // May also include parkingLocationId if user selects it manually
}

export interface EndSessionDto {
  plateNumber: string;
  displayPlateNumber?: string; // Original format for display
  paymentMethodId?: string; // For card payment
  paymentMethodType: 'card' | 'wallet'; // from UI
}