/**
 * نقطة التشغيل — التوجيه والواجهة
 */
(function () {
  var titles = {
    dashboard: "لوحة التحكم",
    "invoice-new": "فاتورة جديدة",
    "invoice-edit": "تعديل فاتورة",
    "invoice-view": "معاينة الفاتورة",
    invoices: "سجل الفواتير",
    customers: "العملاء",
    reports: "التقارير",
    settings: "الإعدادات",
  };

  function parseRoute() {
    var h = location.hash.replace(/^#/, "") || "/dashboard";
    if (h[0] !== "/") h = "/" + h;
    return h.split("/").filter(Boolean);
  }

  function showToast(message, type) {
    type = type || "info";
    var c = document.getElementById("toast-container");
    if (!c) return;
    var el = document.createElement("div");
    el.className = "toast toast--" + type;
    el.textContent = message;
    c.appendChild(el);
    setTimeout(function () {
      el.remove();
    }, 3500);
  }

  window.showToast = showToast;

  function syncShellChrome() {
    try {
      if (!window.LHStorage) return;
      var s = window.LHStorage.getSettings();
      var titleEl = document.getElementById("sidebarCompanyTitle");
      var regEl = document.getElementById("sidebarCommercialReg");
      var markEl = document.querySelector(".app-sidebar__mark");
      var esc =
        window.LHFormat && window.LHFormat.escapeHtml
          ? window.LHFormat.escapeHtml.bind(window.LHFormat)
          : function (t) {
              return String(t || "")
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            };
      if (titleEl) {
        var name = (s && s.companyName) || "مؤسسة ليلى حكمي للمقاولات العامة";
        titleEl.innerHTML = name.replace(/\n/g, "<br />");
      }
      if (regEl) {
        var reg = (s && s.commercialReg) ? String(s.commercialReg).trim() : "";
        regEl.textContent = reg ? "س.ت: " + reg : "س.ت: —";
      }
      if (markEl) {
        var logo = s && s.logoDataUrl;
        if (logo) {
          markEl.classList.add("app-sidebar__mark--has-logo");
          markEl.innerHTML =
            '<img class="app-sidebar__mark-img" src="' + esc(logo) + '" alt="" decoding="async" />';
        } else {
          markEl.classList.remove("app-sidebar__mark--has-logo");
          markEl.textContent = "ل.ح";
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }

  window.LHSyncShellChrome = syncShellChrome;

  function setActiveNav(parts) {
    var route = "dashboard";
    if (parts[0] === "dashboard") route = "dashboard";
    else if (parts[0] === "invoice") {
      if (parts[1] === "new") route = "invoice-new";
      else if (parts[1] === "edit") route = "invoice-edit";
      else route = "invoice-view";
    } else if (parts[0] === "invoices") route = "invoices";
    else if (parts[0] === "customers") route = "customers";
    else if (parts[0] === "reports") route = "reports";
    else if (parts[0] === "settings") route = "settings";

    document.querySelectorAll("#sidebar a[data-route]").forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-route") === route);
    });

    var titleKey = route;
    if (parts[0] === "invoice" && parts[1] === "edit") titleKey = "invoice-edit";
    if (parts[0] === "invoice" && parts[1] && parts[1] !== "new" && parts[1] !== "edit") titleKey = "invoice-view";

    var pt = document.getElementById("pageTitle");
    if (pt) pt.textContent = titles[titleKey] || titles.dashboard;
  }

  var appContent = null;
  var lastCleanup = null;

  function navigate() {
    var parts = parseRoute();
    if (!parts.length) parts = ["dashboard"];

    if (!appContent) appContent = document.getElementById("appContent");
    syncShellChrome();

    if (lastCleanup) {
      try {
        lastCleanup();
      } catch (e) {
        console.warn(e);
      }
      lastCleanup = null;
    }

    setActiveNav(parts);

    var first = parts[0];

    if (first === "dashboard") {
      window.LHDashboard.render(appContent);
      lastCleanup = appContent._cleanup;
      return;
    }

    if (first === "invoice") {
      if (parts[1] === "new") {
        window.LHInvoiceForm.render(appContent, null);
        lastCleanup = appContent._cleanup;
        return;
      }
      if (parts[1] === "edit" && parts[2]) {
        location.hash = "#/invoice/" + parts[2];
        return;
      }
      if (parts[1] && parts[1] !== "new" && parts[1] !== "edit") {
        window.LHInvoicePreview.render(appContent, parts[1]);
        lastCleanup = appContent._cleanup;
        return;
      }
    }

    if (first === "invoices") {
      window.LHInvoicesList.render(appContent);
      lastCleanup = appContent._cleanup;
      return;
    }

    if (first === "customers") {
      window.LHCustomers.render(appContent);
      lastCleanup = appContent._cleanup;
      return;
    }

    if (first === "reports") {
      window.LHReports.render(appContent);
      lastCleanup = appContent._cleanup;
      return;
    }

    if (first === "settings") {
      window.LHSettings.render(appContent);
      lastCleanup = appContent._cleanup;
      return;
    }

    location.hash = "#/dashboard";
  }

  function init() {
    appContent = document.getElementById("appContent");
    var sidebar = document.getElementById("sidebar");
    var menuToggle = document.getElementById("menuToggle");
    var backdrop = document.getElementById("sidebarBackdrop");
    var isMobile = function () {
      return window.matchMedia && window.matchMedia("(max-width: 900px)").matches;
    };

    function applyCollapsedState(isCollapsed) {
      if (!sidebar) return;
      sidebar.classList.toggle("is-collapsed", !!isCollapsed);
      try {
        localStorage.setItem("lh_sidebar_collapsed", isCollapsed ? "1" : "0");
      } catch (e) {}
    }

    function setMenuToggleLabel() {
      if (!menuToggle || !sidebar) return;
      if (isMobile()) {
        var open = sidebar.classList.contains("is-open");
        menuToggle.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
        menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      } else {
        menuToggle.setAttribute("aria-label", "طي/فتح القائمة");
        menuToggle.removeAttribute("aria-expanded");
      }
    }

    function closeMobileSidebar() {
      if (!sidebar) return;
      sidebar.classList.remove("is-open");
      if (backdrop) backdrop.classList.remove("is-visible");
      document.body.classList.remove("no-scroll");
      setMenuToggleLabel();
    }

    function toggleMobileSidebar() {
      if (!sidebar) return;
      var willOpen = !sidebar.classList.contains("is-open");
      sidebar.classList.toggle("is-open", willOpen);
      if (backdrop) backdrop.classList.toggle("is-visible", willOpen);
      document.body.classList.toggle("no-scroll", willOpen);
      setMenuToggleLabel();
    }

    if (sidebar) {
      try {
        applyCollapsedState(localStorage.getItem("lh_sidebar_collapsed") === "1");
      } catch (e) {}
      /* على الجوال لا يُعرض شريط الطي — القائمة منسدلة من الزر فقط */
      if (isMobile()) {
        sidebar.classList.remove("is-collapsed");
      }
    }

    if (menuToggle && sidebar) {
      menuToggle.addEventListener("click", function () {
        if (isMobile()) {
          toggleMobileSidebar();
        } else {
          applyCollapsedState(!sidebar.classList.contains("is-collapsed"));
          setMenuToggleLabel();
        }
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", function () {
        closeMobileSidebar();
      });
    }

    if (sidebar) {
      sidebar.addEventListener("click", function (e) {
        if (!isMobile()) return;
        if (e.target && e.target.closest && e.target.closest("a[href^='#/']")) {
          closeMobileSidebar();
        }
      });
    }

    window.addEventListener("resize", function () {
      if (!sidebar) return;
      if (!isMobile()) {
        closeMobileSidebar();
        try {
          applyCollapsedState(localStorage.getItem("lh_sidebar_collapsed") === "1");
        } catch (e) {}
      } else {
        sidebar.classList.remove("is-collapsed");
      }
      setMenuToggleLabel();
    });
    setMenuToggleLabel();
    syncShellChrome();
    window.addEventListener("lh:settings-updated", syncShellChrome);

    window.addEventListener("hashchange", function () {
      if (isMobile()) closeMobileSidebar();
      navigate();
    });

    if (!location.hash || location.hash === "#") {
      location.hash = "#/dashboard";
    } else {
      navigate();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
