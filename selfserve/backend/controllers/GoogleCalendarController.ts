import {Router, Request, Response} from 'express';
import {DebugConsole, DebugSeverity} from '../Debug';
import {ServerAuth} from '../BlogBackend_Mongo';
import {GoogleCalendarBackend} from '../Calendar/GoogleCalendarBackend'

let oid = require('mongodb').ObjectID;

const router: Router = Router();

router.get('/is_auth', (req: Request, res: Response) => {
    console.log('checking auth');
    if(GoogleCalendarBackend.BackendAvailable)
    {
        console.log('(GoogleCalendarController.ts) Google Cal is available.');
        res.status(200).send('OK');
    }
    else
    {
        res.status(200).send(GoogleCalendarBackend.STORED_AUTH_URL);
    }
});

router.post('/submit_code', (req: Request, res: Response) => {
    let gcode = req.body.gcode;
    GoogleCalendarBackend.TryGoogleCodeForToken(gcode, (gAuthClient:any, err:any) => {
        if(gAuthClient === undefined)
        {
            res.status(400).send(err);
        }
        else
        {
            res.status(200).send('Authenticated successfully with Google Calendar!');
        }
    })
});

router.get('/get_events_timespan', (req: Request, res: Response) => {
    let timeMin = req.query.timeMin;
    let timeMax = req.query.timeMax;
    let calendarId = req.query.calendarId;

    GoogleCalendarBackend.GetEventsInTimeSpan(<string>calendarId, <string>timeMin, <string>timeMax, (results: any, err: any) => {
        if(err)
        {
            res.status(400).send(`Error while getting events between ${timeMin} and ${timeMax}: ${err}`)
            return;
        }
        else
        {
            res.status(200).send(JSON.stringify(results, undefined, 4));
            return;
        }
    });
})

router.get('/test', (req: Request, res: Response) => {
    GoogleCalendarBackend.TestListRecentEvents((recentEvents: any, error: any) => {
        if(error)
        {
            res.send(error);
        }
        else
        {
            res.status(200).send(JSON.stringify(recentEvents));
        }
    });
});

router.get('/owner_calendars', (req: Request, res: Response) => {
    GoogleCalendarBackend.GetOwnerCalendars((calendars: any, err: any) => {
        if(err)
        {
            res.send(err);
            return;
        }
        else
        {
            res.status(200).send(JSON.stringify(calendars, undefined, 4));
        }
    });
}); 

export const Controller: Router = router;
export const Endpoint: string = '/gcalendar';