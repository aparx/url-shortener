# url-shortener

Securely shorten URLs with opt-in password protection, one-time use, expiration and more.

<div style="columns: 2">
	<img width = "400" src="https://github.com/user-attachments/assets/58d24604-98a8-4e14-b3fa-6aa7e07bf710">
  <img width = "400" src="https://github.com/user-attachments/assets/a4270bd2-db96-46c3-9844-0268a8702cbc">
</div>

## Table Of Contents
- [Technologies and services](#technologies-and-services)
  - [UrlCryptography: Encryption and hashing](#urlcryptography-encryption-and-hashing)
  - [UrlSafetyService: URL safety evaluation](#urlsafetyservice-url-safety-evaluation)
  - [UrlVisitService: Visit tracking](#urlvisitservice-visit-tracking)
  - [Google Recaptcha (v3)](#google-recaptcha-v3)
  - [Dependencies](#dependencies)
- [User Experience](#user-experience)
  - [Accessibility and responsiveness](#accessibility-and-responsiveness)
  - [Redirect warnings](#redirect-warnings)
- [Environment Variables](#environment-variables)

## Technologies and services

This shortener was realised with NextJS 15, Drizzle (SQLite/Turso) & Tailwind CSS. The actual backend is split up in service interfaces to provide maximum modularity and isolate responsibilities. You can find most services and backend under [`src/services`](https://github.com/aparx/url-shortener/tree/master/src/services).

### UrlCryptography: Encryption and hashing
The URL encryption uses [**AES-256-CBC**](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard), where each shortened URL is encrypted with a unique random 16-byte initialization vector (IV). Passwords are hashed using [**PBKDF2**](https://en.wikipedia.org/wiki/PBKDF2) with SHA-512, and the same seed is used as the salt for password hashing. The seed - and thus the IV and salt - are unique, or at least random, to each shortened URL and stored alongside them in the table for shortened URLs.

### UrlSafetyService: URL safety evaluation
By integrating with Google's Safe Browsing API, this service checks the safety of URLs during shortening. If no Google API key is available, the URL is marked as insecure by default. However, this service does not require Google's API, since it is used as an interface to evaluate whether it is worth to show a redirection warning to a user (thus interrupting the flow), it is just a default implementation using Google's API.

### UrlVisitService: Visit tracking
This service tracks visits and URL decryption events. Each decryption counts as a "visit" even if the user doesn't click the shortened link directly, potentially offering more granular analytics in the future.
The reasoning behind this is, that a user - as soon as they receive the endpoint as plaintext - can visit it themselves without using the shortener as redirection tool. 

### Google Recaptcha (v3)
The shortener uses the score based "hidden" Google Recaptcha to verify incoming shortening requests. The library used for this is [`react-google-recaptcha-v3`](https://www.npmjs.com/package/react-google-recaptcha-v3). As of the current implementation, it is missing proper error handling for when the recaptcha fails.

### Dependencies
Following dependencies also have had an impact:
- [`react-google-recaptcha-v3`](https://www.npmjs.com/package/react-google-recaptcha-v3), [`framer-motion`](https://www.npmjs.com/package/framer-motion), [`react-qr-code`](https://www.npmjs.com/package/react-qr-code), [`react-icons`](https://www.npmjs.com/package/react-icons), [`@radix-ui/*`](https://www.npmjs.com/search?q=%40radix-ui), [`@paralleldrive/cuid2`](https://www.npmjs.com/package/@paralleldrive/cuid2), ...

## User experience

### Accessibility and responsiveness
The entire application is built with accessibility and responsiveness in mind. Tho, in the current implementation this mindset is not entirely matured nor tested yet. Expect future updates to correctly validate that behaviour.

### Redirect warnings
<img align="right" src="https://github.com/user-attachments/assets/9a9274bd-8538-43b3-9d60-ccabd6aa0d47" width="300" />
When an endpoint has been marked insecure during its shortening, a user is shown a warning when trying to access that endpoint via the shortened link. By default, users are redirected immediately, without any intermediate warning about the endpoint, unless the secure flag is false, causing the warning to appear before redirection. This way, it requires a user's consent and also warns them of possible harmful content.
<p>
	<br />
	The default implementation uses <a href="https://developers.google.com/safe-browsing">Googles Safe Browsing API</>.
</p>
<br clear="right"/>

## Environment variables

Following environment variables are required in order for this project to work in its entirety:
| Variable Name | Description |
| :--- | :--- |
| `NEXT_PUBLIC_URL`* | URL hostname (including protocol) of your website. For example: `http://localhost:3000`, where the dynamic routing is appended. Or for example `https://aparx.dev`, where a link whose path is `abc` resolves to `https://aparx.dev/abc`.
| `URL_ENCRYPTION_KEY`* | The default implementation expects this key, used to encrypt and decrypt endpoint URLs using AES-256 in CBC mode. The default encoding for this string is **base64**, thus this string must be a 32 byte base64 encoded cryptographic key. **There is no key rotation by default.**
| `TURSO_DATABASE_URL`* | Used as the target database URL that Drizzle can connect to |
| `TURSO_AUTH_TOKEN`* | The auth token authenticating the Drizzle client to Turso |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`* | Google Recaptcha v3 Site Key ([get them here](https://www.google.com/recaptcha/about/)) |
| `RECAPTCHA_SECRET_KEY`* | Google Recaptcha v3 Secret ([get them here](https://www.google.com/recaptcha/about/)) |
| `GOOGLE_SAFETY_API_KEY` | Google API key used for Google's Safe Browsing API (v4) |
| `GOOGLE_SAFETY_CLIENT_ID` | Client - not user - used for analytical purposes by Google  |
| `GOOGLE_SAFETY_CLIENT_VERSION` | Client ID - not user - used for analytical purposes by Google  |
<p>* = Required</p>
