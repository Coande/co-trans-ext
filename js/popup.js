const data = new extData();
const transExt = $('.trans-ext__popup');
const transIframe = $('.trans-ext__iframe');

// 加载图标
loadCSS('https://at.alicdn.com/t/font_1141105_4dqgo0hxye9.css', 'iconfont');
transIframe.attr(
  'src',
  `${data
    .get(data.get('transTool'))
    .replace('KEYWORD', '')
    .replace('SHOWDETAIL', true)}`
);

// 获取并高亮当前使用的搜索工具
const activeTransTool = transExt.find(
  `.trans-ext__tool[data-trans-tool=${data.get('transTool')}]`
);

activeTransTool.addClass('active');

// 添加搜索工具图标点击事件
transExt.find(`.trans-ext__tool`).click(function(event) {
  const transTool = $(event.target).data('trans-tool');
  transExt.find('.trans-ext__tool').removeClass('active');
  transExt
    .find(`.trans-ext__tool[data-trans-tool=${transTool}]`)
    .addClass('active');
  data.set('transTool', transTool);
  let iframeURL = data.get(data.get('transTool'));
  iframeURL = iframeURL.replace('KEYWORD', '');
  iframeURL = iframeURL.replace('SHOWDETAIL', true);
  transIframe.attr('src', iframeURL);
});

// 网页翻译
transExt.find('.trans-ext__trans-page-tool').click(function() {
  const transTool = $(this).data('trans-tool');
  chrome.tabs.getSelected(null, function(tab) {
    if (transTool === 'yandex') {
      window.open(
        `https://translate.yandex.com/translate?url=${tab.url}&lang=en-zh`
      );
    } else if (transTool === 'youdao') {
      // 有道网页翻译
      chrome.tabs.executeScript(tab.id, {
        file: 'lib/youdao-web-translate/web2/seed.js'
      });
      chrome.tabs.insertCSS(tab.id, {
        file: 'lib/youdao-web-translate/web2/styles/cover.css'
      });
    }
  });
});
