/**
 * The debug controller
 */

import { Router, Request, Response } from 'express';

import { ServerAuth, IUser, User, IBlogPost } from '../BlogBackend_Mongo';
import { MongoDBInstance, MongoDBStatus } from '../MongoRequests'
import { DebugConsole } from '../Debug';

var config = require(`${process.cwd()}/site.config`).selfserve;

const router: Router = Router();
const mongo: MongoDBInstance = new MongoDBInstance(config.default_db);

const BlogCollection: string = "blog";
const UsersCollection: string = "users";

router.get('/test', (req: any, res: any) => {
    res.send('Hello world');
});

router.get('/userlist', (req: any, res: any) => {
    mongo.returnAll(UsersCollection, (err: any, value: any) =>
    {
        if(err) res.status(401).send(`Unexpected error: ${err}`);
        else res.status(200).send(JSON.stringify(value));
    });
})

router.post('/adduser', (req: any, res: any) => {
    const _username = req.body.username;
    const _password = req.body.password;
    const _email = req.body.email;

    if(_username.trim() && _password.trim() && _email.trim())
    {
        ServerAuth.registerUser(res, _username, _password, _email, (resulting_user: IUser | undefined) => {
            if(resulting_user !== undefined)    res.status(200).send(JSON.stringify(resulting_user));
        });
    }
});

router.post('/removeuser', (req: any, res: any) => {
    const _userID = req.body._id;

    if(_userID.trim())
    {
        mongo.delete(UsersCollection, "_id", _userID);
    }
})

router.post('/edituser', (req: any, res: any) => {
    const _newUserObject = req.body.new;
    const _userID = req.body.id;

    if(_userID.trim() && _newUserObject.trim())
    {
        mongo.query(UsersCollection, "_id", _userID, (err: any, result: any) => {
            if(err) throw err;
            if(result) 
            {
                var queryObj = JSON.parse(result);
                var newUserObj = JSON.parse(_newUserObject);
                mongo.updateRecord(UsersCollection, queryObj, newUserObj, (err: any, result: any) => {
                    if(err) throw err;
                    res.status(200).send("Updated.");
                });
            }
            else
                res.status(400).send("Couldn't update user.");
        });
    }
})

router.get('/user', (req: any, res: any) => {
    const _byUsername = req.body.username;
    const _byId = req.body.id;

    let verb = "_id";
    let value = _byId;
    if(_byUsername)
    {
        verb = "username";
        value = _byUsername;
    }

    let resultingUser: IUser | undefined = undefined;

    mongo.query(UsersCollection, verb, value, (err: any, result: any) => {
        if(err) throw err;

        resultingUser = result;
        if(resultingUser)
            res.status(200).send(JSON.stringify(resultingUser));
        else
            res.status(400).send('No user found.');
    });
})

router.post('/getlogs', (req: any, res: any) => {
    const _username = req.body.username;
    const _token = req.body.token;
    if(_username === undefined || _token === undefined)
        res.status(400).send('Fatal');
    if(_username.trim() && _token.trim())
    {
        if(ServerAuth.tokenStore.verifyToken(_username, _token))
        {
            let result = JSON.stringify(DebugConsole.GetLogs());
            res.status(200).send(result);
        }
        else
            res.status(400).send('Not authorized.');
    }
    else
        res.status(400).send('Bad params');
});

import * as indexObj from '../index';

router.post('/restart', (req: any, res: any) => {
    // Importing just the restartServer function from our main file.
    

    const _username = req.body.username;
    const _token = req.body.token;

    if(_username === undefined || _token === undefined)
        res.status(400).send('Error');

    if(_username.trim() && _token.trim())
    {
        if(ServerAuth.tokenStore.verifyToken(_username, _token))
        {
            indexObj.restartCmsServer();
            res.status(200).send('OK');
        }
        else
            res.status(400).send('Not authorized.');
    }
    
});

export const Controller: Router = router;
export const Endpoint: string = '/TESTING';