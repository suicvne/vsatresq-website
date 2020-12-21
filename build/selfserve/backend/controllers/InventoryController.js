"use strict";
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
const InventoryBackend_1 = require("../InventoryBackend");
const Debug_1 = require("../Debug");
const fs = __importStar(require("fs"));
const BlogBackend_Mongo_1 = require("../BlogBackend_Mongo");
var oid = require('mongodb').ObjectID;
let sharp = require('sharp');
const router = express_1.Router();
router.get('/availability', (req, res) => {
    res.status(200).send(`${InventoryBackend_1.InventoryBackend.Available}`);
});
router.get('/get_item', (req, res) => {
    const __id = req.query._id;
    const _subdb = req.query.subdb;
    InventoryBackend_1.InventoryBackend.getItemByID(_subdb, oid(__id), (item, err) => {
        if (err)
            res.status(400).send(err);
        if (item !== undefined) {
            res.status(200).send(item);
        }
        res.status(401).send('????');
    });
});
router.get('/all_items', (req, res) => {
    const _subdb = req.query.subdb;
    InventoryBackend_1.InventoryBackend.getAllItems(_subdb, (err, value) => {
        if (err)
            res.status(400).send(err);
        else {
            if (value !== undefined)
                res.status(200).send(value);
            else
                res.status(200).send(JSON.stringify({ items: [] }));
        }
    });
});
router.get('/subdb_list', (req, res) => {
    const token = req.query.token;
    const username = req.query.username;
    res.setHeader("Set-Cookie", "HttpOnly;Secure;SameSite=Lax");
    if (token.trim() && username.trim()) {
        BlogBackend_Mongo_1.ServerAuth.verifyUserPower(username, token, (username, power) => {
            if (token !== undefined && token.trim()) {
                InventoryBackend_1.InventoryBackend.GetSubDBList((err, result) => {
                    if (err)
                        res.status(400).send(err);
                    else if (result !== undefined)
                        res.status(200).send(result);
                    else
                        res.status(200).send(`Result was undefined. There are no subdirectories.`);
                });
            }
            else {
                res.status(401).send('Invalid token..');
            }
            // if (power === 1) // Has power
            // {
            // }
            // else {
            //     res.status(401).send('Unauthorized to view inventory list.');
            // }
        });
    }
    else {
        res.status(401).send('Token or username are incorrect or bad.');
    }
});
const DirectoryExists = (dir, cb) => {
    fs.access(dir, fs.constants.F_OK | fs.constants.W_OK, (err) => {
        if (err) {
            Debug_1.DebugConsole.Writeq(`${dir} doesn't exist`);
            cb(false);
        }
        else
            cb(true);
    });
};
router.post('/delete_item', (req, res) => {
    Debug_1.DebugConsole.Writeq('Got request to delete an item');
    let item_id = req.body.item_id;
    let username = req.body.username;
    let token = req.body.token;
    let _subdb = req.body.subdb;
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
        InventoryBackend_1.InventoryBackend.removeItem(_subdb, item_id, () => {
            res.status(200).send('Deleted successfully.');
        });
    }
    else
        res.status(401).send('Unauthorized.');
});
router.post('/upload_item_image', (req, res) => {
    Debug_1.DebugConsole.Writeq('Init inventory upload');
    // TODO: authorization
    let uploadedData = req.body.item_image;
    let extension = req.body.extension;
    let fileName = GenerateRandomName(6);
    let filePath = `${process.cwd()}/data/inventory/item_images`;
    let fullFilePath = `${filePath}/${fileName}${extension}`;
    let finalURL = `${exports.Endpoint}/item_image?name=${fileName}${extension}`;
    const base64Data = uploadedData.split(',')[1];
    // TODO: Compress data
    let error = false;
    let fs = require('fs');
    DirectoryExists(filePath, (doesExist) => {
        if (doesExist) {
            console.log("Directory exists");
            WriteData(fullFilePath, base64Data, (errorOccured) => {
                if (!errorOccured) {
                    Debug_1.DebugConsole.Writeq("Written to disk");
                    Debug_1.DebugConsole.Writeq("Available at: ", finalURL);
                    res.status(200).send(finalURL);
                }
                else {
                    console.log("Error writing");
                    res.status(400).send('poop');
                }
            });
        }
        else {
            console.log("making directory");
            fs.mkdir(filePath, { recursive: true }, (err) => {
                if (err)
                    Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, err);
                else {
                    WriteData(fullFilePath, base64Data, (errorOccured) => {
                        if (!errorOccured) {
                            Debug_1.DebugConsole.Writeq("Written to disk");
                            Debug_1.DebugConsole.Writeq("Serving at ", finalURL);
                            res.status(200).send(finalURL);
                        }
                        else
                            res.status(400).send('poop');
                    });
                }
            });
        }
    });
});
const WriteData = (file, uploadedData, cb) => {
    require('fs').writeFile(file, uploadedData, 'base64', (err) => {
        let error = false;
        Debug_1.DebugConsole.Writeq(`Written to ${file}`);
        if (err)
            error = true;
        //else res.status(200).send('Success!');
        cb(error);
    });
};
const GenerateRandomName = (length) => {
    let randomPool = "abcdefghijklmnopqrstuvwxyz";
    let finalResult = "";
    for (let i = 0; i < length; i++) {
        finalResult +=
            randomPool.charAt(randomIntFromInterval(0, (randomPool.length - 1)));
    }
    return finalResult;
};
const randomIntFromInterval = (min, max) => // min and max included
 {
    return Math.floor(Math.random() * (max - min + 1) + min);
};
const mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};
router.get('/item_image', (req, res) => {
    let fileName = req.query.name;
    let file = `${process.cwd()}/data/inventory/item_images/${fileName}`;
    let idx = fileName.indexOf('.');
    let type = fileName.substring(++idx);
    console.log(`getting file (${file}) of type ${type}`);
    let sizeDivisor = 0;
    if (req.query.res !== undefined)
        sizeDivisor = Number.parseInt(req.query.res);
    let fileAtRes = `${process.cwd()}/data/inventory/item_images/${sizeDivisor}x${fileName}`;
    // Source file stream
    var s = undefined;
    // Pipe full size file over the network.
    if (sizeDivisor == 0) {
        s = fs.createReadStream(file);
        s.on('open', () => {
            res.set('Content-Type', mime[type]);
            s.pipe(res);
        });
        s.on('error', () => {
            res.set('Content-Type', 'text/plain');
            res.status(404).send('Not found');
        });
    }
    else {
        // Pipe it 
        if (fs.existsSync(fileAtRes)) {
            Debug_1.DebugConsole.Writeq("Piping existing file at " + fileAtRes);
            s = fs.createReadStream(fileAtRes).pipe(res);
            s.on('error', () => {
                res.set('Content-Type', 'text/plain');
                res.status(404).send('Not found');
            });
        }
        else // Otherwise, let's resize it, write it, then pipe it!
         {
            Debug_1.DebugConsole.Writeq("Resizing, writing, then pipeing file");
            const metaReader = sharp();
            let outStream = fs.createWriteStream(fileAtRes, { flags: "w" });
            s = fs.createReadStream(file);
            let newWidth = 0;
            let newHeight = 0;
            metaReader.metadata().then((info) => {
                newWidth = Math.max(info.width / sizeDivisor, 400);
                newHeight = Math.max(info.height / sizeDivisor, 300);
                console.log("!!!! new size: " + newWidth + ", " + newHeight);
                let outStream = fs.createWriteStream(fileAtRes, { flags: "w" });
                let transform = metaReader.resize({ width: newWidth, height: newHeight });
                s.pipe(transform).pipe(outStream);
                s.pipe(res);
            });
            s.on('open', () => {
                s.pipe(metaReader);
            });
        }
    }
});
router.get('/existing_images', (req, res) => {
    // Return
    // List of URLS based on the files existing in the item images directory.
    let directory = `${process.cwd()}/data/inventory/item_images/`;
    let returning_payload = {
        existing_images: []
    };
    fs.readdir(directory, (err, files) => {
        if (files !== undefined) {
            files.forEach((file_name_ext) => {
                returning_payload.existing_images.push(`${exports.Endpoint}/item_image?name=${file_name_ext}`);
            });
            res.status(200).send(returning_payload);
        }
        else {
            res.status(400).send(err);
        }
    });
});
router.post('/add_item', (req, res) => {
    let itemObject = req.body.new_item;
    let _subdb = req.body.subdb;
    // DebugConsole.WriteObj(itemObject);
    if (itemObject !== undefined) {
        InventoryBackend_1.InventoryBackend.addNewItem(_subdb, itemObject, (err, result) => {
            if (err) {
                Debug_1.DebugConsole.Writeq(err);
                res.status(400).send(`Couldn't add item\n${itemObject}.\n${err}`); //TODO: hack around a variadic send function ;))
            }
            else {
                if (result === undefined)
                    return;
                Debug_1.DebugConsole.Writeq(`Added new item to DB: ${itemObject.item_name}`);
                res.status(200).send(result);
            }
        });
    }
    else
        res.status(400).send(`Couldn't add item: ${req.body.item}`);
});
router.post('/edit_item', (req, res) => {
    console.log(req.body);
    let id = req.body.id;
    let token = req.body.token;
    let username = req.body.username;
    let _subdb = req.body.subdb;
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
        Debug_1.DebugConsole.Writeq(`Updating item id ${id} in subdb ${_subdb}`);
        InventoryBackend_1.InventoryBackend.updateItem(_subdb, id, req.body.item, (err, result) => {
            if (err || result === undefined)
                res.status(400).send(err || 'Something happened.');
            res.status(200).send(result);
        });
    }
    else
        res.status(401).send('Unauthorized.');
});
exports.Controller = router;
exports.Endpoint = '/inventory';
//# sourceMappingURL=InventoryController.js.map