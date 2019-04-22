const data = new ExtData();

// 获取初始数据
(function init() {
  const currentVersion = chrome.runtime.getManifest().version;
  $('.current-version').text(currentVersion);
  fetch('https://update.e12e.com/co-trans-ext/')
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, 'text/xml'))
    .then(doc => {
      // const appId = chrome.runtime.id;
      const appId = 'keigenoolicjcehlbpjcfhdjdmaochie';
      const $updateCheck = $(doc)
        .find(`[appid=${appId}]`)
        .find('updatecheck');
      const latestVersion = $updateCheck.attr('version');
      $('.latest-version').text(latestVersion);
      if (latestVersion !== currentVersion) {
        // 有更新
        $('.not-latest').show();
        $('.not-latest a').attr('href', $updateCheck.attr('codebase'));
      } else {
        $('.already-latest').show();
      }
    });
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

// 谷歌分析
$('.not-latest a').click(() => {
  ga('send', 'event', 'update', 'click-button');
});
