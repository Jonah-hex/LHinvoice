/**
 * تأكيد من داخل الواجهة (بدل window.confirm)
 */
(function (global) {
  /**
   * @param {{ title?: string, message?: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} opts
   * @returns {Promise<boolean>}
   */
  function show(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var root = document.getElementById("lhConfirmRoot");
      if (!root) {
        resolve(global.confirm(opts.message || opts.title || ""));
        return;
      }
      var titleEl = document.getElementById("lhConfirmTitle");
      var msgEl = document.getElementById("lhConfirmMsg");
      var btnOk = document.getElementById("lhConfirmOk");
      var btnCancel = document.getElementById("lhConfirmCancel");
      var bd = root.querySelector(".lh-confirm-backdrop");
      if (!titleEl || !msgEl || !btnOk || !btnCancel || !bd) {
        resolve(global.confirm(opts.message || ""));
        return;
      }

      titleEl.textContent = opts.title || "تأكيد";
      msgEl.textContent = opts.message || "";
      btnOk.textContent = opts.confirmLabel || "تأكيد";
      btnCancel.textContent = opts.cancelLabel || "إلغاء";
      btnOk.className = "btn " + (opts.danger === false ? "btn--primary" : "btn--danger");

      root.hidden = false;
      root.classList.add("is-visible");
      root.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");

      function cleanup() {
        btnOk.removeEventListener("click", onOk);
        btnCancel.removeEventListener("click", onCancel);
        bd.removeEventListener("click", onCancel);
        document.removeEventListener("keydown", onKey);
      }

      function finish(val) {
        root.classList.remove("is-visible");
        root.hidden = true;
        root.setAttribute("aria-hidden", "true");
        document.body.classList.remove("no-scroll");
        cleanup();
        resolve(val);
      }

      function onOk() {
        finish(true);
      }
      function onCancel() {
        finish(false);
      }
      function onKey(ev) {
        if (ev.key === "Escape") onCancel();
      }

      btnOk.addEventListener("click", onOk);
      btnCancel.addEventListener("click", onCancel);
      bd.addEventListener("click", onCancel);
      document.addEventListener("keydown", onKey);
      try {
        btnOk.focus();
      } catch (e) {}
    });
  }

  global.LHConfirm = { show: show };
})(typeof window !== "undefined" ? window : this);
