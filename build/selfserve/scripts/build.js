"use strict";
// TODO: please god typescript it
const fse = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const marked = require('marked');
const frontMatter = require('front-matter');
const glob = require('glob');
const config = require(`${process.cwd()}/site.config`);
let srcPath = './site-src';
if (config.build.srcPath !== undefined)
    srcPath = config.build.srcPath;
const distPath = config.build.outputPath;
// clear destination folder
fse.emptyDirSync(distPath);
// copy assets folder
fse.copy(`${srcPath}/assets`, `${distPath}`);
fse.ensureSymlinkSync(`node_modules/`, `${distPath}/node_modules`);
// read pages
const files = glob.sync('**/*.@(md|ejs|html)', { cwd: `${srcPath}/pages` });
files.forEach((file, i) => {
    const fileData = path.parse(file);
    const destPath = path.join(distPath, fileData.dir);
    // create destination directory
    fse.mkdirsSync(destPath);
    // read page file
    const data = fse.readFileSync(`${srcPath}/pages/${file}`, 'utf-8');
    // render page
    const pageData = frontMatter(data);
    const templateConfig = Object.assign({}, config, {
        page: pageData.attributes
    });
    let pageContent;
    // generate page content according to file type
    switch (fileData.ext) {
        case '.md':
            pageContent = marked(pageData.body);
            break;
        case '.ejs':
            pageContent = ejs.render(pageData.body, templateConfig, {
                filename: `${srcPath}/pages/${file}`
            });
            break;
        default:
            pageContent = pageData.body;
    }
    // render layout with page contents
    const layout = pageData.attributes.layout || 'template';
    const layoutFileName = `${srcPath}/templates/${layout}.ejs`;
    const layoutData = fse.readFileSync(layoutFileName, 'utf-8');
    const pageTitle = pageData.attributes.title || 'Selfserve';
    const baseURL = config.site.baseURL || "http://localhost:3000/";
    const completePage = ejs.render(layoutData, Object.assign({}, templateConfig, {
        body: pageContent,
        filename: layoutFileName,
        title: pageTitle,
        base_url: baseURL
    }));
    // save the html file
    fse.writeFileSync(`${destPath}/${fileData.name}.html`, completePage);
});
//# sourceMappingURL=build.js.map