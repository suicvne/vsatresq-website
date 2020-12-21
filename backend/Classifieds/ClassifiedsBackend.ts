import {MongoDBInstance, MongoDBStatus} from "../MongoRequests";
import { ObjectID } from "mongodb";
import {ClassifiedListing, IClassifiedListing} from './ClassifiedListing';
import { DebugConsole } from "../Debug";
import { IShopItem } from "../Shop/ShopItem";
var config = require(`${process.cwd()}/../site.config`).selfserve;

export abstract class ClassifiedsBackend
{
    private static ClassifiedsCollection: string = "classifieds_listings";
    private static mongoBackend: MongoDBInstance;
    public static Available:boolean = false;

    public static initBackend()
    {
                            // TODO: read from config
        this.mongoBackend = new MongoDBInstance(config.default_db);

        this.mongoBackend.init((available: boolean) => {
            DebugConsole.Writeq("Classifieds Allowed: ", available);
            this.Available = available;


        });
    }

    public static getAllListings(callback: (err: any, value: any) => void) {
        this.mongoBackend.returnAll(this.ClassifiedsCollection, (err: any, value: any) => {
            callback(err, value);
        })
    }

    public static addNewListing(newListing: ClassifiedListing, callback: (err: any, result: any) => void) {
        this.mongoBackend.insertRecord(this.ClassifiedsCollection, newListing, (err: any, result: any) => {
            callback(err, result.ops);
        });
    }

    public static removeListing(listing_id: ObjectID, callback: any) {
        this.mongoBackend.delete(this.ClassifiedsCollection, '_id', String(listing_id));
        callback(`Deleted ${listing_id}`);
    }

    public static updateListing(listing_id: string, newValues: any, callback: (err: any, result: any) => void) {
        let oid = require('mongodb').ObjectID;
        var queryObj = {_id: oid(listing_id)};
        delete newValues._id;
        console.log(queryObj);
        console.log(newValues);

        this.mongoBackend.updateRecord(this.ClassifiedsCollection, queryObj, newValues, (err: any, result: any) => {
            callback(err, result);
        }); 
    }

    public static getListingByID(__id: ObjectID, callback: (listing: ClassifiedListing | undefined, err: any) => void) {
        this.mongoBackend.query(this.ClassifiedsCollection, "_id", __id, (err: any, result: any) => {
            if(err)
            {
                callback(undefined, err);
                return;
            }
            else
            {
                if(result) {
                    let returningItem: IClassifiedListing;

                    if(typeof result === typeof String) returningItem = JSON.parse(result);
                    else returningItem = <IClassifiedListing>result;

                    callback(returningItem, undefined);
                }
            }
        });
    }
}

