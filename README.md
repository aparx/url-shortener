# url-shortener
Securely shorten URLs with opt-in password protection, one-time use, expiration and more.
<div style="columns: 2">
	<img width = "400" src="https://github.com/user-attachments/assets/58d24604-98a8-4e14-b3fa-6aa7e07bf710">
  <img width = "400" src="https://github.com/user-attachments/assets/a4270bd2-db96-46c3-9844-0268a8702cbc">
</div>

## Technologies and modularity
This shortener was realised with NextJS 15, Drizzle (SQLite/Turso) & Tailwind CSS. The actual backend is split up in service interfaces to provide maximum modularity and isolate responsibilities. You can find most services and backend under `src/services`. 

### Encryption and hashing (`UrlCryptography`)
The default encryption standard used for URL encryption is _AES-256-CBC_, with a random 16 byte long seed as the initialization vector generated through the `UrlCryptography` interface. The default hashing algorithm for passwords is _pbkdf_ with SHA-512, the same seed used as the IV for URL encryption and decryption is used as the salt. The seed is simply stored alongside the shortened URL data (same row) in the database.

### Accessibility & responsiveness
The entire application is built with accessibility and responsiveness in mind. Tho, in the current implementation this mindset is not entirely matured nor tested yet. Expect future updates to correctly validate that behaviour.

<br/>Following dependencies also have had an impact:
- [`framer-motion`](https://www.npmjs.com/package/framer-motion), [`react-qr-code`](https://www.npmjs.com/package/react-qr-code), [`react-icons`](https://www.npmjs.com/package/react-icons), [`@radix-ui/*`](https://www.npmjs.com/search?q=%40radix-ui), [`@paralleldrive/cuid2`](https://www.npmjs.com/package/@paralleldrive/cuid2), ...

## Environment variables
Following environment variables are required in order for this project to work in its entirety:
| Variable Name | Description |
| :--- | :--- |
| `NEXT_PUBLIC_URL` | URL hostname (including protocol) of your website. For example: `http://localhost:3000`, where the dynamic routing is appended. Or for example `https://aparx.dev`, where a link whose path is `abc` resolves to `https://aparx.dev/abc`.
| `URL_ENCRYPTION_KEY` | The default implementation expects this key, used to encrypt and decrypt endpoint URLs using AES-256 in CBC mode. The default encoding for this string is **base64**, thus this string must be a 32 byte base64 encoded cryptographic key. **There is no key rotation by default.**
| `TURSO_DATABASE_URL` | Used as the target database URL that Drizzle can connect to |
| `TURSO_AUTH_TOKEN` | The auth token authenticating the Drizzle client to Turso |
