
const functions = require('firebase-functions');
const request = require('request-promise');
const admin = require('firebase-admin');

var mqtt = require('mqtt');

var options = {
    port: 15275,
    host: 'mqtt://tailor.cloudmqtt.com',
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: 'jacnnzbw',
    password: 'HoNanjl89Gm0',
    keepalive: 60,
    reconnectPeriod: 1000,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    clean: true,
    encoding: 'utf8'
}


admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const LINE_TOKEN = 'XQKwG4IfUZxlmiDEEC3i4Cys2ipN8L0btW28KxTSIeTsfoXX/R93syH7hIl1uYBONz1+1SsKIwJ7gFba7lolrzHHS+HxnTouYZ2C3PIIbrEGXmT5gZ0jHFLFnOJy6ZgUM5JrcGSk1w0xF5AWz+pONlGUYhWQfeY8sLGRXgo3xvw=';
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message';
const LINE_HEADER = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${LINE_TOKEN}`
};
exports.Linebot = functions.https.onRequest((req, res) => {

  if (req.body.events[0].message.type !== 'text') {
    //return;
    reply(req.body, 'ไม่พบสิ่งที่คุณต้องการค้นหา');
  }

  const hwId = "abcd";
  const contentText = req.body.events[0].message.text;

  var client  = mqtt.connect('mqtt://tailor.cloudmqtt.com', options);
    switch (contentText.toLowerCase()) {
        case "console":
            openConsole(req.body);
            break;
        case "cmd":
            client.on('connect', function () {
              client.publish('getStatus', hwId + '/STATUS');
              client.subscribe('UPDATE_STATUS', function (err) {
                if (!err) {
                  //client.publish('presence', 'Hello mqtt')
                }
              })
            });
             
            client.on('message', function (topic, message) {
              reply(req.body, message.toString());
              updateDB(message);
              client.end();
            });
            
            break;
        case "status":
            client.on('connect', function () {
              client.publish('getStatus', hwId + '/STATUS');
              client.subscribe('UPDATE_STATUS', function (err) {
                if (!err) {
                  //client.publish('presence', 'Hello mqtt')
                }
              })
            });
             
            client.on('message', function (topic, message) {
              updateDB(message);
              client.end();
            });

            getHardwareStatus(req.body, hwId);

            break;
        case "openvalve":
            client.on('connect', function () {
              client.publish('getStatus', hwId + '/Solenoid=ON', function(err) {
                if(!err){
                    openValve(req.body);
                }else{
                    reply(req.body, "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
                }
                console.log("Message is published");
                //client.end(); // Close the connection when published
              });

              client.subscribe('UPDATE_STATUS', function (err) {
                if (!err) {
                  //client.publish('presence', 'Hello mqtt')
                }
              })
            });
             
            client.on('message', function (topic, message) {
              updateDB(message);
              client.end();
            });
            
            break;
        case "closevalve":
          client.on('connect', function () {
            client.publish('getStatus', hwId + '/Solenoid=OFF', function(err) {
              if(!err){
                closeValve(req.body);
              }else{
                  reply(req.body, "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
              }
              //client.end(); // Close the connection when published
            });

            client.subscribe('UPDATE_STATUS', function (err) {
              if (!err) {
                //client.publish('presence', 'Hello mqtt')
              }
            })
          });
          
          client.on('message', function (topic, message) {
            updateDB(message);
            client.end();
          });
            
            break;
        default:
            reply(req.body, contentText);
    }

});

const openValve = (bodyResponse) => {
  reply(bodyResponse, 'เปิดระบบเรียบร้อยแล้ว')
}

const closeValve = (bodyResponse) => {
  reply(bodyResponse, 'ปิดระบบเรียบร้อยแล้ว')
}

const updateDB = (obj) => {
  var dt = new Date();
  var utcDate = dt.toUTCString();

  var param = JSON.parse(obj);

  admin.database().ref('hwStatus/' + param.hwid).set({
    humidity: param.humidity,
    temperature: param.temperature,
    soilMoisture: param.moisture,
    valveState: param.valve,
    time: utcDate,
  });
}

const getHardwareStatus = (bodyResponse, hwId) => {
  admin.database().ref('hwStatus/' + hwId).once('value', (snapshot) => {
    var event = snapshot.val();
    var valveText = "";
    if(event.valveState === "1"){
        valveText = "ON";
    }else{
        valveText = "OFF";
    }
    const replyMessage = {
      "type": "flex",
      "altText": "แผงควบคุมระบบรดน้ำในฟาร์ม",
      "contents": {
        "type": "bubble",
        "direction": "ltr",
        "header": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "รายงานสถานะจากอุปกรณ์",
              "align": "center",
              "weight": "bold"
            }
          ]
        },
        "hero": {
          "type": "image",
          "url": "https://firebasestorage.googleapis.com/v0/b/thaifarmer-1be95.appspot.com/o/condition.png?alt=media&token=8c44813c-9e16-49a2-a2c8-1718f3c7bcf7",
          "size": "lg",
          "aspectRatio": "1:1",
          "aspectMode": "fit"
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "flex": 1,
          "contents": [
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "image",
                  "url": "https://firebasestorage.googleapis.com/v0/b/thaifarmer-1be95.appspot.com/o/pot.png?alt=media&token=d926d245-3726-4d92-b307-14f4383a0069",
                  "flex": 0,
                  "align": "start",
                  "size": "xxs",
                  "aspectRatio": "2:1"
                },
                {
                  "type": "text",
                  "text": "อุณหภูมิ",
                  "weight": "bold"
                },
                {
                  "type": "text",
                  "text": `${event.temperature}°C`,
                  "align": "end"
                },
                {
                  "type": "spacer"
                }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "image",
                  "url": "https://firebasestorage.googleapis.com/v0/b/thaifarmer-1be95.appspot.com/o/humidity.png?alt=media&token=393f1c2b-67f9-4f27-93ad-58660d813c00",
                  "flex": 0,
                  "align": "start",
                  "size": "xxs",
                  "aspectRatio": "2:1"
                },
                {
                  "type": "text",
                  "text": "ความชื้น",
                  "align": "start",
                  "weight": "bold"
                },
                {
                  "type": "text",
                  "text": `${event.humidity}%`,
                  "align": "end"
                },
                {
                  "type": "spacer"
                }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "image",
                  "url": "https://firebasestorage.googleapis.com/v0/b/thaifarmer-1be95.appspot.com/o/soil.png?alt=media&token=422971be-a433-4d4a-8c6f-22976e936111",
                  "flex": 0,
                  "align": "start",
                  "size": "xxs",
                  "aspectRatio": "2:1"
                },
                {
                  "type": "text",
                  "text": "ความชื้นในดิน",
                  "weight": "bold"
                },
                {
                  "type": "text",
                  "text": `${event.soilMoisture}%`,
                  "align": "end"
                },
                {
                  "type": "spacer"
                }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "image",
                  "url": "https://firebasestorage.googleapis.com/v0/b/thaifarmer-1be95.appspot.com/o/watering.png?alt=media&token=ddd07a8e-5fed-4c95-9019-e62b6cd08f91",
                  "flex": 0,
                  "align": "start",
                  "size": "xxs",
                  "aspectRatio": "2:1"
                },
                {
                  "type": "text",
                  "text": "สถานะวาล์ว",
                  "weight": "bold"
                },
                {
                  "type": "text",
                  "text": `${valveText}`,
                  "flex": 1,
                  "align": "end"
                },
                {
                  "type": "spacer"
                }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "spacer"
                },
                {
                  "type": "text",
                  "text": `${event.time}`,
                  "align": "center"
                },
                {
                  "type": "spacer"
                }
              ]
            },
            {
              "type": "spacer"
            }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "horizontal",
          "contents": [
            {
              "type": "button",
              "action": {
                "type": "message",
                "label": "เปิดระบบน้ำ",
                "text": "openValve"
              },
              "style": "primary"
            },
            {
              "type": "button",
              "action": {
                "type": "message",
                "label": "ปิดระบบน้ำ",
                "text": "closeValve"
              },
              "margin": "sm",
              "style": "secondary"
            }
          ]
        }
      }
    };
    replyMsg(bodyResponse, replyMessage);

  });
}

const replyMsg = (bodyResponse, msg) => {
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken: bodyResponse.events[0].replyToken,
      messages: [msg]
    })
  });
};

const reply = (bodyResponse, msg) => {
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken: bodyResponse.events[0].replyToken,
      messages: [
        {
          type: `text`,
          text: msg
        }
      ]
    })
  });
};

const openConsole = (bodyResponse) => {
  const replyMessage = {
    "type": "flex",
    "altText": "แผงควบคุมระบบรดน้ำในฟาร์ม",
    "contents": {
      "type": "bubble",
      "styles": {
        "footer": {
          "backgroundColor": "#42b3f4"
        }
      },
      "hero": {
        "type": "image",
        "url": "https://firebasestorage.googleapis.com/v0/b/thaifarmer-1be95.appspot.com/o/network-782707_1280.png?alt=media&token=540b3a1c-a172-4b00-a7f1-0d96e9279a56",
        "size": "full",
        "aspectRatio": "20:13",
        "aspectMode": "cover"
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "margin": "sm",
            "text": "Thai Smart Farmer - IoT",
            "weight": "bold",
            "size": "md",
            "wrap": true
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xs",
            "contents": [
              {
                "type": "box",
                "layout": "baseline",
                "spacing": "sm",
                "contents": [
                  {
                    "type": "text",
                    "text": "แผงควบคุมการรดน้ำในฟาร์ม",
                    "wrap": true,
                    "color": "#666666",
                    "size": "sm",
                    "flex": 6
                  }
                ]
              }
            ]
          }
        ]
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "spacing": "sm",
        "contents": [
          {
            "type": "button",
            "style": "link",
            "color": "#FFFFFF",
            "height": "sm",
            "action": {
              "type": "message",
              "label": "เปิดระบบน้ำ",
              "text": "openValve"
            }
          },
          {
            "type": "button",
            "style": "link",
            "color": "#FFFFFF",
            "height": "sm",
            "action": {
              "type": "message",
              "label": "ปิดระบบน้ำ",
              "text": "closeValve"
            }
          },
          {
            "type": "button",
            "style": "link",
            "color": "#FFFFFF",
            "height": "sm",
            "action": {
              "type": "message",
              "label": "ตรวจสอบสถานะอุปกรณ์",
              "text": "status"
            }
          }
        ]
      }
    }
  }
  replyMsg(bodyResponse, replyMessage);
};
