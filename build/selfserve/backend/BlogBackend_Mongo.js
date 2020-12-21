"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerAuth = exports.User = exports.UserPower = void 0;
var oid = require('mongodb').ObjectID;
const TokenStore_1 = __importDefault(require("./TokenStore"));
const MongoRequests_1 = require("./MongoRequests");
const querystring_1 = require("querystring");
const Debug_1 = require("./Debug");
var config = require(`${process.cwd()}/site.config`).selfserve;
let crypto = require('crypto'), crypto_method = 'aes-256-cbc';
let file = require('fs');
var fx = require("money");
var UserPower;
(function (UserPower) {
    UserPower[UserPower["Admin"] = 1] = "Admin";
    UserPower[UserPower["User"] = 2] = "User";
})(UserPower = exports.UserPower || (exports.UserPower = {}));
class User {
    constructor(_username, _password, _signup_date, _email, _power) {
        this._id = oid();
        this.password = undefined;
        this.username = _username;
        this.password = _password;
        this.signup_date = _signup_date;
        this.email = _email;
        this.power = _power;
    }
}
exports.User = User;
const UsersCollection = "users";
const BlogCollection = "blog";
class ServerAuth {
    static initServerAuth() {
        // Encrypt Self Test
        Debug_1.DebugConsole.Writeq('Encrypt Self Test\n');
        if (this.tokenStore.getNonce() === undefined) {
            Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.WARNING, `Nonce is undefined. Fixing.`);
            this.tokenStore.checkNonce();
        }
        let test = 'Hello World.';
        let encrypted = ServerAuth.encryptText(test);
        let decrypted = ServerAuth.decryptText(encrypted);
        Debug_1.DebugConsole.Writeq(`--Test Params--\nText: ${test}\nEncrypted Value: ${encrypted}\nDecrypted Value: ${decrypted}`);
        if (decrypted === test) {
            Debug_1.DebugConsole.Writeq(`   Success!\n    ${test} === ${decrypted}`);
        }
        else
            throw new Error(`   Failed.!\n    ${test} === ${decrypted}`);
        Debug_1.DebugConsole.Writeq('\nEnd Self Test\n');
        // End Self Test
        this.mongoBackend = new MongoRequests_1.MongoDBInstance(config.default_db);
        this.mongoBackend.init((isAvailable) => {
            this.Available = isAvailable;
            if (this.Available && this.tokenStore.getNonce() !== undefined) {
                Debug_1.DebugConsole.Writeq("Server Auth initialized!");
            }
            else {
                if (this.tokenStore.getNonce() === undefined)
                    Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, '(BlogBackend.ts) Authentication unavailable: Invalid nonce');
                else if (this.Available === false)
                    Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, '(BlogBackend.ts) Authentication unavailable: No MongoDB!');
            }
        });
    }
    static getUserInformation(res, callback, username, id) {
        let verb = 'username';
        let value = username;
        if (id !== undefined) {
            verb = '_id';
            value = querystring_1.stringify(id);
        }
        this.mongoBackend.query(UsersCollection, verb, value, (err, res) => {
            if (err)
                throw err;
            callback(res);
        });
    }
    static editUserInformation(userID, pw, changes, callback) {
        this.mongoBackend.query(UsersCollection, "_id", userID.toHexString(), (err, result) => {
            if (err) {
                callback(false, err);
                return;
            }
            if (result) {
                let userToBeEdited = JSON.parse(result);
                let encrypted_pass = userToBeEdited.password;
                let decrypted_pass = ServerAuth.decryptText(encrypted_pass);
                let actual_pass = decrypted_pass.substring(decrypted_pass.indexOf('|'));
                if (userToBeEdited !== undefined && actual_pass === pw) {
                    this.mongoBackend.updateRecord(UsersCollection, userToBeEdited, changes, (err, finalResult) => {
                        if (err)
                            callback(false, err);
                        else
                            callback(true, finalResult);
                    });
                }
                else {
                    callback(false, 'Password mismatch.');
                }
            }
        });
    }
    static getUserById(id, callback) {
        this.mongoBackend.query(UsersCollection, "_id", id, (err, result) => {
            callback(result);
        });
    }
    static getUserByName(username, callback) {
        //this.mongoBackend.changeCollection("users");
        this.mongoBackend.query(UsersCollection, "username", username, (err, result) => {
            if (err)
                Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, `Unable to find user with username ${username}`);
            callback(result);
        });
    }
    static encryptText(input) {
        if (this.tokenStore.getNonce() === undefined)
            throw new Error(`Nonce is undefined.`);
        // let iv = Buffer.from(crypto.randomBytes(16), 'utf8');
        let iv = crypto.randomBytes(16);
        let ivstring = iv.toString('hex').slice(0, 16);
        let cipher = crypto.createCipheriv(crypto_method, Buffer.concat([Buffer.from(this.tokenStore.getNonce(), 'base64'), Buffer.alloc(32)], 32), ivstring);
        let encrypted = cipher.update(input);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        let return_val = ivstring + ':' + encrypted.toString('hex');
        return return_val;
        // let cipher = crypto.createCipher(method, this.tokenStore.getNonce());
        // let key = cipher.update(this.tokenStore.getNonce() + '|' + input, 'utf8', 'hex');
        // key += cipher.final('hex');
        // return key;
    }
    static decryptText(input) {
        if (this.tokenStore.getNonce() === undefined)
            throw new Error(`Nonce is undefined.`);
        let textParts = input.split(':');
        let shifted = textParts.shift();
        if (shifted === undefined || shifted.length === 0) {
            return '';
        }
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv(crypto_method, Buffer.concat([Buffer.from(this.tokenStore.getNonce(), 'base64'), Buffer.alloc(32)], 32), shifted);
        let decrypted = decipher.update(encryptedText);
        try {
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        }
        catch (error) {
            return '';
        }
        // let decipher = crypto.createDecipher(method, this.tokenStore.getNonce());
        // let key = decipher.update(input, 'hex', 'utf8');
        // key += decipher.final('utf8');
        // return key;
    }
    static doLogin(res, username, password, callback) {
        this.mongoBackend.query(UsersCollection, "username", username, (qerr, qresult) => {
            res.setHeader("Set-Cookie", "HttpOnly;Secure;SameSite=Lax");
            if (qresult === undefined) {
                res.status(400).send('No matching user in database.');
                callback(MongoRequests_1.MongoDBStatus.Error, 'No matching user in database.');
                return;
            }
            let userMatches = false;
            let passMatches = false;
            if (qresult.username === username)
                userMatches = true;
            let encrypted_pass = qresult.password;
            let decrypted_pass = ServerAuth.decryptText(qresult.password);
            let actual_pass = decrypted_pass.substring(decrypted_pass.indexOf('|') + 1);
            if (actual_pass === password)
                passMatches = true;
            if (qresult && userMatches && passMatches) {
                qresult.password = ":)))";
                const newToken = ServerAuth.tokenStore.generateToken(username);
                res.set('Authorization', newToken.token);
                res.status(200).send(qresult);
                callback(MongoRequests_1.MongoDBStatus.OK);
            }
            else {
                console.log("(BlogBackend/doLogin) error handling for: ", qerr);
                if (qerr === undefined) {
                    if (!passMatches) {
                        res.status(400).send('Credential mismatch.');
                        callback(MongoRequests_1.MongoDBStatus.Error, "Credential mismatch");
                    }
                    else {
                        res.status(400).send('Unknown error ocurred while trying to log you in.');
                        callback(MongoRequests_1.MongoDBStatus.Error, "Unknown error.");
                    }
                }
                else {
                    res.status(400).send(qerr);
                    callback(MongoRequests_1.MongoDBStatus.Error, qerr);
                }
            }
        });
    }
    static registerUser(res, username, password, email, callback) {
        if (username.trim() && password.trim() && email.trim()) {
            let encrypted_pass = ServerAuth.encryptText(`${password}`);
            this.mongoBackend.query(UsersCollection, "username", username, (err, result) => {
                if (result === undefined) {
                    Debug_1.DebugConsole.Writeq('User we are registering does not already exist.');
                    let newUser = new User(username, encrypted_pass, new Date(Date.now()), email, 3);
                    this.mongoBackend.insertRecord(UsersCollection, newUser, (err, result) => {
                        if (err)
                            throw err;
                        callback(newUser);
                    });
                }
                else {
                    Debug_1.DebugConsole.Writeq(`User ${username} already exists. We cannot register this user.`);
                    res.status(400).send(`User already exists. Please login.`);
                    callback(undefined);
                }
            });
        }
    }
    static verifyUserPower(username, token, callback) {
        if (username.trim() && token.trim()) {
            if (ServerAuth.tokenStore.verifyToken(username, token)) {
                this.mongoBackend.query(UsersCollection, "username", username, (err, res) => {
                    if (err)
                        throw err;
                    if (res)
                        callback(username, res.power);
                    else
                        callback(username, -1);
                });
            }
        }
    }
    static getRandomInt(maxValue) {
        return Math.floor(Math.random() * Math.floor(maxValue));
    }
    static makePost(res, userPosting, _token, post, callback) {
        if (ServerAuth.tokenStore.verifyToken(userPosting.username, _token)) {
            let toBeInserted = post;
            toBeInserted.date = new Date(Date.now());
            this.mongoBackend.insertRecord(BlogCollection, post, (err, result) => {
                if (err)
                    throw err;
                callback(err, result);
                Debug_1.DebugConsole.Write(result);
            });
        }
    }
    static editPost(res, userEditing, _token, updatedPost, __id, callback) {
        if (ServerAuth.tokenStore.verifyToken(userEditing.username, _token)) {
            this.mongoBackend.query(BlogCollection, "_id", __id, (err, res) => {
                if (err)
                    throw err;
                if (res) {
                    // let postToBeEdited: IBlogPost = JSON.parse(res);
                    this.mongoBackend.updateRecord(BlogCollection, res, updatedPost, (err, finalResult) => {
                        if (err)
                            throw err;
                        callback(err, finalResult);
                    });
                }
            });
        }
    }
    static deletePost(res, userDeleting, _token, postID) {
        if (ServerAuth.tokenStore.verifyToken(userDeleting.username, _token)) {
            this.mongoBackend.delete(BlogCollection, "_id", postID);
            res.status(200).send("OK"); // TODO
        }
    }
    static getLatestPosts(limit = 20, callback) {
        this.mongoBackend.returnN(BlogCollection, limit, (err, result) => {
            if (result === undefined) {
                callback(null);
            }
            else {
                callback(result);
            }
        });
    }
    static getPostByID(postID, res, callback) {
        try {
            this.mongoBackend.query(BlogCollection, "_id", postID, (err, resultingPost) => {
                Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.DEBUG, "queried for post with _id ", postID);
                if (err) {
                    console.log('error while looking for post with ID: ', err);
                    callback(true, "The post with the corresponding post ID could not be found. The post may have been deleted.");
                }
                else {
                    Debug_1.DebugConsole.Write(resultingPost);
                    if (resultingPost) {
                        Debug_1.DebugConsole.Writeq(JSON.stringify(resultingPost));
                        Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.DEBUG, "now querying for author with username ", resultingPost.author.username);
                        this.mongoBackend.query(UsersCollection, "username", resultingPost.author.username.trim(), (err, userPosting) => {
                            if (err)
                                throw err;
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
        catch (exc) {
            console.log('getPostByID', exc);
        }
    }
    static getPostsByUsername(res, user, limit) {
        this.mongoBackend.returnNByKey(BlogCollection, limit, "author", user.username, (err, result) => {
            if (err) {
                Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, `Error while getting posts from ${user.username}`, err);
                res.status(400).send(`Error while getting posts from ${user.username}`);
                return;
            }
            if (result !== undefined)
                res.status(200).send(JSON.stringify(result));
        });
    }
}
exports.ServerAuth = ServerAuth;
// TODO: fix this accessor
ServerAuth.tokenStore = new TokenStore_1.default();
ServerAuth.Available = false;
ServerAuth.MongoAvailable = () => ServerAuth.mongoBackend.allowed;
//# sourceMappingURL=BlogBackend_Mongo.js.map