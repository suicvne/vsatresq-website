"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassifiedsBackend = void 0;
const MongoRequests_1 = require("../MongoRequests");
const Debug_1 = require("../Debug");
var config = require(`${process.cwd()}/site.config`).selfserve;
class ClassifiedsBackend {
    static initBackend() {
        // TODO: read from config
        this.mongoBackend = new MongoRequests_1.MongoDBInstance(config.default_db);
        this.mongoBackend.init((available) => {
            Debug_1.DebugConsole.Writeq("Classifieds Allowed: ", available);
            this.Available = available;
        });
    }
    static loadGCalReflectionID() {
        let fs = require('fs');
        fs.statSync();
    }
    static getAllListings(callback) {
        this.mongoBackend.returnAll(this.ClassifiedsCollection, (err, value) => {
            callback(err, value);
        });
    }
    static addNewListing(newListing, callback) {
        this.mongoBackend.insertRecord(this.ClassifiedsCollection, newListing, (err, result) => {
            callback(err, result.ops);
        });
    }
    static removeListing(listing_id, callback) {
        this.mongoBackend.delete(this.ClassifiedsCollection, '_id', String(listing_id));
        callback(`Deleted ${listing_id}`);
    }
    static updateListing(listing_id, newValues, callback) {
        let oid = require('mongodb').ObjectID;
        var queryObj = { _id: oid(listing_id) };
        delete newValues._id;
        console.log(queryObj);
        console.log(newValues);
        this.mongoBackend.updateRecord(this.ClassifiedsCollection, queryObj, newValues, (err, result) => {
            callback(err, result);
        });
    }
    static getListingByID(__id, callback) {
        this.mongoBackend.query(this.ClassifiedsCollection, "_id", __id, (err, result) => {
            if (err) {
                callback(undefined, err);
                return;
            }
            else {
                if (result) {
                    let returningItem;
                    if (typeof result === typeof String)
                        returningItem = JSON.parse(result);
                    else
                        returningItem = result;
                    callback(returningItem, undefined);
                }
            }
        });
    }
}
exports.ClassifiedsBackend = ClassifiedsBackend;
ClassifiedsBackend.ClassifiedsCollection = "classifieds_listings";
ClassifiedsBackend.Available = false;
ClassifiedsBackend.GCalReflectionID = undefined;
//# sourceMappingURL=ClassifiedsBackend.js.map