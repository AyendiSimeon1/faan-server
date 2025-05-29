export interface StartSessionByQrDto {
    qrCodeId: string;
    vehicleType?: string;
}
export interface StartSessionByPlateDto {
    plateNumber: string;
    vehicleType?: string;
}
export interface EndSessionDto {
    sessionId: string;
    paymentMethodId?: string;
    paymentMethodType: 'card' | 'wallet';
}
