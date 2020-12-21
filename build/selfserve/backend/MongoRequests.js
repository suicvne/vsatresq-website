"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBInstance = exports.MongoDBStatus = void 0;
var MongoDBStatus;
(function (MongoDBStatus) {
    MongoDBStatus[MongoDBStatus["OK"] = 0] = "OK";
    MongoDBStatus[MongoDBStatus["Error"] = 1] = "Error";
})(MongoDBStatus = exports.MongoDBStatus || (exports.MongoDBStatus = {}));
const Debug_1 = require("./Debug");
var mongo = require('mongodb').MongoClient;
var oid = require('mongodb').ObjectID;
var DB = require('mongodb').Db, MongoClient = mongo, Server = require('mongodb').Server;
var config = require(`${process.cwd()}/site.config`).selfserve;
class MongoDBInstance {
    constructor(databaseName) {
        this.currentDatabase = config.default_db;
        this.allowed = true;
        this.currentDatabase = databaseName;
        if (config.skip_auth)
            this.url = `mongodb://${config.url}:${config.port}`;
        else
            this.url = `mongodb://${config.username}:${config.password}@${config.url}:${config.port}/`;
        // console.log("sanity check: ", this.url);
    }
    init(callback) {
        // console.log('connecting to ' + this.url);
        // test connect
        mongo.connect(this.url, (err, db) => {
            if (err) {
                console.log(err);
                callback(false);
                this.allowed = false;
            }
            else
                callback(true);
        });
    }
    query(collectionName, keyName, keyValue, callback) {
        if (!this.allowed)
            return;
        // console.log('\n\n keyvalue: ', keyValue, '\n\n');
        if (!keyValue)
            return;
        if ((typeof keyValue === typeof String) && !keyValue.trim())
            return;
        mongo.connect(this.url, (err, db) => {
            if (err) {
                callback(err, null);
                throw err;
            }
            if (db === null) {
                callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined);
                return;
            }
            var dbo = db.db(this.currentDatabase);
            if (keyName === "_id") {
                if (keyValue.length == 24) {
                    keyValue = oid(keyValue);
                }
                else {
                    Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, `Invalid key name or key value invalid length:\n\nKey Name: ${keyName}\nKey Value: ${keyValue}`);
                    callback(`Invalid key name or key value invalid length:\n\nKey Name: ${keyName}\nKey Value: ${keyValue}`, undefined);
                    return;
                }
            }
            var query = { [keyName]: keyValue };
            Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.DEBUG, `(MongoRequests.ts) ${this.currentDatabase}.${collectionName}.query(${JSON.stringify(query)});`);
            dbo.collection(collectionName).find(query).toArray((err, res) => {
                if (err) {
                    callback(err, null);
                    throw err;
                } // Something bad happened
                if (res.length === 0) // User isn't in the database
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
    delete(collectionName, byKey, keyValue) {
        if (!this.allowed)
            return;
        mongo.connect(this.url, (err, db) => {
            if (err)
                throw err;
            if (db === null) {
                Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, "DB was null!");
                return;
            }
            var dbo = db.db(this.currentDatabase);
            if (byKey === "_id") {
                console.log(`id key: ${keyValue}`);
                keyValue = oid(keyValue);
            }
            var query = { [byKey]: keyValue };
            Debug_1.DebugConsole.Writeq("delete query: ", query);
            dbo.collection(collectionName).deleteOne(query, (err, res) => {
                Debug_1.DebugConsole.Writeq("send delete request");
                db.close();
            });
            db.close();
        });
    }
    changeDatabase(dbName) {
        if (!this.allowed)
            return;
        Debug_1.DebugConsole.Writeq(`change database from ${this.currentDatabase} -> ${dbName}`);
        this.currentDatabase = dbName;
    }
    deleteCollection(collectionName) {
        if (!this.allowed)
            return;
        mongo.connect(this.url, (err, db) => {
            if (err)
                throw err;
            var dbo = db.db(this.currentDatabase);
            dbo.collection(collectionName).drop((err, delOK) => {
                if (err)
                    throw err;
                Debug_1.DebugConsole.Writeq("dropped collection ", collectionName, " ", delOK);
                db.close();
            });
            db.close();
        });
    }
    updateRecord(collectionName, queryObj, newValues, callback) {
        if (!this.allowed)
            return;
        var updateQuery = { $set: newValues };
        // console.log(queryObj);
        // console.log(updateQuery);
        mongo.connect(this.url, (err, db) => {
            if (err)
                callback(err, "Error while connecting to the Mongo instance.");
            if (db === null) {
                callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined);
                return;
            }
            var dbo = db.db(this.currentDatabase);
            dbo.collection(collectionName).updateOne(queryObj, updateQuery, (err, res) => {
                if (err || res.result.nModified == 0)
                    callback(err, `Error while updating the record given\nUpdate Query: ${JSON.stringify(updateQuery)}\nqueryObj: ${JSON.stringify(queryObj)}`);
                else {
                    console.log('modified ' + res.result.nModified);
                    callback(err, res);
                    db.close();
                }
            });
            db.close();
        });
    }
    returnN(collectionName, n, callback) {
        if (!this.allowed)
            return;
        mongo.connect(this.url, (err, db) => {
            if (err) {
                callback(err, "Error while connecting to the Mongo instance.");
                return;
            }
            if (db === null) {
                callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined);
                return;
            }
            var dbo = db.db(this.currentDatabase);
            if (!Number.isInteger(n))
                n = 0;
            dbo.collection(collectionName).find().limit(n).toArray((err, res) => {
                if (err) {
                    callback(err, `Error while returning ${n} items from the database.`);
                    return;
                }
                db.close();
                callback(err, res);
            });
        });
    }
    returnNByKey(collectionName, n, key, value, callback) {
        if (!this.allowed)
            return;
        mongo.connect(this.url, (err, db) => {
            if (err)
                callback(err, "Error while connecting to the Mongo instance.");
            if (db === null) {
                callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined);
                return;
            }
            var dbo = db.db(this.currentDatabase);
            if (key === "_id")
                value = oid(value);
            var queryObj = { [key]: value };
            dbo.collection(collectionName).find(queryObj).limit(n).toArray((err, result) => {
                if (err)
                    callback(err, `Error while returning ${n} items from the database given ${JSON.stringify(queryObj)}.`);
                callback(undefined, result);
                db.close();
            });
        });
        return undefined;
    }
    returnAll(collectionName, callback) {
        if (collectionName === undefined) {
            console.warn("Attempt to call `returnAll` with invalid/null collection name.");
            callback("Attempt to call `returnAll` with invalid/null collection name.", undefined);
            return;
        }
        if (!this.allowed)
            return;
        console.log('RETURN ALL FOR.... ', collectionName);
        if (collectionName.indexOf('$') >= 0) {
            callback("ERROR", `Collection name contains illegal character.\nCollection Name: ${collectionName}`);
            return;
        }
        mongo.connect(this.url, (err, db) => {
            if (err) {
                callback(err, "Error while connecting to the Mongo instance.");
                return;
            }
            if (db === null) {
                callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined);
                return;
            }
            var dbo = db.db(this.currentDatabase);
            console.log(`getting all for ${this.currentDatabase}.${collectionName}`);
            dbo.collection(collectionName).find({}).toArray((err, result) => {
                if (err) {
                    callback(err, "Error while returning all from database");
                    return;
                }
                callback(undefined, result);
                db.close();
            });
        });
    }
    makeCollection(collectionName) {
        if (!this.allowed)
            return;
        mongo.connect(this.url, (err, db) => {
            var dbo = db.db(this.currentDatabase);
            dbo.createCollection(collectionName, (err, res) => {
                if (err)
                    throw err;
                db.close();
            });
        });
    }
    insertRecord(collectionName, obj, callback) {
        if (!this.allowed)
            return;
        mongo.connect(this.url, (err, db) => {
            if (err)
                callback(err, "Error while connecting to the Mongo instance.");
            if (db === null) {
                callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined);
                return;
            }
            var dbo = db.db(this.currentDatabase);
            dbo.collection(collectionName).insertOne(obj, (err, res) => {
                if (err) {
                    callback(err, "Error while inserting.");
                    return;
                }
                callback(err, res);
                db.close();
            });
        });
    }
    insertManyRecords(collectionName, objs, callback) {
        if (!this.allowed)
            return;
        mongo.connect(this.url, (err, db) => {
            if (err)
                callback(err, "Error while connecting to the Mongo instance.");
            if (db === null) {
                callback("db was null. Either mongoDB is not running or something else is critically wrong.", undefined);
                return;
            }
            var dbo = db.db(this.currentDatabase);
            dbo.collection(collectionName).insertMany(objs, (err, result) => {
                if (err) {
                    callback(err, "Error while inserting");
                    db.close();
                    return;
                }
                callback(undefined, result);
                db.close();
            });
        });
    }
}
exports.MongoDBInstance = MongoDBInstance;
//# sourceMappingURL=MongoRequests.js.map