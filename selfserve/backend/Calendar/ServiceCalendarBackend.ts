import { IClassifiedListing } from '../Classifieds/ClassifiedListing';
import { DebugConsole, DebugSeverity } from '../Debug';
import { MongoDBInstance } from '../MongoRequests';
import {IOrderNote} from '../Shop/Order';
import {GoogleCalendarBackend} from '../Calendar/GoogleCalendarBackend';
import * as fs from 'fs';

let config = require(`${process.cwd()}/../site.config`).selfserve;

export interface IServiceCalendarEntry {
    Name: string;
    ServiceType: string;
    OwnerNotes: string;
    StatusNotes: IOrderNote[];
    PreferredServiceDate: Date | undefined;
    GCalEventID: string | undefined;
};

export class ServiceCalendarEntry implements IServiceCalendarEntry {
    public Name: string;
    public ServiceType: string;
    public OwnerNotes: string;
    public StatusNotes: IOrderNote[];
    public PreferredServiceDate: Date | undefined;
    public GCalEventID: string | undefined;

    constructor()
    {
        this.Name = "John Doe";
        this.ServiceType = "Unknown";
        this.OwnerNotes = "N/A";
        this.StatusNotes = [];
        this.PreferredServiceDate = undefined;
        this.GCalEventID = undefined;
    }

    public SetInitialNote()
    {
        let ownerNotesMsg = (this.OwnerNotes === "N/A" ? '' : `\nThey added: ${this.OwnerNotes}\n`);
        let preferredDateMsg = (this.PreferredServiceDate === undefined ? '' : `Their preferred service date is ${this.PreferredServiceDate?.toLocaleDateString()}`);

        this.StatusNotes.push(
            {
                note_date: Date.now().toString(), 
                status: 'Created', 
                message: `${this.Name} requested a service of type ${this.ServiceType}.${ownerNotesMsg}${preferredDateMsg}`
            }
        );
    }
}

export abstract class ServiceCalendarBackend {

    private static mongoBackend: MongoDBInstance;
    public static BackendAvailable: boolean = false;
    private static GCalReflectionID: string | undefined = undefined;
    private static GCalReflectionIDStorePath: string = `${process.cwd()}/../data/gcalreflectionid`;
    private static ServiceCalendarCollection: string = "service_calendar";
    

    public static init() {
        if(GoogleCalendarBackend.BackendAvailable === false)
        {
            DebugConsole.Write(DebugSeverity.WARNING, `(ServiceCalendarBackend.ts) Google Calendar Backend unavailable, some features limited on Service Calendar.`);
        }

        this.mongoBackend = new MongoDBInstance(config.default_db);

        this.mongoBackend.init((available: boolean) => {
            DebugConsole.Writeq("(ServiceCalendarBackend.ts) Allowed: ", available);
            this.BackendAvailable = available;

            this.loadGCalReflectionID();
        });
    }

    public static GetGCalReflectionID(): string | undefined {
        return this.GCalReflectionID;
    }

    public static SetGCalReflectionID(newID: string) {
        this.GCalReflectionID = newID;
        fs.writeFileSync(this.GCalReflectionIDStorePath, this.GCalReflectionID);
    }

    private static loadGCalReflectionID() {
        try
        {
            let statsObj = fs.statSync(this.GCalReflectionIDStorePath);
            if(statsObj.isFile())
            {
                this.GCalReflectionID = fs.readFileSync(this.GCalReflectionIDStorePath).toString();
            }
        }
        catch
        {
            fs.writeFileSync(this.GCalReflectionIDStorePath, this.GCalReflectionID === undefined ? '' : this.GCalReflectionID);
        }
    }

    public static getAllServiceCalendarEntries(callback: (entries: any, err: any) => void) {
        this.mongoBackend.returnAll(this.ServiceCalendarCollection, (err: any, value: any) => {
            callback(value, err);
        });
    }

    public static addServiceCalendarEntry(newEntry: IServiceCalendarEntry, callback: (result: any, err: any) => void) {
        this.mongoBackend.insertRecord(this.ServiceCalendarCollection, newEntry, (err: any, result: any) => {
            callback(result.ops, err);
        });
    }

    public static removeServiceCalendarEntry(entry_id: string, callback: any) {
        this.mongoBackend.delete(this.ServiceCalendarCollection, '_id', entry_id);
        callback(`Deleted ${entry_id}`);
    }

    public static updateServiceCalendarEntry(entry_id: string, newValues: any, callback: (result: any, err: any) => void) {
        let oid = require('mongodb').ObjectID;
        var queryObj = {_id: oid(entry_id)};
        delete newValues._id;

        this.mongoBackend.updateRecord(this.ServiceCalendarCollection, queryObj, newValues, (err: any, res: any) => {
            callback(res, err);
        })
    }

    public static getServiceCalendarEntryByID(entry_id: string, callback: (calendar_entry: ServiceCalendarEntry | undefined, err: any) => void) {
        let oid = require('mongodb').ObjectID;
        this.mongoBackend.query(this.ServiceCalendarCollection, "_id", oid(entry_id), (err: any, result: any) => {
            if(err)
            {
                callback(undefined, err);
                return;
            }
            else
            {
                if(result) {
                    let returningItem: ServiceCalendarEntry;

                    if(typeof result === typeof String) returningItem = JSON.parse(result);
                    else returningItem = <ServiceCalendarEntry>result;

                    callback(returningItem, undefined);
                }
            }
        });
    }
}