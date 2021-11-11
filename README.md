# recoder-screen
Use Web API getDisplayMedia() and webRTC to record screen a pupperteer tab and send to another peer

I'm bad at English, so I write Vietnamese, you can use Google translate if needed.

# 3 cái demo khác nhau:
Ta sẽ thấy có 3 file server, thực tế là 3 cái demo khác nhau:

#demo1
server.js + play.html + quay.html: Kết nối Peer to Peer từ quay.html (quay.html sẽ lấy stream từ camera của máy tính ạ) tới play.html, server.js làm Signaling Server ạ

#demo2
server2.js + play.html + quay.html: 2 Kết nối WebRTC: quay.html =>=>=WebRTCConnection1=>=>= server2.js =>=>=WebRTCConnection2=>=>= play.html

#demo3
server3.js + server3-recoder.js + play.html: Dùng pupperteer truy cập 1 trang, quay màn hình page đó bằng API navigator.mediaDevices.getDisplayMedia() của trình duyệt===>WebRTCConnection1===>server3.js===>WebRTCConnection2===>play.html

#Lưu ý
#1. *File server3-recoder.js là file javascript được add thêm vào page pupperteer để lấy source màn hình + tạo kết nối, truyền dữ liệu với server
#2. *headless bắt buộc phải set thành false, nếu set thành true thì sẽ không lấy được source
#3. *Có thể tăng, giảm chất lượng video hay số frame/s bằng cách set constraints cho getDisplayMedia()
#4.
Ví dụ:
navigator.mediaDevices.getDisplayMedia(constraints);
navigator.mediaDevices.getDisplayMedia({
video: {
        width: 160,
        height: 120,
        frameRate: 15
      },
audio: {
      sampleSize: 8,
      echoCancellation: true
    }
});
