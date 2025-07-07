"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePlateNumber = exports.ParkingFeeCalculator = exports.VehicleType = void 0;
var VehicleType;
(function (VehicleType) {
    VehicleType["MOTORCYCLE"] = "motorcycle";
    VehicleType["SALON_CAR"] = "salon_car";
    VehicleType["SUV"] = "suv";
    VehicleType["BUS"] = "bus";
    VehicleType["TRUCK"] = "truck";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
class ParkingFeeCalculator {
    /**
     * Calculate parking fee based on vehicle type and duration
     * @param session Parking session details
     * @returns Calculated fee in Naira
     */
    static calculateFee(session) {
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
    static getBaseRate(type) {
        return this.BASE_RATES[type];
    }
}
exports.ParkingFeeCalculator = ParkingFeeCalculator;
ParkingFeeCalculator.BASE_RATES = {
    [VehicleType.MOTORCYCLE]: 200,
    [VehicleType.SALON_CAR]: 300,
    [VehicleType.SUV]: 400,
    [VehicleType.BUS]: 500,
    [VehicleType.TRUCK]: 1000
};
ParkingFeeCalculator.GRACE_PERIOD_MINS = 15;
ParkingFeeCalculator.HOURS_IN_DAY = 24;
// Utility function to normalize plate numbers
const normalizePlateNumber = (plateNumber) => {
    // Remove all whitespace and convert to uppercase
    return plateNumber.replace(/\s+/g, '').toUpperCase();
};
exports.normalizePlateNumber = normalizePlateNumber;
//# sourceMappingURL=ParkingFeeCalculator.js.map