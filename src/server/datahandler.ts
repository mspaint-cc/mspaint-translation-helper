"use server";

import { cookies } from "next/headers";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

export async function set_key(key: string) {
    const AUTH_SECRET = process.env.AUTH_SECRET;
    if (!AUTH_SECRET) throw new Error("AUTH_SECRET is not defined");

    const iv = randomBytes(12);
    
    const cipher = createCipheriv(
        "aes-256-gcm",
        Buffer.from(AUTH_SECRET.slice(0, 32).padEnd(32, "0")),
        iv
    );

    const encryptedKey = Buffer.concat([
        cipher.update(key, "utf8"),
        cipher.final(),
    ]);


    const authTag = cipher.getAuthTag();
    const encryptedData = Buffer.concat([iv, encryptedKey, authTag]).toString("base64");

    (await cookies()).set("key", encryptedData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7 * 1000,
        path: "/",
    });

    return "ok";
}

export async function get_key() {
    const AUTH_SECRET = process.env.AUTH_SECRET;
    if (!AUTH_SECRET) throw new Error("AUTH_SECRET is not defined");
    
    const encryptedData = (await cookies()).get("key");
    if (!encryptedData) return null;
    
    const buffer = Buffer.from(encryptedData.value, "base64");
    
    // Extract parts from the buffer
    const iv = buffer.subarray(0, 12);
    const authTag = buffer.subarray(buffer.length - 16);
    const encryptedKey = buffer.subarray(12, buffer.length - 16);
    
    const decipher = createDecipheriv(
        "aes-256-gcm",
        Buffer.from(AUTH_SECRET.slice(0, 32).padEnd(32, "0")),
        iv
    );
    
    decipher.setAuthTag(authTag);
    
    const decryptedKey = Buffer.concat([
        decipher.update(encryptedKey),
        decipher.final(),
    ]);
    
    return decryptedKey.toString("utf8");
}