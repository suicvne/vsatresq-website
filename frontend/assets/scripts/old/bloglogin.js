// TODO: integrate this script with auth.js


var userPower = 0;
selfserve.global.handleLoginExternally = true;

window.addEventListener("load",function(event) {
    hideAuthorizedOnly();
    checkLoginCookie(function() {
        changeForLogin();       
    });
}, false);

function changeForLogin()
{
    $("form").hide();
    var msg = $("<span></span>").text = "Logged in successfully.";
    $("#maincontentarea").append(msg);
    showAuthorizedOnly();
}



function doLogin(sender) {
    var _username = document.loginform.username.value;
    var _password = document.loginform.password.value;
    var remember = $('#remember').prop('checked');

    if ($.trim(_username).length > 0 && $.trim(_password).length > 0) {
        $.post("./blog/loginnode", { username: _username, password: _password }, function (result, status, xhr) {
            var token = xhr.getResponseHeader('Authorization');

            if (status == "success") {
                changeForLogin();
                if(remember == true)
                {
                    setCookie("username", _username, 30);
                    setCookie("token", token, 30);
                }
                $("#maincontentarea").append(" Redirecting...");
                window.setTimeout(sendhome, 2000);
            }
            else {
                $("span").style += "color: red;";
            }
        });
    }
}

function populatePostsByUser()
{
    var _username = getCookie('username');
    $.get(`http://vsatresq.com/blog/getpost?byAuthor=${_username}`, function(result, status)
    {
        var resultingPosts = JSON.parse(result);
        resultingPosts.posts.sort(function(obja, objb){
            var datea = new Date(obja.date);
            var dateb = new Date(objb.date);
            return dateb - datea;
        });
        var postsUL = $('<ul></ul>').attr('id', 'posts-list');
        $("#maincontentarea").append(postsUL);
        resultingPosts.posts.forEach(element => {
            var parsedDate = new Date(element.date);
            var dateStr = `${parsedDate.getMinutes() == 0 ? parsedDate.toDateString() : parsedDate.toUTCString()}`;

            $("#posts-list").append(`<li style="list-style=none"><a href='../viewpost?id=${element.id}'>${element.title}</a><br>${dateStr}</li><hr>`);
        });
        

    }).fail(function(err){$("#maincontentarea").append(err)});
}

function usercheck() {
    var _username = getCookie("username");
    var _token = getCookie("token");
    $.post('http://vsatresq.com/userlist', { username: _username, token: _token }, function (result,status,xhr)
    {
        if(status == "success")
        {
            $("#maincontentarea").append(result);
        }
        else
        {
            $("#maincontentarea").append("Error: " + result);
        }
    });
}

function logout() {
    setCookie("username", "", 1);
    setCookie("token", "", 1);
    window.location.reload(true);
}

function sendhome() {
    window.location.replace("../../");
}

function checkPower() {
    var _username = getCookie("username");
    var _token = getCookie("token");
    $.post('../powercheck', {username: _username, token: _token}, function(result,status,xhr)
    {
        var power = xhr.getResponseHeader('Power');
        userPower = power;
        if(userPower == 1)
            showAdminContent();
    });
}