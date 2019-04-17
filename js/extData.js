function extData() {
  // 部分页面的iframe可能被限制部分功能，导致无法使用localStorage
  // Uncaught SecurityError: Failed to read the 'localStorage' property from 'Window': The document is sandboxed and lacks the 'allow-same-origin' flag
}

extData.prototype.set = function(key, value) {
  localStorage.setItem(key, value);
  this[key] = value;
};

extData.prototype.get = function(key) {
  const defaultOptions = {
    transTool: 'sogou',
    sogou:
      'https://fanyi.sogou.com/?keyword=KEYWORD&transfrom=auto&transto=zh-CHS&x-from=co-translate-extension&showDetail=SHOWDETAIL',
    baidu:
      'https://fanyi.baidu.com/?x-from=co-translate-extension&showDetail=SHOWDETAIL#en/zh/KEYWORD',
    // Google 如果不用 https，会自动跳转到 https ，导致 query 数据丢失
    google:
      'https://translate.google.cn/?x-from=co-translate-extension&showDetail=SHOWDETAIL#view=home&op=translate&sl=auto&tl=zh-CN&text=KEYWORD',
    youdao:
      'https://m.youdao.com/dict?le=eng&q=KEYWORD&x-from=co-translate-extension&showDetail=SHOWDETAIL'
  };
  const val = localStorage.getItem(key);
  if (val === null) {
    return defaultOptions[key];
  }
  return val;
};
