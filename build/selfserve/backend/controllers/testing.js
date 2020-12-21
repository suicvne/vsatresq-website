"use strict";
/**
 * The debug controller
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
const express_1 = require("express");
const BlogBackend_Mongo_1 = require("../BlogBackend_Mongo");
const MongoRequests_1 = require("../MongoRequests");
const Debug_1 = require("../Debug");
var config = require(`${process.cwd()}/site.config`).selfserve;
const router = express_1.Router();
const mongo = new MongoRequests_1.MongoDBInstance(config.default_db);
const BlogCollection = "blog";
const UsersCollection = "users";
router.get('/test', (req, res) => {
    res.send('Hello world');
});
router.get('/userlist', (req, res) => {
    mongo.returnAll(UsersCollection, (err, value) => {
        if (err)
            res.status(401).send(`Unexpected error: ${err}`);
        else
            res.status(200).send(JSON.stringify(value));
    });
});
router.post('/adduser', (req, res) => {
    const _username = req.body.username;
    const _password = req.body.password;
    const _email = req.body.email;
    if (_username.trim() && _password.trim() && _email.trim()) {
        BlogBackend_Mongo_1.ServerAuth.registerUser(res, _username, _password, _email, (resulting_user) => {
            if (resulting_user !== undefined)
                res.status(200).send(JSON.stringify(resulting_user));
        });
    }
});
router.post('/removeuser', (req, res) => {
    const _userID = req.body._id;
    if (_userID.trim()) {
        mongo.delete(UsersCollection, "_id", _userID);
    }
});
router.post('/edituser', (req, res) => {
    const _newUserObject = req.body.new;
    const _userID = req.body.id;
    if (_userID.trim() && _newUserObject.trim()) {
        mongo.query(UsersCollection, "_id", _userID, (err, result) => {
            if (err)
                throw err;
            if (result) {
                var queryObj = JSON.parse(result);
                var newUserObj = JSON.parse(_newUserObject);
                mongo.updateRecord(UsersCollection, queryObj, newUserObj, (err, result) => {
                    if (err)
                        throw err;
                    res.status(200).send("Updated.");
                });
            }
            else
                res.status(400).send("Couldn't update user.");
        });
    }
});
router.get('/user', (req, res) => {
    const _byUsername = req.body.username;
    const _byId = req.body.id;
    let verb = "_id";
    let value = _byId;
    if (_byUsername) {
        verb = "username";
        value = _byUsername;
    }
    let resultingUser = undefined;
    mongo.query(UsersCollection, verb, value, (err, result) => {
        if (err)
            throw err;
        resultingUser = result;
        if (resultingUser)
            res.status(200).send(JSON.stringify(resultingUser));
        else
            res.status(400).send('No user found.');
    });
});
router.post('/getlogs', (req, res) => {
    const _username = req.body.username;
    const _token = req.body.token;
    if (_username === undefined || _token === undefined)
        res.status(400).send('Fatal');
    if (_username.trim() && _token.trim()) {
        if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(_username, _token)) {
            let result = JSON.stringify(Debug_1.DebugConsole.GetLogs());
            res.status(200).send(result);
        }
        else
            res.status(400).send('Not authorized.');
    }
    else
        res.status(400).send('Bad params');
});
const indexObj = __importStar(require("../index"));
router.post('/restart', (req, res) => {
    // Importing just the restartServer function from our main file.
    const _username = req.body.username;
    const _token = req.body.token;
    if (_username === undefined || _token === undefined)
        res.status(400).send('Error');
    if (_username.trim() && _token.trim()) {
        if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(_username, _token)) {
            indexObj.restartCmsServer();
            res.status(200).send('OK');
        }
        else
            res.status(400).send('Not authorized.');
    }
});
exports.Controller = router;
exports.Endpoint = '/TESTING';
//# sourceMappingURL=testing.js.map