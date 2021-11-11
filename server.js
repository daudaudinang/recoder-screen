//require our websocket library 
var WebSocketServer = require('ws').Server; 

//creating a websocket server at port 9090 
var wss = new WebSocketServer({port: 9090}); 

var users = {};
wss.on('connection', connection => {
    // console.log("User connected!");

    connection.on('message', message => {
        message = JSON.parse(message);
        console.log(message.type);
        switch(message.type) {
            case "login":
                users[message.data] = connection; // Lưu connection của nó lại để sau còn biết phải gửi cho player hay camera
                connection.name = message.data; // Cũng lưu luôn tên thằng kết nối lại để biết nó là camera hay player
                sendTo(connection, {type:"login", data:true});
                break;
            case "offer":
                // Nhận offer từ camera, send nó cho player
                // console.log("Receive an offer from camera");

                // Chuyển offer tới thằng player nếu nó có tồn tại
                if(users.player) sendTo(users.player, {
                    type: "offer",
                    data: message.data
                });
                break;
            case "answer":
                // Sau khi thằng player lấy đc offer từ camera, nó sẽ tạo 1 answer và gửi phản hồi cho camera thông qua server
                // console.log("Receive an answer from player");

                //Chuyển answer tới thằng camera nếu nó có tồn tại
                if(users.camera) {
                    sendTo(users.camera, {
                    type: "answer",
                    data: message.data
                    });
                }
                break;
            case "candidate":
                // Sau khi thằng camera nhận đc answer, nhận thấy là đã thu đủ thông tin của phía player, nó trigger ra icecandidate event và gửi candidate tới server để chuyển qua cho thằng player để tạo phiên kết nối p2p chuẩn bị truyền dữ liệu
                // console.log("Receive an icecandidate from camera");
                
                // Chuyển candidate tới thằng player nếu nó có tồn tại
                if(users.player) sendTo(users.player, {
                    type: "candidate",
                    data: message.data
                });
                break;
                
        }
    })
});

let i = 0;
function sendTo(connection, message) { 
    // console.log(connection.name, message, ++i);
    connection.send(JSON.stringify(message));
 }