// calculator.js - Расчёт доставки

const Calculator = {
    getSettings() {
        return Storage.getSettings();
    },

    // Доставка авто в юанях: вес * 6$ * 7 юань/$
    calcAutoDelivery(weightKg) {
        const s = this.getSettings();
        return weightKg * s.autoDeliveryRatePerKg * s.usdToYuanRate;
    },

    // Доставка авиав юанях: вес * тариф (120/110/100)
    calcAirDelivery(weightKg, tariff = 120) {
        return weightKg * tariff;
    },

    // Универсальный расчёт доставки
    calcDelivery(weightKg, method, tariff) {
        return method === 'air' ? this.calcAirDelivery(weightKg, tariff) : this.calcAutoDelivery(weightKg);
    }
};
