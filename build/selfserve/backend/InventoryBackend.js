"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryBackend = void 0;
const MongoRequests_1 = require("./MongoRequests");
const Debug_1 = require("./Debug");
var config = require(`${process.cwd()}/site.config`).selfserve;
class InventoryBackend {
    static initInvBackend() {
        // TODO: change this name
        this.mongoBackend = new MongoRequests_1.MongoDBInstance(config.default_db);
        this.mongoBackend.init((available) => {
            Debug_1.DebugConsole.Writeq("Allowed ", available);
            this.Available = available;
            if (this.Available) {
                Debug_1.DebugConsole.Writeq("Inventory backend available!!");
                this.SubDBNames = new Array();
                InventoryBackend.ReloadSubDBNames();
            }
            else
                Debug_1.DebugConsole.Writeq("Inventory backend unavailable");
        });
    }
    static ReloadSubDBNames() {
        this.mongoBackend.returnAll(this.InventoryCollection, (err, value) => {
            if (value.length > 0) {
                value.forEach((element) => {
                    this.SubDBNames.push(element);
                });
            }
            else {
                console.log('no prior subdbs to load.');
            }
            console.log('\n\nTODO: still actually reload the subdb names. Until then, here they are!\n');
            console.log(value);
            console.log('\n');
        });
    }
    static GetSubDBList(callback) {
        this.mongoBackend.returnAll(this.InventoryCollection, (err, value) => {
            if (err)
                callback(err, undefined);
            else
                callback(undefined, value);
        });
    }
    static TrackingSubDB(subdb) {
        let alreadyTracking = false;
        if (this.SubDBNames !== undefined && this.SubDBNames.length > 0) {
            this.SubDBNames.forEach((value) => {
                if (alreadyTracking)
                    return;
                if (value.name === subdb) {
                    alreadyTracking = true;
                    return true;
                }
            });
            return alreadyTracking;
        }
        else {
            return false;
        }
    }
    static MakeFullDBName(subdb) {
        if (subdb === null || subdb === undefined || subdb === "new_subdb" || subdb === "undefined" || subdb === "null")
            return "";
        // If we're not already tracking, add it to the list and then to the database!
        if (!InventoryBackend.TrackingSubDB(subdb)) {
            let payload = {
                name: subdb
            };
            this.SubDBNames.push(payload);
            this.mongoBackend.insertRecord(this.InventoryCollection, payload, (err, result) => {
                if (err) {
                    console.error("OHHHH NO. Error occurred while adding shit to the subdb list.", err, result);
                }
            });
        }
        return `${this.InventoryCollection}#${subdb}`;
    }
    static getAllItems(subdb, callback) {
        this.mongoBackend.returnAll(InventoryBackend.MakeFullDBName(subdb), (err, value) => {
            callback(err, value);
        });
    }
    static getItemByID(subdb, __id, callback) {
        this.mongoBackend.query(InventoryBackend.MakeFullDBName(subdb), "_id", __id, (err, result) => {
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
    static addNewItem(subdb, newItem, callback) {
        this.mongoBackend.insertRecord(InventoryBackend.MakeFullDBName(subdb), newItem, (err, result) => {
            callback(err, result.ops[0]);
        });
    }
    static removeItem(subdb, item_id, callback) {
        this.mongoBackend.delete(InventoryBackend.MakeFullDBName(subdb), '_id', String(item_id));
        callback('Deleted');
    }
    static updateItem(subdb, __id, newValues, callback) {
        let oid = require('mongodb').ObjectID;
        var queryObj = { _id: oid(__id) };
        console.log(newValues);
        this.mongoBackend.updateRecord(InventoryBackend.MakeFullDBName(subdb), queryObj, newValues, (err, res) => {
            callback(err, res);
        });
    }
}
exports.InventoryBackend = InventoryBackend;
InventoryBackend.InventoryCollection = "inventory_db";
InventoryBackend.Available = false;
//# sourceMappingURL=InventoryBackend.js.map