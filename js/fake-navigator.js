// 欺骗js获取的 navigator.userAgent（有道中有个判断，不欺骗会跳转网页）
// https://stackoverflow.com/questions/23202136/changing-navigator-useragent-using-chrome-extension

const actualCode = `(${
  () => {
    const navigator = window.navigator;
    let modifiedNavigator;
    if ('userAgent' in Navigator.prototype) {
      // Chrome 43+ moved all properties from navigator to the prototype,
      // so we have to modify the prototype instead of navigator.
      modifiedNavigator = Navigator.prototype;
    } else {
      // Chrome 42- defined the property on navigator.
      modifiedNavigator = Object.create(navigator);
      Object.defineProperty(window, 'navigator', {
        value: modifiedNavigator,
        configurable: false,
        enumerable: false,
        writable: false
      });
    }
    // Pretend to be Windows XP
    Object.defineProperties(modifiedNavigator, {
      userAgent: {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        configurable: false,
        enumerable: true,
        writable: false
      },
      appVersion: {
        value:
          '5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
        configurable: false,
        enumerable: true,
        writable: false
      },
      platform: {
        value: 'Win32',
        configurable: false,
        enumerable: true,
        writable: false
      }
    });
  }
})();`;

const s = document.createElement('script');
s.textContent = actualCode;
document.documentElement.appendChild(s);
s.remove();
