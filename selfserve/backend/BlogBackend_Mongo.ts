var oid = require('mongodb').ObjectID;

import express = require("express");
import TokenStore from "./TokenStore";
import { MongoDBInstance, MongoDBStatus } from "./MongoRequests";
import { stringify } from "querystring";
import { DebugConsole, DebugSeverity } from "./Debug";

import { ObjectId } from 'mongodb';

var config = require(`${process.cwd()}/site.config`).selfserve;

let crypto = require('crypto'),
    crypto_method = 'aes-256-cbc';

let file = require('fs');

var fx = require("money");

export enum UserPower {
    Admin = 1,
    User = 2,
}

export class User implements IUser {
    public _id: ObjectId = oid();
    public username: string;
    public signup_date: Date;
    public email: string;
    public power: UserPower;
    public password: string | undefined = undefined;

    constructor(_username: string, _password: string | undefined, _signup_date: Date, _email: string, _power: UserPower) {
        this.username = _username; this.password = _password!; this.signup_date = _signup_date; this.email = _email; this.power = _power;
    }
}

export interface IUser {
    username: string;
    password: string | undefined;
    signup_date: Date;
    email: string;
    power: UserPower;
    _id: ObjectId;
}

export interface IBlogPost {
    title: string;
    message: string;
    author: IUser | string;
    date: Date;
    _id: ObjectId;
    plain_text: string | undefined;
}

const UsersCollection: string = "users";
const BlogCollection: string = "blog";

export abstract class ServerAuth {

    // TODO: fix this accessor
    public static tokenStore: TokenStore = new TokenStore();
    public static Available: boolean = false;
    private static mongoBackend: MongoDBInstance;
    private static nonce: string;

    public static MongoAvailable = () => ServerAuth.mongoBackend.allowed;

    public static initServerAuth() {
        // Encrypt Self Test
        DebugConsole.Writeq('Encrypt Self Test\n');

        if(this.tokenStore.getNonce() === undefined)
        {
            DebugConsole.Write(DebugSeverity.WARNING, `Nonce is undefined. Fixing.`);
            this.tokenStore.checkNonce();
        }

        let test: string = 'Hello World.';
        let encrypted = ServerAuth.encryptText(test);
        let decrypted: string = ServerAuth.decryptText(encrypted);

        DebugConsole.Writeq(`--Test Params--\nText: ${test}\nEncrypted Value: ${encrypted}\nDecrypted Value: ${decrypted}`);
        
        if(decrypted === test)
        {
            DebugConsole.Writeq(`   Success!\n    ${test} === ${decrypted}`);
        }
        else throw new Error(`   Failed.!\n    ${test} === ${decrypted}`);

        DebugConsole.Writeq('\nEnd Self Test\n');
        // End Self Test



        this.mongoBackend = new MongoDBInstance(config.default_db);
        this.mongoBackend.init((isAvailable: boolean) => {
            this.Available = isAvailable;

            

            if (this.Available && this.tokenStore.getNonce() !== undefined)
            { 
                DebugConsole.Writeq("Server Auth initialized!");

            }
            else
            { 
                if(this.tokenStore.getNonce() === undefined) DebugConsole.Write(DebugSeverity.ERROR, '(BlogBackend.ts) Authentication unavailable: Invalid nonce');
                else if(this.Available === false) DebugConsole.Write(DebugSeverity.ERROR, '(BlogBackend.ts) Authentication unavailable: No MongoDB!');
            }
        });
    }

    public static getUserInformation(res: express.Response, callback: (result: IUser) => void, username?: string, id?: any) {
        let verb = 'username';
        let value = username!;
        if (id !== undefined) {
            verb = '_id';
            value = stringify(id!);
        }

        this.mongoBackend.query(UsersCollection, verb, value, (err: any, res: any) => {
            if (err) throw err;
            callback(res);
        });
    }

    public static editUserInformation(userID: ObjectId, pw: string, changes: any, callback: (successful: boolean, msg: string) => void) {
        this.mongoBackend.query(UsersCollection, "_id", userID.toHexString(), (err: any, result: any) => {
            if (err) {
                callback(false, err);
                return;
            }

            if (result) {
                let userToBeEdited: IUser = JSON.parse(result);

                let encrypted_pass = userToBeEdited.password;
                let decrypted_pass = ServerAuth.decryptText(<string>encrypted_pass);
                let actual_pass = decrypted_pass.substring(decrypted_pass.indexOf('|'));

                if (userToBeEdited !== undefined && actual_pass === pw) {
                    this.mongoBackend.updateRecord(UsersCollection, userToBeEdited, changes, (err: any, finalResult: any) => {
                        if (err) callback(false, err);
                        else callback(true, finalResult);
                    });
                }
                else {
                    callback(false, 'Password mismatch.');
                }
            }
        });
    }

    public static getUserById(id: string, callback: (result: IUser) => void) {
        this.mongoBackend.query(UsersCollection, "_id", id, (err: any, result: any) => {
            callback(result);
        });
    }

    public static getUserByName(username: string, callback: (resulting_obj: any) => void) {
        //this.mongoBackend.changeCollection("users");
        this.mongoBackend.query(UsersCollection, "username", username, (err: any, result: any) => {
            if (err) DebugConsole.Write(DebugSeverity.ERROR, `Unable to find user with username ${username}`);
            callback(result);
        });
    }

    private static encryptText(input: string): string {

        if(this.tokenStore.getNonce() === undefined) throw new Error(`Nonce is undefined.`);

        // let iv = Buffer.from(crypto.randomBytes(16), 'utf8');
        let iv = crypto.randomBytes(16);
        let ivstring = iv.toString('hex').slice(0, 16);
        let cipher = 
            crypto.createCipheriv(crypto_method, 
                Buffer.concat([Buffer.from(<string>this.tokenStore.getNonce(), 'base64'), Buffer.alloc(32)], 32), 
                ivstring);
        let encrypted = cipher.update(input);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        let return_val = ivstring + ':' + encrypted.toString('hex');
        return return_val;


        // let cipher = crypto.createCipher(method, this.tokenStore.getNonce());
        // let key = cipher.update(this.tokenStore.getNonce() + '|' + input, 'utf8', 'hex');
        // key += cipher.final('hex');

        // return key;
    }

    private static decryptText(input: string): string {

        if(this.tokenStore.getNonce() === undefined) throw new Error(`Nonce is undefined.`);

        let textParts = input.split(':');
        let shifted = textParts.shift();

        if(shifted === undefined || shifted.length === 0)
        {
            return '';
        }
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = 
            crypto.createDecipheriv(crypto_method, 
                Buffer.concat([Buffer.from(<string>this.tokenStore.getNonce(), 'base64'), Buffer.alloc(32)], 32), 
                <string>shifted);
        let decrypted = decipher.update(encryptedText);
        try {
            decrypted = Buffer.concat([decrypted, decipher.final()]);    
            return decrypted.toString();
        } catch (error) {
            return '';
        }
        
        // let decipher = crypto.createDecipher(method, this.tokenStore.getNonce());
        // let key = decipher.update(input, 'hex', 'utf8');
        // key += decipher.final('utf8');

        // return key;
    }

    public static doLogin(res: express.Response, username: string, password: string, callback: (status: MongoDBStatus, err?: any) => void) {
        this.mongoBackend.query(UsersCollection, "username", username, (qerr: any, qresult: any) => {

            res.setHeader("Set-Cookie", "HttpOnly;Secure;SameSite=Lax");
            if (qresult === undefined) {
                res.status(400).send('No matching user in database.');
                callback(MongoDBStatus.Error, 'No matching user in database.');
                return;
            }

            let userMatches = false;
            let passMatches = false;

            if (qresult.username === username) userMatches = true;

            let encrypted_pass = qresult.password;
            let decrypted_pass = ServerAuth.decryptText(qresult.password);
            let actual_pass = decrypted_pass.substring(decrypted_pass.indexOf('|') + 1);

            if (actual_pass === password) passMatches = true;

            if (qresult && userMatches && passMatches) {
                qresult.password = ":)))"
                const newToken = ServerAuth.tokenStore.generateToken(username);
                res.set('Authorization', newToken.token);
                res.status(200).send(qresult);
                callback(MongoDBStatus.OK);
            }
            else {
                console.log("(BlogBackend/doLogin) error handling for: ", qerr);
                if (qerr === undefined) {
                    if (!passMatches) {
                        res.status(400).send('Credential mismatch.');
                        callback(MongoDBStatus.Error, "Credential mismatch");
                    }
                    else {
                        res.status(400).send('Unknown error ocurred while trying to log you in.');
                        callback(MongoDBStatus.Error, "Unknown error.");
                    }
                }
                else {
                    res.status(400).send(qerr);
                    callback(MongoDBStatus.Error, qerr);
                }

            }
        });
    }

    public static registerUser(res: express.Response, username: string, password: string, email: string, callback: (resulting_user: IUser | undefined) => void) {
        if (username.trim() && password.trim() && email.trim()) {

            let encrypted_pass = ServerAuth.encryptText(`${password}`);

            this.mongoBackend.query(UsersCollection, "username", username, (err: any, result: any) => {
                if (result === undefined) {
                    DebugConsole.Writeq('User we are registering does not already exist.');
                    let newUser: IUser = new User(username, encrypted_pass, new Date(Date.now()), email, 3);
                    this.mongoBackend.insertRecord(UsersCollection, newUser, (err: any, result: any) => {
                        if (err) throw err;
                        callback(newUser);
                    });
                }
                else {
                    DebugConsole.Writeq(`User ${username} already exists. We cannot register this user.`);

                    res.status(400).send(`User already exists. Please login.`);
                    callback(undefined);
                }
            });
        }
    }

    public static verifyUserPower(username: string, token: string, callback: (username: string, power: number) => void) {
        if (username.trim() && token.trim()) {
            if (ServerAuth.tokenStore.verifyToken(username, token)) {
                this.mongoBackend.query(UsersCollection, "username", username, (err: any, res: any) => {
                    if (err) throw err;
                    if (res) callback(username, res.power);
                    else callback(username, -1);
                });
            }
        }
    }

    private static getRandomInt(maxValue: number) {
        return Math.floor(Math.random() * Math.floor(maxValue));
    }

    public static makePost(res: express.Response, userPosting: IUser, _token: string, post: IBlogPost, callback: (err: any, result: any) => void): void {
        if (ServerAuth.tokenStore.verifyToken(userPosting.username, _token)) {
            let toBeInserted: IBlogPost = post;
            toBeInserted.date = new Date(Date.now());
            this.mongoBackend.insertRecord(BlogCollection, post, (err: any, result: any) => {
                if (err) throw err;
                callback(err, result);
                DebugConsole.Write(result);
            });
        }
    }

    public static editPost(res: express.Response, userEditing: IUser, _token: string, updatedPost: IBlogPost, __id: ObjectId, callback: (err: any, res: any) => void) {
        if (ServerAuth.tokenStore.verifyToken(userEditing.username, _token)) {
            this.mongoBackend.query(BlogCollection, "_id", __id, (err: any, res: any) => {
                if (err) throw err;
                if (res) {
                    // let postToBeEdited: IBlogPost = JSON.parse(res);
                    this.mongoBackend.updateRecord(BlogCollection, res, updatedPost, (err: any, finalResult: any) => {
                        if (err) throw err;
                        callback(err, finalResult);
                    });
                }
            });
        }
    }

    public static deletePost(res: express.Response, userDeleting: IUser, _token: string, postID: any) {
        if (ServerAuth.tokenStore.verifyToken(userDeleting.username, _token)) {
            this.mongoBackend.delete(BlogCollection, "_id", postID);
            res.status(200).send("OK"); // TODO
        }
    }

    public static getLatestPosts(limit: number = 20, callback: (result: IBlogPost[] | null) => void) {
        this.mongoBackend.returnN(BlogCollection, limit, (err: any, result: any) => {
            if (result === undefined) {
                callback(null);
            }
            else {

                callback(result);
            }
        });
    }

    public static getPostByID(postID: string, res: express.Response, callback: (err: any, result: any) => void) {
        try {
            this.mongoBackend.query(BlogCollection, "_id", postID, (err: any, resultingPost: any) => {
                DebugConsole.Write(DebugSeverity.DEBUG, "queried for post with _id ", postID);
                if (err) {
                    console.log('error while looking for post with ID: ', err);
                    callback(true, "The post with the corresponding post ID could not be found. The post may have been deleted.");
                }
                else {
                    DebugConsole.Write(resultingPost);
                    if (resultingPost) {
                        DebugConsole.Writeq(JSON.stringify(resultingPost));
                        DebugConsole.Write(DebugSeverity.DEBUG, "now querying for author with username ", resultingPost.author.username);
                        this.mongoBackend.query(UsersCollection, "username", resultingPost.author.username.trim(), (err: any, userPosting: any) => {
                            if (err) throw err;
                            if (userPosting) {
                                resultingPost.author = userPosting;
                                callback(undefined, resultingPost);
                            }
                            else
                                callback(true, 'User posted not found');
                        });
                    }
                }
            });
        }
        catch (exc) { console.log('getPostByID', exc); }
    }

    public static getPostsByUsername(res: express.Response, user: IUser, limit: number) {
        this.mongoBackend.returnNByKey(BlogCollection, limit, "author", user.username, (err: any, result: any) => {
            if (err) {
                DebugConsole.Write(DebugSeverity.ERROR, `Error while getting posts from ${user.username}`, err);
                res.status(400).send(`Error while getting posts from ${user.username}`);
                return;
            }
            if (result !== undefined) res.status(200).send(JSON.stringify(result));
        });
    }
}
