export class MongoDBFile implements IMongoDBFilePath {
    public file: string;
    public ext: string;

    constructor(_file: string, _extension: string)
    {
        this.file = _file;
        this.ext = _extension;
    }

    public fullFilename(): string {
        return `${this.file}.${this.ext}`;
    }
}

export interface IMongoDBFilePath {
    file: string;
    ext: string;
}