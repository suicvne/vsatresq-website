"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLInstance = exports.SQLStatus = void 0;
const mySqlModule = require("mysql");
var SQLStatus;
(function (SQLStatus) {
    SQLStatus[SQLStatus["OK"] = 0] = "OK";
    SQLStatus[SQLStatus["Error"] = 1] = "Error";
})(SQLStatus = exports.SQLStatus || (exports.SQLStatus = {}));
class MySQLInstance {
    constructor(sqlConnectionOptions) {
        this.allowed = true;
        this.pool = mySqlModule.createPool({
            connectionLimit: 10,
            host: 'localhost',
            user: 'mike',
            password: 'Papabear123',
            database: 'blogusers'
        });
        this.sqlConnection = mySqlModule.createConnection(sqlConnectionOptions);
        if (this.sqlConnection === undefined)
            throw new Error('sqlConnection null. Check given connection options');
        else {
            this.sqlConnection.on('error', (err) => {
                console.log(err.code, err.sqlMessage, err.sql); // 'ER_BAD_DB_ERROR'
            });
            /*
            this.sqlConnection.connect((err: mySqlModule.MysqlError) =>
            {
                if(err)
                    this.allowed = false;
                else
                    this.currentDatabase = sqlConnectionOptions.database!;
            });
            */
        }
    }
    query(queryString, callback) {
        if (!this.allowed)
            return;
        this.pool.getConnection((err2, connection) => {
            connection.release();
            if (err2)
                callback(SQLStatus.Error, err2, "Error occurred.");
            else {
                connection.query(queryString, (error, results, fields) => {
                    if (error)
                        callback(SQLStatus.Error, error, results);
                    else {
                        callback(SQLStatus.OK, error, results);
                    }
                });
            }
        });
        /*
        this.sqlConnection.query(queryString, (err2: mySqlModule.MysqlError, result2: any) =>
        {
            if (err2)
            {
                callback(SQLStatus.Error, err2, result2);
            }
            else
            {
                callback(SQLStatus.OK, err2, result2);
            }
        });
        */
    }
    changeSQLDatabase(dbName) {
        if (!this.allowed)
            return;
        this.sqlConnection.changeUser({ database: dbName }, (err) => {
            if (err) {
                throw new Error(err.message);
            }
        });
    }
}
exports.MySQLInstance = MySQLInstance;
//# sourceMappingURL=SQLRequests.js.map