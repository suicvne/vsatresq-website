"use strict";
/**
 * About selfserve.js
 *
 * selfserve.js is the basis of the selfserve in browser API. Defines the most important functions
 * for authentication.
 *
 * Created by Mike Santiago
 * Copyright (C) 2018
 *
 * DO NOT REDISTRIBUTE!
 */
/**
 * Creates the initial global variable.
 */
var selfserve = {
    global: {
        loggedIn: false,
        handleLoginExternally: false,
        version: "1.6.1-vsat",
        currentUser: undefined,
        currentUserPower: -1,
        /**An array of functions to execute once the Selfserve objects have been initialized. */
        onLoad: [],
        urlValid: (url) => {
            // TODO: does this work with relative/local ?? 
            let regex = /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/;
            return regex.test(url);
        },
        RemoveBaseURL: (url) => {
            /*
             * Replace base URL in given string, if it exists, and return the result.
             *
             * e.g. "http://localhost:8000/api/v1/blah/" becomes "/api/v1/blah/"
             *      "/api/v1/blah/" stays "/api/v1/blah/"
             */
            var baseUrlPattern = /^https?:\/\/[a-z\:0-9.]+/;
            var result = "";
            var match = baseUrlPattern.exec(url);
            if (match != null) {
                result = match[0];
            }
            if (result.length > 0) {
                url = url.replace(result, "");
            }
            return url;
        }
    },
    auth: {
        /**@deprecated*/
        onLogin: [],
        authSupported: true
        //#region Functions
        /*
        checkLoginCookie : Function,
        hideAuthorizedOnly : Function,
        showAuthorizedOnly : Function,
        getCookie : Function,
        setCookie : Function,
        checkPower : Function,
        getOwnPower: Function,
        getUrlParameter: Function,
        loginAs: Function,
        registerAccount: Function,
        logout: Function
        */
        //#endregion Functions
    }
};
window.addEventListener("load", (event) => {
    $.get("/blog/tokencheck", "", (data, status, xhr) => {
        selfserve.auth.authSupported = (data === "available");
    }).fail(() => {
        selfserve.auth.authSupported = false;
    }).always(() => {
        selfserve_phasetwo();
    });
});
selfserve_phasetwo = () => {
    $('img.svg').each(() => {
        var $img = $(this);
        var imgID = $img.attr('id');
        var imgClass = $img.attr('class');
        var imgURL = $img.attr('src');
        $.get(imgURL, function (data) {
            // Get the SVG tag, ignore the rest
            var $svg = $(data).find('svg');
            // Add replaced image's ID to the new SVG
            if (typeof imgID !== 'undefined') {
                $svg = $svg.attr('id', imgID);
            }
            // Add replaced image's classes to the new SVG
            if (typeof imgClass !== 'undefined') {
                $svg = $svg.attr('class', imgClass + ' replaced-svg');
            }
            // Remove any invalid XML tags as per http://validator.w3.org
            $svg = $svg.removeAttr('xmlns:a');
            // Check if the viewport is set, if the viewport is not set the SVG wont't scale.
            if (!$svg.attr('viewBox') && $svg.attr('height') && $svg.attr('width')) {
                $svg.attr('viewBox', '0 0 ' + $svg.attr('height') + ' ' + $svg.attr('width'));
            }
            // Replace image with new SVG
            $img.replaceWith($svg);
        }, 'xml');
    });
    if (selfserve.auth.authSupported) {
        selfserve.auth.checkLoginCookie((result) => {
            if (result) {
                if (selfserve.auth.onLogin !== undefined) {
                    try {
                        $("#current_user_message").show();
                    }
                    catch (_a) { }
                    if (selfserve.auth.onLogin.constructor === Array) // Multiple on login functions
                     {
                        console.log("[DEBUG] Multiple onLogin(result) (login succeeded) functions.");
                        selfserve.auth.onLogin.forEach(onLoginFunc => { onLoginFunc(result); });
                    }
                    else
                        selfserve.auth.onLogin(result);
                }
            }
            else {
                if (selfserve.auth.onLogin.constructor === Array) // Multiple on login functions
                 {
                    console.log("[DEBUG] Multiple onLogin(undefined) (login failed/no token) functions.");
                    selfserve.auth.onLogin.forEach(onLoginFunc => { onLoginFunc(undefined); });
                }
                else
                    selfserve.auth.onLogin(undefined);
            }
        });
    }
    else {
        alert();
    }
    selfserve.global.onLoad.forEach(onLoadFunction => { onLoadFunction(); });
};
//#region Selfserve Authentication
/**
 * Disables any elements with the class authorized-only.
 *
 * Hides any elements with the class authorized-only-hide
 */
selfserve.auth.hideAuthorizedOnly = function hideAuthorizedOnly() {
    $(".authorized-only").each(function (i, element) {
        $(element).addClass("disabled");
        $(element).css({ "pointer-events": "none" });
    });
    $(".authorized-only-hide").each(function (i, element) {
        $(element).hide();
        $(element).addClass("disabled");
    });
};
/**
 * Does the opposite of hideAuthorizedOnly.
 *
 * Enables any elements with the CSS class .authorized-only.
 * Shows any elements with the CSS class .authorized-only-hide
 */
selfserve.auth.showAuthorizedOnly = function showAuthorizedOnly() {
    $(".authorized-only").each(element => {
        $(element).removeClass("disabled");
        $(element).css({ "pointer-events": "all" });
    });
    $(".authorized-only-hide").each(element => {
        $(element).show();
        $(element).removeClass("disabled");
    });
};
/**
 * @deprecated
 * Modifies header objects with the following IDs
 *
 * #login-text - Changes to the word 'user' to indicate it's been logged in.
 * #nav-ucp - Changes the text to indicate you can change settings for your user.
 * #nav-login - Changes the text to indicate you're able to logout.
 */
selfserve.auth.changeHeaderForLogin = function changeHeaderForLogin() {
    var _username = selfserve.auth.getCookie("username");
    if (_username.trim() && _username != undefined) {
        $("#login-text").html("User");
        $("#nav-ucp").html(`Settings for ${selfserve.auth.getCookie('username')}`);
        $("#nav-login").html('Logout');
    }
};
const setCurrentUserObject = (ob) => {
    //let returnValue = JSON.parse(ob);
    if (ob !== undefined) {
        //ob.password = null;
        if (typeof ob === 'string')
            selfserve.global.currentUser = JSON.parse(ob);
        else
            selfserve.global.currentUser = ob;
    }
};
selfserve.auth.editUserInformation = (password, user_changes, callback) => {
    let payload = {
        password: password,
        _id: selfserve.global.currentUser._id,
        changes: user_changes
    };
    $.post('./edit_user', payload, (result, status, xhr) => {
        console.log(result, status);
        callback(result, status);
    }).fail((msg) => {
        console.log('error: ', msg);
        callback(result, status);
    });
};
/**
 * Checks the login cookie to see if you've already been logged in and that it hasn't been expired.
 * @param {*} callback - Action to perform once the login cookie has been checked.
 */
selfserve.auth.checkLoginCookie = function checkLoginCookie(callback) {
    var _username = selfserve.auth.getCookie('username');
    var _token = selfserve.auth.getCookie('token');
    if ($.trim(_username) && $.trim(_token)) {
        $.post("/blog/tokencheck", { username: _username, token: _token }, function (result, status, xhr) {
            if (status === "success") {
                console.log("User: ", result);
                setCurrentUserObject(result);
                selfserve.global.loggedIn = true;
                // selfserve.global.currentUser.username, (USED to be an arg, not anymore)
                selfserve.auth.checkPower((pwrLevel) => selfserve.global.currentUserPower = pwrLevel); // TODO: need to make the power level resolvable without needing *TWO* separate network calls. That's ridiculous.
            }
            if (callback)
                callback(selfserve.global.loggedIn);
        }).fail(() => {
            selfserve.global.loggedIn = false;
            selfserve.auth.setCookie("username", "", 1);
            selfserve.auth.setCookie("token", "", 1);
            if (callback)
                callback(undefined);
        });
    }
    else {
        if (callback)
            callback(false);
        selfserve.auth.setCookie("username", "", 1);
        selfserve.auth.setCookie("token", "", 1);
    }
};
/**
 * Helper function designed to read JS cookies.
 */
selfserve.auth.getCookie = function getCookie(cname) {
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
};
/**
 * Helper function to write JS cookies.
 */
selfserve.auth.setCookie = function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
};
// selfserve.auth.clearCookie = function clearCookie(cname) {
// selfserve.auth.setCookie(cname, '', -50);
// };
/**
selfserve.auth.checkSelfPower = function checkSelfPower() {
    var _username = selfserve.auth.getCookie("username");
    var _token = selfserve.auth.getCookie("token");
    $.post('/blog/powercheck', { username: _username, token: _token }, function (result, status, xhr) {
        var power = xhr.getResponseHeader('Power');
        userPower = power;
        if (userPower == 1)
            showAdminContent();
    });
};
*/
/**
 * Helper function to check the power of the user specified.
 * @param _username The username of the user you want to check permissions for.
 * @param callback The callback to execute when the user's power value has been fully retrieved and read from the server.
 */
selfserve.auth.checkPower = function checkPower(callback) {
    if (selfserve.auth.authSupported) {
        var _username = selfserve.auth.getCookie("username");
        var _token = selfserve.auth.getCookie("token");
        $.post('/blog/powercheck', { username: _username, token: _token }, function (result, status, xhr) {
            var power = xhr.getResponseHeader('Power');
            if (callback)
                callback(power);
        }).fail(() => {
            callback('nothing');
        });
    }
};
/**
 * Retrieves the current power value of the user that is currently logged in.
 * @param callback The function to execute when the value is retrieved.
 */
selfserve.auth.getOwnPower = (callback) => selfserve.auth.checkPower(selfserve.global.currentUser.username, callback);
/**
 * Helper function to retrieve the value of URL parameters on the current URL.
 *
 * @param sParam The parameter to search for
 * @returns Undefined if a value is not found, or the parameters value.
 */
selfserve.auth.getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)), sURLVariables = sPageURL.split('&'), sParameterName, i;
    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
    return undefined;
};
/**
 * Try to login as a user given a username and password.
 *
 * Side Effects:
 *  if _remember is true, the function will also set the username and token cookies assuming that login was successful.
 *
 * @param _username
 * @param _password
 * @param _remember (boolean)
 * @param callback
 */
selfserve.auth.loginAs = function loginAs(_username, _password, _remember, callback) {
    if ($.trim(_username) && $.trim(_password)) {
        $.post("./blog/loginnode", { username: _username, password: _password }, function (result, status, xhr) {
            var _token = xhr.getResponseHeader('Authorization');
            if (status == "success") {
                // TODO: strip password parameter server side. Like ASAP.
                result.password = "";
                setCurrentUserObject(result);
                if (_remember === true) {
                    selfserve.auth.setCookie("username", _username, 30);
                    selfserve.auth.setCookie("token", _token, 30);
                }
                if (callback)
                    callback({ status: status, result: result });
            }
            else // Err
             {
                if (callback)
                    callback({ err: result, status: status });
            }
        }).fail((jqXHR, textStatus, errorThrown) => {
            if (callback)
                callback({ err: jqXHR.responseText, status: textStatus });
        });
    }
};
/**
 * Registers an account given an email, username, and password.
 */
selfserve.auth.registerAccount = function registerAccount(_email, _username, _password, callback) {
    if ($.trim(_username) && $.trim(_email) && $.trim(_password)) {
        $.post("./blog/registernode", { username: _username, password: _password, email: _email }, (result, status, xhr) => {
            if (status === "success")
                console.log('registration successful.');
            callback(result, status, xhr);
        }).fail((jqXHR, textStatus, errThrown) => {
            console.log('uh oh: ', textStatus, errThrown, jqXHR);
            callback(jqXHR.responseText, textStatus, jqXHR);
        });
    }
};
/**
 * Logs the current user out.
 *
 * @callback: Function to run when the logout function has completed.
 */
selfserve.auth.logout = (callback) => {
    selfserve.auth.setCookie("username", "f", 1);
    selfserve.auth.setCookie("token", "f", 1);
    callback();
};
selfserve.global.getAvatarByUsername = (username, callback) => {
    $.get(`./blog/avatar?${username}`, (success) => {
        callback(`./blog/avatar?${username}`, success);
    });
};
selfserve.global.changeAvatarForCurrentUser = (avatar_base64, callback) => {
    let payload = {
        token: selfserve.auth.getCookie('token'),
        username: selfserve.global.currentUser.username,
        avatar: avatar_base64
    };
    $.post(`./blog/changeavatar`, payload, (result, status, xhr) => {
        callback(result, status);
    });
};
//#endregion
//# sourceMappingURL=selfserve.js.map