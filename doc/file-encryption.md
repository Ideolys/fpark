# File encryption

All the files are encrypted by design. When posting a file to Fpark with `PUT /file/container/:containerId/:filename`, the parameter `filemname` is used to encrypt the content of the file.

The following config parameters allow you to customize encryption settings `"ENCRYPTION_IV", "ENCRYPTION_IV_LENGTH", "ENCRYPTION_ALGORITHM"`.

Internally, Fpark encrypts files with [`crypto.createCipheriv(algorithm, key, iv[, options])`](https://nodejs.org/api/crypto.html#crypto_crypto_createcipheriv_algorithm_key_iv_options).

The only way to decrypt a file is to know the filename **and** the `ENCRYPTION_IV`.
