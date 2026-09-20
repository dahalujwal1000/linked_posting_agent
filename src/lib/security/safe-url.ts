const privateHosts = /(^localhost$)|(^127\.)|(^0\.)|(^10\.)|(^192\.168\.)|(^169\.254\.)|(^172\.(1[6-9]|2\d|3[0-1])\.)|(^\[?::1\]?$)/i;
export function assertSafeExternalUrl(input: string) {
  const url = new URL(input);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only HTTP(S) URLs are allowed.");
  if (privateHosts.test(url.hostname) || url.hostname.endsWith(".local") || url.hostname.endsWith(".internal")) throw new Error("Private and local network addresses are blocked.");
  if (url.username || url.password) throw new Error("Credential-bearing URLs are blocked.");
  return url;
}
