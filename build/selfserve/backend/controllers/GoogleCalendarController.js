"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Endpoint = exports.Controller = void 0;
const express_1 = require("express");
const GoogleCalendarBackend_1 = require("../Calendar/GoogleCalendarBackend");
let oid = require('mongodb').ObjectID;
const router = express_1.Router();
router.get('/is_auth', (req, res) => {
    console.log('checking auth');
    if (GoogleCalendarBackend_1.GoogleCalendarBackend.BackendAvailable) {
        console.log('(GoogleCalendarController.ts) Google Cal is available.');
        res.status(200).send('OK');
    }
    else {
        res.status(200).send(GoogleCalendarBackend_1.GoogleCalendarBackend.STORED_AUTH_URL);
    }
});
router.post('/submit_code', (req, res) => {
    let gcode = req.body.gcode;
    GoogleCalendarBackend_1.GoogleCalendarBackend.TryGoogleCodeForToken(gcode, (gAuthClient, err) => {
        if (gAuthClient === undefined) {
            res.status(400).send(err);
        }
        else {
            res.status(200).send('Authenticated successfully with Google Calendar!');
        }
    });
});
router.get('/get_events_timespan', (req, res) => {
    let timeMin = req.query.timeMin;
    let timeMax = req.query.timeMax;
    let calendarId = req.query.calendarId;
    GoogleCalendarBackend_1.GoogleCalendarBackend.GetEventsInTimeSpan(calendarId, timeMin, timeMax, (results, err) => {
        if (err) {
            res.status(400).send(`Error while getting events between ${timeMin} and ${timeMax}: ${err}`);
            return;
        }
        else {
            res.status(200).send(JSON.stringify(results, undefined, 4));
            return;
        }
    });
});
router.get('/test', (req, res) => {
    GoogleCalendarBackend_1.GoogleCalendarBackend.TestListRecentEvents((recentEvents, error) => {
        if (error) {
            res.send(error);
        }
        else {
            res.status(200).send(JSON.stringify(recentEvents));
        }
    });
});
router.get('/owner_calendars', (req, res) => {
    GoogleCalendarBackend_1.GoogleCalendarBackend.GetOwnerCalendars((calendars, err) => {
        if (err) {
            res.send(err);
            return;
        }
        else {
            res.status(200).send(JSON.stringify(calendars, undefined, 4));
        }
    });
});
exports.Controller = router;
exports.Endpoint = '/gcalendar';
//# sourceMappingURL=GoogleCalendarController.js.map