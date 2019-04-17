// 拦截请求头，改为手机版以访问手机版网页
// 该部分参考了：https://github.com/jugglinmike/chrome-user-agent/blob/master/src/background.js
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    console.log('details==', details);
    const headers = details.requestHeaders;
    let i = 0;
    for (const l = headers.length; i < l; ++i) {
      if (headers[i].name == 'User-Agent') {
        break;
      }
    }
    if (i < headers.length) {
      headers[i].value =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1';
    }
    return {
      requestHeaders: headers
    };
  },
  {
    urls: [
      '*://fanyi.sogou.com/*x-from=co-translate-extension*',
      '*://fanyi.baidu.com/*',
      '*://*.youdao.com/*x-from=co-translate-extension*',
      '*://*.ydstatic.com/*x-from=co-translate-extension*'
    ]
  },
  ['requestHeaders', 'blocking']
);

// 处理部分网站CPS限制导致插件不工作问题
// 参考了：https://gist.github.com/dchinyee/5992397
// Listens when new request
chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    for (i = 0; i < details.responseHeaders.length; i++) {
      if (isCSPHeader(details.responseHeaders[i].name.toUpperCase())) {
        var csp = details.responseHeaders[i].value;

        // append "https://fanyi.sogou.com/" to the authorized sites
        csp = csp.replace(
          'frame-src',
          'frame-src fanyi.sogou.com fanyi.baidu.com translate.google.cn m.youdao.com'
        );
        csp = csp.replace('style-src', 'style-src at.alicdn.com');
        csp = csp.replace('font-src', 'font-src at.alicdn.com data:');

        details.responseHeaders[i].value = csp;
      }

      if (isXFrameOptions(details.responseHeaders[i].name.toUpperCase())) {
        // 删除这个响应头
        details.responseHeaders.splice(i, 1);
      }
    }

    return {
      // Return the new HTTP header
      responseHeaders: details.responseHeaders
    };
  },
  {
    urls: ['<all_urls>']
  },
  ['blocking', 'responseHeaders']
);

function isHeaderNameEqual(name1, name2) {
  return name1.toLowerCase() === name2.toLowerCase();
}

function isCSPHeader(headerName) {
  return (
    isHeaderNameEqual(headerName, 'CONTENT-SECURITY-POLICY') ||
    isHeaderNameEqual(headerName, 'X-WEBKIT-CSP')
  );
}

function isXFrameOptions(headerName) {
  return isHeaderNameEqual(headerName, 'X-FRAME-OPTIONS');
}

// 判断refer是否包含 co-translate-extension，保持 co-translate-extension 的存在
// 参考了 https://stackoverflow.com/questions/26720766/redirecting-those-urls-which-are-not-having-any-referrer-urls
var requestsToRedirect = new Object();

// 兼容 extraHeaders
const extraInfoSpec = ['blocking', 'requestHeaders'];
if (
  chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')
) {
  extraInfoSpec.push('extraHeaders');
}

chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    // get请求才做重定向
    if (details.method !== 'GET') {
      return;
    }

    const headers = details.requestHeaders;
    let i = 0;
    for (const l = headers.length; i < l; ++i) {
      if (isHeaderNameEqual(headers[i].name, 'Referer')) {
        break;
      }
    }

    if (i < headers.length) {
      // block 掉 百度统计，影响速度
      if (
        headers[i].value.indexOf('x-from=co-translate-extension') !== -1 &&
        details.url.indexOf('hm.baidu.com') !== -1
      ) {
        return { cancel: true };
      }

      // refer 中有x-from 且 当前没有 x-from 才需要处理
      const needAddQuery =
        headers[i].value.indexOf('x-from=co-translate-extension') !== -1 &&
        details.url.indexOf('x-from=co-translate-extension') === -1;
      if (needAddQuery) {
        requestsToRedirect[details.requestId] = headers[i].value;
      }
    }
    return;
  },
  {
    urls: ['<all_urls>']
  },
  // 72版本起，访问refer需要extraHeaders，72之前加了会报错，需要兼容
  // https://groups.google.com/a/chromium.org/d/msg/chromium-extensions/vYIaeezZwfQ/hVln6g1OAgAJ
  extraInfoSpec
);

chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    if (requestsToRedirect[details.requestId]) {
      const referUrl = requestsToRedirect[details.requestId];
      delete requestsToRedirect[details.requestId];

      const headers = details.responseHeaders;
      let i = 0;
      for (const l = headers.length; i < l; ++i) {
        if (isHeaderNameEqual(headers[i].name, 'content-type')) {
          break;
        }
      }
      if (i < headers.length) {
        if (headers[i].value.indexOf('text/html') !== -1) {
          const urlObj = new URL(details.url);
          urlObj.searchParams.set('x-from', 'co-translate-extension');
          const showDetail = new URL(referUrl).searchParams.get('showDetail');
          urlObj.searchParams.set('showDetail', showDetail);
          return { redirectUrl: urlObj.href };
        }
      }
      return;
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders', 'blocking']
);

chrome.webRequest.onErrorOccurred.addListener(
  function(details) {
    // Cleanup in case we don't reach onHeadersReceived
    delete requestsToRedirect[details.requestId];
  },
  { urls: ['<all_urls>'] }
);
