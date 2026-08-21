/*
 * Render replies to a post's Mastodon and Bluesky announcements as comments.
 *
 * Both services answer unauthenticated cross-origin reads, so this needs no
 * server and no API key. Nothing is fetched until the section is close to the
 * viewport: readers who never scroll that far never touch either service.
 *
 * Mastodon returns comment bodies as HTML written by strangers, so it goes
 * through an allowlist that rebuilds the tree from scratch rather than
 * stripping tags from a string. Bluesky returns plain text, inserted as text.
 */
(function () {
  var root = document.querySelector('.social-comments');
  if (!root) return;

  var list = root.querySelector('.social-comments__list');

  var ALLOWED = {
    A: ['href'], P: [], BR: [], SPAN: [], EM: [], STRONG: [], B: [], I: [],
    DEL: [], CODE: [], PRE: [], BLOCKQUOTE: [], UL: [], OL: [], LI: []
  };

  // Unknown tags are unwrapped so their text survives, which is right for
  // markup but wrong for these: the body of a <script> is inert once the tag
  // is gone, yet it would still be printed at the reader as source code.
  var DISCARD = {
    SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, TEMPLATE: 1,
    NOSCRIPT: 1, FORM: 1, INPUT: 1, BUTTON: 1, TEXTAREA: 1, SELECT: 1,
    SVG: 1, MATH: 1, LINK: 1, META: 1, BASE: 1, TITLE: 1
  };

  function rebuild(source, target, doc) {
    Array.prototype.forEach.call(source.childNodes, function (child) {
      if (child.nodeType === 3) {
        target.appendChild(doc.createTextNode(child.nodeValue));
        return;
      }
      if (child.nodeType !== 1) return;

      if (DISCARD[child.tagName]) return; // tag and contents both go

      var attrs = ALLOWED[child.tagName];
      if (!attrs) {
        rebuild(child, target, doc); // drop the tag, keep what it wrapped
        return;
      }
      var el = doc.createElement(child.tagName.toLowerCase());
      attrs.forEach(function (name) {
        var value = child.getAttribute(name);
        if (name === 'href' && !/^https?:\/\//i.test(value || '')) return;
        if (value !== null) el.setAttribute(name, value);
      });
      if (el.tagName === 'A' && el.hasAttribute('href')) {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'nofollow noopener ugc');
      }
      rebuild(child, el, doc);
      target.appendChild(el);
    });
  }

  function sanitise(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var out = document.createDocumentFragment();
    rebuild(doc.body, out, document);
    return out;
  }

  function json(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' → ' + r.status);
      return r.json();
    });
  }

  function fromMastodon(url) {
    var parsed = new URL(url);
    var id = parsed.pathname.replace(/\/$/, '').split('/').pop();
    return json(parsed.origin + '/api/v1/statuses/' + id + '/context').then(function (data) {
      return (data.descendants || []).map(function (status) {
        return {
          service: 'Mastodon',
          url: status.url,
          name: status.account.display_name || status.account.username,
          handle: '@' + status.account.acct,
          avatar: status.account.avatar_static,
          date: status.created_at,
          body: sanitise(status.content)
        };
      });
    });
  }

  function blueskyDid(handle) {
    if (handle.indexOf('did:') === 0) return Promise.resolve(handle);
    return json('https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=' +
      encodeURIComponent(handle)).then(function (d) { return d.did; });
  }

  function fromBluesky(url) {
    var parts = new URL(url).pathname.split('/').filter(Boolean); // profile/<who>/post/<rkey>
    var rkey = parts[3];
    return blueskyDid(parts[1]).then(function (did) {
      var uri = 'at://' + did + '/app.bsky.feed.post/' + rkey;
      return json('https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?depth=10&uri=' +
        encodeURIComponent(uri));
    }).then(function (data) {
      var found = [];
      (function walk(node) {
        (node.replies || []).forEach(function (reply) {
          var post = reply.post;
          if (!post || !post.record) return;
          var text = document.createDocumentFragment();
          text.appendChild(document.createTextNode(post.record.text || ''));
          found.push({
            service: 'Bluesky',
            url: 'https://bsky.app/profile/' + post.author.handle + '/post/' +
              post.uri.split('/').pop(),
            name: post.author.displayName || post.author.handle,
            handle: '@' + post.author.handle,
            avatar: post.author.avatar,
            date: post.record.createdAt,
            body: text
          });
          walk(reply);
        });
      })(data.thread || {});
      return found;
    });
  }

  function render(comments) {
    list.textContent = '';
    if (!comments.length) {
      var empty = document.createElement('p');
      empty.className = 'social-comments__status';
      empty.textContent = 'まだ返信はありません。';
      list.appendChild(empty);
      return;
    }
    comments.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });

    comments.forEach(function (c) {
      var item = document.createElement('article');
      item.className = 'comment';

      if (c.avatar) {
        var img = document.createElement('img');
        img.className = 'comment__avatar';
        img.src = c.avatar;
        img.alt = '';
        img.loading = 'lazy';
        item.appendChild(img);
      }

      var main = document.createElement('div');
      main.className = 'comment__main';

      var head = document.createElement('p');
      head.className = 'comment__head';

      var who = document.createElement('a');
      who.className = 'comment__name';
      who.href = c.url;
      who.target = '_blank';
      who.rel = 'nofollow noopener ugc';
      who.textContent = c.name;
      head.appendChild(who);

      var handle = document.createElement('span');
      handle.className = 'comment__handle';
      handle.textContent = c.handle;
      head.appendChild(handle);

      var when = document.createElement('time');
      when.className = 'comment__meta';
      when.dateTime = c.date;
      when.textContent = new Date(c.date).toLocaleDateString('ja-JP') + '・' + c.service;
      head.appendChild(when);

      var body = document.createElement('div');
      body.className = 'comment__body';
      body.appendChild(c.body);

      main.appendChild(head);
      main.appendChild(body);
      item.appendChild(main);
      list.appendChild(item);
    });
  }

  function load() {
    var jobs = [];
    if (root.dataset.mastodon) jobs.push(fromMastodon(root.dataset.mastodon));
    if (root.dataset.bluesky) jobs.push(fromBluesky(root.dataset.bluesky));

    // allSettled: one service being down must not hide the other's replies.
    Promise.allSettled(jobs).then(function (results) {
      var comments = [];
      var failed = 0;
      results.forEach(function (r) {
        if (r.status === 'fulfilled') comments = comments.concat(r.value);
        else failed++;
      });
      render(comments);
      if (failed) {
        var note = document.createElement('p');
        note.className = 'social-comments__status';
        note.textContent = '一部の返信を読み込めませんでした。上のリンクから直接ご覧ください。';
        list.appendChild(note);
      }
    });
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      load();
    }, { rootMargin: '400px' });
    observer.observe(root);
  } else {
    load();
  }
})();
