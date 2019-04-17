// 存储选中的文本内容
let selectedText;
const data = new extData();

// 弹窗移动相关数据
// 翻译弹窗的移动
let isMoving = false;
let startX = 0;
let startY = 0;
let startTop = 0;
let startLeft = 0;

// 插件注入的页面结构
const transExt = $(`
<div class="trans-ext">
  <div class="trans-ext__trans-btn">译</div>
  <div class="trans-ext__popup">
    <div class="trans-ext__title-bar">
      <div class="trans-ext__title-center">
        <i class="iconfont icon-sogou trans-ext__tool" data-trans-tool="sogou" title="搜狗翻译"></i>
        <i class="iconfont icon-baidu trans-ext__tool" data-trans-tool="baidu" title="百度翻译"></i>
        <i class="iconfont icon-google1 trans-ext__tool" data-trans-tool="google" title="谷歌翻译"></i>
        <i class="iconfont icon-youdao trans-ext__tool" data-trans-tool="youdao" title="有道翻译"></i>
        <i class="iconfont icon-kingsoft trans-ext__tool" data-trans-tool="kingsoft" title="金山词霸"></i>
      </div>
      <div class="trans-ext__title-right">
        <i class="iconfont icon-zhankai1 trans-ext__tool-down" title="显示更多"></i>
        <i class="iconfont icon-shouqi trans-ext__tool-up" title="收起更多"></i>
        <i class="iconfont icon-guanbi trans-ext__tool-close" title="关闭"></i>
      </div>
    </div>
    <iframe class="trans-ext__iframe"></iframe>
  </div>
</div>
`);

// 后续需要操作的相关元素
const transBtn = transExt.find('.trans-ext__trans-btn');
transBtn.hide();
const transPopup = transExt.find('.trans-ext__popup');
transPopup.hide();
const transIframe = transExt.find('.trans-ext__iframe');
const transPopupTitleBar = transExt.find('.trans-ext__title-bar');

// 默认显示展开按钮
transExt.find('.trans-ext__tool-up').hide();

// 获取并高亮当前使用的搜索工具
const activeTransTool = transExt.find(
  `.trans-ext__tool[data-trans-tool=${data.get('transTool')}]`
);

activeTransTool.addClass('active');

// 切换详细和简略
transExt.find('.trans-ext__tool-down').click(function() {
  transIframe.eq(0)[0].contentWindow.postMessage(
    {
      op: 'showDetail'
    },
    '*'
  );
  transExt.find('.trans-ext__tool-down').hide();
  transExt.find('.trans-ext__tool-up').show();
});
transExt.find('.trans-ext__tool-up').click(function() {
  transIframe.eq(0)[0].contentWindow.postMessage(
    {
      op: 'hideDetail'
    },
    '*'
  );
  transExt.find('.trans-ext__tool-down').show();
  transExt.find('.trans-ext__tool-up').hide();
});

// 关闭弹出框
transExt.find('.trans-ext__tool-close').click(function() {
  transPopup.hide();
  transIframe.attr('src', iframeURL);
});

// 添加搜索工具图标点击事件
transExt.find(`.trans-ext__tool`).click(function(event) {
  const transTool = $(event.target).data('trans-tool');
  transExt.find('.trans-ext__tool').removeClass('active');
  transExt
    .find(`.trans-ext__tool[data-trans-tool=${transTool}]`)
    .addClass('active');
  data.set('transTool', transTool);
  let iframeURL = data.get(data.get('transTool'));
  iframeURL = iframeURL.replace('KEYWORD', encodeURIComponent(selectedText));
  iframeURL = iframeURL.replace(
    'SHOWDETAIL',
    transExt.find('.trans-ext__tool-up').is(':visible')
  );
  transIframe.attr('src', iframeURL);
});

// 默认显示收起
transExt.find('.trans-ext__title-up').hide();

// 点击翻译按钮时防止划选的文本消失掉
transExt.on('mousedown mouseup', function(event) {
  event.preventDefault();
  event.stopPropagation();
});

// 点击“译”按钮
transBtn.mouseup(showPopup);

// 显示翻译内容页
function showPopup(event) {
  event.stopPropagation();

  // 加载图标
  loadCSS('//at.alicdn.com/t/font_1141105_4dqgo0hxye9.css', 'iconfont');

  transIframe.attr(
    'src',
    data
      .get(data.get('transTool'))
      .replace('KEYWORD', encodeURIComponent(selectedText))
  );

  // 计算定位，避免超出可视范围
  // 参考 https://github.com/Selection-Translator/crx-selection-translate/blob/master/src/content-scripts/st/restrict.js
  const transBtnRect = event.target.getBoundingClientRect();
  let realLeftPos = $(document).scrollLeft() + transBtnRect.left;
  let realTopPos = $(document).scrollTop() + transBtnRect.top;
  const rightPos = transBtnRect.left + transPopup.width();
  const bottomPos = transBtnRect.top + transPopup.height();

  const rightDiff = rightPos - window.innerWidth;
  if (rightDiff > 0) {
    realLeftPos = realLeftPos - rightDiff;
  }
  const bottomDiff = bottomPos - window.innerHeight;
  if (bottomDiff > 0) {
    realTopPos = realTopPos - bottomDiff;
  }
  transPopup.css({
    top: realTopPos,
    left: realLeftPos
  });

  // 弹出翻译窗，隐藏翻译按钮
  transBtn.hide();
  transPopup.show();
}

$(document).mouseup(function(event) {
  // 获取选中的文本
  selectedText = window
    .getSelection()
    .toString()
    .trim();

  if (selectedText) {
    // 如果有选中的文本，显示“译”按钮
    if (!$('body').find(transExt).length) {
      $('body').append(transExt);
    }

    transBtn.css({
      top: event.pageY - 15,
      left: event.pageX + 15
    });
    transPopup.hide();
    transIframe.attr('src', '');
    transBtn.show();
  } else {
    // 如果没有选中文本，确保隐藏插件内容
    transBtn.hide();
    transPopup.hide();
    transIframe.attr('src', '');

    // 恢复是否显示详情的箭头
    transExt.find('.trans-ext__tool-down').show();
    transExt.find('.trans-ext__tool-up').hide();

    isMoving = false;
  }
});

$(transPopup).on('mousedown', '.trans-ext__title-bar', function(event) {
  isMoving = true;
  startX = event.clientX;
  startY = event.clientY;
  startTop = transPopup.position().top;
  startLeft = transPopup.position().left;
});

$(document).on('mousemove', function(event) {
  if (isMoving) {
    const moveX = event.clientX - startX;
    const moveY = event.clientY - startY;

    // 避免出现滚动条
    const maxWidth = transPopup
      .parent()
      .parent()
      .width();
    const maxHeight = transPopup
      .parent()
      .parent()
      .height();

    let realTopPos = startTop + moveY;
    let realLeftPos = startLeft + moveX;

    const heightDiff = realTopPos + transPopup.height() - maxHeight;
    const widthDiff = realLeftPos + transPopup.width() - maxWidth;

    if (heightDiff > 0) {
      realTopPos = realTopPos - heightDiff;
    }

    if (widthDiff > 0) {
      realLeftPos = realLeftPos - widthDiff;
    }

    if (realLeftPos)
      transPopup.css({
        top: realTopPos,
        left: realLeftPos
      });
  }
});

// transPopup事件已经被阻止冒泡了，所以，document监听不到
$(transPopup).on('mouseup', function() {
  isMoving = false;
});

$(document).on('mouseup', function() {
  isMoving = false;
});

// 处理移动时可能出现的跳动问题
window.addEventListener('message', function(event) {
  if (event.data.keyup) {
    isMoving = false;
    console.log('yes');
  }
});
