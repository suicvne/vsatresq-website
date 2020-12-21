var loggedIn = false;

window.onload = function () {
    checkLoginCookie();
    $("#username").value = getCookie("username");
};


function checkToken(_username, _token) {
    $.post("../tokencheck", { username: _username, token: _token }, function (result, status, xhr) {
        console.log("token check status: " + status);
        if (status == "success") {
            loggedIn = true;
        }
        else {
            loggedIn = false;
        }
    });
    console.log("returning ");
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkLoginCookie() {
    var _username = getCookie("username");
    var _token = getCookie("token");
    if ($.trim(_username).length > 0) {
        if ($.trim(_token).length > 0) {
            $.post("../tokencheck", { username: _username, token: _token }, function (result, status, xhr) {
                if (status == "success") {
                    loggedIn = true;
                    $("form").hide();
                    var msg = $("<span></span>").text(`Logged in as ${getCookie("username")}`);
                    $("body").append(msg);
                }
                else {
                    loggedIn = false;
                }
            });
        }
        else
        {
            //not logged in.
            setCookie("username", "", 1);
            setCookie("token", "", 1);
        }
    }
    else {
        //not logged in.
        setCookie("username", "", 1);
        setCookie("token", "", 1);
    }
}

function logout() {
    setCookie("username", "", 1);
    setCookie("token", "", 1);
    window.location.reload(true);
}

function register(sender)
{
    var _email = document.registerform.email.value;
    var _username = document.registerform.username.value;
    var _password = document.registerform.password.value;

    if(_email.trim() && _username.trim() && _password.trim())
    {
        $.post('../registernode', { email: _email, username: _username, password: _password }, function (result, status, xhr) {
            if (status == "success") {
                $("form").hide();
                $("body").append(`Registered successfully. Please <a href=../login>login</a> with the username <strong>${_username}</strong>`);
            }
            else {
                $("body").append(`Couldn't register: ${result}`);
            }
        });
    }
}