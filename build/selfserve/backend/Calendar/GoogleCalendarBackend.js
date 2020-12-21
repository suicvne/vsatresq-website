"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarBackend = void 0;
const Debug_1 = require("../Debug");
const googleapis_1 = require("googleapis");
let config = require(`${process.cwd()}/site.config`);
let fs = require('fs');
class GoogleCalendarBackend {
    // private static getGoogleAuthURL() {
    //     const scopes = [
    //     ]
    //     return this.googleOAuthClient?.generateAuthUrl({
    //         access_type: 'offline',
    //         prompt: 'consent',
    //         scope: scopes
    //     });
    // }
    static TryGoogleCodeForToken(inputCode, callback) {
        this.googleOAuthClient.getToken(inputCode, (err, token) => {
            if (err)
                return callback(undefined, 'Error retrieving access token: ' + err);
            this.googleOAuthClient.setCredentials(token);
            fs.writeFile(`${process.cwd()}/data/google_token.json`, JSON.stringify(token), (err) => {
                if (err)
                    return console.error(err);
                console.log('Google Token Stored for Calendar Integration.');
            });
            callback(this.googleOAuthClient, undefined);
        });
    }
    static GoogleAuthorize(callback) {
        let client_secret = config.selfserve.calendar.google_client_secret;
        let client_id = config.selfserve.calendar.google_client_id;
        let redirect_uris = 'http://localhost:8000/TESTING/flvanman/admin/authorize_calendar.html';
        this.googleOAuthClient = new googleapis_1.google.auth.OAuth2(client_id, client_secret, redirect_uris);
        fs.readFile(`${process.cwd()}/data/google_token.json`, (err, token) => {
            if (err) {
                this.getAuthUrl((authUrl) => {
                    this.STORED_AUTH_URL = authUrl;
                    console.error('Please visit ' + authUrl + '\n to authenticate Calendar integration');
                    callback(undefined, 'New authorization needed.');
                });
            }
            else {
                this.googleOAuthClient.setCredentials(JSON.parse(token));
                callback(this.googleOAuthClient, undefined);
            }
        });
    }
    static getAuthUrl(callback) {
        const authUrl = this.googleOAuthClient.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES
        });
        callback(authUrl);
    }
    static getAccessToken(callback) {
        const authUrl = this.googleOAuthClient.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES
        });
    }
    static GetOwnerCalendars(callback) {
        if (this.BackendAvailable === false) {
            callback(undefined, "Not authorized.");
            return;
        }
        let auth = this.googleOAuthClient;
        var calendar = googleapis_1.google.calendar({ version: 'v3', auth });
        calendar.calendarList.list({
            "maxResults": 20
        }).then((response) => {
            // console.log(response);
            callback(response.data.items, undefined);
            // callback(response, undefined);
        }, (error) => {
            callback(undefined, error);
        });
    }
    static GetEventsInTimeSpan(calendarId, timeMin, timeMax, callback) {
        if (this.BackendAvailable === false) {
            callback(undefined, "Not Authorized.");
            return;
        }
        let auth = this.googleOAuthClient;
        let calendar = googleapis_1.google.calendar({ version: 'v3', auth });
        calendar.events.list({
            "calendarId": calendarId,
            "maxResults": 200,
            "timeMax": timeMax,
            "timeMin": timeMin
        }).then((response) => {
            callback(response.data.items, undefined);
        }, (error) => {
            callback(undefined, error);
        });
    }
    static TestListRecentEvents(callback) {
        let auth = this.googleOAuthClient;
        let calendar = googleapis_1.google.calendar({ version: 'v3', auth });
        calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime'
        }, (err, res) => {
            if (err)
                callback(undefined, err);
            const events = res.data.items;
            if (events.length) {
                callback(events, undefined);
                // events.map((event: any, i: any) => {
                //     const start = event.start.dateTime || event.start.date;
                // })
            }
        });
    }
    static init() {
        this.GoogleAuthorize((gclient, err) => {
            if (err) {
                this.BackendAvailable = false;
                Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, `Error while re-authenticating with Google: ${err}`);
                return;
            }
            this.BackendAvailable = true;
            console.log('(GoogleCalendarBackend.ts) GAuth Result: OK');
        });
    }
}
exports.GoogleCalendarBackend = GoogleCalendarBackend;
GoogleCalendarBackend.googleOAuthClient = undefined;
GoogleCalendarBackend.BackendAvailable = false;
GoogleCalendarBackend.SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
GoogleCalendarBackend.STORED_AUTH_URL = '';
//# sourceMappingURL=GoogleCalendarBackend.js.map