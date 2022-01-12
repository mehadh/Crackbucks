const fs = require('fs')
const figlet = require('figlet');
const process = require('process');
const exec = require('child_process').exec;
const { stdout, stderr } = require('process');

threads = null
currentThreads = null
currentPort = 65534
toCheck = null
var processes = {}
counter = 0
origLength = 0
twilbal = "$0 USD."


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

function endProcess() {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
}

function isConfig() {
    try {
        config = require('./config.json');
        console.log("config.json successfully loaded!")
        return true
    } catch (err) {
        debug(err)
        console.log("Uh oh! config.json was not loaded properly. This is usually because you don't have a config.json file located in the directory of this program.")
        console.log("An example file will be created if it is not already present. Press any key to exit.")
        let example = {
            "sid": "Your account SID. Found at https://www.twilio.com/console",
            "token": "Your auth token. Found at https://www.twilio.com/console",
            "number": "The phone number you have purchased from Twilio.",
            "threads": "How many processes do you want running at once?",
            "minimum": "What's the minimum $ value you want for a hit? Optional, but if not specified, $0 hits will be listed."
        };
        let data = JSON.stringify(example)
        fs.writeFileSync('config.example.json', data)
        endProcess()
        return false

    }
}

function isGoogle() {
    try {
        google = require('./google.json');
        console.log("google.json successfully loaded!")
        return true
    }
    catch (err) {
        debug(err)
        console.log("Uh oh! google.json was not loaded properly. This is usually because you don't have a google.json file located in the directory of this program.")
        console.log("Visit this link and create a JSON key file from the service account of your Google Cloud project: https://cloud.google.com/docs/authentication/getting-started")
        console.log("Place the JSON file in this directory, and rename it to google.json. Press any key to exit.")
        endProcess()
        return false
    }
}

function isCombo() {
    try {
        combo = require('./combo.txt');
        console.log("combo.txt successfully loaded!")
        toCheck = fs.readFileSync('./combo.txt').toString().split('\n');
        return true
    }
    catch (err) {
        debug(err)
        console.log("There is no combo.txt file. Create this file and insert valid 16 digit numbers line by line. For example:")
        console.log("6094762943970634")
        console.log("6077601261963598")
        console.log("Once you've placed the file in this directory, relaunch the program. Press any key to exit.")
        endProcess()
        return false
    }
}

// Twilio credential checker can go here, but we'll assume the user is competent enough to figure it out.

function splash() {
    figlet.text(`Crack
    Bucks`, {
        font: 'Big Money-sw',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true
    }, function (err, data) {
        if (err) {
            console.log('CRACKBUCKS');
            debug(err);
            return;
        }
        console.log(data);
    });
    setTimeout(function () {
        console.log(`CrackBucks by Mehad.`)
    }, 100)

}

function start() {
    process.title = "CRACKBUCKS - mehad"
    isDebug()
    if (isConfig() && isGoogle() && isCombo()) {
        debug("WARNING: config.json and google.json have not been checked for validity, just for existence. If you are debugging errors, check that these files contain the proper credentials.")
        splash()
        setTimeout(function () {
            balanceChecker()
            if (config.threads == undefined || config.threads == null || isNaN(config.threads)) {
                console.log('Your config.json file does not contain a valid amount of threads. Please check your config.json file again. Press any key to exit.')
                endProcess()
            }
            else if (toCheck == null || toCheck == undefined) {
                console.log('Something is wrong with your combo.txt file. Please check it and try again. Press any key to exit.')
                endProcess()
            }
            else {
                console.log('Starting to crack!')
                threads = config.threads
                currentThreads = config.threads
                origLength = toCheck.length
                starterHelper()
            }
        }, 200)
    }
}

function processStarter() {
    if (currentPort < 1026) {
        currentPort = 65534
        processStarter()
    }
    else if (toCheck[0] == undefined || toCheck[0] == null) {
        console.log(`Either the end of the list has been reached, or the combos.txt file has errors in it. You can end the process when all checks have completed.`)
    }
    else {
        currentPort -= 1
        counter += 1
        goCheck = toCheck[0]
        toCheck.shift()
        balanceChecker()
        debug(`Starting process on port ${currentPort} with number ${goCheck}`)
        processes[counter] = exec(`node caller.js ${currentPort} ${goCheck}`,
            (error, stdout, stderr) => {
                debug(`Output: ${stdout} || Err: ${stderr}`);
                if (error !== null) {
                    debug(`Error: ${error}`)
                }
            })

        processes[counter].on('close', () => exitHandler())
        processes[counter].on('error', () => exitHandler())
        process.title = `CRACKBUCKS - mehad - Doing/done: ${origLength - toCheck.length} Todo: ${toCheck.length}/${origLength} Balance: ${twilbal}`
    }

}

function exitHandler() {
    // Hopefully this doesn't do something bad!
    setTimeout(function () {
        processStarter()
    }, 250)
}

function starterHelper() {
    if (currentThreads != 0 && !isNaN(threads) && !isNaN(currentThreads)) {
        for (let i = 0; i < currentThreads; i++) {
            setTimeout(function () {
                processStarter()
            }, 250)
        }
    }
}

function balanceChecker() {
    const twilio = require('twilio')(config.sid, config.token)
    twilio.balance.fetch()
        .then((data) => {
            const balance = Math.round(data.balance * 100) / 100;
            const currency = data.currency;
            twilbal = `$${balance} ${currency}`
            return twilbal
        });

}


start()