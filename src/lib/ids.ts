import { customAlphabet } from "nanoid";

// URL-safe, no ambiguous characters. 16 chars ≈ 83 bits of entropy.
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const newId = customAlphabet(alphabet, 16);
