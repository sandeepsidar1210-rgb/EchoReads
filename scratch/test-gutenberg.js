async function test() {
  const urls = [
    'https://www.gutenberg.org/cache/epub/6130/pg6130.txt',
    'https://www.gutenberg.org/files/6130/6130-0.txt',
    'https://www.gutenberg.org/ebooks/6130.txt.utf-8'
  ];
  for (let url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'EchoReads/1.0' } });
      console.log(`URL: ${url} -> Status: ${res.status}, Type: ${res.headers.get('content-type')}`);
      if (res.ok) {
        const txt = await res.text();
        console.log(`Length: ${txt.length}, Preview: ${txt.slice(0, 100).replace(/\r?\n/g, ' ')}`);
      }
    } catch (e) {
      console.log(`URL: ${url} -> Error: ${e.message}`);
    }
  }
}
test();
