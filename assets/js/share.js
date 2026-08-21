// Sharing to Mastodon needs the reader's own server, which nothing on this
// page can know. Rather than route them through a third-party relay — this
// site tells people it does not hand their address to anyone it does not have
// to — the button asks once and keeps the answer in their own browser.
(function () {
  "use strict";

  var KEY = "share:mastodon-host";

  function ask() {
    var saved = null;
    try {
      saved = window.localStorage.getItem(KEY);
    } catch (e) {
      // Private browsing can refuse storage. Asking every time still works.
    }
    if (saved) return saved;

    var typed = window.prompt(
      "お使いの Mastodon サーバーのドメインを入力してください。\n（例: fedibird.com / mstdn.jp）",
      ""
    );
    if (!typed) return null;

    // Readers paste all of https://example.social/@name; keep the host.
    var host = typed.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!host || host.indexOf(".") < 0) return null;

    try {
      window.localStorage.setItem(KEY, host);
    } catch (e) {
      // Not being able to remember it is not a reason to refuse the share.
    }
    return host;
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest && event.target.closest(".share-mastodon");
    if (!button) return;
    event.preventDefault();

    var host = ask();
    if (!host) return;

    var text = button.getAttribute("data-share-text") || document.title;
    var url = button.getAttribute("data-share-url") || window.location.href;
    window.open(
      "https://" + host + "/share?text=" + encodeURIComponent(text + " " + url),
      "_blank",
      "noopener"
    );
  });
})();
