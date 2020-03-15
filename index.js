const net = require('net');
const {MongoClient} = require('mongodb');
const {Client} = require('ssh2');

const connectSSH = async (sshConfig) => {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn
            .on('ready', () => resolve(conn))
            .on('error', reject)
            .connect(sshConfig);
    });
};

const createServer = async (conn, mongoConfig) => {
    return new Promise((resolve, reject) => {
        const server = net.createServer(sock => {
            conn.forwardOut(sock.remoteAddress, sock.remotePort, mongoConfig.host, mongoConfig.port, (err, stream) => {
                if (err) {
                    sock.end();
                } else {
                    sock.pipe(stream).pipe(sock);
                }
            });
        });
        server.on('error', reject).listen(0, () => resolve(server));
    });
};

const closePoolAndExit = async ()=> {
    try {
        // Get the pool from the pool cache and close it when no
        // connections are in use, or force it closed after 10 seconds
        // If this hangs, you may need DISABLE_OOB=ON in a sqlnet.ora file
        await oracledb.getPool().close(10);
    } catch(err) {
        throw err;
    }
};

module.exports = {
    async connect(sshConfig, mongoConfig) {
        const conn = await connectSSH(sshConfig);
        const server = await createServer(conn, mongoConfig);
        const {host,user,password} = mongoConfig;
        let uri = `mongodb://${host}:${server.address().port}`;
        if(user &&  password){
            uri = `mongodb://${user}:${password}@${host}:${server.address().port}`;
        }
        const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
        // Connect to the MongoDB cluster
        await client.connect();

        return {
            client,
            conn,
            server,
            close: () => {
                client.close();
                server.close();
                conn.end();
            },
        };
    },
};
