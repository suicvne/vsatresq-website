"use strict";
const populateOptionsWithSubDBs = (callback) => {
    selfserve.inventory.getAllSubDBs((subdb_list) => {
        console.log(subdb_list);
        if (subdb_list.error) {
            console.log("Has error.");
            unauthorized(subdb_list.error);
            return;
        }
        else {
            console.log(`typeof result: ${typeof subdb_list}`);
            if (subdb_list.length > 0) {
                subdb_list.forEach((element) => {
                    $("#subdb_select").append($('<option>', { value: element.name, text: element.name }));
                });
            }
            else {
                if (selfserve.global.currentUser !== undefined && selfserve.global.currentUser.power === 1)
                    $("#subdb_selection").prepend(`<strong>Please create a subdatabase.</strong><br>`);
                $("#db_container").hide();
            }
            if (selfserve.global.currentUser.power === 1) {
                $("#subdb_select").append($('<option>', { value: 'undefined', text: '=========' }));
                $("#subdb_select").append($('<option>', { value: 'new_subdb', text: 'Create new subdatabase' }));
            }
        }
        callback();
    });
};
const deleteItemID = (item_id) => {
    selfserve.inventory.getItemByID(item_id, (inv_item) => {
        if (confirm('Are you sure you want to delete this item from the database?')) {
            selfserve.inventory.admin.deleteItemFromDb(inv_item, (result) => {
                console.log('deletion result: ' + result);
                populateItemsFromSubdb();
            });
        }
    });
};
const grabFirstImg = (images) => {
    if (images !== undefined && images.length > 0) {
        return `<img class=item_image src=${images[0]}&res=4>`;
    }
    else
        return `No images.`;
};
var selfserve_inventory_editing = false;
const showEditUI = (item_id) => {
    if (!item_id.trim()) {
        console.error("Can't edit: invalid item ID.");
        return;
    }
    selfserve.inventory.getItemByID(item_id, (item) => {
        if (item !== undefined) {
            selfserve_inventory_editing = true;
            console.log('Editing item with id ' + item_id);
            preoccupyNewItemOverlay(item);
            showNewItemOverlay();
        }
        else {
            console.error("Can't edit: invalid item ID or item doesn't exist.");
            return;
        }
    });
};
const preoccupyNewItemOverlay = (inv_item) => {
    $("#item_editor_container").data('edit_id', inv_item._id);
    $("#new_item_overlay_header").html(`Editing ${inv_item.item_name}`);
    $("#new_item_id").html($("#item_editor_container").data('edit_id'));
    $("#new_item_id").show();
    $("#new_item_name").val(inv_item.item_name);
    $("#new_item_serial").val(inv_item.serial_number);
    $("#new_item_description").val(inv_item.description);
    $("#add_new_item_button").val('Edit');
    $("#upload_preview").html('');
    if (inv_item.images !== undefined) {
        inv_item.images.forEach((image_url, index) => {
            let preview = createImgPreview(image_url);
            $("#upload_preview").append(preview);
        });
    }
};
const resetNewItemOverlay = () => {
    $("#item_editor_container").data('edit_id', 'undefined');
    $("#new_item_overlay_header").html(`New Item`);
    $("#new_item_id").hide();
    $("#new_item_id").val('');
    $("#new_item_name").val('');
    $("#new_item_serial").val('');
    $("#new_item_description").val('');
    $("#upload_preview").html('');
    $("#add_new_item_button").val('Add Item');
    selfserve_inventory_editing = false;
};
const appendInventoryItem = (inv_item) => {
    if (inv_item === undefined) {
        $("#datatable tbody").first().append(`<tr>` +
            `<td>No</td>` +
            `<td>items</td>` +
            `<td>in the</td>` +
            `<td>subdb.</td>` +
            `</tr>`);
        return;
    }
    console.log(`appending ${inv_item.item_name}`);
    let editButton = ``;
    if (inv_item._id && selfserve.global.currentUser.power === 1) {
        editButton = `<td><a href='javascript:void(0);' onclick=\"showEditUI('${inv_item._id}');\"><img src='/images/icons/editw.png'></a> / <a href='javascript:void(0);' onclick=\"deleteItemID('${inv_item._id}')\"><img src='/images/icons/deletew.png'></a></td>`;
    }
    $("#datatable tbody").first().append(`<tr>` +
        `<td>${grabFirstImg(inv_item.images)}</td>` +
        `<td><a href='/inventory/viewitem.html?id=${inv_item._id}&subdb=${selfserve.inventory.subdb}'>${inv_item.item_name}</a></td>` +
        `<td class='hide_overflow_small_display'>${inv_item.serial_number}</td>` +
        `<td class='hide_small_display'>${inv_item.description}</td>` +
        editButton +
        `</tr>`);
};
const clearTable = () => {
    $("#datatable tbody").first().empty().append("<tr>" +
        "<th>Image</th>" +
        "<th>Item</th>" +
        "<th>Serial / Add Date</th>" +
        "<th class='hide_small_display'>Description</th>" +
        "</tr>");
};
const populateItemsFromSubdb = (callback) => {
    console.log(`Populating table with items from subdb ${selfserve.inventory.subdb}`);
    clearTable();
    selfserve.inventory.getAllItemsInSubdb((result, status) => {
        if (status === "success") {
            console.log(result);
            if (result.length > 0) {
                result.forEach(element => {
                    appendInventoryItem(element);
                });
            }
            else {
                appendInventoryItem(undefined);
            }
        }
        else {
            $("#datatable tbody").first().append(`<tr>` +
                `<td>ERROR</td>` +
                `<td>Something bad happened.</td>` +
                `<td>Tell Mike asap.</td>` +
                `<td></td>` +
                `</tr>`);
        }
        if (callback)
            callback();
    });
};
const subdbSelectionChanged = (specified_subdb) => {
    if (specified_subdb === undefined || specified_subdb === "undefined") {
        console.log('No subdb selected.');
        $("#db_container").hide();
    }
    else if (specified_subdb === "new_subdb") {
        console.log('Show new subdb form.');
        $("#new_subdb_overlay").show();
    }
    else {
        console.log(`Changing subdb from ${selfserve.inventory.subdb} to ${specified_subdb}`);
        selfserve.inventory.subdb = specified_subdb;
        populateItemsFromSubdb();
        $("#db_container").show();
    }
};
const unauthorized = (msg) => {
    $("#inventory_container").hide();
    $(".custom_nav").hide();
    $(".main_content_area").append(`<h1>Error while contacting the inventory server</h1><br><br><p>${msg}</p>`);
};
const handleFiles = (files) => {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
            continue;
        }
        let imgContainer = createImgPreview(undefined, file);
        let img = $(imgContainer).find('img');
        console.log(img);
        let preview = document.getElementById("upload_preview");
        preview.appendChild(imgContainer);
        const reader = new FileReader();
        reader.onload = (function (aImg) { return function (e) { aImg.attr('src', e.target.result); }; })(img);
        reader.readAsDataURL(file);
    }
};
const createImgPreview = (url, file = undefined) => {
    const imgContainer = document.createElement("div");
    imgContainer.classList.add('item_image_container');
    const overlay = document.createElement("div");
    overlay.classList.add('item_image_overlay');
    /*overlay.appendChild('X :)');*/
    const img = document.createElement("img");
    img.classList.add("obj");
    img.classList.add("item_image_cp");
    if (file !== undefined)
        img.file = file;
    else
        img.src = url;
    imgContainer.addEventListener('click', (event) => {
        var trgt = event.target;
        trgt.parentNode.remove();
    });
    imgContainer.appendChild(img);
    imgContainer.appendChild(overlay);
    return imgContainer;
};
const submitNewItem = () => {
    console.log(`submitting new item to subdb ${selfserve.inventory.subdb}`);
    let problems = false;
    let item_name = $("#new_item_name").val();
    if (!item_name.trim()) {
        $("#new_item_name").css('border-color', 'red');
        problems = true;
    }
    let serial = $("#new_item_serial").val();
    if (!serial.trim()) {
        $("#new_item_serial").css('border-color', 'red');
        problems = true;
    }
    if (problems)
        return;
    let editing = ($("#item_editor_container").data('edit_id') !== 'undefined');
    let id = $("#item_editor_container").data('edit_id');
    uploadImages({ editing: editing, item_id: id });
};
const uploadBase64 = (img, base64data, extension, cb) => {
    $.post("inventory/upload_item_image", { item_image: base64data, extension: extension }, (result) => {
        $(img).parent().append(`<a href='${result}'></a>`);
        cb(result);
    });
};
const MakeInventoryItem = (imageURLs) => {
    let _name = $("#new_item_name").val();
    let _description = $("#new_item_description").val();
    let _serial = $("#new_item_serial").val();
    let params = {
        images: imageURLs,
        item_name: _name,
        description: _description,
        serial_number: _serial
    };
    return new InventoryItem(params);
};
const uploadImages = (params) => {
    const imgs = document.querySelectorAll(".obj");
    let uploadQueue = [];
    let existingImages = [];
    for (let i = 0; i < imgs.length; i++) {
        if (imgs[i].file === undefined) {
            existingImages.push(selfserve.global.RemoveBaseURL(imgs[i].src));
            continue;
        }
        let fileName = imgs[i].file.name;
        let extension = fileName.substring(fileName.indexOf('.'));
        let base64 = imgs[i].src;
        uploadQueue.push({
            fileName: fileName,
            extension: extension,
            data: base64,
            obj: imgs[i]
        });
    }
    let promiseTest = new Promise((resolve, reject) => {
        console.log("begin promise");
        var theURLs = existingImages;
        let counter = 0;
        let isComplete = false;
        if (uploadQueue.length === 0)
            resolve(existingImages);
        for (let i = 0; i < uploadQueue.length; i++) {
            console.log("uploading ", counter);
            var newUpload = uploadQueue[i];
            uploadBase64(newUpload.obj, newUpload.data, newUpload.extension, (returnedURL) => {
                console.log("Upload done. Success: ", (returnedURL !== undefined));
                if (returnedURL)
                    theURLs.push(returnedURL);
                counter++;
                if (counter == uploadQueue.length) {
                    console.log("maybe done, let's check");
                    console.log(`${theURLs.length} === ${uploadQueue.length}`);
                    if (theURLs.length >= uploadQueue.length) {
                        resolve(theURLs);
                    }
                    else
                        reject(Error("Someting is vewy wrong"));
                }
            });
        }
        console.log('last line of promise');
    });
    promiseTest.then((resultingURLS) => {
        let newInvItem = MakeInventoryItem(resultingURLS);
        if (newInvItem) {
            if (params.editing) {
                selfserve.inventory.admin.editItem(params.item_id, newInvItem, (status, result) => {
                    if (result === undefined)
                        alert('Error editing: ', status);
                    else {
                        alert('Edited successfully');
                        hideNewItemOverlay();
                        populateItemsFromSubdb();
                    }
                });
            }
            else {
                selfserve.inventory.admin.addItemToDb(newInvItem, (result) => {
                    if (result === undefined || result === typeof String) {
                        alert(`Error adding item: \n\n${result}`);
                        // window.location.reload();
                    }
                    else {
                        alert(`Added ${newInvItem.item_name} to database.`);
                        hideNewItemOverlay();
                        populateItemsFromSubdb();
                    }
                });
            }
        }
        else
            console.log("Couldn't make new item? :(");
    }, (error) => {
        console.log('promise error:', error);
    });
};
const hideNewItemOverlay = () => {
    $("#new_item_overlay").hide();
};
const showNewItemOverlay = () => {
    if (selfserve.global.currentUser)
        $("#new_item_overlay").show();
    reinitAutocomplete();
};
const hideNewSubdbOverlay = () => {
    $("#new_subdb_overlay").hide();
};
const addNewSubDbToList = () => {
    $("#subdb_select").prepend($('<option>', { value: selfserve.inventory.subdb, text: selfserve.inventory.subdb }));
    $("#subdb_select").val(selfserve.inventory.subdb);
    // $("#subdb_select").change();
    $("#db_container").show();
};
const submitNewSubdb = (new_subdb_name) => {
    console.log(`Setting subdb to ${new_subdb_name} and allowing user to add new items now.`);
    selfserve.inventory.setSubDB(new_subdb_name);
    window.history.pushState(new_subdb_name, `${new_subdb_name} Inventory - VSAT ResQ`, `/inventory/?subdb=${new_subdb_name}`);
    hideNewSubdbOverlay();
    addNewSubDbToList();
    subdbSelectionChanged(new_subdb_name);
};
//# sourceMappingURL=inventory_ui.js.map