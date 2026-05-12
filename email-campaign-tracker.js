/**
 * 邮件活动访问追踪：
 * - 检测 URL 上的 utm_medium=email/edm，触发 Mixpanel 自定义事件 email_campaign_visit
 * - 携带 utm_source / utm_medium / utm_campaign / utm_content / campaign_label
 * - 触发后清理 URL 上的 UTM 相关参数（保留其他业务参数）
 */
(function () {
  try {
    if (typeof window === 'undefined') return;

    var EMAIL_TRACK_KEYS = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'campaign_label',
    ];

    var params = new URLSearchParams(window.location.search);
    var utmMedium = params.get('utm_medium');
    if (utmMedium !== 'email' && utmMedium !== 'edm') return;

    var payload = {};
    EMAIL_TRACK_KEYS.forEach(function (key) {
      var v = params.get(key);
      if (v) payload[key] = v;
    });
    console.log('[email-campaign-tracker] detected, payload:', payload);

    var fired = false;
    var elapsed = 0;
    var MAX_WAIT = 10000; // 最多等 10 秒
    var INTERVAL = 200;

    function tryFire() {
      if (fired) return true;
      if (window.mixpanel && typeof window.mixpanel.track === 'function') {
        window.mixpanel.track('email_campaign_visit', payload);
        fired = true;
        console.log('[email-campaign-tracker] event fired');
        return true;
      }
      return false;
    }

    function cleanUrl() {
      EMAIL_TRACK_KEYS.forEach(function (key) {
        params.delete(key);
      });
      var newSearch = params.toString();
      window.history.replaceState(
        null,
        '',
        window.location.pathname +
          (newSearch ? '?' + newSearch : '') +
          window.location.hash,
      );
    }

    // 立即尝试一次
    if (tryFire()) {
      // 已发出，给 Mintlify 自带的页面访问事件 1s 时间读取 UTM 后清理
      setTimeout(cleanUrl, 1000);
      return;
    }

    // mixpanel 还没就绪，开始轮询
    var poller = setInterval(function () {
      elapsed += INTERVAL;
      if (tryFire() || elapsed >= MAX_WAIT) {
        clearInterval(poller);
        if (!fired) {
          console.warn('[email-campaign-tracker] mixpanel not ready after ' + MAX_WAIT + 'ms');
        }
        // 不管成不成功，都清一下 URL，避免参数残留
        cleanUrl();
      }
    }, INTERVAL);
  } catch (e) {
    console.log('[email-campaign-tracker] error:', e);
  }
})();
