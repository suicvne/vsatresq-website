var editModeEnabled = false;
selfserve.global.handleLoginExternally = true;

selfserve.compose = {editModeEnabled: false};


window.addEventListener("load", function(event) {
    $("#edit-area").hide();
    selfserve.auth.hideAuthorizedOnly();
    selfserve.auth.checkLoginCookie(function() {
        selfserve.auth.showAuthorizedOnly();
        selfserve.compose.changeMainForLogin();
        CKEDITOR.replace('editor');
    })
});

/**
 * Checks to make sure we aren't in edit mode.
 */
selfserve.compose.editMode = function editMode()
{
    var editId = parseInt(selfserve.auth.getUrlParameter('id'));
    if(editId)
    {
        // TODO: test URL
        $.get(`/blog/getpost?id=${editId}`, function (result, status) {
            var postObject = JSON.parse(result);
            $("#title_text").val(postObject.title);
            CKEDITOR.instances.editor.setData(unescape(decodeURI(postObject.message)));
        });
    }
    else
    {
        $("#editor-container").hide();
        $("#maincontentarea").html('Invalid post id to edit.');
    }
};

selfserve.compose.previewButtonClick = function previewButtonClick()
{
    if(selfserve.global.loggedIn === false)
        return;
    var win = window.open("", "Blog Post Preview", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=400,top="+(screen.height-400)+",left="+(screen.width-840));
    var previousHtml = "<img width='10%' height='auto' src='https://static.licdn.com/scds/common/u/images/themes/katy/ghosts/person/ghost_person_200x200_v1.png'>";
    previousHtml += `<span style='padding: 6px;'>${$("#title_text").val()} by ${selfserve.auth.getCookie('username')}</span>`;
    //win.document.body.innerHTML = previousHtml + $("#editor").val();
    win.document.body.innerHTML = previousHtml + CKEDITOR.instances.editor.getData();
};

selfserve.compose.submitButtonClick = function submitButtonClick()
{
    if(selfserve.global.loggedIn === false)
        return;
    var _username = selfserve.auth.getCookie('username'),
        _token = selfserve.auth.getCookie('token');
    var postJson = {
        title: $("#title_text").val(),
        message: CKEDITOR.instances.editor.getData(),
        author: _username,
        token: _token,
        id: undefined
    }

    var url = "/blog/post";
    if(selfserve.compose.editModeEnabled)
    {
        url = "/blog/editpost"
        postJson.id = parseInt(selfserve.auth.getUrlParameter('id'));
    }

    $.post(url, postJson, function(result, status, xhr)
    {
        console.log(status);
        if(status == 'success')
        {
            var newPostID = xhr.getResponseHeader('PostID');
            $("#editorcontainer").hide();
            if(editModeEnabled)
                $("#maincontentarea").html(`Post was edited successfully! <a href='../getpost?id=${newPostID}'>Check it out here!</a>`);
            else
                $("#maincontentarea").html(`Post was made successfully! <a href='../getpost?id=${newPostID}'>Check it out here!</a>`)
        }
    }).fail(function(err){alert(JSON.stringify(err));});
}

selfserve.compose.changeMainForLogin = function changeMainForLogin()
{
    $("#login-message").hide();
    $("#edit-area").show();
    $("#preview-button").show();
    $("#submit-button").show();
    if(selfserve.auth.getUrlParameter('edit'))
    {
        editModeEnabled = true;
        selfserve.compose.editMode();
    }
}
