async function test() {
  const res = await fetch('http://localhost:3000/api/market/history?symbol=RELIANCE');
  console.log(res.status);
  const data = await res.json();
  console.log(data);
}
test();
