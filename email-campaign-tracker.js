/**
 * 邮件活动访问追踪：
 * - 自带 Mixpanel SDK 加载（Mintlify 的内置 Mixpanel 没挂到 window.mixpanel）
 * - 检测 URL 上的 utm_medium=email/edm，触发自定义事件 email_campaign_visit
 * - 触发后清理 URL 上的 UTM 相关参数
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

    // 自带 Mixpanel SDK（独立命名空间 __solveaMp，避免与 Mintlify 内置冲突）
    (function (e, c) {
      if (!c.__SV) {
        var l, h;
        window.__solveaMp = c;
        c._i = [];
        c.init = function (q, r, f) {
          function t(d, a) {
            var g = a.split('.');
            2 == g.length && ((d = d[g[0]]), (a = g[1]));
            d[a] = function () {
              d.push([a].concat(Array.prototype.slice.call(arguments, 0)));
            };
          }
          var b = c;
          'undefined' !== typeof f ? (b = c[f] = []) : (f = '__solveaMp');
          b.people = b.people || [];
          b.toString = function (d) {
            var a = 'mixpanel';
            '__solveaMp' !== f && (a += '.' + f);
            d || (a += ' (stub)');
            return a;
          };
          b.people.toString = function () {
            return b.toString(1) + '.people (stub)';
          };
          l = 'disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove'.split(' ');
          for (h = 0; h < l.length; h++) t(b, l[h]);
          c._i.push([q, r, f]);
        };
        c.__SV = 1.2;
        var k = e.createElement('script');
        k.type = 'text/javascript';
        k.async = true;
        k.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
        var s = e.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(k, s);
      }
    })(document, window.__solveaMp || []);

    // 用独立实例初始化，名字 solvea，不污染 Mintlify 自带的 mixpanel
    window.__solveaMp.init('a5d2467fc60284b84678487fb69210ab', { autocapture: false }, 'solvea');

    // 调用 track（stub 会先 queue，SDK 加载完后自动发出）
    window.__solveaMp.solvea.track('email_campaign_visit', payload);
    console.log('[email-campaign-tracker] event queued');

    // 1 秒后清理 URL，给 Mintlify 的 pageview 留出读取 UTM 的时间
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
    console.log('[email-campaign-tracker] error:', e);
  }
})();
