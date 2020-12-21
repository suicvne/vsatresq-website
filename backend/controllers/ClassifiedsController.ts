import {Router, Request, Response} from 'express';
import {DebugConsole, DebugSeverity} from '../Debug';
import {ServerAuth} from '../BlogBackend_Mongo';
import {ClassifiedListing} from '../Classifieds/ClassifiedListing';
import { ClassifiedsBackend } from '../Classifieds/ClassifiedsBackend';

let shop = require('./ShopController');

var oid = require('mongodb').ObjectID;

const router: Router = Router();

router.get('/cdn', (req: Request, res: Response) => {
    var fileName: string = <string>req.query.name;
    let file = `${process.cwd()}/../data/classifieds/images/${fileName}`;
    let idx = fileName.indexOf('.');
    let type = fileName.substring(++idx);
    DebugConsole.Writeq('Classifieds getting file of type ' + type);

    var s = require('fs').createReadStream(file);
    s.on('open', () => 
    {
        res.set('Content-Type', shop._MIME[type]);
        s.pipe(res);
    });
    s.on('error', () =>
    {
        res.set('Content-Type', 'text/plain');
        res.status(404).send('Not found');
    });
});

router.post('/cdn', (req: Request, res: Response) => {
    let token = req.body.token;
    let username = req.body.username;
    let __base64 = req.body.base64.split(',')[1];
    let extension = req.body.extension;
    let fileName = shop._GenerateRandomName(16);
    let finalURL = `${Endpoint}/cdn?name=${fileName}${extension}`;

    let filePath = `${process.cwd()}/../data/classifieds/images`;
    let fullDestinationPath = `${filePath}/${fileName}${extension}`;
    
    let fs = require('fs');
    if(ServerAuth.tokenStore.verifyToken(username, token))
    {
        console.log('Classifieds CDN Upload', fileName, extension, __base64.substring(0, 45));
        shop._DirectoryExists(filePath, (doesExist: boolean) => {
            if(doesExist)
            {
                shop._WriteData(fullDestinationPath, __base64, (errorOccured: boolean) => {
                    if(errorOccured) res.status(400).send(`Unknown error ocurred while trying to write file to disk.`);
                    else res.status(200).send(finalURL);
                });
            }
            else
            {
                fs.mkdir(filePath, {recursive: true}, (err: any) => {
                    if(err)
                    {
                        res.status(400).send(`Error while trying to create files dir: ${err}`);
                        return;
                    }

                    shop._WriteData(fullDestinationPath, __base64, (errorOccured: boolean) => {
                        if(errorOccured) res.status(400).send(`Unknown error ocurred while trying to write file to disk.`);
                        else res.status(200).send(finalURL);
                    });
                });
            }
        });
    }
});

router.get('/availability', (req: Request, res: Response) => {
    res.status(200).send(String(ClassifiedsBackend.Available));
});

router.post('/delete_listing', (req: Request, res: Response) => {
    let token = req.body.token;
    let username = req.body.username;
    let listing_id = req.body.listing_id;

    if(ServerAuth.tokenStore.verifyToken(username, token))
    {
        ClassifiedsBackend.removeListing(listing_id, (result: any) => {
            res.status(200).send(result);
        });
    }
    else res.status(401).send('Unauthorized');
});

router.post('/get_listing', (req: Request, res: Response) => {
    let id = req.body.listing_id;
    console.log(req.body);
    
    if(id !== undefined)
    {
        if(id === 'all')
        {
            ClassifiedsBackend.getAllListings((err, value) => {
                if(err !== undefined || (value === undefined)) res.status(400).send('err: ' + err);
                else res.status(200).send(value);
            });
        }
        else
        {
            ClassifiedsBackend.getListingByID(id, (listing, err) => {
                if(err || listing === undefined)
                { 
                    console.log('Sending err....');
                    res.status(400).send(err);
                }
                else
                { 
                    console.log('Sending listing....');
                    res.status(200).send(listing);
                }
            });
        }
    }
    else res.status(400).send('Invalid Order ID: ' + id);
});

router.post('/edit_listing', (req: Request, res: Response) => {
    let id = oid(req.body.listing_id);
    let token = req.body.token;
    let username = req.body.username;
    let _item = <ClassifiedListing>req.body.item;
    console.log(req.body);

    if(ServerAuth.tokenStore.verifyToken(username, token))
    {
        DebugConsole.Writeq(`Updating classified with listing ID ${id}`);
        ClassifiedsBackend.updateListing(id, _item, (err, result) => {
            if(err || result === undefined) res.status(400).send(err || 'Something happened');
            else res.status(200).send(_item);
        });
    }
    else res.status(401).send('Unauthorized');
});

router.post('/add_classified', (req: Request, res: Response) => {
    let itemObject: ClassifiedListing = <ClassifiedListing>req.body.new_classified;
    let token = req.body.token;
    let username = req.body.username;

    if(ServerAuth.tokenStore.verifyToken(username, token))
    {
        if(itemObject === undefined)
        {
            res.status(400).send('Item you wanted to add was undefined or nil.');
            return;
        }

        ClassifiedsBackend.addNewListing(itemObject, (err: any, result: any) => {
            if(err)
            {
                DebugConsole.Write(DebugSeverity.ERROR, `Error adding new Classified: ${err}`);
                res.status(400).send(`Error adding new Classified: ${err}`);
            }
            else
            {
                if(result === undefined) res.status(400).send('Added result was undefined.');
                else res.status(200).send(result);
            }
        });
    }
    else res.status(401).send('Unauthorized');
});

export const Controller: Router = router;
export const Endpoint: string = '/classifieds';