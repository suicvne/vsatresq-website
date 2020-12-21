"use strict";
/**
 * VSAT ResQ Node.JS Web Server
 *
 * collab.js
 * Author: Mike Santiago (axiom@ignoresolutions.xyz)
 * Date: October 4th, 2018
 *
 * About:
 * Contains code necessary for real time collab/discussion over websocket.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConnect = exports.handleDiff = exports.broadcastToAll = exports.useWithExpress = void 0;
const connectedUsers = {};
let lastIP = "undf";
const BlogBackend_Mongo_1 = require("./BlogBackend_Mongo");
function useWithExpress(wsExpressInstance, app) {
    console.log('setting up for websockets');
    wsExpressInstance.app.ws('/app', (ws, req) => {
        //const ip = req.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
        const ip = req.socket.remoteAddress.split(/\s*,\s*/)[0];
        lastIP = ip;
        console.log(`new connection. ip: ${ip}`);
        ws.isAlive = true;
        ws.on('pong', () => {
            console.log('ping!');
        });
        ws.broadcast = (data) => {
            ws.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        };
        ws.on('close', (_ws, _req) => {
            console.log('info', `client disconnected.`);
        });
        ws.on('message', (msg) => {
            const receivedData = JSON.parse(msg);
            if (receivedData.type) {
                switch (receivedData.type) {
                    case "connect":
                        handleConnect(ws, receivedData, lastIP);
                        break;
                    case "msg":
                        break;
                    case "diff":
                        //handleDiff(ws, receivedData);
                        broadcastToAll(wsExpressInstance, ws, msg);
                    case undefined:
                        break;
                    default:
                        console.log('warning', `unknown type sent: ${receivedData.type}`);
                }
            }
        });
    });
}
exports.useWithExpress = useWithExpress;
function broadcastToAll(expressWsSocketObj, ws, data) {
    expressWsSocketObj.getWss().clients.forEach((client) => {
        client.send(JSON.stringify(data));
    });
}
exports.broadcastToAll = broadcastToAll;
function handleDiff(ws, msg) {
    //TODO: properly handle diff
    console.log('TODO: Properly handle diff to save bandwidth!');
}
exports.handleDiff = handleDiff;
function handleConnect(ws, msg, _lastIP) {
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(msg.connect.username, msg.connect.token)) {
        Object.assign(connectedUsers, { username: msg.connect.username, ip: lastIP });
        console.log(`verified connection for ${msg.connect.username} at ${lastIP}`);
        console.log(connectedUsers);
        const msgToSend = {
            type: "connection_ok",
            connect: {
                ip: _lastIP,
                username: msg.connect.username,
                token: msg.connect.token,
            },
        };
        ws.send(JSON.stringify(msgToSend));
    }
    else {
        console.log('error', 'bad msg: ' + msg);
    }
}
exports.handleConnect = handleConnect;
//# sourceMappingURL=collab.js.map