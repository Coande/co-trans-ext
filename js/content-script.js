/********************* 插件用到的元素模板 ****************/
// 插件注入的页面结构
const transExt = $(`
<co-div class="trans-ext">
  <co-div class="trans-ext__trans-btn">译</co-div>
  <co-div class="trans-ext__popup">
    <co-div class="trans-ext__title-bar">
      <co-div class="trans-ext__title-center">
        <co-i class="co-iconfont co-icon-sogou trans-ext__tool" data-trans-tool="sogou" title="搜狗翻译"></co-i>
        <co-i class="co-iconfont co-icon-baidu trans-ext__tool" data-trans-tool="baidu" title="百度翻译"></co-i>
        <co-i class="co-iconfont co-icon-google1 trans-ext__tool" data-trans-tool="google" title="谷歌翻译"></co-i>
        <co-i class="co-iconfont co-icon-youdao trans-ext__tool" data-trans-tool="youdao" title="有道翻译"></co-i>
        <co-i class="co-iconfont co-icon-kingsoft trans-ext__tool" data-trans-tool="kingsoft" title="金山词霸"></co-i>
      </co-div>
      <co-div class="trans-ext__title-right">
        <co-i class="co-iconfont co-icon-zhankai1 trans-ext__tool-down" title="显示更多"></co-i>
        <co-i class="co-iconfont co-icon-shouqi trans-ext__tool-up" title="收起更多"></co-i>
        <co-i class="co-iconfont co-icon-guanbi trans-ext__tool-close" title="关闭"></co-i>
      </co-div>
    </co-div>
    <iframe class="trans-ext__iframe"></iframe>
  </co-div>
</co-div>
`);

/********************** 初始化相关 ***********************/

// 存储选中的文本内容
let selectedText;
const data = new ExtData();

// 弹窗移动相关数据
// 翻译弹窗的移动
let isMoving = false;

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
data.get('transTool', val => {
  const activeTransTool = transExt.find(
    `.trans-ext__tool[data-trans-tool=${val}]`
  );

  activeTransTool.addClass('active');
});

/************************** 事件处理 ***********************/

// 切换是否显示输入内容、翻译语言切换等界面元素
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

// 处理拖动过程中事件可能被iframe捕获而丢失事件的问题
// https://blog.csdn.net/zgrbsbf/article/details/71423401
function setIsMoving(moving) {
  isMoving = moving;
  if (moving) {
    transIframe.css('pointer-events', 'none');
  } else {
    transIframe.css('pointer-events', 'auto');
  }
}

// 关闭 popup 的相关操作
function handleClosePopup() {
  // 如果没有选中文本，确保隐藏插件内容
  transBtn.hide();
  transPopup.hide();
  transIframe.attr('src', '');

  // 恢复是否显示详情的箭头
  transExt.find('.trans-ext__tool-down').show();
  transExt.find('.trans-ext__tool-up').hide();

  setIsMoving(false);
}

// 监听关闭 popup 按钮点击事件
transExt.find('.trans-ext__tool-close').click(handleClosePopup);

// 监听 popup 中翻译切换图标的点击事件
transExt.find(`.trans-ext__tool`).click(function(event) {
  const transTool = $(event.target).data('trans-tool');
  transExt.find('.trans-ext__tool').removeClass('active');
  transExt
    .find(`.trans-ext__tool[data-trans-tool=${transTool}]`)
    .addClass('active');
  data.set('transTool', transTool);
  data.get(transTool, val => {
    let iframeURL = val;
    iframeURL = iframeURL.replace('KEYWORD', encodeURIComponent(selectedText));
    iframeURL = iframeURL.replace(
      'SHOWDETAIL',
      transExt.find('.trans-ext__tool-up').is(':visible')
    );
    transIframe.attr('src', iframeURL);
  });
});

// 点击翻译按钮时防止划选的文本消失掉
transExt.on('mousedown mouseup', function(event) {
  event.preventDefault();
  event.stopPropagation();
});

// 计算 popup 初始位置
function calcInitPopupPosition(event) {
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

// 点击“译”字显示翻译内容页 popup
transBtn.mouseup(function showPopup(event) {
  event.stopPropagation();

  // 加载图标
  loadCSS(chrome.extension.getURL('css/iconfont/iconfont.css'), 'iconfont');

  data.get('transTool', val => {
    // 初始化并设置active
    transExt.find('.trans-ext__tool').removeClass('active');
    const activeTransTool = transExt.find(
      `.trans-ext__tool[data-trans-tool=${val}]`
    );
    activeTransTool.addClass('active');

    data.get(val, val2 => {
      transIframe.attr(
        'src',
        val2
          .replace('KEYWORD', encodeURIComponent(selectedText))
          .replace('SHOWDETAIL', false)
      );
    });
  });
  calcInitPopupPosition(event);
});

// 监听是否需要显示译字或者隐藏popup等
$(document).mouseup(function(event) {
  // 测试发现：选中文本后，再次keyup选中区域内内容才取消选中，keydown选中区域外内容马上取消选中
  // 猜测：这是为了处理拖拽选中内容而这样设计的吧
  // 异步获取选中的文本（会产生适当的延时），避免再次点击上次选中文本区域内时获取到上次选中内容的情况
  setTimeout(() => {
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
        top: event.pageY + 15,
        left: event.pageX + 15
      });
      transPopup.hide();
      transIframe.attr('src', '');
      transBtn.show();
    } else {
      handleClosePopup();
    }
  }, 0);
});

/********************** popup 拖拽处理 ***********************/
let startX = 0;
let startY = 0;
let startTop = 0;
let startLeft = 0;

// popup 拖拽开始
$(transPopup).on('mousedown', '.trans-ext__title-bar', function(event) {
  setIsMoving(true);
  startX = event.clientX;
  startY = event.clientY;
  startTop = transPopup.position().top;
  startLeft = transPopup.position().left;
});

// popup 拖拽过程中
$(document).on('mousemove', function(event) {
  if (isMoving) {
    const moveX = event.clientX - startX;
    const moveY = event.clientY - startY;

    // 避免出现滚动条
    let maxWidth = $(document.body).width();
    let maxHeight = $(document.body).height();
    if ($(document.body).width() < $(window).width()) {
      maxWidth = $(window).width();
    }
    if ($(document.body).height() < $(window).height()) {
      maxHeight = $(window).height();
    }

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

// popup 拖拽结束
$(document).on('mouseup', function() {
  setIsMoving(false);
});
// popup 拖拽结束
// transPopup事件已经被阻止冒泡了，所以，document监听不到，需要额外监听
$(transPopup).on('mouseup', function() {
  setIsMoving(false);
});
