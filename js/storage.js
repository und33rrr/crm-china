// storage.js - Работа с localStorage

const Storage = {
    KEYS: {
        ORDERS: 'crm_orders',
        SETTINGS: 'crm_settings',
        WITHDRAWALS: 'crm_withdrawals',
        REVIEWS: 'crm_reviews',
        GITHUB_TOKEN: 'crm_github_token',
        GIST_ID: 'crm_gist_id'
    },

    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    },

    // ===== ЗАКАЗЫ =====

    getOrders() {
        return this.get(this.KEYS.ORDERS) || [];
    },

    getOrder(id) {
        return this.getOrders().find(o => o.id === id);
    },

    saveOrder(order) {
        const orders = this.getOrders();
        const index = orders.findIndex(o => o.id === order.id);
        
        if (index >= 0) {
            orders[index] = { ...orders[index], ...order, updatedAt: new Date().toISOString() };
        } else {
            orders.push({
                ...order,
                id: order.id || Date.now().toString(),
                createdAt: order.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        
        return this.set(this.KEYS.ORDERS, orders);
    },

    deleteOrder(id) {
        return this.set(this.KEYS.ORDERS, this.getOrders().filter(o => o.id !== id));
    },

    searchOrders(query) {
        const q = query.toLowerCase();
        return this.getOrders().filter(o => 
            (o.tgUsername && o.tgUsername.toLowerCase().includes(q)) ||
            (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
            (o.itemName && o.itemName.toLowerCase().includes(q))
        );
    },

    // ===== ОТЗЫВЫ =====

    getReviews() {
        return this.get(this.KEYS.REVIEWS) || [];
    },

    saveReview(review) {
        const reviews = this.getReviews();
        const index = reviews.findIndex(r => r.id === review.id);
        
        if (index >= 0) {
            reviews[index] = { ...reviews[index], ...review, updatedAt: new Date().toISOString() };
        } else {
            reviews.push({
                ...review,
                id: review.id || Date.now().toString(),
                createdAt: review.createdAt || new Date().toISOString()
            });
        }
        
        return this.set(this.KEYS.REVIEWS, reviews);
    },

    importReviews(reviewsArray) {
        const existing = this.getReviews();
        const existingTgs = new Set(existing.map(r => r.tg.toLowerCase()));
        
        reviewsArray.forEach(r => {
            if (!existingTgs.has(r.tg.toLowerCase())) {
                existing.push({
                    id: r.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    tg: r.tg,
                    status: r.status || 'wrote',
                    comment: r.comment || '',
                    createdAt: r.createdAt || new Date().toISOString()
                });
            }
        });
        
        return this.set(this.KEYS.REVIEWS, existing);
    },

    deleteReview(id) {
        return this.set(this.KEYS.REVIEWS, this.getReviews().filter(r => r.id !== id));
    },

    // ===== НАСТРОЙКИ =====

    getSettings() {
        return this.get(this.KEYS.SETTINGS) || {
            yuanToBynRate: 0.44,
            withdrawalRate: 0.44,
            yuanToRubRate: 12.1,
            usdToYuanRate: 7,
            autoDeliveryRatePerKg: 6,
            airDeliveryRatePerKg: 120
        };
    },

    saveSettings(settings) {
        return this.set(this.KEYS.SETTINGS, settings);
    },

    // ===== ВЫВОДЫ =====

    getWithdrawals() {
        return this.get(this.KEYS.WITHDRAWALS) || [];
    },

    addWithdrawal(amountYuan, comment) {
        const withdrawals = this.getWithdrawals();
        withdrawals.push({
            id: Date.now().toString(),
            amount: amountYuan,
            comment: comment || '',
            date: new Date().toISOString()
        });
        return this.set(this.KEYS.WITHDRAWALS, withdrawals);
    },

    deleteWithdrawal(id) {
        return this.set(this.KEYS.WITHDRAWALS, this.getWithdrawals().filter(w => w.id !== id));
    },

    getTotalWithdrawn() {
        return this.getWithdrawals().reduce((sum, w) => sum + (w.amount || 0), 0);
    },

    // Баланс Alipay = общая прибыль в юанях - выведено
    getAlipayBalance() {
        const totalProfitYuan = this.getTotalProfitYuan();
        const withdrawn = this.getTotalWithdrawn();
        return totalProfitYuan - withdrawn;
    },

    // Общая прибыль за всё время в юанях
    getTotalProfitYuan() {
        const settings = this.getSettings();
        return this.getOrders().reduce((sum, order) => {
            if (order.profit) {
                // Конвертируем в юани
                if (order.currency === 'rub') {
                    return sum + (order.profit / settings.yuanToRubRate);
                }
                // BYN → ¥ по курсу обмена
                return sum + (order.profit / (settings.withdrawalRate || 0.44));
            }
            return sum;
        }, 0);
    },

    // ===== СТАТИСТИКА =====

    // Конвертировать прибыль в BYN
    convertProfitToByn(profit, currency) {
        if (currency === 'rub') {
            const settings = this.getSettings();
            return profit * (settings.yuanToBynRate / settings.yuanToRubRate);
        }
        return profit;
    },

    // Получить прибыль за период (всегда в BYN)
    // Считает прибыль для ВСЕХ заказов, не только завершённых
    getProfitForPeriod(startDate, endDate) {
        const settings = this.getSettings();
        const rubToByn = settings.yuanToBynRate / settings.yuanToRubRate;
        
        return this.getOrders().reduce((sum, order) => {
            if (order.profit) {
                const date = new Date(order.updatedAt || order.createdAt);
                if (date >= startDate && date <= endDate) {
                    const profitByn = order.currency === 'rub' 
                        ? order.profit * rubToByn 
                        : order.profit;
                    return sum + profitByn;
                }
            }
            return sum;
        }, 0);
    },

    getTodayProfit() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.getProfitForPeriod(today, tomorrow);
    },

    getWeekProfit() {
        const now = new Date();
        const dayOfWeek = now.getDay() || 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - dayOfWeek + 1);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return this.getProfitForPeriod(monday, sunday);
    },

    getMonthProfit() {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const last = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return this.getProfitForPeriod(first, last);
    },

    getYearProfit() {
        const now = new Date();
        const first = new Date(now.getFullYear(), 0, 1);
        const last = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return this.getProfitForPeriod(first, last);
    },

    // ===== СИНХРОНИЗАЦИЯ =====

    getGitHubToken() {
        return localStorage.getItem(this.KEYS.GITHUB_TOKEN) || '';
    },

    saveGitHubToken(token) {
        localStorage.setItem(this.KEYS.GITHUB_TOKEN, token);
    },

    getGistId() {
        return localStorage.getItem(this.KEYS.GIST_ID) || '';
    },

    saveGistId(id) {
        localStorage.setItem(this.KEYS.GIST_ID, id);
    },

    // Получить все данные для синхронизации
    getAllData() {
        return {
            orders: this.getOrders(),
            reviews: this.getReviews(),
            withdrawals: this.getWithdrawals(),
            settings: this.getSettings(),
            githubToken: this.getGitHubToken(),
            gistId: this.getGistId(),
            lastSync: new Date().toISOString()
        };
    },

    // Загрузить данные из Gist (без токена - публичный Gist)
    async syncFromGist() {
        const gistId = this.getGistId() || 'bfae8132b96a52fbd5092749d40f2475';

        try {
            // Читаем публичный Gist без токена
            const response = await fetch(`https://api.github.com/gists/${gistId}`);

            if (!response.ok) {
                return { success: false, error: 'Ошибка доступа к Gist' };
            }

            const gist = await response.json();
            const content = gist.files['crm-data.json']?.content;

            if (!content) {
                return { success: false, error: 'Файл не найден в Gist' };
            }

            const data = JSON.parse(content);

            // Сохраняем данные
            if (data.orders) this.set(this.KEYS.ORDERS, data.orders);
            if (data.reviews) this.set(this.KEYS.REVIEWS, data.reviews);
            if (data.withdrawals) this.set(this.KEYS.WITHDRAWALS, data.withdrawals);
            if (data.settings) this.set(this.KEYS.SETTINGS, data.settings);
            
            // Восстанавливаем токен и ID если есть
            if (data.githubToken) localStorage.setItem(this.KEYS.GITHUB_TOKEN, data.githubToken);
            if (data.gistId) localStorage.setItem(this.KEYS.GIST_ID, data.gistId);

            return { success: true, lastSync: data.lastSync };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    // Сохранить данные в Gist
    async syncToGist() {
        const token = this.getGitHubToken();
        const gistId = this.getGistId();

        if (!token || !gistId) {
            return { success: false, error: 'Не настроен Gist' };
        }

        const data = this.getAllData();
        const content = JSON.stringify(data, null, 2);

        try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: {
                        'crm-data.json': { content }
                    }
                })
            });

            if (!response.ok) {
                return { success: false, error: 'Ошибка сохранения' };
            }

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
};
