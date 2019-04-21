// 谷歌分析
function ga(...args) {
  args.push({
    page: '/popup.html'
  });
  const bg = chrome.extension.getBackgroundPage();
  bg.ga(...args);
}

ga('send', 'pageview');
