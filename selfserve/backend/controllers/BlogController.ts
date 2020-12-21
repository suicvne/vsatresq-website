import { Router, Request, Response } from 'express';
import { ServerAuth, IUser, User, IBlogPost } from '../BlogBackend_Mongo';
import expressWs = require('express-ws');
import { MongoDBStatus } from '../MongoRequests';
import { DebugConsole } from '../Debug';

import { ObjectId } from 'mongodb';

const router: Router = Router();
const cheerio = require('cheerio');
let $: any = undefined;


router.post('/loginnode', (req: any, res: any) => {
    if (!ServerAuth.MongoAvailable()) { res.status(200).send('Mongo not available.'); return; }

    DebugConsole.Writeq(`Logging in user ${req.body.username}`);

    if (req.body.username !== undefined) {
        ServerAuth.doLogin(res, req.body.username, req.body.password, (status, err) => {
            if (status === MongoDBStatus.OK) {
                DebugConsole.Writeq(`User ${req.body.username} logged in successfully.`);
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

router.post('/tokencheck', (req: any, res: any) => {
    //if(!ServerAuth.MongoAvailable()) {res.status(500).send('Mongo not available.'); return;}

    if (req.body.username != null && req.body.token != null) {
        const username = req.body.username;
        const token = req.body.token;
        if (ServerAuth.tokenStore.verifyToken(username, token)) {
            ServerAuth.getUserByName(username, (result: any) => {
                if (result) {
                    result.password = undefined;
                    res.status(200).send(JSON.stringify(result));
                }
                else res.status(400).send("Something bad happened internally.");
            });
        }
        else
            res.status(401).send('Unauthorized');
    }
});

router.get('/tokencheck', (req: any, res: any) => {
    if (ServerAuth.MongoAvailable()) res.status(200).send('available');
    else res.status(200).send('unavailable');
});

router.post('/edit_user', (req: any, res: any) => {
    let pw = req.body.password;
    let id = req.body._id;

    let changes = req.body.changes;
    let oid = require('mongodb').ObjectId;

    ServerAuth.editUserInformation(oid(id), pw, changes, (successful, msg) => {
        if (successful) res.status(200).send(msg);
        else res.status(400).send(msg);
    });
});

router.get('/avatar', (req: any, res: any) => {
    if (!ServerAuth.MongoAvailable()) { res.status(400).send('Mongo not available.'); return; }

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

    var s = require('fs').createReadStream(which)
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
router.post('/changeavatar', (req: any, res: any) => {
    if (!ServerAuth.MongoAvailable()) { res.status(400).send('Mongo not available.'); return; }
    console.log('okay what this worked GREAT last year. now wtf.');
    console.log(typeof req.body.avatar);
    if (typeof req.body.avatar !== 'string') {
        res.status(500).send('Base64 not sent.');
        return;
    }

    if (req.body.username.trim() && req.body.token.trim()) {
        if (ServerAuth.tokenStore.verifyToken(req.body.username, req.body.token)) {
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

            require('fs').writeFile(fullPath, base64Data, 'base64', (err: any) => {
                if (err) { res.status(500).send(err); }
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

router.post('/powercheck', (req: any, res: any) => {
    if (!ServerAuth.MongoAvailable()) { res.status(400).send('Mongo not available.'); return; }

    if (req.body.username != null && req.body.token != null) {
        const _username: string | undefined = req.body.username;
        const _id: number | undefined = req.body.id;
        const _token = req.body.token;
        //TODO: double check this?
        if (ServerAuth.tokenStore.verifyToken(_username!, _token)) {
            ServerAuth.getUserInformation(res, (result: IUser) => {
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
    else { res.status(400).send("Bad token or username"); }
});

router.get('/userinfo', (req: any, res: any) => {
    if (!ServerAuth.MongoAvailable()) { res.status(400).send('Mongo not available.'); return; }

    let byUsername: string | undefined = req.query.byUsername;
    let byId: number | undefined = req.query.byId;

    byId !== undefined ? byUsername = undefined : byId = undefined;

    ServerAuth.getUserInformation(res, (result: IUser) => {
        if (result !== undefined) {
            res.status(200).send(JSON.stringify(result));
        }
        else
            res.status(400).send('Error: ' + JSON.stringify(result));
    }, byUsername, byId);
});
/// Post to this URL with the following parameters
/// username, password, email
router.post('/registernode', (req: any, res: any) => {
    if (!ServerAuth.MongoAvailable()) { res.status(400).send('Mongo not available.'); return; }

    const _username = req.body.username;
    const _password = req.body.password;
    const _email = req.body.email;

    DebugConsole.Writeq("New registration any received!");
    if (_username.trim() && _password.trim() && _email.trim()) {
        ServerAuth.registerUser(res, _username, _password, _email, (resulting_user) => {
            if (resulting_user !== undefined) {
                DebugConsole.Writeq(resulting_user);
                res.status(200).send(JSON.stringify(resulting_user));
            }
        });
    }
});
// TODO: remove this for launch.
router.post('/userlist', (req: any, res: any) => {
    if (!ServerAuth.MongoAvailable()) { res.status(400).send('Mongo not available.'); return; }

    const _username = req.body.username;
    const _token = req.body.token;
    if (_username.trim() && _token.trim()) {
        if (ServerAuth.tokenStore.verifyToken(_username, _token)) {
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
        else { res.status(401).send("Not authorized."); }
    }
    else {
        res.status(401).send("Not authorized.");
    }
});

router.post('/post', (req: any, res: any) => {
    if (!ServerAuth.MongoAvailable()) { res.status(510).send('Mongo not available.'); return; }

    const _messageText = req.body.message;
    const _author = req.body.author;
    const _title = req.body.title;
    const _email = req.body.email;

    const _token = req.body.token;

    if (!ServerAuth.tokenStore.verifyToken(_author, _token)) {
        res.status(401).send('Unauthorised, bad token.');
        return;
    }

    ServerAuth.getUserByName(_author, (result: any) => {
        let userPosting: IUser = result;
        let posterUsername: string = userPosting.username;
        // var $ = require('jquery');
        $ = cheerio.load(_messageText);
        let plainText: string = $(_messageText).text();
        const post: IBlogPost = {
            title: _title,
            message: encodeURI(_messageText),
            plain_text: plainText,
            author: userPosting,
            date: new Date(Date.now()),
            _id: new ObjectId() // TODO: does this randomly generate an ObjectId?
        };

        ServerAuth.makePost(res, userPosting!, _token, post, (err: any, result: any) => {
            // err is already thrown in ServerAuth.makePost.
            console.log('resulting post: ', result.ops);
            res.status(200).send(JSON.stringify(result.ops));
        });
    });
});

router.post('/editpost', (req: any, res: any) => {
    if (!ServerAuth.MongoAvailable()) { res.status(400).send('Mongo not available.'); return; }

    const msgID: ObjectId = new ObjectId(req.body._id);
    const _username: string = req.body.author;
    const _newtitle = req.body.title;
    const _token = req.body.token;
    const _newMessage = req.body.message;

    if (msgID) {
        // let userEditing: User | undefined;
        let userEditing: string | undefined;
        let userObj: IUser | undefined;
        ServerAuth.getUserByName(_username, (result: IUser) => {
            userEditing = result.username;
            userObj = result;

            if (userObj === undefined) {
                console.error("User trying to post does not exist in the database.");
                throw "User trying to post does not exist in the database.";
            }
            if (!ServerAuth.tokenStore.verifyToken(_username, _token)) {
                res.header('Access-Control-Allow-Headers', 'true');
                res.status(401).send('Unauthorised or bad token.');
                return;
            }
            ServerAuth.verifyUserPower(_username, _token, (username: string, powerLevel: number) => {
                if (powerLevel !== 1) { res.status(401).send('Nope.'); return; }

                $ = cheerio.load(_newMessage);

                const updatedPost: IBlogPost = {
                    title: _newtitle,
                    message: encodeURI(_newMessage),
                    plain_text: $(_newMessage).text(),
                    author: userObj!,
                    date: new Date(Date.now()),
                    _id: msgID
                };

                ServerAuth.editPost(res, userObj!, _token, updatedPost, msgID, (err: any, finalResult: any) => {
                    if (finalResult != undefined) {
                        DebugConsole.Write(finalResult);
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

router.post('/deletepost', (req: any, res: any) => {
    if (!ServerAuth.MongoAvailable()) { res.status(400).send('Mongo not available.'); return; }

    const msgID: number = req.body.id;
    const _username: string = req.body.username;
    const _token: string = req.body.token;

    let userDeleting: IUser | undefined;
    ServerAuth.getUserByName(_username, (result: IUser) => { userDeleting = result; });

    if (msgID !== undefined && _username.trim() && _token.trim()) {
        if (!ServerAuth.tokenStore.verifyToken(_username, _token)) { res.status(400).send('Nope'); return; }
        ServerAuth.verifyUserPower(_username, _token, (username: string, power: number) => {
            if (power !== 1) { res.send(401).send('Nope'); return; }
            ServerAuth.deletePost(res, userDeleting!, _token, msgID);
        });
    }
    else {
        res.status(400).send(`Bad params: ${msgID}, ${_username}, ${_token}`);
    }
});

router.get('/getpost', (req: any, res: any) => {
    if (!ServerAuth.MongoAvailable()) { res.status(400).send('Mongo not available.'); return; }

    const postID: any = req.query.id;
    const byUsername: string = req.query.byUsername;

    const limit: number = req.query.limit;

    // Get post by ID
    if (postID !== undefined) {
        DebugConsole.Writeq('Get post by ID');
        ServerAuth.getPostByID(postID, res, (err: any, resultingPost: any) => {

            if (err || resultingPost === undefined) {
                DebugConsole.Writeq(`Error while retrieving post.`);
                res.status(404).send(resultingPost);
            }
            else {
                DebugConsole.Write(resultingPost);
                res.status(200).send(JSON.stringify(resultingPost));
            }
        });
        return;
    }

    // TODO: fix these to use callbacks and shit
    // Get post by username
    if (byUsername !== undefined && byUsername.trim()) {
        DebugConsole.Writeq('Get post by username');
        let user: IUser | undefined;
        ServerAuth.getUserByName(byUsername, (result: IUser) => {
            user = result;
        });
        ServerAuth.getPostsByUsername(res, user!, limit);
        return;
    }

    // Get latest posts
    if (!postID && !byUsername) {
        ServerAuth.getLatestPosts(limit, (result: IBlogPost[] | null) => {
            if (result === null) res.status(200).send('N/A');
            else res.status(200).send(JSON.stringify(result));
        });
        return;
    }

});



export const Controller: Router = router;

/** The endpoint that this controller responds to. All pre-defined requests are relative to this endpoint which is relative to the base URL. */
export const Endpoint: string = '/blog';
