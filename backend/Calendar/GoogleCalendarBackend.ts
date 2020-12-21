import { DebugConsole, DebugSeverity } from '../Debug';
import {google} from 'googleapis';
import { calendar } from 'googleapis/build/src/apis/calendar';
let config = require(`${process.cwd()}/site.config`);
let fs = require('fs');

export abstract class GoogleCalendarBackend
{
    private static googleOAuthClient: any = undefined;

    public static BackendAvailable: boolean = false;
    private static SCOPES: string[] = ["https://www.googleapis.com/auth/calendar.readonly"];
    public static STORED_AUTH_URL: string = '';

    // private static getGoogleAuthURL() {
    //     const scopes = [
            
    //     ]

    //     return this.googleOAuthClient?.generateAuthUrl({
    //         access_type: 'offline',
    //         prompt: 'consent',
    //         scope: scopes
    //     });
    // }

    public static TryGoogleCodeForToken(inputCode: string, callback: Function) {
        this.googleOAuthClient.getToken(inputCode, (err: any, token: any) => {
            if(err) return callback(undefined, 'Error retrieving access token: ' + err);
            this.googleOAuthClient.setCredentials(token);

            fs.writeFile(`${process.cwd()}/data/google_token.json`, JSON.stringify(token), (err: any) => {
                if(err) return console.error(err);
                console.log('Google Token Stored for Calendar Integration.');
            });
            callback(this.googleOAuthClient, undefined);
        });
    }


    private static GoogleAuthorize(callback: any) {
        let client_secret = config.selfserve.calendar.google_client_secret;
        let client_id = config.selfserve.calendar.google_client_id;
        let redirect_uris = 'http://localhost:8000/TESTING/flvanman/admin/authorize_calendar.html';

        this.googleOAuthClient = new google.auth.OAuth2(client_id, client_secret, redirect_uris);

        fs.readFile(`${process.cwd()}/data/google_token.json`, (err: any, token: any) => {
            if(err) 
            {
                this.getAuthUrl((authUrl: any) => {
                    this.STORED_AUTH_URL = authUrl;
                    console.error('Please visit ' + authUrl + '\n to authenticate Calendar integration');
                    callback(undefined, 'New authorization needed.');
                });
            }
            else
            {
                this.googleOAuthClient.setCredentials(JSON.parse(token));
                callback(this.googleOAuthClient, undefined);
            }
        });
    }

    private static getAuthUrl(callback: any) {
        const authUrl = this.googleOAuthClient.generateAuthUrl(
            {
                access_type: 'offline',
                scope: this.SCOPES
            }
        )
        callback(authUrl);
    }

    private static getAccessToken(callback: any) {
        const authUrl = this.googleOAuthClient.generateAuthUrl(
            {
                access_type: 'offline',
                scope: this.SCOPES
            }
        )
    }

    public static GetOwnerCalendars(callback: any) {
        if(this.BackendAvailable === false) 
        {
            callback(undefined, "Not authorized.");
            return;
        }

        let auth = this.googleOAuthClient;
        var calendar = google.calendar({version: 'v3', auth});

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

    public static GetEventsInTimeSpan(calendarId: string, timeMin: string, timeMax: string, callback: any) {
        if(this.BackendAvailable === false)
        {
            callback(undefined, "Not Authorized.");
            return; 
        }  

        let auth = this.googleOAuthClient;
        let calendar = google.calendar({version: 'v3', auth});

        calendar.events.list(
        {
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

    public static TestListRecentEvents(callback: any) {
        let auth = this.googleOAuthClient;
        let calendar: any = google.calendar({version: 'v3', auth});

        calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime'
        }, (err: any, res: any) => {
            if(err) callback(undefined, err);
            const events = res.data.items;
            if(events.length) {
                callback(events, undefined);
                // events.map((event: any, i: any) => {
                //     const start = event.start.dateTime || event.start.date;
                    
                // })
            }
        });
    }

    public static init () {

        this.GoogleAuthorize((gclient: any, err: any) => {
            if(err)
            {
                this.BackendAvailable = false;
                DebugConsole.Write(DebugSeverity.ERROR, `Error while re-authenticating with Google: ${err}`);
                return;
            }

            this.BackendAvailable = true;
            console.log('(GoogleCalendarBackend.ts) GAuth Result: OK');
        });
    }
}