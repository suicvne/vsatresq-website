"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Endpoint = exports.Controller = void 0;
const express_1 = require("express");
const BlogBackend_Mongo_1 = require("../BlogBackend_Mongo");
const MongoRequests_1 = require("../MongoRequests");
const Debug_1 = require("../Debug");
const mongodb_1 = require("mongodb");
const router = express_1.Router();
const cheerio = require('cheerio');
let $ = undefined;
router.post('/loginnode', (req, res) => {
    if (!BlogBackend_Mongo_1.ServerAuth.MongoAvailable()) {
        res.status(200).send('Mongo not available.');
        return;
    }
    Debug_1.DebugConsole.Writeq(`Logging in user ${req.body.username}`);
    if (req.body.username !== undefined) {
        BlogBackend_Mongo_1.ServerAuth.doLogin(res, req.body.username, req.body.password, (status, err) => {
            if (status === MongoRequests_1.MongoDBStatus.OK) {
                Debug_1.DebugConsole.Writeq(`User ${req.body.username} logged in successfully.`);
            }
            else {
                /*
                DebugConsole.Writeq("Error while logging user in: ")
                DebugConsole.WriteObj(err);
                */
            }
        });
    }
});
router.post('/tokencheck', (req, res) => {
    //if(!ServerAuth.MongoAvailable()) {res.status(500).send('Mongo not available.'); return;}
    if (req.body.username != null && req.body.token != null) {
        const username = req.body.username;
        const token = req.body.token;
        if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
            BlogBackend_Mongo_1.ServerAuth.getUserByName(username, (result) => {
                if (result) {
                    result.password = undefined;
                    res.status(200).send(JSON.stringify(result));
                }
                else
                    res.status(400).send("Something bad happened internally.");
            });
        }
        else
            res.status(401).send('Unauthorized');
    }
});
router.get('/tokencheck', (req, res) => {
    if (BlogBackend_Mongo_1.ServerAuth.MongoAvailable())
        res.status(200).send('available');
    else
        res.status(200).send('unavailable');
});
router.post('/edit_user', (req, res) => {
    let pw = req.body.password;
    let id = req.body._id;
    let changes = req.body.changes;
    let oid = require('mongodb').ObjectId;
    BlogBackend_Mongo_1.ServerAuth.editUserInformation(oid(id), pw, changes, (successful, msg) => {
        if (successful)
            res.status(200).send(msg);
        else
            res.status(400).send(msg);
    });
});
router.get('/avatar', (req, res) => {
    if (!BlogBackend_Mongo_1.ServerAuth.MongoAvailable()) {
        res.status(400).send('Mongo not available.');
        return;
    }
    // TODO: all of this...
    const _username = req.query.username;
    const fs = require('fs');
    let dir = './data/images/avatar';
    let user = `${dir}/${_username}.png`;
    let _default = `${process.cwd()}/build/public_html/images/avatar/default.png`;
    let which = user;
    if (!fs.existsSync(user)) {
        console.log(user, 'doesnt exist');
        which = _default;
    }
    var s = require('fs').createReadStream(which);
    s.on('open', () => {
        res.set('Content-Type', 'image/png');
        s.pipe(res);
    });
    s.on('error', () => {
        res.set('Content-Type', 'text/plain');
        res.status(404).send('Error Avatar not found');
    });
});
// TODO: not this because it might work... but implement a front-end for it.
// Oh shit past Mike, this looks cool.
router.post('/changeavatar', (req, res) => {
    if (!BlogBackend_Mongo_1.ServerAuth.MongoAvailable()) {
        res.status(400).send('Mongo not available.');
        return;
    }
    console.log('okay what this worked GREAT last year. now wtf.');
    console.log(typeof req.body.avatar);
    if (typeof req.body.avatar !== 'string') {
        res.status(500).send('Base64 not sent.');
        return;
    }
    if (req.body.username.trim() && req.body.token.trim()) {
        if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(req.body.username, req.body.token)) {
            const data = req.body.avatar.split(',');
            const fileInfo = data[0]; //data:image/png
            console.log('file type: ', fileInfo.split('/')[1]);
            const base64Data = data[1];
            const fs = require('fs');
            let dir = './data/images/avatar/';
            let fullPath = `${dir}${req.body.username}.png`;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log('directory made');
            }
            require('fs').writeFile(fullPath, base64Data, 'base64', (err) => {
                if (err) {
                    res.status(500).send(err);
                }
                else {
                    res.status(200).send({ msg: 'Success' });
                }
            });
        }
        else
            res.status(400).send('Unauthorized.');
    }
    else
        res.status(400).send('Unauthorized.');
});
router.post('/powercheck', (req, res) => {
    if (!BlogBackend_Mongo_1.ServerAuth.MongoAvailable()) {
        res.status(400).send('Mongo not available.');
        return;
    }
    if (req.body.username != null && req.body.token != null) {
        const _username = req.body.username;
        const _id = req.body.id;
        const _token = req.body.token;
        //TODO: double check this?
        if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(_username, _token)) {
            BlogBackend_Mongo_1.ServerAuth.getUserInformation(res, (result) => {
                if (result !== undefined) {
                    res.set('Power', result.power.toString());
                    res.send('Check power header');
                }
                else
                    res.status(400).send('Error: ' + result);
            }, _username, _id);
        }
        else {
            res.status(400).send("Invalid token.");
        }
    }
    else {
        res.status(400).send("Bad token or username");
    }
});
router.get('/userinfo', (req, res) => {
    if (!BlogBackend_Mongo_1.ServerAuth.MongoAvailable()) {
        res.status(400).send('Mongo not available.');
        return;
    }
    let byUsername = req.query.byUsername;
    let byId = req.query.byId;
    byId !== undefined ? byUsername = undefined : byId = undefined;
    BlogBackend_Mongo_1.ServerAuth.getUserInformation(res, (result) => {
        if (result !== undefined) {
            res.status(200).send(JSON.stringify(result));
        }
        else
            res.status(400).send('Error: ' + JSON.stringify(result));
    }, byUsername, byId);
});
/// Post to this URL with the following parameters
/// username, password, email
router.post('/registernode', (req, res) => {
    if (!BlogBackend_Mongo_1.ServerAuth.MongoAvailable()) {
        res.status(400).send('Mongo not available.');
        return;
    }
    const _username = req.body.username;
    const _password = req.body.password;
    const _email = req.body.email;
    Debug_1.DebugConsole.Writeq("New registration any received!");
    if (_username.trim() && _password.trim() && _email.trim()) {
        BlogBackend_Mongo_1.ServerAuth.registerUser(res, _username, _password, _email, (resulting_user) => {
            if (resulting_user !== undefined) {
                Debug_1.DebugConsole.Writeq(resulting_user);
                res.status(200).send(JSON.stringify(resulting_user));
            }
        });
    }
});
// TODO: remove this for launch.
router.post('/userlist', (req, res) => {
    if (!BlogBackend_Mongo_1.ServerAuth.MongoAvailable()) {
        res.status(400).send('Mongo not available.');
        return;
    }
    const _username = req.body.username;
    const _token = req.body.token;
    if (_username.trim() && _token.trim()) {
        if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(_username, _token)) {
            res.status(200).send(':) wip');
            /*
            MySQLInstance.query("SELECT * FROM users", (status: SQLStatus, err: MysqlError, result: any) => {
                let inner = '';
                for (let i = 0; i < result.length; i++) {
                    const cur = result[i];
                    inner += `<li>${cur.id}: ${cur.username} / ${cur.email} / Signup Date: ${cur.signup_date}</li>`;
                }
                res.status(200).send(`<ul>${inner}</ul>`);
            });,
            */
        }
        else {
            res.status(401).send("Not authorized.");
        }
    }
    else {
        res.status(401).send("Not authorized.");
    }
});
router.post('/post', (req, res) => {
    if (!BlogBackend_Mongo_1.ServerAuth.MongoAvailable()) {
        res.status(510).send('Mongo not available.');
        return;
    }
    const _messageText = req.body.message;
    const _author = req.body.author;
    const _title = req.body.title;
    const _email = req.body.email;
    const _token = req.body.token;
    if (!BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(_author, _token)) {
        res.status(401).send('Unauthorised, bad token.');
        return;
    }
    BlogBackend_Mongo_1.ServerAuth.getUserByName(_author, (result) => {
        let userPosting = result;
        let posterUsername = userPosting.username;
        // var $ = require('jquery');
        $ = cheerio.load(_messageText);
        let plainText = $(_messageText).text();
        const post = {
            title: _title,
            message: encodeURI(_messageText),
            plain_text: plainText,
            author: userPosting,
            date: new Date(Date.now()),
            _id: new mongodb_1.ObjectId() // TODO: does this randomly generate an ObjectId?
        };
        BlogBackend_Mongo_1.ServerAuth.makePost(res, userPosting, _token, post, (err, result) => {
            // err is already thrown in ServerAuth.makePost.
            console.log('resulting post: ', result.ops);
            res.status(200).send(JSON.stringify(result.ops));
        });
    });
});
router.post('/editpost', (req, res) => {
    if (!BlogBackend_Mongo_1.ServerAuth.MongoAvailable()) {
        res.status(400).send('Mongo not available.');
        return;
    }
    const msgID = new mongodb_1.ObjectId(req.body._id);
    const _username = req.body.author;
    const _newtitle = req.body.title;
    const _token = req.body.token;
    const _newMessage = req.body.message;
    if (msgID) {
        // let userEditing: User | undefined;
        let userEditing;
        let userObj;
        BlogBackend_Mongo_1.ServerAuth.getUserByName(_username, (result) => {
            userEditing = result.username;
            userObj = result;
            if (userObj === undefined) {
                console.error("User trying to post does not exist in the database.");
                throw "User trying to post does not exist in the database.";
            }
            if (!BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(_username, _token)) {
                res.header('Access-Control-Allow-Headers', 'true');
                res.status(401).send('Unauthorised or bad token.');
                return;
            }
            BlogBackend_Mongo_1.ServerAuth.verifyUserPower(_username, _token, (username, powerLevel) => {
                if (powerLevel !== 1) {
                    res.status(401).send('Nope.');
                    return;
                }
                $ = cheerio.load(_newMessage);
                const updatedPost = {
                    title: _newtitle,
                    message: encodeURI(_newMessage),
                    plain_text: $(_newMessage).text(),
                    author: userObj,
                    date: new Date(Date.now()),
                    _id: msgID
                };
                BlogBackend_Mongo_1.ServerAuth.editPost(res, userObj, _token, updatedPost, msgID, (err, finalResult) => {
                    if (finalResult != undefined) {
                        Debug_1.DebugConsole.Write(finalResult);
                        res.status(200).send(JSON.stringify(finalResult));
                    }
                });
            });
        });
    }
    else {
        res.status(400).send('No ID specified.');
    }
});
router.post('/deletepost', (req, res) => {
    if (!BlogBackend_Mongo_1.ServerAuth.MongoAvailable()) {
        res.status(400).send('Mongo not available.');
        return;
    }
    const msgID = req.body.id;
    const _username = req.body.username;
    const _token = req.body.token;
    let userDeleting;
    BlogBackend_Mongo_1.ServerAuth.getUserByName(_username, (result) => { userDeleting = result; });
    if (msgID !== undefined && _username.trim() && _token.trim()) {
        if (!BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(_username, _token)) {
            res.status(400).send('Nope');
            return;
        }
        BlogBackend_Mongo_1.ServerAuth.verifyUserPower(_username, _token, (username, power) => {
            if (power !== 1) {
                res.send(401).send('Nope');
                return;
            }
            BlogBackend_Mongo_1.ServerAuth.deletePost(res, userDeleting, _token, msgID);
        });
    }
    else {
        res.status(400).send(`Bad params: ${msgID}, ${_username}, ${_token}`);
    }
});
router.get('/getpost', (req, res) => {
    if (!BlogBackend_Mongo_1.ServerAuth.MongoAvailable()) {
        res.status(400).send('Mongo not available.');
        return;
    }
    const postID = req.query.id;
    const byUsername = req.query.byUsername;
    const limit = req.query.limit;
    // Get post by ID
    if (postID !== undefined) {
        Debug_1.DebugConsole.Writeq('Get post by ID');
        BlogBackend_Mongo_1.ServerAuth.getPostByID(postID, res, (err, resultingPost) => {
            if (err || resultingPost === undefined) {
                Debug_1.DebugConsole.Writeq(`Error while retrieving post.`);
                res.status(404).send(resultingPost);
            }
            else {
                Debug_1.DebugConsole.Write(resultingPost);
                res.status(200).send(JSON.stringify(resultingPost));
            }
        });
        return;
    }
    // TODO: fix these to use callbacks and shit
    // Get post by username
    if (byUsername !== undefined && byUsername.trim()) {
        Debug_1.DebugConsole.Writeq('Get post by username');
        let user;
        BlogBackend_Mongo_1.ServerAuth.getUserByName(byUsername, (result) => {
            user = result;
        });
        BlogBackend_Mongo_1.ServerAuth.getPostsByUsername(res, user, limit);
        return;
    }
    // Get latest posts
    if (!postID && !byUsername) {
        BlogBackend_Mongo_1.ServerAuth.getLatestPosts(limit, (result) => {
            if (result === null)
                res.status(200).send('N/A');
            else
                res.status(200).send(JSON.stringify(result));
        });
        return;
    }
});
exports.Controller = router;
/** The endpoint that this controller responds to. All pre-defined requests are relative to this endpoint which is relative to the base URL. */
exports.Endpoint = '/blog';
//# sourceMappingURL=BlogController.js.map