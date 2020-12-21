
function addNewUser()
{
    var _username = prompt("Enter the new user's username.", "undefined");
    var _password = "password";
    var _email = "email@default.com";

    $.post("/TESTING/adduser", {username: _username, password: _password, email: _email}, function(result, status, xhr) {
        console.log(result);
    });
}

function removeUser()
{
    var __id = prompt("Enter the ID you want to delete.", "");
    $.post("/TESTING/removeuser", {_id: __id}, function(result, status, xhr) {
        updateList();
    });
}

function clearList()
{
    $("dt").remove();
    $("dd").remove();
}

function loginAs(username, password)
{
    console.log("logging in as ", username, password);
    selfserve.auth.loginAs(username, password, true, function(result, status, xhr) {
        if(status === "success")
        {
            console.log("Logged in!");
            console.log(selfserve.global.currentUser);
        }
        else
            console.log("Failed.");
    });
}


function updateList()
{
    clearList();

    $.get("/TESTING/userlist", function(result, status, xhr) {
        var asObj = JSON.parse(result);
        asObj.forEach(element => {
            var _user, _email, _signup, __id;
            _user = $("<dt></dt>").text(element.username);
            _email = $("<dd></dd>").text("- " + element.email);
            _signup = $("<dd></dd>").text("- " + element.signup_date);
            _password = $("<dd></dd>").text("- " + element.password);
            __id = $("<dd></dd>").text("- " + element._id);
            __loginAs = $(`<button type='button' onclick="loginAs('${element.username}', '${element.password}');"></button>`).text("Login as");

            $("#userdb_list").append(_user);
            $("#userdb_list").append(_email);
            $("#userdb_list").append(_signup);
            $("#userdb_list").append(__id);
            $("#userdb_list").append(_password);
            $("#userdb_list").append(__loginAs);
        });
    });
}

window.onload = function() {
    selfserve.auth.checkLoginCookie(function(success) {
        if(success)
        {
            $("#userdb_loggedInAsText").text(`Logged in as ${JSON.stringify(selfserve.global.currentUser)}`);
            updateList();
        }
        else
            console.log("Not logged in");
        
    });
}