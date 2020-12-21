"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
class Order {
    constructor(orderID, userID, amountPaid, cart, payer, payee_email, optional_data) {
        this.OrderID = orderID;
        this.UserID = userID;
        this.AmountPaid = amountPaid;
        this.ItemsBought = cart;
        this.Payer = payer;
        this.PayeeEmail = payee_email;
        this.OptionalData = optional_data;
        this.OrderNotes = new Array({ note_date: Date.now().toString(), status: 'Created', message: `${payer.name.full_name} created this order.` });
    }
}
exports.Order = Order;
//# sourceMappingURL=Order.js.map