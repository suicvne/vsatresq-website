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

const connectedUsers = {};
let lastIP = "undf";
import webSocketExpress = require('express-ws');
import express = require('express');
import {ServerAuth} from './BlogBackend_Mongo';

export function useWithExpress(wsExpressInstance: webSocketExpress.Instance, app: express.Application) {
    console.log('setting up for websockets');
    wsExpressInstance.app.ws('/app', (ws: any, req: express.Request) => {
        //const ip = req.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
        const ip = req.socket.remoteAddress!.split(/\s*,\s*/)[0];
        lastIP = ip;
        console.log(`new connection. ip: ${ip}`);
        ws.isAlive = true;
        ws.on('pong', () => {
            console.log('ping!');
        });

        ws.broadcast = (data: string) => {
            ws.clients.forEach((client: any) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        };

        ws.on('close', (_ws: any, _req: express.Request) => {
            console.log('info', `client disconnected.`);
        });
        ws.on('message', (msg: string) => {
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

export function broadcastToAll(expressWsSocketObj: webSocketExpress.Instance, ws: any, data: string) {
    expressWsSocketObj.getWss().clients.forEach((client: any) => {
        client.send(JSON.stringify(data));
    });
}

export function handleDiff(ws: any, msg: string) {
    //TODO: properly handle diff
    console.log('TODO: Properly handle diff to save bandwidth!');
}

export function handleConnect(ws: any, msg: any, _lastIP: string) {
    if (ServerAuth.tokenStore.verifyToken(msg.connect.username, msg.connect.token)) {
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
