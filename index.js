const axios = require('axios');
const {
    ensureDirectories,
    saveJsonFile,
    needsRefresh,
    cacheBlob,
    readCachedBlob
} = require('./utils');

const MDS_URL = 'https://mds.fidoalliance.org/';

function decodeJwtPayload(jwt) {
    // JWT format: header.payload.signature
    const parts = jwt.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
    }
    // Base64url decode
    const payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(decoded);
}

async function fetchMDSBlob() {
    try {
        const response = await axios.get(MDS_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching MDS blob:', error.message);
        throw error;
    }
}

async function processMetadataStatements(metadataStatements) {
    if (!metadataStatements || typeof metadataStatements !== 'object') {
        throw new Error('Invalid metadata statements format');
    }

    for (const [aaguid, statement] of Object.entries(metadataStatements)) {
        if (!statement) continue;

        // Get the description from the metadata statement
        const description = statement.metadataStatement?.description;
        if (!description) {
            console.warn(`Skipping entry with AAGUID ${aaguid} due to missing description.`);
            continue;
        }

        await saveJsonFile(description, statement);
    }
}

async function main() {
    try {
        // Ensure required directories exist
        await ensureDirectories();

        let mdsJwt = await readCachedBlob();
        let decoded;
        let needsUpdate = true;
        if (mdsJwt) {
            try {
                decoded = decodeJwtPayload(mdsJwt);
                needsUpdate = needsRefresh(decoded);
            } catch (e) {
                console.warn('Cached blob is invalid, will fetch a new one.');
                needsUpdate = true;
            }
        }
        if (!mdsJwt || needsUpdate) {
            console.log('Fetching fresh MDS blob...');
            mdsJwt = await fetchMDSBlob();
            await cacheBlob(mdsJwt);
            decoded = decodeJwtPayload(mdsJwt);
        } else {
            console.log('Using cached MDS blob...');
        }

        if (!decoded || !decoded.entries) {
            throw new Error('Invalid MDS blob format: missing entries');
        }

        // Process metadata statements
        console.log('Processing metadata statements...');
        await processMetadataStatements(decoded.entries);

        console.log('Processing complete! Check the output directory for results.');
    } catch (error) {
        console.error('Error in main process:', error.message);
        process.exit(1);
    }
}

main();