// iframe页面通讯
// https://www.cnblogs.com/syll/p/8640329.html

// 接收iframe外部通过postMessage传递过来的数据
window.addEventListener('message', function(event) {
  if (event.data.op === 'showDetail') {
    document.body.classList.add('trans-ext-detail');
  } else if (event.data.op === 'hideDetail') {
    document.body.classList.remove('trans-ext-detail');
  }
});

// 接收query上的数据
const isShowDetail = getQueryVariable(window.location.href, 'showDetail');
if (isShowDetail === 'true') {
  document.body.classList.add('trans-ext-detail');
} else {
  document.body.classList.remove('trans-ext-detail');
}

// 处理移动时可能发生的跳动问题
document.addEventListener('mouseup', function(){
  window.parent.postMessage({ keyup: true }, '*');
});
