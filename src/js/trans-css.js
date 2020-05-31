(function loadCustomCss() {
  const url = new URL(window.location.href);
  const origin = url.origin;
  switch (origin) {
    case 'https://fanyi.sogou.com':
      loadCSS('https://cdn.jsdelivr.net/gh/Coande/co-trans-ext@master/src/css/sogou.css');
      break;
    case 'https://fanyi.baidu.com':
      loadCSS('https://cdn.jsdelivr.net/gh/Coande/co-trans-ext@master/src/css/baidu.css');
      break;
    case 'https://translate.google.cn':
      loadCSS('https://cdn.jsdelivr.net/gh/Coande/co-trans-ext@master/src/css/google.css');
      break;
    case 'https://m.youdao.com':
      loadCSS('https://cdn.jsdelivr.net/gh/Coande/co-trans-ext@master/src/css/youdao.css');
      break;
    case 'https://m.iciba.com':
      loadCSS('https://cdn.jsdelivr.net/gh/Coande/co-trans-ext@master/src/css/kingsoft.css');
      break;

    default:
      break;
  }
}());
