async function fetchNSE() {
  try {
    const baseHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    console.log('Fetching homepage for cookies...');
    const homeRes = await fetch('https://www.nseindia.com', { headers: baseHeaders });
    
    // In built-in fetch, headers.get('set-cookie') returns a comma-separated string
    const cookieHeader = homeRes.headers.get('set-cookie');
    let cookieStr = '';
    if (cookieHeader) {
      cookieStr = cookieHeader.split(',').map(c => c.split(';')[0]).join('; ');
    }
    console.log('Cookies:', cookieStr);

    console.log('Fetching announcements...');
    const apiRes = await fetch('https://www.nseindia.com/api/corporates-announcements', {
      headers: {
        ...baseHeaders,
        'Cookie': cookieStr
      }
    });

    console.log('Status:', apiRes.status);
    if (apiRes.ok) {
      const data = await apiRes.json();
      console.log('Data length:', data.data ? data.data.length : 0);
    } else {
      console.log('Text:', await apiRes.text());
    }
  } catch (e) {
    console.error(e);
  }
}

fetchNSE();
