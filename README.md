# MongoDB SSH

Sets up a MongoDB connection inside an SSH tunnel.

## API

### `.connect(obj sshConfig, obj mongoConfig)`

* `sshConfig` should be an object according to the `ssh2` package.
* `mongodbConfig` should be an object contains the correct information to make connection to the `mongodb` database.
* Returns a Object, containing a `client` from the `mongodb` package and `close` function.


## Usage
Don't forget to `close()` the tunnel connection when you're done with mongodb.
This is a working example put only your configuration and run example.js

```javascript
async function init() {
    let connection;
    let collections = [];
    let databases = [];
    try {
        // Set up the connection config
        connection = await mongodb.connect(
            {
                host: '', // server host name
                port: 22, // server ssh port as default in ssh is 22
                user: '', // server username
                password: '' // server password
            },
            {
                host: "127.0.0.1", // database host in server as default is localhost
                port: 27017, // database port in server as default is 27017
                user: "", // database user
                password: "", // database password
                database: "" // database name
            }
        );

        databases = await connection.client.db("admin").admin().listDatabases();
        await connection.client.db("database you want get collection from").listCollections().toArray()
            .then(data => {
                data.forEach(item => collections.push(item.name));
            }).catch(err => {
                console.error("An error occurred reading the database.");
                throw err;
            });
        console.log("Databases: ",databases);
        console.log("Collections: ",collections);
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                throw err;
            }
        }
    }
}
init();

```
