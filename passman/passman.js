const fs = require('fs');
const crypto = require('crypto');
const readlineSync = require('readline-sync');

class PasswordManager {
    constructor(keyFile = 'key.key', dataFile = 'passwords.json') {
        this.keyFile = keyFile;
        this.dataFile = dataFile;
        this.loadOrGenerateKey();
    }

    loadOrGenerateKey() {
        try {
            this.key = fs.readFileSync(this.keyFile);
        } catch (error) {
            this.key = crypto.randomBytes(32);
            fs.writeFileSync(this.keyFile, this.key);
        }
    }

    encrypt(data) {
        const cipher = crypto.createCipher('aes-256-cbc', this.key);
        let encryptedData = cipher.update(data, 'utf-8', 'hex');
        encryptedData += cipher.final('hex');
        return encryptedData;
    }

    decrypt(encryptedData) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.key);
        let decryptedData = decipher.update(encryptedData, 'hex', 'utf-8');
        decryptedData += decipher.final('utf-8');
        return decryptedData;
    }

    loadPasswords() {
        try {
            const encryptedData = fs.readFileSync(this.dataFile, 'utf-8');
            const decryptedData = this.decrypt(encryptedData);
            return JSON.parse(decryptedData);
        } catch (error) {
            return {};
        }
    }

    savePasswords(passwords) {
        const encryptedData = this.encrypt(JSON.stringify(passwords));
        fs.writeFileSync(this.dataFile, encryptedData, 'utf-8');
    }

    addPassword(service, username, password) {
        const passwords = this.loadPasswords();
        passwords[service] = { username, password };
        this.savePasswords(passwords);
    }

    getPassword(service) {
        const passwords = this.loadPasswords();
        return passwords[service] || null;
    }
}

if (require.main === module) {
    const passwordManager = new PasswordManager();

    while (true) {
        console.log("\nPassword Manager Menu:");
        console.log("1. Add a new password");
        console.log("2. Retrieve a password");
        console.log("3. Exit");

        const choice = readlineSync.question("Enter your choice (1/2/3): ");

        if (choice === '1') {
            const service = readlineSync.question("Enter the service: ");
            const username = readlineSync.question("Enter the username: ");
            const password = readlineSync.question("Enter the password: ", { hideEchoBack: true });
            passwordManager.addPassword(service, username, password);
            console.log("Password added successfully!");
        } else if (choice === '2') {
            const service = readlineSync.question("Enter the service: ");
            const storedPassword = passwordManager.getPassword(service);
            if (storedPassword) {
                console.log(`Service: ${service}\nUsername: ${storedPassword.username}\nPassword: ${storedPassword.password}`);
            } else {
                console.log("Password not found for the given service.");
            }
        } else if (choice === '3') {
            break;
        } else {
            console.log("Invalid choice. Please enter 1, 2, or 3.");
        }
    }
}
