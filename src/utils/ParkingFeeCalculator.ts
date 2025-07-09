export enum VehicleType {
  MOTORCYCLE = 'motorcycle',
  SALON_CAR = 'salon_car',
  SUV = 'suv',
  BUS = 'bus',
  TRUCK = 'truck'
}

export interface ParkingSession {
  vehicleType: VehicleType;
  entryTime: Date;
  exitTime?: Date;
  totalAmount?: number;  // calculated amount
  paid?: boolean;       // payment status
}

export class ParkingFeeCalculator {
  private static readonly BASE_RATES = {
    [VehicleType.MOTORCYCLE]: 200,
    [VehicleType.SALON_CAR]: 300,
    [VehicleType.SUV]: 400,
    [VehicleType.BUS]: 500,
    [VehicleType.TRUCK]: 1000
  };

  private static readonly GRACE_PERIOD_MINS = 15;
  private static readonly HOURS_IN_DAY = 24;

  /**
   * Calculate parking fee based on vehicle type and duration
   * @param session Parking session details
   * @returns Calculated fee in Naira
   */
  public static calculateFee(session: ParkingSession): number {
    if (!session.exitTime) {
      session.exitTime = new Date();
    }

    const durationMs = session.exitTime.getTime() - session.entryTime.getTime();
    const durationMins = Math.ceil(durationMs / (1000 * 60));

    // If within grace period, no charge
    if (durationMins <= this.GRACE_PERIOD_MINS) {
      return 0;
    }

    const baseRate = this.BASE_RATES[session.vehicleType];
    const hours = Math.ceil(durationMins / 60);
    let totalFee = 0;

    // First hour
    totalFee += baseRate;

    if (hours > 1) {
      // Subsequent hours up to 24 hours
      const additionalHours = Math.min(hours - 1, this.HOURS_IN_DAY - 1);
      totalFee += (additionalHours * baseRate * 0.5);

      // After 24 hours
      if (hours > this.HOURS_IN_DAY) {
        const additionalDays = Math.ceil((hours - this.HOURS_IN_DAY) / this.HOURS_IN_DAY);
        totalFee += (additionalDays * baseRate * this.HOURS_IN_DAY * 0.5);
      }
    }

    return Math.ceil(totalFee);
  }

  /**
   * Get the base rate for a vehicle type
   * @param type Vehicle type
   * @returns Base rate in Naira
   */
  public static getBaseRate(type: VehicleType): number {
    return this.BASE_RATES[type];
  }
}

// // Utility function to normalize plate numbers
// export const normalizePlateNumber = (plateNumber: string): string => {
//   // Remove all whitespace and convert to uppercase
//   return plateNumber.replace(/\s+/g, '').toUpperCase();
// };