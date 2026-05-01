/**
 * لوحة التحكم — الهيكل من HTML (<template>)؛ JS للبيانات والتفاعل فقط
 */
(function (global) {
  var F = global.LHFormat;
  var S = global.LHStorage;

  function formatDateAr(d) {
    try {
      var months = [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ];
      return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
    } catch (e) {
      return "";
    }
  }

  function formatDeltaPct(prev, current) {
    var p = Number(prev) || 0;
    var c = Number(current) || 0;
    if (p <= 0 && c <= 0) return { text: "—", cls: "dash-pro-metric__delta--neutral" };
    if (p <= 0 && c > 0) return { text: "جديد", cls: "dash-pro-metric__delta--up" };
    var pct = ((c - p) / p) * 100;
    if (!isFinite(pct)) return { text: "—", cls: "dash-pro-metric__delta--neutral" };
    var rounded = Math.round(pct * 10) / 10;
    var sign = rounded > 0 ? "+" : "";
    var cls =
      rounded > 0 ? "dash-pro-metric__delta--up" : rounded < 0 ? "dash-pro-metric__delta--down" : "dash-pro-metric__delta--neutral";
    return { text: "مقارنة بالشهر الماضي: " + sign + rounded + "%", cls: cls };
  }

  function ymdFromDate(d) {
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function invoiceDayYmd(inv) {
    var parsed = F.parseLocalDate(inv.issueDate || inv.createdAt);
    if (!parsed) return "";
    return ymdFromDate(parsed);
  }

  function render(container) {
    var tpl = document.getElementById("lh-tpl-dashboard");
    var rowTpl = document.getElementById("lh-tpl-dash-row");
    var emptyTpl = document.getElementById("lh-tpl-dash-empty");
    if (!tpl || !rowTpl || !emptyTpl) {
      container.textContent = "";
      var err = document.createElement("p");
      err.className = "empty-state";
      err.textContent = "قالب لوحة التحكم غير موجود في الصفحة.";
      container.appendChild(err);
      container._cleanup = function () {};
      return;
    }

    container.textContent = "";
    container.appendChild(document.importNode(tpl.content, true));

    var invoices = S.getInvoices();
    var now = new Date();
    var todayYmd = ymdFromDate(now);
    var curYm = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    var prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var prevYm = prevMonthStart.getFullYear() + "-" + String(prevMonthStart.getMonth() + 1).padStart(2, "0");

    var thisMonth = invoices.filter(function (inv) {
      var d = invoiceDayYmd(inv);
      return d && d.slice(0, 7) === curYm && d <= todayYmd;
    });
    var prevMonthInv = invoices.filter(function (inv) {
      var d = invoiceDayYmd(inv);
      return d && d.slice(0, 7) === prevYm;
    });

    var totalSales = invoices.reduce(function (a, i) {
      return a + (Number(i.total) || 0);
    }, 0);
    var totalVat = invoices.reduce(function (a, i) {
      return a + (Number(i.vatAmount) || 0);
    }, 0);
    var monthSales = thisMonth.reduce(function (a, i) {
      return a + (Number(i.total) || 0);
    }, 0);
    var prevMonthSales = prevMonthInv.reduce(function (a, i) {
      return a + (Number(i.total) || 0);
    }, 0);

    function invoiceSortTime(inv) {
      var d = inv.issueDate || inv.createdAt || "";
      var t = new Date(d).getTime();
      return isNaN(t) ? 0 : t;
    }

    var sortedNewestFirst = invoices.slice().sort(function (a, b) {
      var byDate = invoiceSortTime(b) - invoiceSortTime(a);
      if (byDate !== 0) return byDate;
      return String(b.number || "").localeCompare(String(a.number || ""), "ar", { numeric: true, sensitivity: "base" });
    });
    var last5 = sortedNewestFirst.slice(0, 5);
    var salesDelta = formatDeltaPct(prevMonthSales, monthSales);

    var elDate = container.querySelector("#dashMetaDate");
    if (elDate) elDate.innerHTML = "<strong>اليوم</strong> · " + formatDateAr(now);

    var elCount = container.querySelector("#dashMetaCount");
    if (elCount) elCount.textContent = invoices.length + " فاتورة في السجل";

    var kInv = container.querySelector("#dashKpiInvoices");
    if (kInv) kInv.textContent = String(invoices.length);

    var kSales = container.querySelector("#dashKpiSales");
    if (kSales) kSales.textContent = F.formatCurrency(totalSales).replace(" ر.س", "");

    var kVat = container.querySelector("#dashKpiVat");
    if (kVat) kVat.textContent = F.formatCurrency(totalVat).replace(" ر.س", "");

    var kMonth = container.querySelector("#dashKpiMonth");
    if (kMonth) kMonth.textContent = F.formatCurrency(monthSales).replace(" ر.س", "");

    var kDelta = container.querySelector("#dashKpiMonthDelta");
    if (kDelta) {
      kDelta.textContent = salesDelta.text;
      kDelta.className = "dash-pro-metric__delta " + salesDelta.cls;
      kDelta.hidden = false;
    }

    var tbody = container.querySelector("#dashLast");
    tbody.textContent = "";

    if (!last5.length) {
      tbody.appendChild(document.importNode(emptyTpl.content, true));
    } else {
      last5.forEach(function (inv) {
        var tr = document.importNode(rowTpl.content, true).firstElementChild;
        tr.setAttribute("data-id", inv.id);
        tr.querySelector(".dash-td-num").textContent = inv.number || "—";
        tr.querySelector(".dash-td-date").textContent = F.formatDateShort(inv.issueDate);
        tr.querySelector(".dash-td-customer").textContent = (inv.customer && inv.customer.name) || "—";
        tr.querySelector(".dash-td-amount").textContent = F.formatCurrency(inv.total);
        tbody.appendChild(tr);
      });
    }

    function onTableClick(e) {
      var tr = e.target.closest("tr[data-id]");
      if (tr) location.hash = "#/invoice/" + tr.getAttribute("data-id");
    }
    tbody.addEventListener("click", onTableClick);

    container._cleanup = function () {
      tbody.removeEventListener("click", onTableClick);
    };
  }

  global.LHDashboard = { render: render };
})(typeof window !== "undefined" ? window : this);
