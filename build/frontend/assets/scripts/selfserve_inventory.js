"use strict";
/**
 * About selfserve_inventory.js
 *
 * Created by Mike Santiago
 * Copyright (C) 2019
 *
 * DO NOT REDISTRIBUTE!
 */
/**
 * Function to create an InventoryItem object that will play nice with the database systems.
 * @param {*} params Object containing Inventory Item params.
 */
function InventoryItem(params) {
    this.images = new Array();
    if (params === undefined) {
        this.item_name = "Template";
        this.serial_number = "1N0TAR3A1N0M83R";
        this.description = "None yet.";
        this.images.push("/images/shop/empty_cart.png");
        this.notes = [
            {
                note_date: Date.now(),
                status: "Info",
                message: "Item created.",
                id: ranId().toString(),
                user: "none"
            }
        ];
    }
    else {
        this.item_name = params.item_name;
        this.serial_number = params.serial_number;
        this.description = params.description;
        if (params.images === undefined) {
            this.images.push("/images/shop/empty_cart.png");
        }
        else
            this.images = params.images;
        if (params.notes === undefined) {
            this.notes = [
                {
                    note_date: Date.now(),
                    status: "Info",
                    message: "Item created.",
                    user: "none"
                }
            ];
        }
        else
            this.notes = params.notes;
    }
    this.list_date = Date.now();
}
function ItemNote(date, status, message) {
    this.note_date = date;
    this.status = status;
    this.message = message;
    this.id = ranId().toString();
}
function ranId() {
    return Math.floor(Math.random() * 1000000000);
}
selfserve.inventory = {
    admin: {},
    db: [],
    /** subdb corresponds to internal subdatabasing for this application */
    subdb: undefined,
    initCompleteFn: () => { },
    isTestMode: false,
    initErrorFn: () => { }
};
/**
 * Sets the subdb for accessing inventory items.
 */
selfserve.inventory.setSubDB = (subdb, callback) => {
    selfserve.inventory.db = undefined;
    selfserve.inventory.subdb = subdb;
    selfserve.inventory.getAllItemsInSubdb(() => { if (callback)
        callback(); });
};
selfserve.inventory.getAllSubDBs = (callback) => {
    let payload = {
        token: selfserve.auth.getCookie('token'),
        username: selfserve.auth.getCookie('username')
    };
    $.get('/inventory/subdb_list', payload, (result, status, xhr) => {
        if (typeof result === 'string') {
            // No subdbs.
            console.log('No subdbs.');
            callback([]);
        }
        else {
            console.log('subdbs: ', result);
            callback(result);
        }
    }).fail((jqxhr, resultText) => {
        callback({ error: `Error while getting subdb list: ${jqxhr.responseText}` });
    });
};
selfserve.inventory.getAllItemsInSubdb = (callback) => {
    if (selfserve.inventory.isTestMode)
        callback(undefined);
    else {
        $.get('./inventory/all_items', { subdb: selfserve.inventory.subdb }, (result, status, xhr) => {
            selfserve.inventory.db = result;
            callback(result, status);
        }).fail((jqXhr, statusText) => {
            console.log(`get all items for subdb ${selfserve.inventory.subdb} failed: `, statusText);
        });
    }
};
selfserve.inventory.getItemByID = (id, callback) => {
    if (selfserve.inventory.isTestMode || selfserve.inventory.db === undefined || selfserve.inventory.db.length < 1) {
        console.error('test mode on or built in db undefined.');
        return undefined;
    }
    else {
        if ($.trim(id) && id !== undefined) {
            let selected_element = undefined;
            selfserve.inventory.db.forEach(element => {
                if (`${element._id}` === id) {
                    console.log('returning', element);
                    selected_element = element;
                    callback(element);
                    return;
                }
            });
            if (selected_element === undefined)
                callback(undefined);
            return;
        }
    }
};
selfserve.inventory.getItemByName = (name, callback) => {
    if (selfserve.inventory.db === undefined) {
        selfserve.inventory.getAllItemsInSubdb(() => selfserve.inventory.getItemByName(name, callback));
        return;
    }
    selfserve.shop.db.forEach((element, index) => {
        if (element.item_name === name) {
            callback(element);
            return;
        }
    });
    callback(undefined);
};
selfserve.inventory.admin.refreshInnerDb = (cb) => {
    selfserve.inventory.db = [];
    selfserve.inventory.getAllItemsInSubdb(() => { cb(); });
};
selfserve.inventory.admin.editItem = (item_id, item, callback) => {
    if (item.notes === undefined || item.notes.length === 0) {
        item.notes = ["__"];
    }
    if (item._id) {
        // So we don't accidentally send the item ID and try and make it change it.
        delete item._id;
    }
    let payload = {
        username: selfserve.global.currentUser.username,
        token: selfserve.auth.getCookie('token'),
        id: item_id,
        item: item,
        subdb: selfserve.inventory.subdb
    };
    console.log(`edit item payload`, payload);
    $.post('./inventory/edit_item', payload, (result, status, xhr) => {
        console.log(result, status);
        selfserve.inventory.admin.refreshInnerDb(() => callback(status, result));
    }).fail((msg) => {
        alert(`Error occurred while editing item\n\n${JSON.stringify(msg)}`);
        callback(msg, undefined);
    });
};
selfserve.inventory.admin.deleteItemFromDb = (inv_item, callback) => {
    if (inv_item) {
        let payload = {
            username: selfserve.global.currentUser.username,
            token: selfserve.auth.getCookie('token'),
            item_id: inv_item._id,
            subdb: selfserve.inventory.subdb,
        };
        $.post('/inventory/delete_item', payload, (result, status, xhr) => {
            callback(result);
        }).fail((jqXHR, textStatus) => {
            console.log(jqXHR.responseText);
            callback(jqXHR.responseText);
        });
    }
    else
        callback("Not passed a shop item. Passed ", inv_item);
};
selfserve.inventory.admin.addItemToDb = (inv_item, callback) => {
    if (selfserve.inventory.subdb === undefined) {
        console.log(`[INVENTORY] SubDB was undefined.`);
        return;
    }
    if (inv_item !== undefined) {
        if (inv_item.notes === undefined) {
            inv_item.notes = [];
        }
        $.post('/inventory/add_item', { new_item: inv_item, subdb: selfserve.inventory.subdb }, (result, status, xhr) => {
            console.log(`added item to subdb ${selfserve.inventory.subdb}`, result);
            if (callback) {
                callback(result);
            }
        }).fail((msg) => {
            console.log(`failed to add ${inv_item.item_name}: `, msg);
            if (callback)
                callback(`failed to add ${inv_item.item_name}: `, msg);
        });
    }
};
selfserve.inventory.checkAvailability = (callback) => {
    $.get('/inventory/availability', (result, status, xhr) => {
        console.log("Inv Availability: ", result, status);
        callback(result);
    }).fail((msg) => { callback(undefined, msg); });
};
selfserve.inventory.checkAvailability((isAvailable) => {
    console.log("Selfserve Inventory availability check! :)");
    let asBool = (isAvailable == 'true');
    selfserve.auth.onLogin.push((result) => {
        try {
            if (__DISABLE_AUTH) {
                console.log('Temporarily disabling auth for this page.');
                selfserve.initCompleteFn();
                return;
            }
        }
        catch (e) { }
        if (result !== undefined) {
            selfserve.inventory.initCompleteFn();
        }
        else {
            selfserve.inventory.initErrorFn('You are unauthorized to view this page.');
        }
    });
    // selfserve.global.onLoad.push(() => {
    //     if (asBool) {
    //         selfserve.inventory.initCompleteFn();
    //     }
    //     else {
    //         console.log('unable to reach shop backend\npopulating with test items, setting test flag.');
    //         selfserve.inventory.initErrorFn('unable to reach shop backend\npopulating with test items, setting test flag.');
    //     }
    // });
});
//# sourceMappingURL=selfserve_inventory.js.map