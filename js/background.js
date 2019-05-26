// 请求头和响应头可能有不同大小写
function isHeaderNameEqual(name1, name2) {
  return name1.toLowerCase() === name2.toLowerCase();
}

/** ********************** 拦截请求头，改user-agent以访问手机版网页 **************** */
// 该部分参考了：https://github.com/jugglinmike/chrome-user-agent/blob/master/src/background.js
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const headers = details.requestHeaders;
    // 百度翻译要特殊处理，除了首页，以下两个api也需要改user-agent才能获取到数据
    // 且只有移动端才使用该api
    // https://fanyi.baidu.com/basetrans
    // https://fanyi.baidu.com/extendtrans
    if (
      details.url.indexOf('x-from=co-translate-extension') !== -1
      || details.url.indexOf('fanyi.baidu.com/basetrans') !== -1
      || details.url.indexOf('fanyi.baidu.com/extendtrans') !== -1
    ) {
      let i = 0;
      for (const l = headers.length; i < l; ++i) {
        if (isHeaderNameEqual(headers[i].name, 'User-Agent')) {
          break;
        }
      }
      if (i < headers.length) {
        headers[i].value = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1';
      }
    }
    return {
      requestHeaders: headers
    };
  },
  {
    urls: [
      '*://fanyi.sogou.com/*x-from=co-translate-extension*',
      // 百度翻译要特殊处理
      '*://fanyi.baidu.com/*',
      '*://*.youdao.com/*x-from=co-translate-extension*',
      '*://*.ydstatic.com/*x-from=co-translate-extension*'
    ]
  },
  ['requestHeaders', 'blocking']
);

/** ********************* 处理部分网站CSP限制导致插件不工作问题 ***************** */
function isCSPHeader(headerName) {
  return (
    isHeaderNameEqual(headerName, 'content-security-policy')
    || isHeaderNameEqual(headerName, 'x-webkit-csp')
    || isHeaderNameEqual(headerName, 'x-content-security-policy')
  );
}
// 参考了：https://gist.github.com/dchinyee/5992397
// Listens when new request
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    let xFrameOptionsIndex = -1;
    for (let i = 0; i < details.responseHeaders.length; i++) {
      if (isCSPHeader(details.responseHeaders[i].name)) {
        let csp = details.responseHeaders[i].value;

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

        // eslint-disable-next-line no-param-reassign
        details.responseHeaders[i].value = csp;
      }

      if (
        isHeaderNameEqual(details.responseHeaders[i].name, 'X-FRAME-OPTIONS')
      ) {
        xFrameOptionsIndex = i;
      }
    }
    if (xFrameOptionsIndex !== -1) {
      // 因为没有初始选项，删除这个响应头
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

/** ************* 保证从插件内跳转的网页都带 x-from=co-translate-extension 参数  ********** */

// 判断refer是否包含 co-translate-extension，保持 co-translate-extension 的存在
// 参考了 https://stackoverflow.com/questions/26720766/redirecting-those-urls-which-are-not-having-any-referrer-urls
const requestsToRedirect = {};

// 兼容 extraHeaders
const extraInfoSpec = ['blocking', 'requestHeaders'];
if (
  chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')
) {
  extraInfoSpec.push('extraHeaders');
}

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // get请求才做重定向
    if (details.method !== 'GET') {
      return {};
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
        headers[i].value.indexOf('x-from=co-translate-extension') !== -1
        && details.url.indexOf('hm.baidu.com') !== -1
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
      const needAddQuery = headers[i].value.indexOf('x-from=co-translate-extension') !== -1
        && details.url.indexOf('x-from=co-translate-extension') === -1;
      if (needAddQuery) {
        requestsToRedirect[details.requestId] = headers[i].value;
        return {};
      }
    }

    // 有道比较特殊，如果没有关键字参数会302跳转，且不一定有refer（直接访问时），导致丢失 x-from
    if (details.url.indexOf('m.youdao.com/dict') !== -1) {
      if (
        details.url.indexOf('x-from=co-translate-extension') !== -1
        && !new URL(details.url).searchParams.get('q')
      ) {
        requestsToRedirect[details.requestId] = details.url;
      }
    }
    return {};
  },
  {
    urls: ['<all_urls>']
  },
  // 72版本起，访问refer需要extraHeaders，72之前加了会报错，需要兼容
  // https://groups.google.com/a/chromium.org/d/msg/chromium-extensions/vYIaeezZwfQ/hVln6g1OAgAJ
  extraInfoSpec
);

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
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
    }
    return {};
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders', 'blocking']
);

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    // Cleanup in case we don't reach onHeadersReceived
    delete requestsToRedirect[details.requestId];
  },
  { urls: ['<all_urls>'] }
);
