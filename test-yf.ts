import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function test() {
  try {
    const result = await yahooFinance.search('RELIANCE');
    console.log(result.quotes[0]);
  } catch (e) {
    console.error(e);
  }
}

test();
