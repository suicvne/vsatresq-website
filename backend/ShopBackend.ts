import express = require("express");
import TokenStore from "./TokenStore"
import {MongoDBInstance, MongoDBStatus} from "./MongoRequests";
import { ObjectID } from "mongodb";
import { IShopItem, ShopItem, CartItem } from "./Shop/ShopItem"
import { DebugConsole } from "./Debug";
import { Order } from "./Shop/Order";
var config = require(`${process.cwd()}/site.config`).selfserve;

export abstract class ShopBackend 
{
    private static ShopCollection: string = "shop_items";
    private static OrdersCollection: string = "shop_orders";
    private static mongoBackend: MongoDBInstance;

    public static Available:boolean = false;

    public static initShopBackend()
    {
        // TODO: change this name
        this.mongoBackend = new MongoDBInstance(config.default_db);

        this.mongoBackend.init((available: boolean) => {
            DebugConsole.Writeq("Allowed ", available);
            this.Available = available;
            
            if(this.Available) DebugConsole.Writeq("Shop backend available!!");
            else DebugConsole.Writeq("Shop backend unavailable");
        });

        
    }

    public static getAllItems(callback: (err: any, value:any) => void) {
        this.mongoBackend.returnAll(this.ShopCollection, (err: any, value: any) => {
            callback(err, value);
        });
    }

    public static getAllOrders(callback: (err: any, value: any) => void) {
        this.mongoBackend.returnAll(this.OrdersCollection, (err: any, value: any) => {
            callback(err, value);
        });
    };

    public static getItemByID(__id: ObjectID, callback: (item: IShopItem | undefined, err: any) => void) {
        this.mongoBackend.query(this.ShopCollection, "_id", __id.toHexString(), (err: any, result: any) => {
            if(err) callback(undefined, err);
            if(result) {
                let returningItem: IShopItem;

                if(typeof result === typeof String) returningItem = JSON.parse(result);
                else returningItem = <IShopItem>result;

                callback(returningItem, undefined);
            }
        });
    }

    public static addNewItem(newItem: IShopItem, callback: (err: any, result: any) => void) {
        this.mongoBackend.insertRecord(this.ShopCollection, newItem, (err: any, result: any) => {
            console.log("Adding new shop item err, result: ", err, result);
            callback(err, result.ops);
        });
    }

    public static removeItem(item_id: ObjectID, callback: any) {
        this.mongoBackend.delete(this.ShopCollection, '_id', String(item_id))
        callback('Deleted');
    }

    public static updateOrder(order_id: string, newValues: Object, callback: (err: any, result: any) => void)
    {
        var queryObj = {OrderID: order_id};
        this.mongoBackend.updateRecord(this.OrdersCollection, queryObj, newValues, (err: any, res: any) => {
            callback(err, res);
        });
    }

    public static updateItem(__id: ObjectID, newValues: Object, callback: (err: any, result: any)=>void)
    {
        let oid = require('mongodb').ObjectID;
        var queryObj = {_id: oid(__id)};
        console.log(newValues);
        this.mongoBackend.updateRecord(this.ShopCollection, queryObj, newValues, (err: any, res: any) =>
        {
            callback(err, res);
        });
    }

    public static addNewOrder(newOrder: Order, callback: (err: any, result: any) => void) {
        this.mongoBackend.insertRecord(this.OrdersCollection, newOrder, (err: any, result: any) => {
            console.log("Adding record of new order: ", err, result.ops);
            callback(err, result.ops);
        });
    }

    public static getOrderByOrderID(orderID: string, callback: (order: Order | undefined, err: any) => void) {
        var queryObj = {OrderID: orderID};
        this.mongoBackend.query(this.OrdersCollection, "OrderID", orderID, (err, result) => {
            if(err || result === undefined) callback(undefined, 'Mongo:'+err);
            else callback(<Order>result, undefined);
        });
    }

    public static calculateTrueCartTotal(cart: CartItem[]): Promise<{db_total: number, cart_total: number}>
    {
        let cartTotalPromise: Promise<{db_total: number, cart_total: number}> = new Promise((resolve, reject) => {
            let oid = require('mongodb').ObjectID;
            let thedb_total: number = 0.00;
            let given_total: number = 0.00;
            let counter = 0;

            if(cart.forEach === undefined)
            {
                resolve({db_total: 0, cart_total: 0});
            }
            else
            {

                cart.forEach((cartItem, index) => {

                    let determined_id = undefined;
                    if(cartItem.item !== undefined) determined_id = cartItem.item._id;
                    else determined_id = (<any>cartItem).item_id;


                    let itemFromDb = ShopBackend.getItemByID(oid(determined_id), (item: IShopItem | undefined, err: any) => {

                        if(cartItem.item === undefined && item !== undefined) given_total += item?.price;
                        else if(cartItem.item === undefined && item === undefined) given_total += .1;
                        else given_total += (cartItem.item.price * cartItem.quantity);

                        // console.log("got one back");
                        if(item === undefined)
                        {
                            if(err) reject(err);
                            else reject('Item was null for unknown reason');
                        }
                        else
                        {
                            let asShopItem = <ShopItem>item;
                            // DebugConsole.WriteObj(asShopItem);
                            // DebugConsole.Write(0, "\n");
                            thedb_total += asShopItem.price * cartItem.quantity;
                        }
                        counter++;

                        if(counter === cart.length)
                        { 
                            let resolveValue = {db_total: thedb_total, cart_total: given_total}
                            DebugConsole.Writeq('Resolving with the following: ', resolveValue);
                            resolve(resolveValue);
                        }
                    });
                });
            }
        });

        return cartTotalPromise;
    }
}