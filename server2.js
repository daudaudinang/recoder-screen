// Ở Server 1 chúng ta đã thử dùng Server 1 làm Server Signaling cho 1 kết nối webRTC duy nhất
// Ở Server 2 này, ta sẽ thử dùng Server 2 làm trung gian chuyển tiếp, tạo 2 kết nối webrtc, 1 từ cam tới server 2, 1 từ server 2 tới player

//1. Tạo kết nối từ cam tới server 2

// Khi Cam gửi cho Server 1 offer, server sẽ response về 1 answer
var wrtc = require('wrtc');

var WebSocketServer = require('ws').Server; 

//creating a websocket server at port 9090 
var wss = new WebSocketServer({port: 9090}); 

var users = {};
var myConnection;
var myConnection2;
wss.on('connection', connection => {
    connection.on('message', message => {
        message = JSON.parse(message);
        switch(message.type) {
            case "login":
                users[message.data] = connection; // Lưu connection của nó lại để sau còn biết phải gửi cho player hay camera
                connection.name = message.data; // Cũng lưu luôn tên thằng kết nối lại để biết nó là camera hay player
                sendTo(connection, {type:"login", data:true});
                break;
            case "offer":
                // Nhận offer từ camera, thay vì send nó cho player. ta tạo luôn PeerConnection vs answer gửi cho nó
                //using Google public stun server
                var configuration = {
                    iceServers: [
                        { urls: "stun:stun2.1.google.com:19302" },
                        {
                            urls: "turn:192.158.29.39:3478?transport=udp",
                            credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
                            username: "28224511:1379330808",
                        },
                        {
                            urls: "turn:192.158.29.39:3478?transport=tcp",
                            credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
                            username: "28224511:1379330808",
                        },
                    ],
                };

                // Tạo Peer Connection Object
                myConnection = new wrtc.RTCPeerConnection(configuration);

                // Lưu offer của thằng camera vào remote description
                myConnection.setRemoteDescription(new wrtc.RTCSessionDescription(message.data))
                .then(() => {
                    if(users.camera) {
                        // Tạo answer
                        myConnection.createAnswer()
                            .then(answer => {
                            // set answer vào local Description
                            myConnection.setLocalDescription(answer);
            
                            // Gửi answer tới camera thôi
                            sendTo(users.camera, {
                                type: "answer",
                                data: answer
                                });
                            })
                            .catch(error => {
                                console.log(error);
                            });
                    }
                });

                // Sau khi trao đổi xong candidate, sẽ bắt đầu thực hiện truyền stream luôn.
                // Nên ta phải tạo trước 1 event để thực thi event khi nó xảy ra
                myConnection.ontrack = (event) => {
                    // Ở bước này, ta đã lấy đc stream. Giờ tạo offer để send nó cho player

                    myConnection2 = new wrtc.RTCPeerConnection(configuration);

                    event.streams[0].getTracks().forEach((track) => {
                        myConnection2.addTrack(track, event.streams[0]);
                    });

                    if(users.player) {
                        myConnection2.createOffer()
                            .then(offer => {
                                myConnection2.setLocalDescription(offer);

                                sendTo(users.player, {
                                    type: "offer",
                                    data: offer
                                });
                            })
                            .catch (error => {
                                console.log(error);
                            }
                        );
                    }

                    // Khi đã nhận đủ answer, nắm đủ thông tin về đầu bên kia rồi,
                    // thì tạo candidate, trigger event icecandidate để tạo kết nối send dữ liệu
                    myConnection2.onicecandidate = (event) => {
                        if(users.player){
                            if (event.candidate) sendTo(users.player, {
                                type:"candidate",
                                data:event.candidate
                            });
                        }
                    };
                };
                break;
            case "answer":
                // Sau khi thằng player lấy đc offer từ Server, nó sẽ tạo 1 answer và gửi về Server
                // Mình nhận answer đó, gán cho thằng remoteDes
                
                myConnection2.setRemoteDescription(new wrtc.RTCSessionDescription(message.data));
                
                // Lúc này, Server nhận thấy đã thu thập đủ dữ liệu, event onicecandidate khai báo ở offer sẽ được thực hiện
                break;
            case "candidate":
                // Nhận candidate từ thằng camera, thay vì gửi cho player, ta cũng lấy luôn để tạo phiên kết nối tới thằng camera
                myConnection.addIceCandidate(new wrtc.RTCIceCandidate(message.data));
                
                // Sau quá trình này xảy ra. 2 peer bắt đầu send data, hàm ontrack trong offer sẽ đc thực thi
        }
    })
});

// Giữ nguyên
function sendTo(connection, message) { 
    connection.send(JSON.stringify(message));
 }
