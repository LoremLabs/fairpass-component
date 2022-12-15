export const shaWorkerCode = `

async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder('utf-8').encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function findMatch({type, nonce, scope = 'global'}) {

  if (type !== 'sha256') {
    return;
  }

  let prefix = "000";
  nonce = nonce || Math.random().toString(36).substr(2, 10);

  let counter = 0;
  let start = performance.now();
  let now = Date.now();
  let resulthash = new String('');
  let found = false;
  while (!found && counter < 99999) {
    counter++;
    resulthash = await sha256(\`\${scope}:\${nonce}:\${now}:\${counter}\`);
    found = resulthash.startsWith(prefix);
  }
  var duration = performance.now() - start;
  var result = {
    nonce: nonce,
    counter: counter,
    duration: duration,
    scope,
    now,
    hash: resulthash
  };
  return result;
}
var self = this;
self.addEventListener('message', async function (e) {
    const src = e.data;
    const result = await findMatch(src);
    console.log('hash', result, e);
    self.postMessage({type: 'sha256', ...src, ...result});
}, false); 
`;

export const shaWorker = () => {
  let worker;
  try {
    const blob = new Blob([shaWorkerCode], { type: "text/javascript" });
    const url = window.URL.createObjectURL(blob);
    worker = new Worker(url);
  } catch (e) {
    console.log(e);
    throw new Error("Failed to create sha");
  }
  return worker;
};
