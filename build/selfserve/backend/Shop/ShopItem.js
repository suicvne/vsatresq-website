"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopItem = exports.CartItem = void 0;
class CartItem {
    constructor(item = undefined, amt = 0) {
        this.quantity = amt;
        if (ShopItem === undefined)
            this.item = new ShopItem();
        else
            this.item = item;
    }
}
exports.CartItem = CartItem;
class ShopItem {
    constructor() {
        this.price = 0;
        this.currency = "USD";
        this.item_name = "Item Name";
        this.description = "Write a description...";
        this.list_date = new Date(Date.now());
        //this.images = [{file: "images/shop/placeholder", ext: "png"},];
        this.images = Array();
        this.images.push("./images/shop/placeholder.png");
        this._id = undefined;
        this.optional_file = undefined;
    }
}
exports.ShopItem = ShopItem;
//# sourceMappingURL=ShopItem.js.map