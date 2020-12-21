"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Endpoint = exports.Controller = void 0;
const Interactivity = __importStar(require("../Interactive"));
const express_1 = require("express");
var oid = require('mongodb').ObjectID;
const router = express_1.Router();
const TSConsole = new Interactivity.InteractiveConsole();
router.post("/exec", (req, res) => {
    const asTS = req.body.ts;
    if (asTS.trim()) {
        const executionResult = TSConsole.executeTSCode(asTS);
        if (executionResult !== "")
            res.status(200).send({ result: executionResult });
        else
            res.status(400).send(`Something happened: ${JSON.stringify(TSConsole.lastErr)}`);
    }
    else
        res.status(400).send('Empty TypeScript submitted.');
});
exports.Controller = router;
exports.Endpoint = '/ts';
//# sourceMappingURL=ClientTSController.js.map