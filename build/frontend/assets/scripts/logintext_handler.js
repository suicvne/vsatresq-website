"use strict";
/**
 * bah
 */
selfserve.auth.onLogin.push(() => {
    if (selfserve.global.currentUser !== undefined) {
        console.log('!!!! enabling authorized only');
        $('.authorized_only').show();
        $('#login-text').html(`<strong>${selfserve.global.currentUser.username}</strong>`);
        $('#nav-login').html('Logout');
    }
    else {
        $('#nav-compose').removeAttr('href').addClass('disabled');
        $('#nav-ucp').removeAttr('href').addClass('disabled');
        $('#nav-inventory').removeAttr('href').addClass('disabled');
        $('.authorized_only').hide();
    }
});
//# sourceMappingURL=logintext_handler.js.map