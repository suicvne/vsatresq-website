import {Router, Request, Response} from 'express';
import {DebugConsole, DebugSeverity} from '../Debug';
import {ServerAuth} from '../BlogBackend_Mongo';
import {ServiceCalendarBackend, ServiceCalendarEntry} from '../Calendar/ServiceCalendarBackend';

let oid = require('mongodb').ObjectID;

const router: Router = Router();

// Get the service calendar ID
router.get('/service_calendar_id', (req: Request, res: Response) => {
    if(ServiceCalendarBackend.BackendAvailable)
    {
        res.status(200).send(ServiceCalendarBackend.GetGCalReflectionID())
    }
    else
    {
        res.status(400).write(`Service Calendar Backend is unavailable.`);
    }
});

// Set the service calendar ID
router.post('/service_calendar_id', (req: Request, res: Response) => {
    let username = req.body.username;
    let token = req.body.token;
    let gcalid = req.body.gcalid;

    if(username === undefined)
    {
        DebugConsole.Write(DebugSeverity.ERROR, `Error while posting service_calendar_id: username is undefined.`);
        res.status(401).send('Bitch');
    }
    
    if(ServerAuth.tokenStore.verifyToken(username, token))
    {
        ServerAuth.verifyUserPower(username, token, (u: string, power: number) => {
            if(power === 1 || power === 0)
            {
                ServiceCalendarBackend.SetGCalReflectionID(gcalid);
                res.status(200).send(ServiceCalendarBackend.GetGCalReflectionID());
            }
            else
            {
                DebugConsole.Write(DebugSeverity.ERROR, `Error while posting service_calendar_id: Username ${username} only has power level ${power}`);
                return res.status(401).send(`User \`${username}\` only has power level ${power}`);
            }
        });
    }
    else
    {
        res.status(401).write(`Unauthorized username/token combination: ${username}/${token}`);
    }
});

router.get('/get_entries', (req: Request, res: Response) => {
    let id = req.body.entry_id;
    
    if(id !== undefined)
    {
        if(id === 'all')
        {
            ServiceCalendarBackend.getAllServiceCalendarEntries((entries: any, err: any) => {
                if(err)
                {
                    res.status(400).send(`Error getting all entries: ${err}`);
                    return;
                }
                else
                {
                    res.status(200).send(JSON.stringify(entries, undefined, 4));
                    return;
                }
            });
        }
        else
        {
            ServiceCalendarBackend.getServiceCalendarEntryByID(id, (cal_entry: ServiceCalendarEntry | undefined, err: any) => {
                if(err)
                {
                    res.status(400).send(`Error getting entry with ID \`${id}\``);
                    return;
                }
                else
                {
                    res.status(200).send(JSON.stringify(cal_entry, null, 4));
                }
            }); 
        }
    }
});

router.post('/add_entry', (req: Request, res: Response) => {
    let entry = req.body.new_entry;

    if(entry !== undefined)
    {
        let newEntry: ServiceCalendarEntry = <ServiceCalendarEntry>entry;
        if(newEntry !== undefined)
        {
            ServiceCalendarBackend.addServiceCalendarEntry(newEntry, (result: any, err: any) => {
                if(err)
                {
                    res.status(400).send(`Error while inserting entry: \n${err}`);
                    return;
                }
                else
                {
                    res.status(200).send(result);
                    return;
                }
            });
        }
        else
        {
            res.status(400).send(`Invalid entry.\n${newEntry}`);
            return;
        }
    }
    else
    {
        res.status(400).send(`Invalid entry.\n${entry}`);
        return;
    }
});

router.post('/delete_entry', (req: Request, res: Response) => {
    let username = req.body.username;
    let token = req.body.token;
    let entry_id = req.body.entry_id;

    if(username === undefined || token === undefined || entry_id === undefined)
    {
        res.status(400).send(`Invalid arguments`);
        return;
    }

    if(ServerAuth.tokenStore.verifyToken(username, token))
    {
        ServerAuth.verifyUserPower(username, token, (u: any, power: any) => {
            if(power === 1 || power === 0)
            {
                ServiceCalendarBackend.removeServiceCalendarEntry(entry_id, (result: any) => {
                    res.status(200).send(result);
                    return;
                });
            }
            else
            {
                res.status(401).send(`User ${username} does not have enough power. Power Level: ${power}`);
                return;
            }
        });
    }
    else
    {
        res.status(401).send(`Invalid username/token combination: ${username}/${token}`);
        return;
    }
}); 

router.post('/update_entry', (req: Request, res: Response) => {
    let username = req.body.username;
    let token = req.body.token;
    let entry_id = req.body.entry_id;
    let new_values = req.body.new_values;

    if(username === undefined || token === undefined || entry_id === undefined)
    {
        res.status(400).send(`Invalid arguments`);
        return;
    }

    if(ServerAuth.tokenStore.verifyToken(username, token))
    {
        ServerAuth.verifyUserPower(username, token, (u: any, power: any) => {
            if(power === 1 || power === 0)
            {
                ServiceCalendarBackend.updateServiceCalendarEntry(entry_id, new_values, (result: any, err: any) => {
                    if(err)
                    {
                        res.status(400).send(`Error while updating entry ID \`${entry_id}\`: ${err}`);
                        return;
                    }
                    else
                    {
                        res.status(200).send(result);
                        return;
                    }
                });
            }
            else
            {
                res.status(401).send(`User ${username} does not have enough power. Power Level: ${power}`);
                return;
            }
        });
    }
    else
    {
        res.status(401).send(`Invalid username/token combination: ${username}/${token}`);
        return;
    }
});

export const Controller: Router = router;
export const Endpoint: string = '/service_calendar';