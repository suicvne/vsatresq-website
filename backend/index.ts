import Selfserve from './Selfserve';
import {Router} from 'express';
import { ServerAuth } from './BlogBackend_Mongo';
import {ShopBackend} from './ShopBackend';
import { DebugConsole, DebugSeverity } from './Debug';
import { InteractiveConsole } from './Interactive'

//#region Controller imports
import * as BlogController from './controllers/BlogController';
import * as TestingController from './controllers/testing';
import * as ShopController from './controllers/ShopController';
import * as ClientTSController from './controllers/ClientTSController';
import * as InventoryController from './controllers/InventoryController';
import * as ClassifiedsController from './controllers/ClassifiedsController';
import * as GoogleCalendarController from './controllers/GoogleCalendarController';
import * as ServiceCalendarController from './controllers/ServiceCalendarController';

let fs = require('fs');
let childProcess = require('child_process');
let selfserve_config = require(`${process.cwd()}/../site.config`);
//#endregion

DebugConsole.Writeq(`Our port is ${selfserve_config.selfserve.hostPort}`);

const cms: Selfserve = new Selfserve(selfserve_config.selfserve.hostPort, selfserve_config.selfserve.backupPort);

/**
 * Modify this array to add more routes/endpoints to Express.
 */
const routes:any[] = [
    BlogController,
    TestingController,
    ShopController,
    ClientTSController,
    InventoryController,
    ClassifiedsController,
    GoogleCalendarController,
    ServiceCalendarController
]

routes.forEach((route: any) => {
    console.log("adding route: " + route.Endpoint);
    if(route.Endpoint.trim())
    {
        if(typeof(route.Controller) == typeof(Router))
            cms.useRouter(route.Endpoint, route.Controller);
    }
});

export function restartCmsServer() {
    DebugConsole.Writeq('Stopping Server...');
    cms.stopServer();
    DebugConsole.Writeq('Starting Server...');
    cms.startServer();
};

const chokidar = require('chokidar');

export function SetupWatchEvents() 
{
    chokidar.watch('../site.config.js').on('change', (event: any) => {
        HandleProjectUpdated(true, event, <string>event);
    });

    chokidar.watch('../frontend/').on('change', (event: any, path: any) => {
        let file = (<string>event).substring(event.lastIndexOf('/'));
        if(file.startsWith('.') || file === '.DS_Store') return;

        HandleProjectUpdated(true, event, <string>event);
    });

    chokidar.watch('./backend/').on('change', (event: any, path: any) => {
        HandleProjectUpdated(true, event, <string>event);
    });

    // fs.watch('site.config.js', (eventType: any, fileName: any) => {
    //     HandleProjectUpdated(true, eventType, <string>fileName);
    // });

    // fs.watch('backend/', {recursive: true}, (eventType: any, fileName: any) => {
    //     HandleProjectUpdated(true, eventType, <string>fileName);
    // });

    // fs.watch('frontend/', {recursive: true}, (eventType: any, fileName: any) => {
    //     HandleProjectUpdated(false, eventType, <string>fileName);
    // });
}

export function HandleProjectUpdated(needsBuildAll: boolean, eventType: any, fileName: string)
{
    DebugConsole.Writeq(`Something in backend/ updated!\n${fileName}\nEventType: ${eventType}`);

    cms.stopServer();

    let invoked = false;

    let process = childProcess.fork('./selfserve/scripts/build.js');
    process.on('error', (err: any) => {
        if(invoked) return;
        invoked = true;
        DebugConsole.Write(DebugSeverity.ERROR, "Error while trying to rebuild after content update.\n\n", fileName);
    });

    process.on('exit', (code: any) => {
        if(invoked) return;
        invoked = true;

        if(code == 0)
        {
            cms.startServer();
        }
    })

    
}


// This is entry.
try
{
    SetupWatchEvents();

    cms.startServer(); 
}
catch(exc)
{
    DebugConsole.Writeq('A critical error has ocurred.');
    DebugConsole.Writeq(exc);
    DebugConsole.Writeq('Selfserver will not be able to start. Please try re-building or contacting axiom@ignoresolutions.xyz');
}