var request = require('request');
const config  = require("config");


function sendFcmNotification(fcmTokens, title, body, additionalData, sound, _callback) {
    var options = {
        'method': 'POST',
        'url': 'https://fcm.googleapis.com/fcm/send',
        'headers': {
            'Authorization': config.AuthKey, //you AuthKey
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "registration_ids": fcmTokens,
            "notification": {
                "android": {
                    "priority": "high"
                },
                "title": title,
                "body": body,
                "sound": sound ? sound : "default"
            },
            "data": additionalData,
            "apns": {
                "headers": {
                    "apns-priority": "10",
                    "apns-collapse-id": "company" //will be set according
                }
            }
        })
    }


    request(options, function (error, response) {
        if (error) {
            console.log('Error', error);
            return _callback(error, null)
        }
        else {
            console.log('RESPONSE', response.body);
            return _callback(null, JSON.parse(response.body))
        }
    });
}


module.exports = sendFcmNotification