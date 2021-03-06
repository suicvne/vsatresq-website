export enum MongoDBStatus {
    OK, Error
}

import { DebugConsole, DebugSeverity } from "./Debug";
import { Db } from "mongodb";


var mongo = require('mongodb').MongoClient;
var oid = require('mongodb').ObjectID;

var DB = require('mongodb').Db,
    MongoClient = mongo,
    Server = require('mongodb').Server;

var config = require(`${process.cwd()}/../site.config`).selfserve;

export class MongoDBInstance {

    private currentDatabase: string = config.default_db;
    public allowed: boolean = true;
    private url: string;

    constructor(databaseName: string)
    {
        this.currentDatabase = databaseName;

        if(config.skip_auth) this.url = `mongodb://${config.url}:${config.port}`;
        else this.url = `mongodb://${config.username}:${config.password}@${config.url}:${config.port}/`;

        // console.log("sanity check: ", this.url);
    }

    public init(callback: Function)
    {
        // console.log('connecting to ' + this.url);
        // test connect
        mongo.connect(this.url, (err: any, db: any) => 
        {
            if(err)
            {
                console.log(err);
                callback(false);
                this.allowed = false;
            }
            else callback(true);
        });
    }

    public query(collectionName: string, keyName: string, keyValue: any, callback: (err: any, result: any) => void) {
        if(!this.allowed) return;

        // console.log('\n\n keyvalue: ', keyValue, '\n\n');

        if(!keyValue) return;
        if((typeof keyValue === typeof String) && !keyValue.trim()) return;

        mongo.connect(this.url, (err: any, db: any) => {
            if(err) {callback(err, null); throw err;}

            if(db === null){callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined); return;}

            var dbo = db.db(this.currentDatabase);


            if(keyName === "_id")
            {
                if(keyValue.length == 24)
                {
                    keyValue = oid(keyValue);
                }
                else {
                    DebugConsole.Write(DebugSeverity.ERROR, `Invalid key name or key value invalid length:\n\nKey Name: ${keyName}\nKey Value: ${keyValue}`);
                    callback(`Invalid key name or key value invalid length:\n\nKey Name: ${keyName}\nKey Value: ${keyValue}`, undefined);
                    return;
                }
            }
            
            var query = {[keyName]: keyValue};

            DebugConsole.Write(DebugSeverity.DEBUG, `(MongoRequests.ts) ${this.currentDatabase}.${collectionName}.query(${JSON.stringify(query)});`);

            dbo.collection(collectionName).find(query).toArray((err: any, res: any) => {
                if(err) {callback(err, null); throw err;} // Something bad happened

                if(res.length === 0) // User isn't in the database
                { 
                    callback(`User ${keyValue} could not be found?`, undefined);
                    return;
                }

                // Yay! Things work!
                callback(undefined, res[0]);
                db.close();
                return res[0];
            });

            db.close();
        });
    }

    /**
     * 
     * @param byKey Delete by the given key (_id to use an id)
     * @param keyValue * for any
     */
    public delete(collectionName: string, byKey: string, keyValue: string) {
        if(!this.allowed) return;

        mongo.connect(this.url, (err: any, db: any) => {
            if(err) throw err;
            if(db === null){DebugConsole.Write(DebugSeverity.ERROR, "DB was null!");return;}
            var dbo = db.db(this.currentDatabase);
            if(byKey === "_id")
            {
                console.log(`id key: ${keyValue}`)
                keyValue = oid(keyValue);
            }
            var query = {[byKey]: keyValue};
            DebugConsole.Writeq("delete query: ", query);
            dbo.collection(collectionName).deleteOne(query, (err: any, res: any) => {
                DebugConsole.Writeq("send delete request");
                db.close();
            });
            db.close();
        });
    }

    public changeDatabase(dbName: string) {
        if(!this.allowed) return;

        DebugConsole.Writeq(`change database from ${this.currentDatabase} -> ${dbName}`);
        this.currentDatabase = dbName;
    }

    public deleteCollection(collectionName: string) {
        if(!this.allowed) return;

        mongo.connect(this.url, (err: any, db: any) => {
            if(err) throw err;
            var dbo = db.db(this.currentDatabase);
            dbo.collection(collectionName).drop((err: any, delOK: any) => {
                if(err) throw err;
                DebugConsole.Writeq("dropped collection ", collectionName, " ", delOK);
                db.close();
            });

            db.close();
        });
    }

    public updateRecord(collectionName: string, queryObj: any, newValues: any, callback: (err: any, res: any) => void) 
    {
        if(!this.allowed) return;

        var updateQuery = {$set:newValues};
        // console.log(queryObj);
        // console.log(updateQuery);
        mongo.connect(this.url, (err: any, db: any) => {
            if(err) callback(err, "Error while connecting to the Mongo instance.");
            if(db === null){callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined); return;}
            var dbo = db.db(this.currentDatabase);
            dbo.collection(collectionName).updateOne(queryObj, updateQuery, (err: any, res: any) => {
                
                if(err || res.result.nModified == 0) callback(err, `Error while updating the record given\nUpdate Query: ${JSON.stringify(updateQuery)}\nqueryObj: ${JSON.stringify(queryObj)}`);
                else
                {
                    console.log('modified ' + res.result.nModified);
                    callback(err, res);
                    db.close();
                }
            });

            db.close();
        });
    }

    public returnN(collectionName: string, n: number, callback: (err: any, result: any) => void) {
        if(!this.allowed) return;

        mongo.connect(this.url, (err: any, db: any) => {
            if(err) {callback(err, "Error while connecting to the Mongo instance.");return;}
            if(db === null){callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined); return;}
            var dbo = db.db(this.currentDatabase);
            if(!Number.isInteger(n))    n = 0;
            dbo.collection(collectionName).find().limit(n).toArray((err: any, res: any) =>
            {
                if(err) {callback(err, `Error while returning ${n} items from the database.`);return;}
                db.close();
                callback(err, res);
            });
        });
    }

    public returnNByKey(collectionName: string, n: number, key: string, value: string, callback: (err: any, res: any) => void) {
        if(!this.allowed) return;

        mongo.connect(this.url, (err: any, db: any) => {
            if(err) callback(err, "Error while connecting to the Mongo instance.");
            if(db === null){callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined); return;}
            var dbo = db.db(this.currentDatabase);
            if(key === "_id") value = oid(value);
            var queryObj = {[key]: value};
            dbo.collection(collectionName).find(queryObj).limit(n).toArray((err: any, result: any) =>
            {
                if(err) callback(err, `Error while returning ${n} items from the database given ${JSON.stringify(queryObj)}.`);
                callback(undefined, result);
                db.close();
                
            });
        });

        return undefined;
    }

    public returnAll(collectionName: string, callback: (err: any, value: any) => void) {

        if(collectionName === undefined)
        {
            console.warn("Attempt to call `returnAll` with invalid/null collection name.");
            callback("Attempt to call `returnAll` with invalid/null collection name.", undefined);
            return;
        }
        if(!this.allowed) return;

        console.log('RETURN ALL FOR.... ', collectionName);
        if(collectionName.indexOf('$') >= 0)
        {
            callback("ERROR", `Collection name contains illegal character.\nCollection Name: ${collectionName}`);
            return;
        }

        mongo.connect(this.url, (err: any, db: any) => {
            if(err)
            {
                callback(err, "Error while connecting to the Mongo instance.");
                return;
            }
            if(db === null)
            {
                callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined); 
                return;
            }
            var dbo = db.db(this.currentDatabase);
            console.log(`getting all for ${this.currentDatabase}.${collectionName}`);
            dbo.collection(collectionName).find({}).toArray((err: any, result: any) =>
            {
                if(err)
                { 
                    callback(err, "Error while returning all from database");
                    return;
                }
                callback(undefined, result);
                db.close();
            });
        });
    }

    public makeCollection(collectionName: string) {
        if(!this.allowed) return;

        mongo.connect(this.url, (err: any, db: any) => {
            var dbo = db.db(this.currentDatabase);
            dbo.createCollection(collectionName, (err: any, res: any) => {
                if(err) throw err;
                db.close();
            });
        });
    }

    public insertRecord(collectionName: string, obj: any, callback: (err: any, result: any) => void)
    {
        if(!this.allowed) return;

        mongo.connect(this.url, (err: any, db: any) => {
            if(err) callback(err, "Error while connecting to the Mongo instance.");
            if(db === null){callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined); return;}
            var dbo = db.db(this.currentDatabase);
            dbo.collection(collectionName).insertOne(obj, (err: any, res: any) => {
                if(err) {callback(err, "Error while inserting."); return;}
                callback(err, res);
                db.close();
            });
        });
    }

    public insertManyRecords(collectionName: string, objs: any[], callback: (err: any, result: any) => void)
    {
        if(!this.allowed) return;

        mongo.connect(this.url, (err: any, db: any) => {
            if(err) callback(err, "Error while connecting to the Mongo instance.");
            if(db === null){callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined); return;}
            var dbo = db.db(this.currentDatabase);
            dbo.collection(collectionName).insertMany(objs, (err: any, result: any) => {
                if(err){ callback(err, "Error while inserting"); db.close(); return; }
                callback(undefined, result);
                db.close();
            });
        });
    }
}