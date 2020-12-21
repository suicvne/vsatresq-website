"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopBackend = void 0;
const MongoRequests_1 = require("./MongoRequests");
const Debug_1 = require("./Debug");
var config = require(`${process.cwd()}/site.config`).selfserve;
class ShopBackend {
    static initShopBackend() {
        // TODO: change this name
        this.mongoBackend = new MongoRequests_1.MongoDBInstance(config.default_db);
        this.mongoBackend.init((available) => {
            Debug_1.DebugConsole.Writeq("Allowed ", available);
            this.Available = available;
            if (this.Available)
                Debug_1.DebugConsole.Writeq("Shop backend available!!");
            else
                Debug_1.DebugConsole.Writeq("Shop backend unavailable");
        });
    }
    static getAllItems(callback) {
        this.mongoBackend.returnAll(this.ShopCollection, (err, value) => {
            callback(err, value);
        });
    }
    static getAllOrders(callback) {
        this.mongoBackend.returnAll(this.OrdersCollection, (err, value) => {
            callback(err, value);
        });
    }
    ;
    static getItemByID(__id, callback) {
        this.mongoBackend.query(this.ShopCollection, "_id", __id.toHexString(), (err, result) => {
            if (err)
                callback(undefined, err);
            if (result) {
                let returningItem;
                if (typeof result === typeof String)
                    returningItem = JSON.parse(result);
                else
                    returningItem = result;
                callback(returningItem, undefined);
            }
        });
    }
    static addNewItem(newItem, callback) {
        this.mongoBackend.insertRecord(this.ShopCollection, newItem, (err, result) => {
            console.log("Adding new shop item err, result: ", err, result);
            callback(err, result.ops);
        });
    }
    static removeItem(item_id, callback) {
        this.mongoBackend.delete(this.ShopCollection, '_id', String(item_id));
        callback('Deleted');
    }
    static updateOrder(order_id, newValues, callback) {
        var queryObj = { OrderID: order_id };
        this.mongoBackend.updateRecord(this.OrdersCollection, queryObj, newValues, (err, res) => {
            callback(err, res);
        });
    }
    static updateItem(__id, newValues, callback) {
        let oid = require('mongodb').ObjectID;
        var queryObj = { _id: oid(__id) };
        console.log(newValues);
        this.mongoBackend.updateRecord(this.ShopCollection, queryObj, newValues, (err, res) => {
            callback(err, res);
        });
    }
    static addNewOrder(newOrder, callback) {
        this.mongoBackend.insertRecord(this.OrdersCollection, newOrder, (err, result) => {
            console.log("Adding record of new order: ", err, result.ops);
            callback(err, result.ops);
        });
    }
    static getOrderByOrderID(orderID, callback) {
        var queryObj = { OrderID: orderID };
        this.mongoBackend.query(this.OrdersCollection, "OrderID", orderID, (err, result) => {
            if (err || result === undefined)
                callback(undefined, 'Mongo:' + err);
            else
                callback(result, undefined);
        });
    }
    static calculateTrueCartTotal(cart) {
        let cartTotalPromise = new Promise((resolve, reject) => {
            let oid = require('mongodb').ObjectID;
            let thedb_total = 0.00;
            let given_total = 0.00;
            let counter = 0;
            if (cart.forEach === undefined) {
                resolve({ db_total: 0, cart_total: 0 });
            }
            else {
                cart.forEach((cartItem, index) => {
                    let determined_id = undefined;
                    if (cartItem.item !== undefined)
                        determined_id = cartItem.item._id;
                    else
                        determined_id = cartItem.item_id;
                    let itemFromDb = ShopBackend.getItemByID(oid(determined_id), (item, err) => {
                        if (cartItem.item === undefined && item !== undefined)
                            given_total += item === null || item === void 0 ? void 0 : item.price;
                        else if (cartItem.item === undefined && item === undefined)
                            given_total += .1;
                        else
                            given_total += (cartItem.item.price * cartItem.quantity);
                        // console.log("got one back");
                        if (item === undefined) {
                            if (err)
                                reject(err);
                            else
                                reject('Item was null for unknown reason');
                        }
                        else {
                            let asShopItem = item;
                            // DebugConsole.WriteObj(asShopItem);
                            // DebugConsole.Write(0, "\n");
                            thedb_total += asShopItem.price * cartItem.quantity;
                        }
                        counter++;
                        if (counter === cart.length) {
                            let resolveValue = { db_total: thedb_total, cart_total: given_total };
                            Debug_1.DebugConsole.Writeq('Resolving with the following: ', resolveValue);
                            resolve(resolveValue);
                        }
                    });
                });
            }
        });
        return cartTotalPromise;
    }
}
exports.ShopBackend = ShopBackend;
ShopBackend.ShopCollection = "shop_items";
ShopBackend.OrdersCollection = "shop_orders";
ShopBackend.Available = false;
//# sourceMappingURL=ShopBackend.js.map