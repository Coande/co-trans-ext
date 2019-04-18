function extData() {}

extData.prototype.set = function(key, value, callback) {
  chrome.storage.sync.set({ [key]: value }, () => {
    if (callback) callback();
  });
  this[key] = value;
};

extData.prototype.get = function(key, callback) {
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
      'https://m.youdao.com/dict?le=eng&q=KEYWORD&x-from=co-translate-extension&showDetail=SHOWDETAIL',
    kingsoft:
      'https://m.iciba.com/KEYWORD?x-from=co-translate-extension&showDetail=SHOWDETAIL'
  };
  chrome.storage.sync.get([key], result => {
    if (result[key] === undefined) {
      callback(defaultOptions[key]);
      return;
    }
    callback(result[key]);
  });
};
