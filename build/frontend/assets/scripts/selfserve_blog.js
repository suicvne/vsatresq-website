"use strict";
/**
 * About blog_helper.js
 *
 * blog_helper.js includes some helper functions for the blog system.
 *
 * Created by Mike Santiago
 * Copyright (C) 2019
 *
 * DO NOT REDISTRIBUTE!
 */
/**
 * TODO: is this necessary for EVERYTHING blogging related?
 */
selfserve.global.handleLoginExternally = true;
selfserve.blog = {};
selfserve.compose = {
    editModeEnabled: false,
    composer_elements: {
        editor: "editor",
        title: "#ss_title",
        preview_button: "#ss_preview_button",
        submit_button: "#ss_submit_button"
    },
    initCompleteFn: () => { }
};
selfserve.compose.init = () => {
    if (selfserve.auth.getUrlParameter('edit')) {
        console.log('edit mode?: ' + selfserve.auth.getUrlParameter('edit'));
        var editId = selfserve.auth.getUrlParameter('id');
        if (!editId)
            return;
        CKEDITOR.replace('editor');
        selfserve.compose.editModeEnabled = true;
        $.get(`/blog/getpost?id=${editId}`, (result, status, xhr) => {
            var postObj = JSON.parse(result);
            $(selfserve.compose.composer_elements.title).val(postObj.title);
            selfserve.compose.setEditorText(postObj.message);
            selfserve.compose.initCompleteFn();
        });
    }
    else {
        CKEDITOR.replace('editor');
    }
};
selfserve.compose.setEditorText = (text) => {
    CKEDITOR.instances.ss_editor.setData(unescape(decodeURI(text)));
};
selfserve.compose.submitButtonClick = (callback) => {
    if (selfserve.global.loggedIn) {
        var _user = selfserve.global.currentUser.username;
        var _token = selfserve.auth.getCookie('token');
        var postJson = {
            title: $(selfserve.compose.composer_elements.title).val(),
            message: CKEDITOR.instances.ss_editor.getData(),
            author: _user,
            token: _token,
        };
        var url = "/blog/post";
        if (selfserve.compose.editModeEnabled) {
            url = "/blog/editpost";
            postJson._id = selfserve.auth.getUrlParameter('id');
        }
        $.post(url, postJson, (result, status, xhr) => {
            if (status === 'success') {
                console.log(xhr);
                if (!postJson._id) {
                    var newPostID = xhr.getResponseHeader('PostID');
                    postJson._id = newPostID;
                }
                if (postJson._id) {
                    console.log("post id: " + postJson._id);
                    callback("success", postJson);
                }
                else {
                    var temp = JSON.parse(result);
                    console.log('THE post ID: ' + temp[0]._id);
                    callback("success", temp[0]);
                }
            }
            else {
                console.log("error?", xhr.responseText);
                callback(result, status);
            }
        });
    }
};
selfserve.compose.previewButtonClick = () => {
    if (selfserve.global.loggedIn) {
        var win = window.open("", "Blog Post Preview", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=400,top=" + (screen.height - 400) + ",left=" + (screen.width - 840));
        var previousHtml = "<img width='10%' height='auto' src='https://static.licdn.com/scds/common/u/images/themes/katy/ghosts/person/ghost_person_200x200_v1.png'>";
        previousHtml += `<span style='padding: 6px;'>${$(selfserve.compose.composer_elements.title).val()} by ${selfserve.auth.getCookie('username')}</span>`;
        //win.document.body.innerHTML = previousHtml + $("#editor").val();
        win.document.body.innerHTML = previousHtml + CKEDITOR.instances.ss_editor.getData();
    }
};
//# sourceMappingURL=selfserve_blog.js.map