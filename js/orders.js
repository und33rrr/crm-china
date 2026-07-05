// orders.js - Управление заказами

const Orders = {
    STATUSES: {
        awaiting: 'Ожидает',
        in_transit: 'В пути',
        received_by_me: 'Получен мной',
        sent_to_client: 'Отправлен клиенту',
        completed: 'Завершён'
    },

    save: (order) => Storage.saveOrder(order),
    delete: (id) => Storage.deleteOrder(id),
    getAll: () => Storage.getOrders(),
    getById: (id) => Storage.getOrder(id),

    filter({ search, status, delivery } = {}) {
        let orders = Storage.getOrders();
        if (status) orders = orders.filter(o => o.status === status);
        if (delivery) orders = orders.filter(o => o.deliveryMethod === delivery);
        if (search) {
            const q = search.toLowerCase();
            orders = orders.filter(o => 
                (o.tgUsername && o.tgUsername.toLowerCase().includes(q)) ||
                (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
                (o.itemName && o.itemName.toLowerCase().includes(q))
            );
        }
        return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    updateStatus(id, status) {
        const order = this.getById(id);
        if (order) {
            order.status = status;
            order.updatedAt = new Date().toISOString();
            return this.save(order);
        }
        return false;
    },

    getStatusText: (status) => Orders.STATUSES[status] || status
};
