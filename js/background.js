// 拦截请求头，改为手机版以访问手机版网页
// 该部分参考了：https://github.com/jugglinmike/chrome-user-agent/blob/master/src/background.js
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
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
    let xFrameOptionsIndex = -1;
    for (i = 0; i < details.responseHeaders.length; i++) {
      if (isCSPHeader(details.responseHeaders[i].name)) {
        var csp = details.responseHeaders[i].value;

        // 有可能只有default-src或者child-src
        csp = csp.replace(
          'default-src',
          'default-src fanyi.sogou.com fanyi.baidu.com translate.google.cn m.youdao.com m.iciba.com fanyi.youdao.com at.alicdn.com data: cidian.youdao.com'
        );
        csp = csp.replace(
          'child-src',
          'child-src fanyi.sogou.com fanyi.baidu.com translate.google.cn m.youdao.com m.iciba.com fanyi.youdao.com at.alicdn.com data: cidian.youdao.com'
        );

        // append "https://fanyi.sogou.com/" to the authorized sites
        csp = csp.replace(
          'frame-src',
          'frame-src fanyi.sogou.com fanyi.baidu.com translate.google.cn m.youdao.com m.iciba.com fanyi.youdao.com'
        );
        csp = csp.replace(
          'style-src',
          'style-src at.alicdn.com fanyi.youdao.com'
        );
        csp = csp.replace('font-src', 'font-src at.alicdn.com data:');
        csp = csp.replace('img-src', 'img-src fanyi.youdao.com');

        // 有道网页翻译语音
        csp = csp.replace('object-src', 'object-src cidian.youdao.com');

        details.responseHeaders[i].value = csp;
      }

      if (isXFrameOptions(details.responseHeaders[i].name)) {
        xFrameOptionsIndex = i;
      }
    }
    if (xFrameOptionsIndex !== -1) {
      // 删除这个响应头
      details.responseHeaders.splice(xFrameOptionsIndex, 1);
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
    isHeaderNameEqual(headerName, 'content-security-policy') ||
    isHeaderNameEqual(headerName, 'x-webkit-csp') ||
    isHeaderNameEqual(headerName, 'x-content-security-policy')
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
      // block掉广告
      if (
        details.url.indexOf(
          '//dictionary.iciba.com/dictionary/getWebFeedsAd'
        ) !== -1
      ) {
        return { cancel: true };
      }

      // refer 中有x-from 且 当前没有 x-from 才需要处理
      const needAddQuery =
        headers[i].value.indexOf('x-from=co-translate-extension') !== -1 &&
        details.url.indexOf('x-from=co-translate-extension') === -1;
      if (needAddQuery) {
        requestsToRedirect[details.requestId] = headers[i].value;
        return;
      }
    }

    // 有道比较特殊，如果没有关键字参数会302跳转，且不一定有refer（直接访问时），导致丢失 x-from
    if (details.url.indexOf('m.youdao.com/dict') !== -1) {
      if (
        details.url.indexOf('x-from=co-translate-extension') !== -1 &&
        !new URL(details.url).searchParams.get('q')
      ) {
        requestsToRedirect[details.requestId] = details.url;
        return;
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
      // 当响应的是html 或者 响应码是3xx 时才需要处理
      if (i < headers.length) {
        if (headers[i].value.indexOf('text/html') !== -1) {
          const urlObj = new URL(details.url);
          urlObj.searchParams.set('x-from', 'co-translate-extension');
          const showDetail = new URL(referUrl).searchParams.get('showDetail');
          urlObj.searchParams.set('showDetail', showDetail);
          return { redirectUrl: urlObj.href };
        }
      }
      if (`${details.statusCode}`.startsWith('3')) {
        i = 0;
        for (const l = headers.length; i < l; ++i) {
          if (isHeaderNameEqual(headers[i].name, 'Location')) {
            break;
          }
        }
        if (i < headers.length) {
          const urlObj = new URL(headers[i].value);
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
