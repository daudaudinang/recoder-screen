var conn = new WebSocket("ws://localhost:9090");
var myConnection;
document.title = "webclip";

// Function để send data sang cho server
function send(type, data) {
    conn.send(JSON.stringify({ type: type, data: data }));
}

conn.onopen = function () {
    console.log("Connected to the signaling server");
    send("login", "recoder");
};

var handleLogin = () => {
  // 1. Lấy stream ra từ camera
  navigator.mediaDevices
    .getDisplayMedia({
      video: { width: 3840, height: 2096, frameRate: 60 },
      audio: true,
    })
    .then((stream) => {

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

      myConnection = new RTCPeerConnection(configuration);

      stream.getTracks().forEach((track) => {
        myConnection.addTrack(track, stream);
      });

      myConnection.createOffer()
      .then(offer => {
          console.log("Offer sẵn sàng");
        send("offer", offer);
        myConnection.setLocalDescription(offer);
      })
      .catch (error => {
        // alert("Error when creating an offer");
        console.log(error);
      });

      // 6. Khi đã nhận đủ answer, nắm đủ thông tin về đầu bên kia rồi,
      // thì tạo candidate, trigger event icecandidate để tạo kết nối send dữ liệu
      myConnection.onicecandidate = (event) => {
          console.log("Candidate sẵn sàng");
        if (event.candidate) send("candidate", event.candidate);
      };
    });
};

// Xử lý sự kiện khi nhận được thông tin của thằng player gửi cho từ Server
conn.onmessage = (message) => {
  message = JSON.parse(message.data);
  // 5. Sau khi send Offer cho player, nó sẽ gửi cho mình 1 answer, mình sẽ nhận về và gán nó vào remote Description của mình
  // Sau khi thực hiện xong cái này, nó đã có đủ dữ liệu để thực hiện kết nối
  // Nên nó trigger ra event icecandidate để mình lấy candidate gửi cho server như số 6 ở trên
  if (message.type === "login" && message.data === true) {
    handleLogin();
  }

  if (message.type === "answer") {
    myConnection.setRemoteDescription(new RTCSessionDescription(message.data));
  }

  if (message.type === "candidate") {
    myConnection.addIceCandidate(new RTCIceCandidate(message.data));
  }
};
