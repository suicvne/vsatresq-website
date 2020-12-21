"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Endpoint = exports.Controller = void 0;
const express_1 = require("express");
const Debug_1 = require("../Debug");
const BlogBackend_Mongo_1 = require("../BlogBackend_Mongo");
const ClassifiedsBackend_1 = require("../Classifieds/ClassifiedsBackend");
let shop = require('./ShopController');
var oid = require('mongodb').ObjectID;
const router = express_1.Router();
router.get('/cdn', (req, res) => {
    var fileName = req.query.name;
    let file = `${process.cwd()}/data/classifieds/images/${fileName}`;
    let idx = fileName.indexOf('.');
    let type = fileName.substring(++idx);
    Debug_1.DebugConsole.Writeq('Classifieds getting file of type ' + type);
    var s = require('fs').createReadStream(file);
    s.on('open', () => {
        res.set('Content-Type', shop._MIME[type]);
        s.pipe(res);
    });
    s.on('error', () => {
        res.set('Content-Type', 'text/plain');
        res.status(404).send('Not found');
    });
});
router.post('/cdn', (req, res) => {
    let token = req.body.token;
    let username = req.body.username;
    let __base64 = req.body.base64.split(',')[1];
    let extension = req.body.extension;
    let fileName = shop._GenerateRandomName(16);
    let finalURL = `${exports.Endpoint}/cdn?name=${fileName}${extension}`;
    let filePath = `${process.cwd()}/data/classifieds/images`;
    let fullDestinationPath = `${filePath}/${fileName}${extension}`;
    let fs = require('fs');
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
        console.log('Classifieds CDN Upload', fileName, extension, __base64.substring(0, 45));
        shop._DirectoryExists(filePath, (doesExist) => {
            if (doesExist) {
                shop._WriteData(fullDestinationPath, __base64, (errorOccured) => {
                    if (errorOccured)
                        res.status(400).send(`Unknown error ocurred while trying to write file to disk.`);
                    else
                        res.status(200).send(finalURL);
                });
            }
            else {
                fs.mkdir(filePath, { recursive: true }, (err) => {
                    if (err) {
                        res.status(400).send(`Error while trying to create files dir: ${err}`);
                        return;
                    }
                    shop._WriteData(fullDestinationPath, __base64, (errorOccured) => {
                        if (errorOccured)
                            res.status(400).send(`Unknown error ocurred while trying to write file to disk.`);
                        else
                            res.status(200).send(finalURL);
                    });
                });
            }
        });
    }
});
router.get('/availability', (req, res) => {
    res.status(200).send(String(ClassifiedsBackend_1.ClassifiedsBackend.Available));
});
router.post('/delete_listing', (req, res) => {
    let token = req.body.token;
    let username = req.body.username;
    let listing_id = req.body.listing_id;
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
        ClassifiedsBackend_1.ClassifiedsBackend.removeListing(listing_id, (result) => {
            res.status(200).send(result);
        });
    }
    else
        res.status(401).send('Unauthorized');
});
router.post('/get_listing', (req, res) => {
    let id = req.body.listing_id;
    console.log(req.body);
    if (id !== undefined) {
        if (id === 'all') {
            ClassifiedsBackend_1.ClassifiedsBackend.getAllListings((err, value) => {
                if (err !== undefined || (value === undefined))
                    res.status(400).send('err: ' + err);
                else
                    res.status(200).send(value);
            });
        }
        else {
            ClassifiedsBackend_1.ClassifiedsBackend.getListingByID(id, (listing, err) => {
                if (err || listing === undefined) {
                    console.log('Sending err....');
                    res.status(400).send(err);
                }
                else {
                    console.log('Sending listing....');
                    res.status(200).send(listing);
                }
            });
        }
    }
    else
        res.status(400).send('Invalid Order ID: ' + id);
});
router.post('/edit_listing', (req, res) => {
    let id = oid(req.body.listing_id);
    let token = req.body.token;
    let username = req.body.username;
    let _item = req.body.item;
    console.log(req.body);
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
        Debug_1.DebugConsole.Writeq(`Updating classified with listing ID ${id}`);
        ClassifiedsBackend_1.ClassifiedsBackend.updateListing(id, _item, (err, result) => {
            if (err || result === undefined)
                res.status(400).send(err || 'Something happened');
            else
                res.status(200).send(_item);
        });
    }
    else
        res.status(401).send('Unauthorized');
});
router.post('/add_classified', (req, res) => {
    let itemObject = req.body.new_classified;
    let token = req.body.token;
    let username = req.body.username;
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
        if (itemObject === undefined) {
            res.status(400).send('Item you wanted to add was undefined or nil.');
            return;
        }
        ClassifiedsBackend_1.ClassifiedsBackend.addNewListing(itemObject, (err, result) => {
            if (err) {
                Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, `Error adding new Classified: ${err}`);
                res.status(400).send(`Error adding new Classified: ${err}`);
            }
            else {
                if (result === undefined)
                    res.status(400).send('Added result was undefined.');
                else
                    res.status(200).send(result);
            }
        });
    }
    else
        res.status(401).send('Unauthorized');
});
exports.Controller = router;
exports.Endpoint = '/classifieds';
//# sourceMappingURL=ClassifiedsController.js.map