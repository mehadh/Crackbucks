# Crackbucks
This is a project demonstrating how improperly secured phone lines can be easily exploited by malicious actors. 

## When?
In the summer of 2021, I created this tool from scratch in order to both build my Node.js skills and to prove the existence of this vulnerability in a specific company's hotline. After its final version was created and the vulnerability was reported, they added an additional security feature to the phone line by requiring the PIN of the balance being checked within two weeks of the report. This successfully thwarted most malicious actors as this hotline was prime for those who intended on stealing the company's giftcards that they did not have rightful access to, usually meaning that they lacked the PIN. However, the company has now removed the automated call-based balance checker, instead opting for users to sign onto their mobile app instead. As a result, I am now releasing this in hopes that perhaps others can learn from this. 

## Why?
The main point is that simple anti-fraud measures are simply not enough. It is evident that the phone line in this particular instance used to be quite simple to exploit due to its lack of any sort of authentication or bot protection. The user would simply enter their gift card details without the PIN and would be presented with their balance. As a countermeasure, the captcha system was added to this hotline. However, as seen in the code of this program, this can also be circumvented through the clever use of free and paid tools. 

## How?
This program works by first initiating a Localtunnel connection in order to network with other servers. Next, it utilizes the Twilio API to create a call to the designated number. Using TwiML and the sendDigits feature, the program will pause for a minute as the phone line reads out the various options before navigating to the correct menu. A websocket stream URL is passed to Twilio using the Localtunnel address, which allows the Twilio servers to send data back to the program via the websocket protocol. Once a connection is initiated to the websocket, the incoming message is parsed and passed to Google Cloud, where speech-to-text analysis is done in real time. Despite the hotline having a five second timeout for the voice captcha in order to defeat bots, unfortunately the use of real-time cloud based analysis is no match for such a simple system. The program will then parse any digits it received from the transcript and send it back over using the Twilio API. Afterwards, the program records down the balance of the card checked and the card number before terminating itself. 

## Features
The index.js file is the main file which repeatedly creates the caller.js instances as they terminate. 
- Supports multiple processes running at once, up to however many the user's machine can handle. Note that the Twilio API may ratelimit you. This is probably also not the most efficient way to handle this, but this is how I did it!
- Debugging mode, initialized by creating secretHacker.txt in the same folder as index.js. 
- Balance threshold for which cards will be logged

## Requirements
- Twilio: SID, token, a phone number, and balance to make the calls. 
- Google Cloud: A JSON key file to use the Google Cloud speech-to-text API. You can get $300 in free credits if I recall correctly by simply signing up. 
- A list of numbers to check.

This tool was designed solely to point out the vulnerability and is in no way meant to be used in a malicious way. I do not support any sort of blackhat or illegal activities. Do not use my work for nefarious purposes. 
