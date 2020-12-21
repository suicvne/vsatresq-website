"use strict";
/**
 * About random_banner.js
 *
 * random_banner.js is a small Selfserver plugin designed to randomize the banner image shown
 * on client side.
 *
 * Created by Mike Santiago
 * Copyright (C) 2019
 *
 * DO NOT REDISTRIBUTE!!
 */
selfserve.random_banner = {};
var __randomBannerTemplate = {
    path: "../images/random/6.jpg",
    offset: { x: 0, y: -1090 }
};
var __randomArrayPath = [
    __randomBannerTemplate
];
selfserve.random_banner.addImageToRandom = function addImageToRandom(path, offset) {
    __randomArrayPath.push({ path: path, offset: offset });
};
selfserve.random_banner.randomBannerImage = function randomBannerImage() {
    selfserve.random_banner.addImageToRandom("../images/random/cat_banner.jpg", { x: 0, y: -170 });
    selfserve.random_banner.addImageToRandom("../images/random/main_banner.jpg", { x: 0, y: -1000 });
    selfserve.random_banner.addImageToRandom("../images/random/bio_banner.jpg", { x: 0, y: -780 });
    var sizeOfPool = __randomArrayPath.length;
    var randomIndex = Math.floor(Math.random() * sizeOfPool);
    $(".header_container").css("background-image", `linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,1.0)), url(${__randomArrayPath[randomIndex].path})`);
    //$(".header_container").css("background-position-x", "center, 100%");
    //$(".header_container").css("background-position-y", `center, ${__randomArrayPath[randomIndex].offset.y}px`);
};
selfserve.random_banner.setBannerImage = (path) => {
    console.log(`manually setting banner to ${path}`);
    $(".header_container").css("background", `url(${path})`);
    // done
};
selfserve.random_banner.setBannerWithGradient = (path, gradient_color) => {
    $(".header_container").css("background-image", `linear-gradient(rgba(${gradient_color.r},${gradient_color.g},${gradient_color.b},0.2), rgba(${gradient_color.r},${gradient_color.g},${gradient_color.b},0.85)), url(${path})`);
    $(".header_container").css("background-attachment", "fixed");
};
//# sourceMappingURL=random_banner.js.map