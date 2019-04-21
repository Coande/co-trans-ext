window.ga =
  window.ga ||
  function() {
    (ga.q = ga.q || []).push(arguments);
  };
ga.l = +new Date();

/*************************** 初始化内容 ***********************/
const propertyID = 'UA-65836121-2';
ga('create', propertyID, 'auto');
// 以下必须设置，否则会检查协议，默认只支持http和https
ga('set', 'checkProtocolTask', null);

// 只要设置 appVersion，Google Analytics 就接收不到数据，是一个bug。只要自定义一个维度。
// https://stackoverflow.com/questions/36508241/how-do-i-set-appversion-for-google-analytics-event-tracking
// ga('set', 'appVersion', chrome.runtime.getManifest().version);
ga('set', 'dimension1', chrome.runtime.getManifest().version);

// 设置是否停用
function setIsDisableGA(isDisable) {
  window[`ga-disable-${propertyID}`] = isDisable;
}

// 判断是否需要禁用
const data = new ExtData();
data.get('isEnabledAnalytics', isEnable => {
  setIsDisableGA(!isEnable);
});

/*************************** 功能函数 ************************/

// 运行时记录
// 必须设置路径，否则谷歌分析拒绝接收 chrome-extension 协议路径
ga('send', 'pageview', '/background.html');

// 监听从 content-script 传递过来的事件
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.ga) {
    ga(...request.ga);
  }
});
