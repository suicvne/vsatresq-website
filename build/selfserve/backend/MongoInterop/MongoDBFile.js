"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBFile = void 0;
class MongoDBFile {
    constructor(_file, _extension) {
        this.file = _file;
        this.ext = _extension;
    }
    fullFilename() {
        return `${this.file}.${this.ext}`;
    }
}
exports.MongoDBFile = MongoDBFile;
//# sourceMappingURL=MongoDBFile.js.map