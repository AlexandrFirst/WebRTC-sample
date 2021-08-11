var webSockerServ = require('ws').Server;

var wss = new webSockerServ({
    port: 9090
});
var users = {};
var otherUser;
wss.on('connection', (conn) => {
    console.log("User connected");

    conn.on('message', (message) => {
        var data;

        try {
            data = JSON.parse(message);

        } catch (error) {
            console.log("Invalid json");
            data = {};
        }

        switch (data.type) {
            case "login":
                if (users[data.name]) {
                    sendToOtherUser(conn, {
                        type: "login",
                        success: false
                    });
                } else {
                    users[data.name] = conn;
                    conn.name = data.name
                    sendToOtherUser(conn, {
                        type: "login",
                        success: true
                    });
                }
                break;
            case "offer":
                var connect = users[data.name];
                if (connect != null) {
                    conn.otherUser = data.name;

                    sendToOtherUser(connect, {
                        type: "offer",
                        offer: data.offer,
                        name: conn.name
                    })
                }
                break;
            case "answer":
                var connect = users[data.name];
                if (connect != null) {
                    conn.otherUser = data.name;

                    sendToOtherUser(connect, {
                        type: "answer",
                        answer: data.answer
                    });
                }
                break;
            case "candidate":
                var connect = users[data.name];
                if (connect != null) {
                    sendToOtherUser(connect, {
                        type: "candidate",
                        candidate: data.candidate
                    });
                }
                break;
            case "reject":
                var connect = users[data.name];
                if (connect != null) {
                    sendToOtherUser(connect, {
                        type: "reject",
                        name: conn.name
                    });
                }
                break;

            case "accept":
                var connect = users[data.name];
                if (connect != null) {
                    sendToOtherUser(connect, {
                        type: "accept",
                        name: conn.name
                    });
                }
                break;
            case "leave":
                var connect = users[data.name];
                if (connect != null) {
                    connect.otherUser = null;
                    sendToOtherUser(connect, {
                        type: "leave"
                    })
                }

                break;
            default:
                sendToOtherUser(conn, {
                    type: "error",
                    message: "Command not found" + data.type
                });
                break;
        }
    })

    conn.on('close', () => {
        console.log('connection closed');

        if (conn.name) {
            delete users[conn.name];
            if (conn.otherUser) {
                var connect = users[conn.otherUser];
                conn.otherUser = null;

                if (conn != null) {
                    sendToOtherUser(connect, {
                        type: "leave"
                    })
                }
            }
        }
    })

    conn.send("Hello world");
})

function sendToOtherUser(connection, message) {
    connection.send(JSON.stringify(message));
}

