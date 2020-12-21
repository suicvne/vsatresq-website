/**
 * About ClientTSController.ts
 * 
 * ClientTSController defines routes necessary to parse TypeScript server side and send it back client side. 
 * Or execute everything server side. I haven't entirely decided yet.
 * 
 * Copyright (C) Mike Santiago 2019
 * 
 * Created 2/11/2019
 * 
 * DO NOT REDISTRIBUTE!
 */

import * as Interactivity from "../Interactive"
import { Router, Request, Response } from 'express';
import {ShopBackend} from '../ShopBackend';
import { IShopItem } from '../Shop/ShopItem';
import expressWs = require('express-ws');
import { MongoDBStatus } from '../MongoRequests';
import { DebugConsole } from '../Debug';
var oid = require('mongodb').ObjectID;

const router: Router = Router();
const TSConsole: Interactivity.InteractiveConsole = new Interactivity.InteractiveConsole();

router.post("/exec", (req: any, res: any) => {
    const asTS: string = req.body.ts;
    if(asTS.trim())
    {
        const executionResult = TSConsole.executeTSCode(asTS);
        if(executionResult !== "")
            res.status(200).send({result: executionResult});
        else
            res.status(400).send(`Something happened: ${JSON.stringify(TSConsole.lastErr)}`);
    }
    else
        res.status(400).send('Empty TypeScript submitted.');
});

export const Controller: Router = router;
export const Endpoint: string = '/ts';