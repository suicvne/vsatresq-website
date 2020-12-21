import { Router, Request, Response } from 'express';
import {ShopBackend} from '../ShopBackend';
import { IShopItem } from '../Shop/ShopItem';
import expressWs = require('express-ws');
import { MongoDBStatus } from '../MongoRequests';
import { DebugConsole, DebugSeverity } from '../Debug';

import * as fs from 'fs';
import * as path from 'path';
import { ServerAuth } from '../BlogBackend_Mongo';

var oid = require('mongodb').ObjectID;

const router: Router = Router();

// TODO: Package this cdn thing as something I can easily include as a "function"....

router.get('/cdn', (req: Request, res: Response) => {
    var fileName: string = <string>req.query.filename;
    var noDownload: Number = (req.query.nodl !== undefined ? Number.parseInt(<string>req.query.nodl) : 0);
    let file = `${process.cwd()}/../data/shop/item_files/${fileName}`;
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
    s.on('open', () => 
    {
        var stat = fs.statSync(file);
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Type', mime[type]);
        if(noDownload === 0) res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        s.pipe(res);
    });
    s.on('error', () =>
    {
        res.set('Content-Type', 'text/plain');
        res.status(404).send('Not found');
    });
});

router.post('/cdn', (req: Request, res: Response) => {
    const __base64 = req.body.base64;
    const extension = req.body.extension;
    const fileName = GenerateRandomName(16);
    const base64DataOnly = __base64.split(',')[1];

    let filePath = `${process.cwd()}/../data/shop/item_files`;

    let fullDestinationPath = `${filePath}/${fileName}.${extension}`;

    DirectoryExists(filePath, (doesExist: boolean) => {
        if(doesExist)
        {
            WriteData(fullDestinationPath, base64DataOnly, (errorOccured: boolean) => {
                if(errorOccured) res.status(400).send(`Unknown error ocurred while trying to write the optional file to disk.`);
                else res.status(200).send(`/shop/cdn?filename=${fileName}.${extension}`);
            });
        }
        else
        {
            fs.mkdir(filePath, {recursive: true}, (err: any) => {
                if(err)
                {
                    res.status(400).send(`Error while trying to create files directory: ${err}`);
                    return;
                }

                WriteData(fullDestinationPath, base64DataOnly, (errorOccured: boolean) => {
                    if(errorOccured) res.status(400).send(`Unknown error ocurred while trying to write the optional file to disk.`);
                    else res.status(200).send(`/shop/cdn?filename=${fileName}.${extension}`);
                });
            });
        }
    });
});

router.get('/availability', (req: Request, res: Response) => {
    res.status(200).send(`${ShopBackend.Available}`);
});

router.get('/get_item', (req: Request, res: Response) => {
    const __id = req.query._id;
    ShopBackend.getItemByID(oid(__id), (item: IShopItem | undefined, err: any) => {
        if (err) res.status(400).send(err);
        if (item !== undefined) {
            res.status(200).send(item!);
        }
        res.status(401).send('????');
    });
});

router.get('/all_items', (req: Request, res: Response) => {
    ShopBackend.getAllItems((err: any, value: any) => {
        if (err) res.status(400).send(err);
        else {
            if (value !== undefined) res.status(200).send(value);
            else res.status(200).send(JSON.stringify({ items: [] }));
        }
    });
});

const DirectoryExists = (dir: any, cb: any) => {
    fs.access(dir, fs.constants.F_OK | fs.constants.W_OK, (err: any) => {
        if(err)
        {
            DebugConsole.Writeq(`${dir} doesn't exist`);
            cb(false);
        }
        else cb(true);
    });
};

router.post('/paypal_complete', (req: Request, res: Response) => {
    DebugConsole.Writeq("Paypal Transaction completed (notified)");
    DebugConsole.Writeq(req.body);
    const paypal_b = require('../paypal');
    paypal_b(req, res, req.body.cart,(code: number, message: String) => {
        //DebugConsole.Writeq("Paypal done.", code, message);
        DebugConsole.Writeq('Sending confirmation email....not ');
        

        res.status(code).send(message);
    });
});

router.post('/delete_item', (req: Request, res: Response) => {
    DebugConsole.Writeq('Got request to delete an item');
    
    let item_id = req.body.item_id;
    let username = req.body.username;
    let token = req.body.token;

    if(ServerAuth.tokenStore.verifyToken(username, token))
    {
        ShopBackend.removeItem(item_id, () => {
            res.status(200).send('Deleted successfully.');
        });
    }
    else res.status(401).send('Unauthorized.');
});

router.post('/get_order', (req: Request, res: Response) => {
    let id = req.body.order_id;

    if(id !== undefined)
    {
        if(id === 'all')
        {
            let orders_array = [];
            ShopBackend.getAllOrders((err, value) => {
                if(err || value === undefined)
                {
                    res.status(400).send(err);
                }
                else res.status(200).send(value);
            });
        }
        else
        {
            ShopBackend.getOrderByOrderID(id, (order, err) => {
                console.log('order, err: ', order, err);
    
                if(err || order === undefined) 
                {
                    DebugConsole.Write(DebugSeverity.ERROR, err);
                    res.status(400).send(err);
                }
                else res.status(200).send(order);
            });
        }
    }
    else res.status(400).send('Invalid order ID');
});


router.get('/item_image', (req: Request, res: Response) => {
    let fileName = <string>req.query.name;
    let file = `${process.cwd()}/../data/shop/item_images/${fileName}`;
    let idx = fileName.indexOf('.'); 
    let type = fileName.substring(++idx);
    console.log('getting file of type ' + type);

    var s = require('fs').createReadStream(file);
    s.on('open', () => 
    {
        res.set('Content-Type', mime[type]);
        s.pipe(res);
    });
    s.on('error', () =>
    {
        res.set('Content-Type', 'text/plain');
        res.status(404).send('Not found');
    });
});

router.post('/upload_item_image', (req: Request, res: Response) => {
    DebugConsole.Writeq('Init shop upload');
    // TODO: authorization
    let uploadedData = req.body.item_image;
    let extension = req.body.extension;
    let fileName = GenerateRandomName(6);
    let filePath = `${process.cwd()}/../data/shop/item_images`;
    let fullFilePath = `${filePath}/${fileName}${extension}`;
    let finalURL = `${Endpoint}/item_image?name=${fileName}${extension}`;
    const base64Data = uploadedData.split(',')[1];

    // TODO: Compress data

    let error = false;
    let fs = require('fs');

    DirectoryExists(filePath, (doesExist: boolean) => {
        if(doesExist)
        {
            console.log("Directory exists");
            WriteData(fullFilePath, base64Data, (errorOccured: boolean) => {
                if(!errorOccured) 
                {
                    DebugConsole.Writeq("Written to disk");
                    DebugConsole.Writeq("Available at: ", finalURL);
                    res.status(200).send(finalURL);
                }
                else
                { 
                    console.log("Error writing");
                    res.status(400).send('poop');
                }
            });
        }
        else
        {
            console.log("making directory");
            fs.mkdir(filePath, {recursive: true}, (err: any) => {
                if(err) DebugConsole.Write(DebugSeverity.ERROR, err);
                else
                {
                    WriteData(fullFilePath, base64Data, (errorOccured: boolean) => {
                        if(!errorOccured) 
                        {
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
        if(err) error = true;
        //else res.status(200).send('Success!');
        cb(error);
    });
};

const GenerateRandomName = (length: number): string => 
{
    let randomPool = "abcdefghijklmnopqrstuvwxyz";
    let finalResult = "";

    for(let i = 0; i < length; i++)
    {
        finalResult += 
            randomPool.charAt(randomIntFromInterval(0, (randomPool.length - 1)));
    }

    return finalResult;
};

const randomIntFromInterval = (min: number,max: number): number => // min and max included
{
    return Math.floor(Math.random()*(max-min+1)+min);
};

const mime: any = {
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


router.post('/add_item', (req: Request, res: Response) => {
    let itemObject: IShopItem = <IShopItem>req.body.new_item;
    DebugConsole.WriteObj(itemObject);
    if (itemObject !== undefined) {
        ShopBackend.addNewItem(itemObject, (err: any, result: any) => {
            if (err) {
                DebugConsole.Writeq(err);
                res.status(400).send(`Couldn't add item\n${itemObject}.\n${err}`) //TODO: hack around a variadic send function ;))
            }
            else {
                if (result === undefined) return;
                res.status(200).send(result);
            }
        });
    }
    else
        res.status(400).send(`Couldn't add item: ${req.body.item}`);

});

router.post('/edit_item', (req: Request, res: Response) => {
    console.log(req.body);
    let id = req.body.id;
    let token = req.body.token;
    let username = req.body.username;

    if(ServerAuth.tokenStore.verifyToken(username, token))
    {
        DebugConsole.Writeq(`Updating item id ${id}`);
        ShopBackend.updateItem(id, req.body.item, (err, result) => {
            if(err || result === undefined) res.status(400).send(err || 'Something happened.');
            else res.status(200).send(result);
        });
    }
    else res.status(401).send('Unauthorized.');
});

router.post('/edit_order', (req: Request, res: Response) => {
    console.log(req.body);
    let id = req.body.id;
    let token = req.body.token;
    let username = req.body.username;
    let order = req.body.order;

    if (ServerAuth.tokenStore.verifyToken(username, token)) {
        DebugConsole.Writeq(`Updating order id ${id}`);
        ShopBackend.updateOrder(id, order, (err, result) => {
            if (err || result === undefined) res.status(400).send(err || 'Something happened.');

            res.status(200).send(result);
        });
    }
    else res.status(401).send('Unauthorized.');
});

export const Controller: Router = router;
export const Endpoint: string = '/shop';
export const _GenerateRandomName: Function = GenerateRandomName;
export const _DirectoryExists: Function = DirectoryExists;
export const _WriteData: Function = WriteData;
export const _MIME: any = mime;