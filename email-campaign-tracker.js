/**
 * 邮件活动访问追踪：
 * - 独立加载 Mixpanel SDK（Mintlify 内置的 Mixpanel 没挂到 window.mixpanel）
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

    // 标准 Mixpanel 加载片段（必须用 window.mixpanel 名字，SDK 内部按此查队列）
    (function (e, c) {
      if (!c.__SV) {
        var l, h;
        window.mixpanel = c;
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
          'undefined' !== typeof f ? (b = c[f] = []) : (f = 'mixpanel');
          b.people = b.people || [];
          b.toString = function (d) {
            var a = 'mixpanel';
            'mixpanel' !== f && (a += '.' + f);
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
    })(document, window.mixpanel || []);

    window.mixpanel.init('a5d2467fc60284b84678487fb69210ab', { autocapture: false });
    window.mixpanel.track('email_campaign_visit', payload);
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
