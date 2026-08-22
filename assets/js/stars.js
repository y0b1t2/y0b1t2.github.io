// star.html が描画する .stars 要素を拾って、リアクションAPIとやり取りする。
// エンドポイントと slug は data-* 属性からサーバ側(Hugo)が埋め込む。
(function () {
  const box = document.querySelector(".stars");
  if (!box) return;

  const endpoint = box.dataset.endpoint.replace(/\/$/, "");
  const slug = box.dataset.slug;
  const btn = box.querySelector(".stars__btn");
  const countEl = box.querySelector(".stars__count");
  const nameInput = box.querySelector(".stars__name");
  const namesEl = box.querySelector(".stars__names");
  const votedKey = "starred:" + slug;
  const nameKey = "star-name";
  const q = "slug=" + encodeURIComponent(slug);

  nameInput.value = localStorage.getItem(nameKey) || ""; // 前回の名前を復元
  if (localStorage.getItem(votedKey)) {
    btn.classList.add("is-starred");
    nameInput.disabled = true;
  }

  function render(d) {
    countEl.textContent = d.count;
    namesEl.textContent = ""; // textContent で組み立ててXSSを防ぐ
    (d.names || []).forEach(function (n) {
      const chip = document.createElement("span");
      chip.className = "stars__chip";
      chip.textContent = n;
      namesEl.appendChild(chip);
    });
  }

  // 初期表示：現在の数と記名一覧
  fetch(endpoint + "/count?" + q)
    .then(function (r) { return r.json(); })
    .then(render)
    .catch(function () { countEl.textContent = "-"; });

  btn.addEventListener("click", function () {
    if (localStorage.getItem(votedKey)) return; // 二度押し防止(UX)
    const name = nameInput.value.trim();
    btn.classList.add("is-starred");
    nameInput.disabled = true;
    const body = q + (name ? "&name=" + encodeURIComponent(name) : "");
    fetch(endpoint + "/like?" + body, { method: "POST" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        render(d);
        localStorage.setItem(votedKey, "1");
        if (name) localStorage.setItem(nameKey, name);
      })
      .catch(function () {
        btn.classList.remove("is-starred");
        nameInput.disabled = false;
      });
  });
})();
