const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Encodes a 64-bit size unique identifier into a Base62 string.
 * We can use a simple random string generator for Base62 if we don't have integer IDs setup easily,
 * but to mimic production, we will generate a random combination or time-based one.
 */
function generateShortCode(length = 6) {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * BASE62_ALPHABET.length);
    result += BASE62_ALPHABET[randomIndex];
  }
  return result;
}

module.exports = {
  generateShortCode
};
