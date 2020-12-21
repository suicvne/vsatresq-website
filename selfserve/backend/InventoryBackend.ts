import express = require("express");
import TokenStore from "./TokenStore"
import {MongoDBInstance, MongoDBStatus} from "./MongoRequests";
import { ObjectID } from "mongodb";
import { InventoryItem, IInventoryItem } from "./Inventory/InventoryItem"
import { DebugConsole } from "./Debug";
import { Order } from "./Shop/Order";

var config = require(`${process.cwd()}/site.config`).selfserve;

export abstract class InventoryBackend 
{
    private static InventoryCollection: string = "inventory_db";
    private static mongoBackend: MongoDBInstance;

    public static Available:boolean = false;

    private static SubDBNames:Array<any>;

    public static initInvBackend()
    {
        // TODO: change this name
        this.mongoBackend = new MongoDBInstance(config.default_db);

        this.mongoBackend.init((available: boolean) => {
            DebugConsole.Writeq("Allowed ", available);
            this.Available = available;
            
            if(this.Available)
            { 
                DebugConsole.Writeq("Inventory backend available!!");
                this.SubDBNames = new Array<any>();
                InventoryBackend.ReloadSubDBNames();
            }
            else DebugConsole.Writeq("Inventory backend unavailable");
        });
    }

    private static ReloadSubDBNames()
    {
        this.mongoBackend.returnAll(this.InventoryCollection, (err: any, value: any) => {
            if(value.length > 0)
            {
                value.forEach((element: any) => {
                    this.SubDBNames.push(element);
                });
            }
            else
            {
                console.log('no prior subdbs to load.');
            }

            console.log('\n\nTODO: still actually reload the subdb names. Until then, here they are!\n')
            console.log(value);
            console.log('\n');
        });
    }

    public static GetSubDBList(callback: (err: any, result: Array<any> | undefined) => void)
    {
        this.mongoBackend.returnAll(this.InventoryCollection, (err: any, value: any) => {
            if(err) callback(err, undefined);
            else callback(undefined, value);
        });
    }

    private static TrackingSubDB(subdb: any): boolean
    {
        let alreadyTracking:boolean = false;
        if(this.SubDBNames !== undefined && this.SubDBNames.length > 0)
        {
            this.SubDBNames.forEach((value) => {
                if(alreadyTracking) return;
                if(value.name === subdb) 
                {
                    alreadyTracking = true;
                    return true;
                }
            });

            return alreadyTracking;
        }
        else 
        {
            return false;
        }
    }

    public static MakeFullDBName(subdb: string): string
    {
        if(subdb === null || subdb === undefined || subdb === "new_subdb" || subdb === "undefined" || subdb === "null") return "";

        // If we're not already tracking, add it to the list and then to the database!
        if(!InventoryBackend.TrackingSubDB(subdb))
        {
            let payload = 
            {
                name: subdb
            };

            this.SubDBNames.push(payload);
            this.mongoBackend.insertRecord(this.InventoryCollection, payload, (err, result) => {
                if(err)
                {
                    console.error("OHHHH NO. Error occurred while adding shit to the subdb list.", err, result);
                }
            });
        }


        return `${this.InventoryCollection}#${subdb}`;
    }

    public static getAllItems(subdb: string, callback: (err: any, value:any) => void) {
        this.mongoBackend.returnAll(InventoryBackend.MakeFullDBName(subdb), (err: any, value: any) => {
            callback(err, value);
        });
    }

    public static getItemByID(subdb: string, __id: ObjectID, callback: (item: IInventoryItem | undefined, err: any) => void) {
        this.mongoBackend.query(InventoryBackend.MakeFullDBName(subdb), "_id", __id, (err: any, result: any) => {
            if(err) callback(undefined, err);
            if(result) {
                let returningItem: IInventoryItem;

                if(typeof result === typeof String) returningItem = JSON.parse(result);
                else returningItem = <IInventoryItem>result;

                callback(returningItem, undefined);
            }
        });
    }

    public static addNewItem(subdb: string, newItem: IInventoryItem, callback: (err: any, result: any) => void) {
        this.mongoBackend.insertRecord(InventoryBackend.MakeFullDBName(subdb), newItem, (err: any, result: any) => {
            callback(err, result.ops[0]);
        });
    }

    public static removeItem(subdb: string, item_id: ObjectID, callback: any) {
        this.mongoBackend.delete(InventoryBackend.MakeFullDBName(subdb), '_id', String(item_id))
        callback('Deleted');
    }

    public static updateItem(subdb: string, __id: ObjectID, newValues: Object, callback: (err: any, result: any)=>void)
    {
        let oid = require('mongodb').ObjectID;
        var queryObj = {_id: oid(__id)};
        console.log(newValues);
        this.mongoBackend.updateRecord(InventoryBackend.MakeFullDBName(subdb), queryObj, newValues, (err: any, res: any) =>
        {
            callback(err, res);
        });
    }
}