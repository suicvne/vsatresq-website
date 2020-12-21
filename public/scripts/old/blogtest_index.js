___allowedToTest = false;
selfserve.global.handleLoginExternally = true; // Prevents multiple requests

function fillRecentPosts() {
    $.get("./blog/getpost", (result, status, xhr) => {
        if(status === "success") // TODO
        {
            let parsedObject = JSON.parse(result);
            if(parsedObject.length > 0)
            {
                parsedObject.forEach(element => {
                     var _title, _previewText, _author, _link;
                     _title = $("<dt></dt>").text(element.title);
                     //_previewText = $("<dd></dd>").text(decodeURI(element.message));
                     _author = $("<dd></dd>").text(element.author);
                     _link = $("<dd></dd>").html(`<a href="./blog/viewpost.html?id=${element._id}">Link</a>`)

                     $("#blogtest_postlist").append(_title);
                     $("#blogtest_postlist").append(_author);
                     $("#blogtest_postlist").append(_link);
                });
            }
            else
                $("#blogtest_postlist").append($("<dt></dt>").text("No posts!"));
        }
    });
}

function redirectToCompose() {
    window.location.assign("./blog/compose");
}

function clearList() {
    $("dd").remove();
    $("dt").remove();
}

function refreshView() {
    clearList();
    fillRecentPosts();
}

function tweak() {
    if(___allowedToTest)
    {
        $("h3").text(`Logged in as ${selfserve.global.currentUser.username}`);
        refreshView();
    }
    else
    {
        $("h3").text("Not allowed!! Login first.");
        $("button").hide();
    }
}

window.onload = () => {
    selfserve.auth.checkLoginCookie(function(success) {
        if(success) {
            ___allowedToTest = true;
        }
        tweak();
    });
};