const data = new ExtData();

// 获取初始数据
(function init() {
  // 显示当前是否启用分析
  data.get('isEnabledAnalytics', val => {
    $('#isEnabledAnalytics').attr('checked', val);
  });
})();

// 监听是否启用分析checkbox的事件
$('#isEnabledAnalytics').change(event => {
  const checked = event.target.checked;
  data.set('isEnabledAnalytics', checked);
  // 通知停用或启用
  var bg = chrome.extension.getBackgroundPage();
  if (checked) {
    bg.setIsDisableGA(!checked);
    ga('send', 'event', 'ga-options', 'enable');
  } else {
    ga('send', 'event', 'ga-options', 'disable');
    bg.setIsDisableGA(!checked);
  }
});

// 接收iframe内部通过postMessage传递过来的数据
// 获取 iframe 里面内容高度，动态设置iframe高度，尽量避免不必要的滚动条
window.addEventListener('message', function(event) {
  if (event.data.iframeHeight) {
    if (event.data.iframeHeight < 400) {
      $('.reward__list').height(event.data.iframeHeight);
    } else {
      $('.reward__list').height(400);
    }
  }
});

// 谷歌分析
$('.reward__button').click(() => {
  ga('send', 'event', 'reward', 'click-button');
});
