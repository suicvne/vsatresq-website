// Lol I had to make another file shit was getting too cluttered in the general index area.


// Right... so this is all about being able to use existing images when inputting item information.

const getExistingImages = (callback) => {
    $.get('/inventory/existing_images', (result, status, xhr) => {
        if(result.existing_images && result.existing_images.length > 0)
        {
            callback(result);
        }
        else
        {
            callback({error: 'No existing images.'});
        }
    }).fail((jqxhr, resultText) => {
        console.error(`could not get existing images list: ${jqxhr.responseText}`)
        callback({error: jqxhr.responseText});
    });
};

const showExistingImagesOverlay = () => {
    populateExistingImagesList();

    $("#existing_images_overlay").show();
};

const hideExistingImagesOverlay = () => {
    $("#existing_images_overlay").hide();
}

const clearExistingImagesList = () => {
    $("#existing_images_select").html("");
};

const populateExistingImagesList = () => {
    clearExistingImagesList();
    getExistingImages((resulting_obj) => {
        if(resulting_obj.error)
        {
            console.error(resulting_obj.error);
            return;
        }
        else
        {
            resulting_obj.existing_images.forEach(element => {
                let new_option = $('<option>', {value: element, text: element});
                new_option.attr('data-img-src', element);

                $("#existing_images_select").append(new_option);    
            });

            $("#existing_images_select").imagepicker();
        }
    });
    
};

const confirmExistingImagesSelection = () => {
    console.log($("#existing_images_select").val());

    $("#existing_images_select").val().forEach(url => {
        let preview = createImgPreview(url);
        $("#upload_preview").append(preview);
    });

    hideExistingImagesOverlay();
};