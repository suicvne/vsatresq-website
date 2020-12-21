import mySqlModule = require('mysql');

export enum SQLStatus {
    OK,
    Error,
}

export class MySQLInstance {
    private sqlConnection: mySqlModule.Connection;
    public currentDatabase?: string;
    private allowed: boolean = true;
    private pool = mySqlModule.createPool({
        connectionLimit : 10,
        host            : 'localhost',
        user            : 'mike',
        password        : 'Papabear123',
        database        : 'blogusers'
    });

    constructor(sqlConnectionOptions: mySqlModule.ConnectionConfig) {
        this.sqlConnection = mySqlModule.createConnection(sqlConnectionOptions);
        if (this.sqlConnection === undefined)
            throw new Error('sqlConnection null. Check given connection options');
        else
        {
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

    public query(queryString: string, callback: (status: SQLStatus, err: mySqlModule.MysqlError, result: any) => void) {
        if(!this.allowed)
            return;
        this.pool.getConnection((err2: mySqlModule.MysqlError, connection: mySqlModule.PoolConnection) =>
        {
            connection.release();

            if(err2) callback(SQLStatus.Error, err2, "Error occurred.");
            else
            {
                connection.query(queryString, (error:any, results:any, fields: any) =>
                {
                    if(error)   callback(SQLStatus.Error, error, results);
                    else
                    {
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
    public changeSQLDatabase(dbName: string) {
        if(!this.allowed)
            return;
        this.sqlConnection.changeUser({database: dbName}, (err: mySqlModule.MysqlError) => {
            if (err) {
                throw new Error(err.message);
            }
        });
    }
}
