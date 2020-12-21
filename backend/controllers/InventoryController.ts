import { Router, Request, Response } from 'express';
import { InventoryBackend } from '../InventoryBackend';
import { IInventoryItem } from '../Inventory/InventoryItem';
import expressWs = require('express-ws');
import { MongoDBStatus } from '../MongoRequests';
import { DebugConsole, DebugSeverity } from '../Debug';

import * as fs from 'fs';
import * as path from 'path';
import { ServerAuth } from '../BlogBackend_Mongo';

var oid = require('mongodb').ObjectID;
let sharp = require('sharp');

const router: Router = Router();

router.get('/availability', (req: any, res: any) => {
    res.status(200).send(`${InventoryBackend.Available}`);
});

router.get('/get_item', (req: any, res: any) => {
    const __id = req.query._id;
    const _subdb = req.query.subdb;

    InventoryBackend.getItemByID(_subdb, oid(__id), (item: IInventoryItem | undefined, err: any) => {
        if (err) res.status(400).send(err);
        if (item !== undefined) {
            res.status(200).send(item!);
        }
        res.status(401).send('????');
    });
});

router.get('/all_items', (req: any, res: any) => {

    const _subdb = req.query.subdb;

    InventoryBackend.getAllItems(_subdb, (err: any, value: any) => {
        if (err) res.status(400).send(err);
        else {
            if (value !== undefined) res.status(200).send(value);
            else res.status(200).send(JSON.stringify({ items: [] }));
        }
    });
});

router.get('/subdb_list', (req: any, res: any) => {
    const token = req.query.token;
    const username = req.query.username;
    res.setHeader("Set-Cookie", "HttpOnly;Secure;SameSite=Lax");
    if(token.trim() && username.trim())
    {
        ServerAuth.verifyUserPower(username, token, (username: string, power: number) => {
            if (token !== undefined && token.trim()) {
                InventoryBackend.GetSubDBList((err: any, result: string[] | undefined) => {
                    if (err) res.status(400).send(err);
                    else if (result !== undefined) res.status(200).send(result!);
                    else res.status(200).send(`Result was undefined. There are no subdirectories.`);
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
    else
    {
        res.status(401).send('Token or username are incorrect or bad.');
    }
});

const DirectoryExists = (dir: any, cb: any) => {
    fs.access(dir, fs.constants.F_OK | fs.constants.W_OK, (err: any) => {
        if (err) {
            DebugConsole.Writeq(`${dir} doesn't exist`);
            cb(false);
        }
        else cb(true);
    });
};

router.post('/delete_item', (req: any, res: any) => {
    DebugConsole.Writeq('Got request to delete an item');

    let item_id = req.body.item_id;
    let username = req.body.username;
    let token = req.body.token;
    let _subdb = req.body.subdb;

    if (ServerAuth.tokenStore.verifyToken(username, token)) {
        InventoryBackend.removeItem(_subdb, item_id, () => {
            res.status(200).send('Deleted successfully.');
        });
    }
    else res.status(401).send('Unauthorized.');
});

router.post('/upload_item_image', (req: any, res: any) => {
    DebugConsole.Writeq('Init inventory upload');
    // TODO: authorization
    let uploadedData = req.body.item_image;
    let extension = req.body.extension;
    let fileName = GenerateRandomName(6);
    let filePath = `${process.cwd()}/data/inventory/item_images`;
    let fullFilePath = `${filePath}/${fileName}${extension}`;
    let finalURL = `${Endpoint}/item_image?name=${fileName}${extension}`;
    const base64Data = uploadedData.split(',')[1];

    // TODO: Compress data

    let error = false;
    let fs = require('fs');

    DirectoryExists(filePath, (doesExist: boolean) => {
        if (doesExist) {
            console.log("Directory exists");
            WriteData(fullFilePath, base64Data, (errorOccured: boolean) => {
                if (!errorOccured) {
                    DebugConsole.Writeq("Written to disk");
                    DebugConsole.Writeq("Available at: ", finalURL);
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
            fs.mkdir(filePath, { recursive: true }, (err: any) => {
                if (err) DebugConsole.Write(DebugSeverity.ERROR, err);
                else {
                    WriteData(fullFilePath, base64Data, (errorOccured: boolean) => {
                        if (!errorOccured) {
                            DebugConsole.Writeq("Written to disk");
                            DebugConsole.Writeq("Serving at ", finalURL);
                            res.status(200).send(finalURL);
                        }
                        else res.status(400).send('poop');
                    });
                }
            });
        }
    });
});

const WriteData = (file: string, uploadedData: any, cb: Function) => {
    require('fs').writeFile(file, uploadedData, 'base64', (err: any) => {
        let error = false;
        DebugConsole.Writeq(`Written to ${file}`);
        if (err) error = true;
        //else res.status(200).send('Success!');
        cb(error);
    });
};

const GenerateRandomName = (length: number): string => {
    let randomPool = "abcdefghijklmnopqrstuvwxyz";
    let finalResult = "";

    for (let i = 0; i < length; i++) {
        finalResult +=
            randomPool.charAt(randomIntFromInterval(0, (randomPool.length - 1)));
    }

    return finalResult;
};

const randomIntFromInterval = (min: number, max: number): number => // min and max included
{
    return Math.floor(Math.random() * (max - min + 1) + min);
};

const mime: any = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

router.get('/item_image', (req: any, res: any) => {
    let fileName = req.query.name;
    let file = `${process.cwd()}/data/inventory/item_images/${fileName}`;
    let idx = fileName.indexOf('.');
    let type = fileName.substring(++idx);
    console.log(`getting file (${file}) of type ${type}`);

    let sizeDivisor = 0;
    if(req.query.res !== undefined)
        sizeDivisor = Number.parseInt(req.query.res);

    let fileAtRes = `${process.cwd()}/data/inventory/item_images/${sizeDivisor}x${fileName}`;



    // Source file stream
    var s: any = undefined;

    // Pipe full size file over the network.
    if(sizeDivisor == 0)
    {
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
    else
    {
        // Pipe it 
        if(fs.existsSync(fileAtRes))
        {
            DebugConsole.Writeq("Piping existing file at " + fileAtRes);
            s = fs.createReadStream(fileAtRes).pipe(res);
            s.on('error', () => {
                res.set('Content-Type', 'text/plain');
                res.status(404).send('Not found');
            });
        }
        else // Otherwise, let's resize it, write it, then pipe it!
        {
            DebugConsole.Writeq("Resizing, writing, then pipeing file");
            const metaReader = sharp();
            let outStream = fs.createWriteStream(fileAtRes, {flags: "w"});
            s = fs.createReadStream(file);

            let newWidth = 0;
            let newHeight = 0;
            metaReader.metadata().then((info: any) => { 
                newWidth = Math.max(info.width / sizeDivisor, 400);
                newHeight = Math.max(info.height / sizeDivisor, 300);

                console.log("!!!! new size: " + newWidth + ", " + newHeight);
                let outStream = fs.createWriteStream(fileAtRes, {flags: "w"});
                let transform = metaReader.resize({width: newWidth, height: newHeight});
                s.pipe(transform).pipe(outStream);
                s.pipe(res);
            });

            s.on('open', () => {
                s.pipe(metaReader);    
            });
        }
    }
});

router.get('/existing_images', (req: any, res: any) => {
    // Return
    // List of URLS based on the files existing in the item images directory.
    let directory = `${process.cwd()}/data/inventory/item_images/`;
    let returning_payload: any = 
    {
        existing_images:[]
    };
    fs.readdir(directory, (err: any, files: string[]) => {
        if(files !== undefined)
        {
            files.forEach((file_name_ext) => {
                returning_payload.existing_images.push(`${Endpoint}/item_image?name=${file_name_ext}`);
            });

            res.status(200).send(returning_payload);
        }
        else
        {
            res.status(400).send(err);
        }
    });
});

router.post('/add_item', (req: any, res: any) => {
    let itemObject: IInventoryItem = <IInventoryItem>req.body.new_item;
    let _subdb = req.body.subdb;

    // DebugConsole.WriteObj(itemObject);
    if (itemObject !== undefined) {
        InventoryBackend.addNewItem(_subdb, itemObject, (err: any, result: any) => {
            if (err) {
                DebugConsole.Writeq(err);
                res.status(400).send(`Couldn't add item\n${itemObject}.\n${err}`) //TODO: hack around a variadic send function ;))
            }
            else {
                if (result === undefined) return;

                DebugConsole.Writeq(`Added new item to DB: ${itemObject.item_name}`);
                res.status(200).send(result);
            }
        });
    }
    else
        res.status(400).send(`Couldn't add item: ${req.body.item}`);

});

router.post('/edit_item', (req: any, res: any) => {
    console.log(req.body);
    let id = req.body.id;
    let token = req.body.token;
    let username = req.body.username;
    let _subdb = req.body.subdb;

    if (ServerAuth.tokenStore.verifyToken(username, token)) {
        DebugConsole.Writeq(`Updating item id ${id} in subdb ${_subdb}`);
        InventoryBackend.updateItem(_subdb, id, req.body.item, (err, result) => {
            if (err || result === undefined) res.status(400).send(err || 'Something happened.');

            res.status(200).send(result);
        });
    }
    else res.status(401).send('Unauthorized.');
});

export const Controller: Router = router;
export const Endpoint: string = '/inventory';