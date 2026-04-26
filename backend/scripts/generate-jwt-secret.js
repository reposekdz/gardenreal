const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

// Generate a secure 64-byte secret key encoded in hex
const secret = crypto.randomBytes(64).toString('hex');

if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    const jwtSecretRegex = /^JWT_SECRET=.*$/m;

    if (jwtSecretRegex.test(envContent)) {
        // Update existing JWT_SECRET
        envContent = envContent.replace(jwtSecretRegex, `JWT_SECRET=${secret}`);
        console.log('Updated JWT_SECRET in .env');
    } else {
        // Append JWT_SECRET if it doesn't exist
        envContent += `\nJWT_SECRET=${secret}\n`;
        console.log('Added JWT_SECRET to .env');
    }

    fs.writeFileSync(envPath, envContent);
} else {
    // Create .env if it doesn't exist
    fs.writeFileSync(envPath, `JWT_SECRET=${secret}\n`);
    console.log('Created .env and added JWT_SECRET');
}

console.log('Generated JWT Secret:', secret);
