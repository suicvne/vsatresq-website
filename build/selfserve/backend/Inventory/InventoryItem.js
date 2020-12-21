"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryItem = void 0;
class InventoryItem {
    constructor() {
        this.serial_number = "1N0TAR3A1N0M83R";
        this.item_name = "Item Name";
        this.description = "Write a description...";
        this.list_date = new Date(Date.now());
        //this.images = [{file: "images/shop/placeholder", ext: "png"},];
        this.images = Array();
        this.images.push("images/shop/placeholder.png");
        this._id = undefined;
        this.notes = [
            { note_date: new Date(Date.now()), status: "Info", message: "Item first created in the database.", user: "none" }
        ];
        this.notes.push();
    }
}
exports.InventoryItem = InventoryItem;
//# sourceMappingURL=InventoryItem.js.map