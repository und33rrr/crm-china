// app.js - Основная логика приложения

let currentScreen = 'dashboard';
let syncInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initOrderForm();
    initReviewForm();
    initSearch();
    loadSettings();
    loadDashboard();
    importInitialReviews();
    startAutoSync();
});

// ===== АВТОСИНХРОНИЗАЦИЯ =====

let lastSyncTime = 0;

function startAutoSync() {
    // Сразу загружаем данные при открытии
    if (Storage.getGitHubToken() && Storage.getGistId()) {
        Storage.syncFromGist().then(result => {
            if (result.success) {
                updateSyncStatus('synced');
                if (currentScreen === 'dashboard') loadDashboard();
                if (currentScreen === 'orders') loadOrders();
                if (currentScreen === 'reviews') loadReviews();
            }
        });
    }
    
    // Каждые 15 секунд загружаем данные из Gist
    setInterval(() => {
        if (Storage.getGitHubToken() && Storage.getGistId()) {
            Storage.syncFromGist().then(result => {
                if (result.success) {
                    updateSyncStatus('synced');
                    if (currentScreen === 'dashboard') loadDashboard();
                    if (currentScreen === 'orders') loadOrders();
                    if (currentScreen === 'reviews') loadReviews();
                }
            });
        }
    }, 15000);
}

function updateSyncStatus(status) {
    const el = document.getElementById('sync-status');
    if (!el) return;
    
    if (status === 'syncing') {
        el.textContent = '⟳';
        el.title = 'Синхронизация...';
    } else if (status === 'synced') {
        el.textContent = '✓';
        el.title = 'Синхронизировано';
        setTimeout(() => { el.textContent = '●'; }, 2000);
    } else if (status === 'error') {
        el.textContent = '!';
        el.title = 'Ошибка синхронизации';
    } else {
        el.textContent = '●';
        el.title = 'Автосинхронизация активна';
    }
}

async function autoSaveToGist() {
    if (Storage.getGitHubToken() && Storage.getGistId()) {
        updateSyncStatus('syncing');
        const result = await Storage.syncToGist();
        updateSyncStatus(result.success ? 'synced' : 'error');
    }
}

async function manualSync() {
    if (!Storage.getGitHubToken() || !Storage.getGistId()) {
        alert('Сначала настройте синхронизацию в Настройках');
        return;
    }
    
    updateSyncStatus('syncing');
    await Storage.syncToGist();
    const result = await Storage.syncFromGist();
    updateSyncStatus(result.success ? 'synced' : 'error');
    
    if (result.success) {
        if (currentScreen === 'dashboard') loadDashboard();
        if (currentScreen === 'orders') loadOrders();
        if (currentScreen === 'reviews') loadReviews();
    }
}

function importInitialReviews() {
    if (Storage.getReviews().length === 0) {
        Storage.importReviews([
            { tg: "@Koksby", status: "waiting" },
            { tg: "@akanuwakareee", status: "not_wrote" },
            { tg: "@forropff", status: "left" },
            { tg: "@cffyzz", status: "not_wrote" },
            { tg: "@qWaif71", status: "not_wrote" },
            { tg: "@twinblumarine", status: "not_wrote" },
            { tg: "@scytheafgm", status: "not_wrote" },
            { tg: "@KBACTOPPPP", status: "not_wrote" },
            { tg: "@emotrustme", status: "not_wrote" },
            { tg: "@mollaxov", status: "not_wrote" },
            { tg: "@V3ld1", status: "not_wrote" },
            { tg: "rec!d!v", status: "not_wrote" },
            { tg: "@hupu89", status: "not_wrote" },
            { tg: "@zzaaveet", status: "not_wrote" },
            { tg: "@larmesmetalliques", status: "not_wrote" },
            { tg: "@gotham_666", status: "not_wrote" },
            { tg: "@WR0TQ", status: "not_wrote" },
            { tg: "palk", status: "not_wrote" },
            { tg: "@dvadvazero", status: "not_wrote" },
            { tg: "@Kiraa4_4", status: "not_wrote" },
            { tg: "@turbo_balls", status: "not_wrote" },
            { tg: "@Crazy_Mega_Hell17", status: "not_wrote" },
            { tg: "@plsstfuRAWR", status: "not_wrote" },
            { tg: "@Rocket2077", status: "not_wrote", comment: "убивал до мейнстрима" },
            { tg: "@XYek_official", status: "not_wrote" },
            { tg: "@nerinferaqqnozeen", status: "not_wrote" },
            { tg: "@lasttgrace", status: "not_wrote" },
            { tg: "@demonimage", status: "not_wrote" },
            { tg: "@silent_frik", status: "not_wrote" },
            { tg: "@tok3nm101", status: "not_wrote" },
            { tg: "@chupepi0", status: "not_wrote" }
        ]);
    }
}

// ===== НАВИГАЦИЯ =====

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.screen));
    });
}

function navigateTo(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screen}`)?.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.screen === screen);
    });
    currentScreen = screen;
    if (screen === 'dashboard') loadDashboard();
    if (screen === 'orders') loadOrders();
    if (screen === 'reviews') loadReviews();
    if (screen === 'settings') loadSettings();
}

// ===== ДАШБОРД =====

function loadDashboard() {
    const settings = Storage.getSettings();
    const wRate = settings.withdrawalRate || 0.44;

    const profitToday = Storage.getTodayProfit();
    const profitWeek = Storage.getWeekProfit();
    const profitMonth = Storage.getMonthProfit();
    const profitYear = Storage.getYearProfit();
    const alipay = Storage.getAlipayBalance();
    const totalProfitYuan = Storage.getTotalProfitYuan();
    const withdrawn = Storage.getTotalWithdrawn();

    document.getElementById('profit-today').textContent = formatMoney(profitToday, 'byn');
    document.getElementById('profit-today-sub').textContent = `≈ ${formatMoney(profitToday / wRate, 'yuan')}`;
    
    document.getElementById('profit-week').textContent = formatMoney(profitWeek, 'byn');
    document.getElementById('profit-week-sub').textContent = `≈ ${formatMoney(profitWeek / wRate, 'yuan')}`;
    
    document.getElementById('profit-month').textContent = formatMoney(profitMonth, 'byn');
    document.getElementById('profit-month-sub').textContent = `≈ ${formatMoney(profitMonth / wRate, 'yuan')}`;
    
    document.getElementById('profit-year').textContent = formatMoney(profitYear, 'byn');
    document.getElementById('profit-year-sub').textContent = `≈ ${formatMoney(profitYear / wRate, 'yuan')}`;
    
    document.getElementById('alipay-balance').textContent = formatMoney(alipay, 'yuan');
    document.getElementById('alipay-balance-sub').textContent = `≈ ${formatMoney(alipay * wRate, 'byn')}`;
    document.getElementById('alipay-total').textContent = `Всего: ${formatMoney(totalProfitYuan, 'yuan')}`;
    document.getElementById('alipay-withdrawn').textContent = `Выведено: ${formatMoney(withdrawn, 'yuan')}`;

    // Последние выводы
    const withdrawals = Storage.getWithdrawals().slice(-5).reverse();
    const withdrawList = document.getElementById('withdrawals-list');
    if (withdrawals.length) {
        withdrawList.innerHTML = withdrawals.map(w => `
            <div class="withdraw-row">
                <span>${formatMoney(w.amount, 'yuan')} — ${w.comment || '—'}</span>
                <button class="btn btn-sm btn-danger" onclick="deleteWithdrawal('${w.id}')">×</button>
            </div>
        `).join('');
    } else {
        withdrawList.innerHTML = '<p class="empty-state" style="padding: 20px">Нет выводов</p>';
    }

    const orders = Orders.getAll().slice(0, 5);
    const container = document.getElementById('recent-orders');
    container.innerHTML = orders.length ? orders.map(orderCard).join('') : '<p class="empty-state">Нет заказов</p>';
}

function showWithdrawForm() {
    document.getElementById('withdraw-modal').style.display = 'flex';
}

function hideWithdrawForm() {
    document.getElementById('withdraw-modal').style.display = 'none';
}

function saveWithdrawal() {
    const amount = parseFloat(document.getElementById('withdraw-amount').value) || 0;
    const comment = document.getElementById('withdraw-comment').value;
    
    if (amount <= 0) {
        alert('Введите сумму');
        return;
    }
    
    const balance = Storage.getAlipayBalance();
    if (amount > balance) {
        alert(`Недостаточно средств. Доступно: ${balance.toFixed(2)} ¥`);
        return;
    }
    
    Storage.addWithdrawal(amount, comment);
    document.getElementById('withdraw-amount').value = '';
    document.getElementById('withdraw-comment').value = '';
    hideWithdrawForm();
    loadDashboard();
    autoSaveToGist();
}

function deleteWithdrawal(id) {
    if (confirm('Удалить запись о выводе?')) {
        Storage.deleteWithdrawal(id);
        loadDashboard();
        autoSaveToGist();
    }
}

// ===== ЗАКАЗЫ =====

function initOrderForm() {
    document.getElementById('order-form').addEventListener('submit', e => {
        e.preventDefault();
        saveOrder();
    });

    ['order-delivery', 'order-currency', 'order-price-yuan', 'order-weight', 'order-client-price', 'order-rate', 'order-tariff'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', updatePreview);
        el.addEventListener('change', updatePreview);
    });

    document.getElementById('order-delivery').addEventListener('change', updateTariffVisibility);
    
    document.getElementById('order-currency').addEventListener('change', function() {
        const settings = Storage.getSettings();
        const rate = this.value === 'rub' ? settings.yuanToRubRate : settings.yuanToBynRate;
        document.getElementById('order-rate').value = rate;
        document.getElementById('order-client-price-label').textContent = 
            `Цена клиента (${this.value.toUpperCase()})`;
        updatePreview();
    });
}

function updateTariffVisibility() {
    const method = document.getElementById('order-delivery').value;
    document.getElementById('tariff-group').style.display = method === 'air' ? 'block' : 'none';
}

function updatePreview() {
    const priceYuan = parseFloat(document.getElementById('order-price-yuan').value) || 0;
    const weight = parseFloat(document.getElementById('order-weight').value) || 0;
    const clientPrice = parseFloat(document.getElementById('order-client-price').value) || 0;
    const rate = parseFloat(document.getElementById('order-rate').value) || 0;
    const method = document.getElementById('order-delivery').value;
    const tariff = parseFloat(document.getElementById('order-tariff').value) || 120;
    const currency = document.getElementById('order-currency').value;

    if (priceYuan > 0 && weight > 0 && rate > 0) {
        const deliveryYuan = Calculator.calcDelivery(weight, method, tariff);
        const totalYuan = priceYuan + deliveryYuan;
        const cost = totalYuan * rate;
        const profit = clientPrice - cost;

        document.getElementById('preview-delivery').textContent = formatMoney(deliveryYuan, 'yuan');
        document.getElementById('preview-cost').textContent = formatMoney(cost, currency);
        
        const profitEl = document.getElementById('preview-profit');
        profitEl.textContent = (profit >= 0 ? '+' : '') + formatMoney(profit, currency);
        profitEl.style.color = profit >= 0 ? 'var(--text)' : 'var(--danger)';
    } else {
        document.getElementById('preview-delivery').textContent = formatMoney(0, 'yuan');
        document.getElementById('preview-cost').textContent = formatMoney(0, currency);
        document.getElementById('preview-profit').textContent = formatMoney(0, currency);
    }
}

function loadOrders() {
    const search = document.getElementById('search-orders').value;
    const status = document.getElementById('filter-status').value;
    const delivery = document.getElementById('filter-delivery').value;

    let orders = Orders.filter({ search, status, delivery });
    const container = document.getElementById('orders-list');
    container.innerHTML = orders.length ? orders.map(orderCard).join('') : '<p class="empty-state">Нет заказов</p>';
}

function orderCard(order) {
    const profit = order.profit || 0;
    const remaining = (order.clientPrice || 0) - (order.prepayment || 0);
    const settings = Storage.getSettings();
    const rubToByn = settings.yuanToBynRate / settings.yuanToRubRate;
    const wRate = settings.withdrawalRate || 0.44;
    
    let profitConvert = '';
    if (order.currency === 'rub') {
        const profitByn = profit * rubToByn;
        const profitYuan = profit / settings.yuanToRubRate;
        profitConvert = `<span class="profit-converter-small">≈ ${formatMoney(profitByn, 'byn')} / ${formatMoney(profitYuan, 'yuan')}</span>`;
    } else {
        const profitYuan = profit / wRate;
        profitConvert = `<span class="profit-converter-small">≈ ${formatMoney(profitYuan, 'yuan')}</span>`;
    }

    const statusOptions = [
        { value: 'awaiting', label: 'Ожидает' },
        { value: 'in_transit', label: 'В пути' },
        { value: 'received_by_me', label: 'Получен мной' },
        { value: 'sent_to_client', label: 'Отправлен клиенту' },
        { value: 'completed', label: 'Завершён' }
    ].map(s => `<option value="${s.value}" ${order.status === s.value ? 'selected' : ''}>${s.label}</option>`).join('');
    
    return `
        <div class="order-card" onclick="editOrder('${order.id}')">
            <div class="order-header">
                <div class="order-title">${order.itemName || '—'}</div>
                <div class="order-header-right">
                    <select class="status-select" onclick="event.stopPropagation()" onchange="changeStatus('${order.id}', this.value)">
                        ${statusOptions}
                    </select>
                    <button class="btn-delete" onclick="event.stopPropagation(); deleteOrder('${order.id}')">×</button>
                </div>
            </div>
            <div class="order-details">
                <div class="order-detail">
                    <span class="order-detail-label">Telegram</span>
                    <span class="order-detail-value">${order.tgUsername || '—'}</span>
                </div>
                <div class="order-detail">
                    <span class="order-detail-label">Доставка</span>
                    <span class="order-detail-value">${order.deliveryMethod === 'auto' ? 'Авто' : 'Авиа'}</span>
                </div>
                <div class="order-detail">
                    <span class="order-detail-label">Цена</span>
                    <span class="order-detail-value">${formatMoney(order.clientPrice, order.currency)}</span>
                </div>
                <div class="order-detail">
                    <span class="order-detail-label">Остаток</span>
                    <span class="order-detail-value">${remaining > 0 ? formatMoney(remaining, order.currency) : '✓'}</span>
                </div>
                <div class="order-detail">
                    <span class="order-detail-label">Прибыль</span>
                    <span class="order-detail-value">
                        ${profit >= 0 ? '+' : ''}${formatMoney(profit, order.currency)} ${profitConvert}
                    </span>
                </div>
                ${order.trackingNumber ? `
                <div class="order-detail">
                    <span class="order-detail-label">Трек</span>
                    <span class="order-detail-value">${order.trackingNumber}</span>
                </div>` : ''}
            </div>
        </div>
    `;
}

function changeStatus(id, newStatus) {
    Orders.updateStatus(id, newStatus);
    loadOrders();
    if (currentScreen === 'dashboard') loadDashboard();
}

function showNewOrderForm() {
    document.getElementById('order-form-title').textContent = 'Новый заказ';
    document.getElementById('order-id').value = '';
    document.getElementById('order-form').reset();
    document.getElementById('order-delivery').value = 'air';
    document.getElementById('order-tariff').value = '120';
    document.getElementById('order-currency').value = 'byn';
    
    const settings = Storage.getSettings();
    document.getElementById('order-rate').value = settings.yuanToBynRate;
    document.getElementById('order-client-price-label').textContent = 'Цена клиента (BYN)';
    document.getElementById('order-calc-preview').style.display = 'none';
    updateTariffVisibility();
    document.getElementById('order-form-modal').style.display = 'flex';
}

function editOrder(id) {
    const o = Orders.getById(id);
    if (!o) return;

    document.getElementById('order-form-title').textContent = 'Редактировать';
    document.getElementById('order-id').value = o.id;
    document.getElementById('order-item-name').value = o.itemName || '';
    document.getElementById('order-tg-username').value = o.tgUsername || '';
    document.getElementById('order-delivery').value = o.deliveryMethod || 'air';
    document.getElementById('order-tariff').value = o.tariff || 120;
    document.getElementById('order-currency').value = o.currency || 'byn';
    document.getElementById('order-price-yuan').value = o.itemPriceYuan || '';
    document.getElementById('order-weight').value = o.weightKg || '';
    document.getElementById('order-rate').value = o.rate || '';
    document.getElementById('order-client-price').value = o.clientPrice || '';
    document.getElementById('order-prepaid').value = o.prepayment || '';
    document.getElementById('order-tracking').value = o.trackingNumber || '';
    document.getElementById('order-comment').value = o.comment || '';
    
    document.getElementById('order-client-price-label').textContent = 
        `Цена клиента (${(o.currency || 'byn').toUpperCase()})`;
    
    updateTariffVisibility();
    updatePreview();
    document.getElementById('order-calc-preview').style.display = 'block';
    document.getElementById('order-form-modal').style.display = 'flex';
}

function hideOrderForm() {
    document.getElementById('order-form-modal').style.display = 'none';
}

function saveOrder() {
    const id = document.getElementById('order-id').value;
    const currency = document.getElementById('order-currency').value;
    const method = document.getElementById('order-delivery').value;
    const tariff = parseFloat(document.getElementById('order-tariff').value) || 120;
    const priceYuan = parseFloat(document.getElementById('order-price-yuan').value) || 0;
    const weight = parseFloat(document.getElementById('order-weight').value) || 0;
    const rate = parseFloat(document.getElementById('order-rate').value) || 0;
    const clientPrice = parseFloat(document.getElementById('order-client-price').value) || 0;
    const prepayment = parseFloat(document.getElementById('order-prepaid').value) || 0;

    if (!priceYuan || !weight || !rate || !clientPrice) {
        alert('Заполните все поля');
        return;
    }

    const deliveryYuan = Calculator.calcDelivery(weight, method, tariff);
    const totalYuan = priceYuan + deliveryYuan;
    const cost = totalYuan * rate;
    const profit = clientPrice - cost;

    const data = {
        itemName: document.getElementById('order-item-name').value,
        tgUsername: document.getElementById('order-tg-username').value,
        trackingNumber: document.getElementById('order-tracking').value,
        comment: document.getElementById('order-comment').value,
        deliveryMethod: method,
        tariff,
        currency,
        itemPriceYuan: priceYuan,
        weightKg: weight,
        rate,
        clientPrice,
        prepayment,
        remaining: clientPrice - prepayment,
        deliveryCostYuan: deliveryYuan,
        costPrice: cost,
        profit
    };

    if (id) {
        const existing = Orders.getById(id);
        data.status = existing?.status || 'awaiting';
        data.id = id;
        data.createdAt = existing?.createdAt;
    } else {
        data.status = 'awaiting';
    }

    Orders.save(data);
    hideOrderForm();
    loadOrders();
    loadDashboard();
    autoSaveToGist();
}

function deleteOrder(id) {
    if (confirm('Удалить?')) {
        Orders.delete(id);
        loadOrders();
        loadDashboard();
        autoSaveToGist();
    }
}

// ===== ПОИСК =====

function initSearch() {
    document.getElementById('search-orders').addEventListener('input', loadOrders);
    document.getElementById('filter-status').addEventListener('change', loadOrders);
    document.getElementById('filter-delivery').addEventListener('change', loadOrders);
    document.getElementById('search-reviews').addEventListener('input', loadReviews);
    document.getElementById('filter-review-status').addEventListener('change', loadReviews);
}

// ===== ОТЗЫВЫ =====

const REVIEW_STATUSES = {
    not_wrote: 'Ещё не написал',
    waiting: 'Жду',
    left: 'Оставил'
};

function initReviewForm() {
    document.getElementById('review-form').addEventListener('submit', e => {
        e.preventDefault();
        saveReview();
    });
}

function loadReviews() {
    const search = document.getElementById('search-reviews').value.toLowerCase();
    const statusFilter = document.getElementById('filter-review-status').value;
    
    let reviews = Storage.getReviews();
    
    if (search) {
        reviews = reviews.filter(r => r.tg.toLowerCase().includes(search));
    }
    if (statusFilter) {
        reviews = reviews.filter(r => r.status === statusFilter);
    }
    
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const container = document.getElementById('reviews-list');
    container.innerHTML = reviews.length ? reviews.map(reviewCard).join('') : '<p class="empty-state">Нет отзывов</p>';
}

function reviewCard(review) {
    const statusLabel = REVIEW_STATUSES[review.status] || review.status;
    return `
        <div class="order-card">
            <div class="order-header">
                <div class="order-title">${review.tg}</div>
                <select class="status-select" onchange="changeReviewStatus('${review.id}', this.value)">
                    <option value="not_wrote" ${review.status === 'not_wrote' ? 'selected' : ''}>Ещё не написал</option>
                    <option value="waiting" ${review.status === 'waiting' ? 'selected' : ''}>Жду</option>
                    <option value="left" ${review.status === 'left' ? 'selected' : ''}>Оставил</option>
                </select>
            </div>
            ${review.comment ? `
            <div class="order-details">
                <div class="order-detail" style="grid-column: 1 / -1;">
                    <span class="order-detail-label">Комментарий</span>
                    <span class="order-detail-value">${review.comment}</span>
                </div>
            </div>` : ''}
            <div class="order-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteReview('${review.id}')">Удалить</button>
            </div>
        </div>
    `;
}

function showReviewForm() {
    document.getElementById('review-form-title').textContent = 'Новый отзыв';
    document.getElementById('review-id').value = '';
    document.getElementById('review-form').reset();
    document.getElementById('review-form-modal').style.display = 'flex';
}

function hideReviewForm() {
    document.getElementById('review-form-modal').style.display = 'none';
}

function saveReview() {
    const id = document.getElementById('review-id').value;
    const tg = document.getElementById('review-tg').value.trim();
    const status = document.getElementById('review-status').value;
    const comment = document.getElementById('review-comment').value;
    
    if (!tg) {
        alert('Введите Telegram');
        return;
    }
    
    const data = { tg, status, comment };
    if (id) {
        data.id = id;
    }
    
    Storage.saveReview(data);
    hideReviewForm();
    loadReviews();
    autoSaveToGist();
}

function changeReviewStatus(id, newStatus) {
    const review = Storage.getReviews().find(r => r.id === id);
    if (review) {
        review.status = newStatus;
        Storage.saveReview(review);
        loadReviews();
        autoSaveToGist();
    }
}

function deleteReview(id) {
    if (confirm('Удалить?')) {
        Storage.deleteReview(id);
        loadReviews();
        autoSaveToGist();
    }
}

// ===== НАСТРОЙКИ =====

function loadSettings() {
    const s = Storage.getSettings();
    document.getElementById('rate-yuan-byn').value = s.yuanToBynRate;
    document.getElementById('rate-withdrawal').value = s.withdrawalRate || 0.44;
    document.getElementById('rate-yuan-rub').value = s.yuanToRubRate;
    document.getElementById('rate-usd-yuan').value = s.usdToYuanRate;
    document.getElementById('rate-auto-kg').value = s.autoDeliveryRatePerKg;
    document.getElementById('rate-air-kg').value = s.airDeliveryRatePerKg;
    
    // GitHub Gist
    document.getElementById('github-token').value = Storage.getGitHubToken();
    document.getElementById('gist-id').value = Storage.getGistId();
}

function saveSettings() {
    Storage.saveSettings({
        yuanToBynRate: parseFloat(document.getElementById('rate-yuan-byn').value) || 0.44,
        withdrawalRate: parseFloat(document.getElementById('rate-withdrawal').value) || 0.44,
        yuanToRubRate: parseFloat(document.getElementById('rate-yuan-rub').value) || 12.1,
        usdToYuanRate: parseFloat(document.getElementById('rate-usd-yuan').value) || 7,
        autoDeliveryRatePerKg: parseFloat(document.getElementById('rate-auto-kg').value) || 6,
        airDeliveryRatePerKg: parseFloat(document.getElementById('rate-air-kg').value) || 120
    });
    
    // GitHub Gist
    Storage.saveGitHubToken(document.getElementById('github-token').value);
    Storage.saveGistId(document.getElementById('gist-id').value);
    
    alert('Сохранено');
    
    // Автоматически синхронизируемся
    if (Storage.getGitHubToken() && Storage.getGistId()) {
        Storage.syncFromGist().then(result => {
            if (result.success) {
                updateSyncStatus('synced');
                if (currentScreen === 'dashboard') loadDashboard();
                if (currentScreen === 'orders') loadOrders();
                if (currentScreen === 'reviews') loadReviews();
            }
        });
    }
}

// ===== СИНХРОНИЗАЦИЯ =====

async function syncToGist() {
    // Сначала сохраняем токен и ID
    Storage.saveGitHubToken(document.getElementById('github-token').value);
    Storage.saveGistId(document.getElementById('gist-id').value);
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Сохраняю...';
    
    const result = await Storage.syncToGist();
    
    btn.disabled = false;
    btn.textContent = 'Сохранить в Gist';
    
    if (result.success) {
        alert('Данные сохранены в Gist!');
    } else {
        alert('Ошибка: ' + result.error);
    }
}

async function syncFromGist() {
    // Сначала сохраняем токен и ID
    Storage.saveGitHubToken(document.getElementById('github-token').value);
    Storage.saveGistId(document.getElementById('gist-id').value);
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Загружаю...';
    
    const result = await Storage.syncFromGist();
    
    btn.disabled = false;
    btn.textContent = 'Загрузить из Gist';
    
    if (result.success) {
        alert('Данные загружены! Страница перезагрузится.');
        location.reload();
    } else {
        alert('Ошибка: ' + result.error);
    }
}

// ===== ФОРМАТИРОВАНИЕ =====

function formatMoney(value, currency) {
    const v = value || 0;
    switch(currency) {
        case 'yuan': return `¥ ${v.toFixed(2)}`;
        case 'rub': return `${v.toFixed(2)} ₽`;
        default: return `${v.toFixed(2)} BYN`;
    }
}

// ===== БЭКАП =====

function exportAllData() {
    const data = {
        version: 1,
        date: new Date().toISOString(),
        orders: Storage.getOrders(),
        reviews: Storage.getReviews(),
        withdrawals: Storage.getWithdrawals(),
        settings: Storage.getSettings()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function importAllData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.orders || !data.settings) {
                alert('Неверный формат файла');
                return;
            }
            
            if (!confirm(`Импортировать данные?\n\nЗаказы: ${data.orders.length}\nОтзывы: ${data.reviews?.length || 0}\n\nВсе текущие данные будут заменены!`)) {
                return;
            }
            
            localStorage.setItem('crm_orders', JSON.stringify(data.orders));
            localStorage.setItem('crm_reviews', JSON.stringify(data.reviews || []));
            localStorage.setItem('crm_withdrawals', JSON.stringify(data.withdrawals || []));
            localStorage.setItem('crm_settings', JSON.stringify(data.settings));
            
            alert('Данные импортированы! Страница будет перезагружена.');
            location.reload();
        } catch (err) {
            alert('Ошибка чтения файла: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
