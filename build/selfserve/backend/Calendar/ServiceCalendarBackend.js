"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCalendarBackend = exports.ServiceCalendarEntry = void 0;
const Debug_1 = require("../Debug");
const MongoRequests_1 = require("../MongoRequests");
const GoogleCalendarBackend_1 = require("../Calendar/GoogleCalendarBackend");
const fs = __importStar(require("fs"));
let config = require(`${process.cwd()}/site.config`).selfserve;
;
class ServiceCalendarEntry {
    constructor() {
        this.Name = "John Doe";
        this.ServiceType = "Unknown";
        this.OwnerNotes = "N/A";
        this.StatusNotes = [];
        this.PreferredServiceDate = undefined;
        this.GCalEventID = undefined;
    }
    SetInitialNote() {
        var _a;
        let ownerNotesMsg = (this.OwnerNotes === "N/A" ? '' : `\nThey added: ${this.OwnerNotes}\n`);
        let preferredDateMsg = (this.PreferredServiceDate === undefined ? '' : `Their preferred service date is ${(_a = this.PreferredServiceDate) === null || _a === void 0 ? void 0 : _a.toLocaleDateString()}`);
        this.StatusNotes.push({
            note_date: Date.now().toString(),
            status: 'Created',
            message: `${this.Name} requested a service of type ${this.ServiceType}.${ownerNotesMsg}${preferredDateMsg}`
        });
    }
}
exports.ServiceCalendarEntry = ServiceCalendarEntry;
class ServiceCalendarBackend {
    static init() {
        if (GoogleCalendarBackend_1.GoogleCalendarBackend.BackendAvailable === false) {
            Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.WARNING, `(ServiceCalendarBackend.ts) Google Calendar Backend unavailable, some features limited on Service Calendar.`);
        }
        this.mongoBackend = new MongoRequests_1.MongoDBInstance(config.default_db);
        this.mongoBackend.init((available) => {
            Debug_1.DebugConsole.Writeq("(ServiceCalendarBackend.ts) Allowed: ", available);
            this.BackendAvailable = available;
            this.loadGCalReflectionID();
        });
    }
    static GetGCalReflectionID() {
        return this.GCalReflectionID;
    }
    static SetGCalReflectionID(newID) {
        this.GCalReflectionID = newID;
        fs.writeFileSync(this.GCalReflectionIDStorePath, this.GCalReflectionID);
    }
    static loadGCalReflectionID() {
        try {
            let statsObj = fs.statSync(this.GCalReflectionIDStorePath);
            if (statsObj.isFile()) {
                this.GCalReflectionID = fs.readFileSync(this.GCalReflectionIDStorePath).toString();
            }
        }
        catch (_a) {
            fs.writeFileSync(this.GCalReflectionIDStorePath, this.GCalReflectionID === undefined ? '' : this.GCalReflectionID);
        }
    }
    static getAllServiceCalendarEntries(callback) {
        this.mongoBackend.returnAll(this.ServiceCalendarCollection, (err, value) => {
            callback(value, err);
        });
    }
    static addServiceCalendarEntry(newEntry, callback) {
        this.mongoBackend.insertRecord(this.ServiceCalendarCollection, newEntry, (err, result) => {
            callback(result.ops, err);
        });
    }
    static removeServiceCalendarEntry(entry_id, callback) {
        this.mongoBackend.delete(this.ServiceCalendarCollection, '_id', entry_id);
        callback(`Deleted ${entry_id}`);
    }
    static updateServiceCalendarEntry(entry_id, newValues, callback) {
        let oid = require('mongodb').ObjectID;
        var queryObj = { _id: oid(entry_id) };
        delete newValues._id;
        this.mongoBackend.updateRecord(this.ServiceCalendarCollection, queryObj, newValues, (err, res) => {
            callback(res, err);
        });
    }
    static getServiceCalendarEntryByID(entry_id, callback) {
        let oid = require('mongodb').ObjectID;
        this.mongoBackend.query(this.ServiceCalendarCollection, "_id", oid(entry_id), (err, result) => {
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
exports.ServiceCalendarBackend = ServiceCalendarBackend;
ServiceCalendarBackend.BackendAvailable = false;
ServiceCalendarBackend.GCalReflectionID = undefined;
ServiceCalendarBackend.GCalReflectionIDStorePath = `${process.cwd()}/gcalreflectionid`;
ServiceCalendarBackend.ServiceCalendarCollection = "service_calendar";
//# sourceMappingURL=ServiceCalendarBackend.js.map