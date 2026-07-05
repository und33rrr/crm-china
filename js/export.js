// export.js - Экспорт данных

function exportToCSV() {
    const orders = Storage.getOrders();
    
    if (orders.length === 0) {
        alert('Нет заказов для экспорта');
        return;
    }

    const headers = [
        'ID', 'Дата', 'Товар', 'Юзер TG', 'Доставка', 'Валюта',
        'Цена ¥', 'Вес кг', 'Курс', 'Цена клиента', 'Предоплата',
        'Остаток', 'Доставка ¥', 'Себестоимость', 'Прибыль',
        'Статус', 'Трек', 'Комментарий'
    ];

    const rows = orders.map(o => [
        o.id,
        o.createdAt ? new Date(o.createdAt).toLocaleDateString('ru-RU') : '',
        o.itemName || '',
        o.tgUsername || '',
        o.deliveryMethod === 'auto' ? 'Авто' : 'Авиа',
        (o.currency || 'byn').toUpperCase(),
        o.itemPriceYuan || 0,
        o.weightKg || 0,
        o.rate || 0,
        o.clientPrice || 0,
        o.prepayment || 0,
        o.remaining || 0,
        o.deliveryCostYuan || 0,
        o.costPrice || 0,
        o.profit || 0,
        Orders.getStatusText(o.status),
        o.trackingNumber || '',
        o.comment || ''
    ]);

    const csv = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => {
            const str = String(cell).replace(/"/g, '""');
            return str.includes(';') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
        }).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function exportSettings() {
    const blob = new Blob([JSON.stringify(Storage.getSettings(), null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `settings_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
}
