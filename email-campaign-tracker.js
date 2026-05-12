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

    // Mixpanel stub 已挂载，track 会先入队列，SDK 加载完成后自动发送
    if (window.mixpanel && typeof window.mixpanel.track === 'function') {
      window.mixpanel.track('email_campaign_visit', payload);
    }

    // 延迟 1s 清理 URL，给 Mintlify 自带的页面访问事件留出读取 UTM 的时间
    setTimeout(function () {
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
    }, 1000);
  } catch (e) {
    console.log('email campaign tracker error:', e);
  }
})();
