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
exports._MIME = exports._WriteData = exports._DirectoryExists = exports._GenerateRandomName = exports.Endpoint = exports.Controller = void 0;
const express_1 = require("express");
const ShopBackend_1 = require("../ShopBackend");
const Debug_1 = require("../Debug");
const fs = __importStar(require("fs"));
const BlogBackend_Mongo_1 = require("../BlogBackend_Mongo");
var oid = require('mongodb').ObjectID;
const router = express_1.Router();
// TODO: Package this cdn thing as something I can easily include as a "function"....
router.get('/cdn', (req, res) => {
    var fileName = req.query.filename;
    var noDownload = (req.query.nodl !== undefined ? Number.parseInt(req.query.nodl) : 0);
    let file = `${process.cwd()}/data/shop/item_files/${fileName}`;
    let idx = fileName.indexOf('.');
    let type = fileName.substring(++idx);
    let fs = require('fs');
    console.log('getting file of type ' + type);
    console.log(mime[type], '\n');
    var s = fs.createReadStream(file);
    /**
     * var file = fs.createReadStream(fullDestinationPath);
                    res.setHeader('Content-Length', base64DataOnly.length);
                    res.setHeader('Content-Type', `application/${extension}`);
                    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.${extension}`);
                    file.pipe(res);
     */
    s.on('open', () => {
        var stat = fs.statSync(file);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Type', mime[type]);
        if (noDownload === 0)
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        s.pipe(res);
    });
    s.on('error', () => {
        res.set('Content-Type', 'text/plain');
        res.status(404).send('Not found');
    });
});
router.post('/cdn', (req, res) => {
    const __base64 = req.body.base64;
    const extension = req.body.extension;
    const fileName = GenerateRandomName(16);
    const base64DataOnly = __base64.split(',')[1];
    let filePath = `${process.cwd()}/data/shop/item_files`;
    let fullDestinationPath = `${filePath}/${fileName}.${extension}`;
    DirectoryExists(filePath, (doesExist) => {
        if (doesExist) {
            WriteData(fullDestinationPath, base64DataOnly, (errorOccured) => {
                if (errorOccured)
                    res.status(400).send(`Unknown error ocurred while trying to write the optional file to disk.`);
                else
                    res.status(200).send(`/shop/cdn?filename=${fileName}.${extension}`);
            });
        }
        else {
            fs.mkdir(filePath, { recursive: true }, (err) => {
                if (err) {
                    res.status(400).send(`Error while trying to create files directory: ${err}`);
                    return;
                }
                WriteData(fullDestinationPath, base64DataOnly, (errorOccured) => {
                    if (errorOccured)
                        res.status(400).send(`Unknown error ocurred while trying to write the optional file to disk.`);
                    else
                        res.status(200).send(`/shop/cdn?filename=${fileName}.${extension}`);
                });
            });
        }
    });
});
router.get('/availability', (req, res) => {
    res.status(200).send(`${ShopBackend_1.ShopBackend.Available}`);
});
router.get('/get_item', (req, res) => {
    const __id = req.query._id;
    ShopBackend_1.ShopBackend.getItemByID(oid(__id), (item, err) => {
        if (err)
            res.status(400).send(err);
        if (item !== undefined) {
            res.status(200).send(item);
        }
        res.status(401).send('????');
    });
});
router.get('/all_items', (req, res) => {
    ShopBackend_1.ShopBackend.getAllItems((err, value) => {
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
router.post('/paypal_complete', (req, res) => {
    Debug_1.DebugConsole.Writeq("Paypal Transaction completed (notified)");
    Debug_1.DebugConsole.Writeq(req.body);
    const paypal_b = require('../paypal');
    paypal_b(req, res, req.body.cart, (code, message) => {
        //DebugConsole.Writeq("Paypal done.", code, message);
        Debug_1.DebugConsole.Writeq('Sending confirmation email....not ');
        res.status(code).send(message);
    });
});
router.post('/delete_item', (req, res) => {
    Debug_1.DebugConsole.Writeq('Got request to delete an item');
    let item_id = req.body.item_id;
    let username = req.body.username;
    let token = req.body.token;
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
        ShopBackend_1.ShopBackend.removeItem(item_id, () => {
            res.status(200).send('Deleted successfully.');
        });
    }
    else
        res.status(401).send('Unauthorized.');
});
router.post('/get_order', (req, res) => {
    let id = req.body.order_id;
    if (id !== undefined) {
        if (id === 'all') {
            let orders_array = [];
            ShopBackend_1.ShopBackend.getAllOrders((err, value) => {
                if (err || value === undefined) {
                    res.status(400).send(err);
                }
                else
                    res.status(200).send(value);
            });
        }
        else {
            ShopBackend_1.ShopBackend.getOrderByOrderID(id, (order, err) => {
                console.log('order, err: ', order, err);
                if (err || order === undefined) {
                    Debug_1.DebugConsole.Write(Debug_1.DebugSeverity.ERROR, err);
                    res.status(400).send(err);
                }
                else
                    res.status(200).send(order);
            });
        }
    }
    else
        res.status(400).send('Invalid order ID');
});
router.get('/item_image', (req, res) => {
    let fileName = req.query.name;
    let file = `${process.cwd()}/data/shop/item_images/${fileName}`;
    let idx = fileName.indexOf('.');
    let type = fileName.substring(++idx);
    console.log('getting file of type ' + type);
    var s = require('fs').createReadStream(file);
    s.on('open', () => {
        res.set('Content-Type', mime[type]);
        s.pipe(res);
    });
    s.on('error', () => {
        res.set('Content-Type', 'text/plain');
        res.status(404).send('Not found');
    });
});
router.post('/upload_item_image', (req, res) => {
    Debug_1.DebugConsole.Writeq('Init shop upload');
    // TODO: authorization
    let uploadedData = req.body.item_image;
    let extension = req.body.extension;
    let fileName = GenerateRandomName(6);
    let filePath = `${process.cwd()}/data/shop/item_images`;
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
    js: 'application/javascript',
    pdf: 'application/pdf'
};
router.post('/add_item', (req, res) => {
    let itemObject = req.body.new_item;
    Debug_1.DebugConsole.WriteObj(itemObject);
    if (itemObject !== undefined) {
        ShopBackend_1.ShopBackend.addNewItem(itemObject, (err, result) => {
            if (err) {
                Debug_1.DebugConsole.Writeq(err);
                res.status(400).send(`Couldn't add item\n${itemObject}.\n${err}`); //TODO: hack around a variadic send function ;))
            }
            else {
                if (result === undefined)
                    return;
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
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
        Debug_1.DebugConsole.Writeq(`Updating item id ${id}`);
        ShopBackend_1.ShopBackend.updateItem(id, req.body.item, (err, result) => {
            if (err || result === undefined)
                res.status(400).send(err || 'Something happened.');
            else
                res.status(200).send(result);
        });
    }
    else
        res.status(401).send('Unauthorized.');
});
router.post('/edit_order', (req, res) => {
    console.log(req.body);
    let id = req.body.id;
    let token = req.body.token;
    let username = req.body.username;
    let order = req.body.order;
    if (BlogBackend_Mongo_1.ServerAuth.tokenStore.verifyToken(username, token)) {
        Debug_1.DebugConsole.Writeq(`Updating order id ${id}`);
        ShopBackend_1.ShopBackend.updateOrder(id, order, (err, result) => {
            if (err || result === undefined)
                res.status(400).send(err || 'Something happened.');
            res.status(200).send(result);
        });
    }
    else
        res.status(401).send('Unauthorized.');
});
exports.Controller = router;
exports.Endpoint = '/shop';
exports._GenerateRandomName = GenerateRandomName;
exports._DirectoryExists = DirectoryExists;
exports._WriteData = WriteData;
exports._MIME = mime;
//# sourceMappingURL=ShopController.js.map