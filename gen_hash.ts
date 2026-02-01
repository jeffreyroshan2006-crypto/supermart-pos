import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${buf.toString("hex")}`;
}

(async () => {
    const hash = await hashPassword("admin123");
    console.log(hash);
})();
