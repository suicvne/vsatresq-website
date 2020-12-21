"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Endpoint = exports.Controller = void 0;
const express_1 = require("express");
const Debug_1 = require("../Debug");
const BlogBackend_Mongo_1 = require("../BlogBackend_Mongo");
const ServiceCalendarBackend_1 = require("../Calendar/ServiceCalendarBackend");
let oid = require('mongodb').ObjectID;
const router = express_1.Router();
// Get the service calendar ID
router.get('/service_calendar_id', (req, res) => {
    if (ServiceCalendarBackend_1.ServiceCalendarBackend.BackendAvailable) {
        res.status(200).send(ServiceCalendarBackend_1.ServiceCalendarBackend.GetGCalReflectionID());
    }
    else {
        res.status(400).write(`Service Calendar Backend is unavailable.`);
    }
});
// Set the service calendar ID
router.post('/service_calendar_id', (req, res) => {
    let username = req.body.username;
    let token = req.body.token;
    let gcalid = req.body.gcalid;
    if (username === undefined) {
        Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, `Error while posting service_calendar_id: username is undefined.`);
        res.status(401).send('Bitch');
    }
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
        BlogBackend_Mongo_1.ServerAuth.verifyUserPower(username, token, (u, power) => {
            if (power === 1 || power === 0) {
                ServiceCalendarBackend_1.ServiceCalendarBackend.SetGCalReflectionID(gcalid);
                res.status(200).send(ServiceCalendarBackend_1.ServiceCalendarBackend.GetGCalReflectionID());
            }
            else {
                Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, `Error while posting service_calendar_id: Username ${username} only has power level ${power}`);
                return res.status(401).send(`User \`${username}\` only has power level ${power}`);
            }
        });
    }
    else {
        res.status(401).write(`Unauthorized username/token combination: ${username}/${token}`);
    }
});
router.get('/get_entries', (req, res) => {
    let id = req.body.entry_id;
    if (id !== undefined) {
        if (id === 'all') {
            ServiceCalendarBackend_1.ServiceCalendarBackend.getAllServiceCalendarEntries((entries, err) => {
                if (err) {
                    res.status(400).send(`Error getting all entries: ${err}`);
                    return;
                }
                else {
                    res.status(200).send(JSON.stringify(entries, undefined, 4));
                    return;
                }
            });
        }
        else {
            ServiceCalendarBackend_1.ServiceCalendarBackend.getServiceCalendarEntryByID(id, (cal_entry, err) => {
                if (err) {
                    res.status(400).send(`Error getting entry with ID \`${id}\``);
                    return;
                }
                else {
                    res.status(200).send(JSON.stringify(cal_entry, null, 4));
                }
            });
        }
    }
});
router.post('/add_entry', (req, res) => {
    let entry = req.body.new_entry;
    if (entry !== undefined) {
        let newEntry = entry;
        if (newEntry !== undefined) {
            ServiceCalendarBackend_1.ServiceCalendarBackend.addServiceCalendarEntry(newEntry, (result, err) => {
                if (err) {
                    res.status(400).send(`Error while inserting entry: \n${err}`);
                    return;
                }
                else {
                    res.status(200).send(result);
                    return;
                }
            });
        }
        else {
            res.status(400).send(`Invalid entry.\n${newEntry}`);
            return;
        }
    }
    else {
        res.status(400).send(`Invalid entry.\n${entry}`);
        return;
    }
});
router.post('/delete_entry', (req, res) => {
    let username = req.body.username;
    let token = req.body.token;
    let entry_id = req.body.entry_id;
    if (username === undefined || token === undefined || entry_id === undefined) {
        res.status(400).send(`Invalid arguments`);
        return;
    }
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
        BlogBackend_Mongo_1.ServerAuth.verifyUserPower(username, token, (u, power) => {
            if (power === 1 || power === 0) {
                ServiceCalendarBackend_1.ServiceCalendarBackend.removeServiceCalendarEntry(entry_id, (result) => {
                    res.status(200).send(result);
                    return;
                });
            }
            else {
                res.status(401).send(`User ${username} does not have enough power. Power Level: ${power}`);
                return;
            }
        });
    }
    else {
        res.status(401).send(`Invalid username/token combination: ${username}/${token}`);
        return;
    }
});
router.post('/update_entry', (req, res) => {
    let username = req.body.username;
    let token = req.body.token;
    let entry_id = req.body.entry_id;
    let new_values = req.body.new_values;
    if (username === undefined || token === undefined || entry_id === undefined) {
        res.status(400).send(`Invalid arguments`);
        return;
    }
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
        BlogBackend_Mongo_1.ServerAuth.verifyUserPower(username, token, (u, power) => {
            if (power === 1 || power === 0) {
                ServiceCalendarBackend_1.ServiceCalendarBackend.updateServiceCalendarEntry(entry_id, new_values, (result, err) => {
                    if (err) {
                        res.status(400).send(`Error while updating entry ID \`${entry_id}\`: ${err}`);
                        return;
                    }
                    else {
                        res.status(200).send(result);
                        return;
                    }
                });
            }
            else {
                res.status(401).send(`User ${username} does not have enough power. Power Level: ${power}`);
                return;
            }
        });
    }
    else {
        res.status(401).send(`Invalid username/token combination: ${username}/${token}`);
        return;
    }
});
exports.Controller = router;
exports.Endpoint = '/service_calendar';
//# sourceMappingURL=ServiceCalendarController.js.map