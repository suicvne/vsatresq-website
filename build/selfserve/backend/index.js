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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandleProjectUpdated = exports.SetupWatchEvents = exports.restartCmsServer = void 0;
const Selfserve_1 = __importDefault(require("./Selfserve"));
const express_1 = require("express");
const Debug_1 = require("./Debug");
//#region Controller imports
const BlogController = __importStar(require("./controllers/BlogController"));
const TestingController = __importStar(require("./controllers/testing"));
const ShopController = __importStar(require("./controllers/ShopController"));
const ClientTSController = __importStar(require("./controllers/ClientTSController"));
const InventoryController = __importStar(require("./controllers/InventoryController"));
const ClassifiedsController = __importStar(require("./controllers/ClassifiedsController"));
const GoogleCalendarController = __importStar(require("./controllers/GoogleCalendarController"));
const ServiceCalendarController = __importStar(require("./controllers/ServiceCalendarController"));
let fs = require('fs');
let childProcess = require('child_process');
//#endregion
const cms = new Selfserve_1.default();
/**
 * Modify this array to add more routes/endpoints to Express.
 */
const routes = [
    BlogController,
    TestingController,
    ShopController,
    ClientTSController,
    InventoryController,
    ClassifiedsController,
    GoogleCalendarController,
    ServiceCalendarController
];
routes.forEach((route) => {
    console.log("adding route: " + route.Endpoint);
    if (route.Endpoint.trim()) {
        if (typeof (route.Controller) == typeof (express_1.Router))
            cms.useRouter(route.Endpoint, route.Controller);
    }
});
function restartCmsServer() {
    Debug_1.DebugConsole.Writeq('Stopping Server...');
    cms.stopServer();
    Debug_1.DebugConsole.Writeq('Starting Server...');
    cms.startServer();
}
exports.restartCmsServer = restartCmsServer;
;
const chokidar = require('chokidar');
function SetupWatchEvents() {
    chokidar.watch('site.config.js').on('change', (event) => {
        HandleProjectUpdated(true, event, event);
    });
    chokidar.watch('frontend/').on('change', (event, path) => {
        let file = event.substring(event.lastIndexOf('/'));
        if (file.startsWith('.') || file === '.DS_Store')
            return;
        HandleProjectUpdated(true, event, event);
    });
    chokidar.watch('selfserve/backend/').on('change', (event, path) => {
        HandleProjectUpdated(true, event, event);
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
exports.SetupWatchEvents = SetupWatchEvents;
function HandleProjectUpdated(needsBuildAll, eventType, fileName) {
    Debug_1.DebugConsole.Writeq(`Something in backend/ updated!\n${fileName}\nEventType: ${eventType}`);
    cms.stopServer();
    let invoked = false;
    let process = childProcess.fork('./selfserve/scripts/build.js');
    process.on('error', (err) => {
        if (invoked)
            return;
        invoked = true;
        Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, "Error while trying to rebuild after content update.\n\n", fileName);
    });
    process.on('exit', (code) => {
        if (invoked)
            return;
        invoked = true;
        if (code == 0) {
            cms.startServer();
        }
    });
}
exports.HandleProjectUpdated = HandleProjectUpdated;
// This is entry.
try {
    SetupWatchEvents();
    cms.startServer();
}
catch (exc) {
    Debug_1.DebugConsole.Writeq('A critical error has ocurred.');
    Debug_1.DebugConsole.Writeq(exc);
    Debug_1.DebugConsole.Writeq('Selfserver will not be able to start. Please try re-building or contacting axiom@ignoresolutions.xyz');
}
//# sourceMappingURL=index.js.map