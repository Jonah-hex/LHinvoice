/**
 * سجل الفواتير — بحث وتصفية
 */
(function (global) {
  var F = global.LHFormat;
  var S = global.LHStorage;

  function render(container) {
    function invIssueTime(inv) {
      var raw = inv.issueDate || "";
      var p = F.parseLocalDate(raw);
      if (p && !isNaN(p.getTime())) return p.getTime();
      var t = new Date(raw).getTime();
      return isNaN(t) ? 0 : t;
    }

    function invCreatedTime(inv) {
      var t = new Date(inv.createdAt || inv.updatedAt || 0).getTime();
      return isNaN(t) ? 0 : t;
    }

    function cmpIssueDesc(a, b) {
      var di = invIssueTime(b) - invIssueTime(a);
      if (di !== 0) return di;
      return invCreatedTime(b) - invCreatedTime(a);
    }

    function cmpIssueAsc(a, b) {
      var di = invIssueTime(a) - invIssueTime(b);
      if (di !== 0) return di;
      return invCreatedTime(a) - invCreatedTime(b);
    }

    function sortInvoices(list, mode) {
      var arr = list.slice();
      mode = mode || "issue-desc";
      if (mode === "issue-desc") {
        arr.sort(cmpIssueDesc);
      } else if (mode === "issue-asc") {
        arr.sort(cmpIssueAsc);
      } else if (mode === "total-desc") {
        arr.sort(function (a, b) {
          var dt = (Number(b.total) || 0) - (Number(a.total) || 0);
          if (dt !== 0) return dt;
          return cmpIssueDesc(a, b);
        });
      } else if (mode === "total-asc") {
        arr.sort(function (a, b) {
          var dt = (Number(a.total) || 0) - (Number(b.total) || 0);
          if (dt !== 0) return dt;
          return cmpIssueAsc(a, b);
        });
      } else if (mode === "num-asc") {
        arr.sort(function (a, b) {
          var cn = String(a.number || "").localeCompare(String(b.number || ""), "ar", { numeric: true, sensitivity: "base" });
          if (cn !== 0) return cn;
          return cmpIssueDesc(a, b);
        });
      } else if (mode === "num-desc") {
        arr.sort(function (a, b) {
          var cn = String(b.number || "").localeCompare(String(a.number || ""), "ar", { numeric: true, sensitivity: "base" });
          if (cn !== 0) return cn;
          return cmpIssueDesc(a, b);
        });
      }
      return arr;
    }

    function draw() {
      var invoices = S.getInvoices();
      var q = (document.getElementById("invSearch") && document.getElementById("invSearch").value) || "";
      var typeF = document.getElementById("invTypeFilter") ? document.getElementById("invTypeFilter").value : "";
      var from = document.getElementById("invFrom") ? document.getElementById("invFrom").value : "";
      var to = document.getElementById("invTo") ? document.getElementById("invTo").value : "";
      var sortMode = document.getElementById("invSort") ? document.getElementById("invSort").value : "issue-desc";

      var filtered = invoices.filter(function (inv) {
        if (typeF === "tax" && !inv.isTaxInvoice) return false;
        if (typeF === "simple" && inv.isTaxInvoice) return false;
        if (from && (inv.issueDate || "").slice(0, 10) < from) return false;
        if (to && (inv.issueDate || "").slice(0, 10) > to) return false;
        if (q) {
          var hay =
            (inv.number || "") +
            " " +
            ((inv.customer && inv.customer.name) || "") +
            " " +
            ((inv.customer && inv.customer.phone) || "");
          if (!hay.toLowerCase().includes(q.toLowerCase())) return false;
        }
        return true;
      });

      filtered = sortInvoices(filtered, sortMode);

      var sum = filtered.reduce(function (a, inv) {
        return a + (Number(inv.total) || 0);
      }, 0);

      var rows = filtered
        .map(function (inv) {
          return (
            "<tr class=\"is-clickable\" data-id=\"" +
            F.escapeHtml(inv.id) +
            "\">" +
            "<td>" +
            F.escapeHtml(inv.number) +
            "</td>" +
            "<td>" +
            F.formatDateShort(inv.issueDate) +
            "</td>" +
            "<td>" +
            F.escapeHtml((inv.customer && inv.customer.name) || "—") +
            "</td>" +
            "<td>" +
            (inv.isTaxInvoice
              ? '<span class="badge badge--tax" aria-label="ضريبية"><span class="badge__full" aria-hidden="true">ضريبية</span><span class="badge__abbr" aria-hidden="true">ض</span></span>'
              : '<span class="badge badge--simple" aria-label="عادية"><span class="badge__full" aria-hidden="true">عادية</span><span class="badge__abbr" aria-hidden="true">ع</span></span>') +
            "</td>" +
            "<td class=\"num\">" +
            F.formatCurrency(inv.total) +
            "</td>" +
            "<td class=\"no-print\">" +
            '<a class="btn btn--sm btn--ghost btn-view" href="#/invoice/' +
            inv.id +
            "\">عرض</a>" +
            "</td></tr>"
          );
        })
        .join("");

      document.getElementById("invSummary").textContent =
        "عرض " + filtered.length + " فاتورة — إجمالي المبالغ: " + F.formatCurrency(sum);

      var tb = document.getElementById("invTableBody");
      if (tb)
        tb.innerHTML =
          rows ||
          '<tr><td colspan="6"><div class="empty-state" style="padding:2rem">لا توجد فواتير مطابقة.</div></td></tr>';
    }

    container.innerHTML =
      '<div class="card">' +
      '<div class="card__header card__header--with-strip">' +
      '<h2 class="card__title">سجل الفواتير</h2>' +
      '<div class="lh-toolbar-strip lh-toolbar-strip--single">' +
      '<a class="btn btn--sm btn--primary" href="#/invoice/new">+ فاتورة جديدة</a></div></div>' +
      '<div class="card__body">' +
      '<div class="filters-bar">' +
      '<div class="form-group"><label class="form-label">بحث</label>' +
      '<input type="search" class="form-control" id="invSearch" placeholder="رقم، عميل، جوال..." /></div>' +
      '<div class="form-group"><label class="form-label">النوع</label>' +
      '<select class="form-select" id="invTypeFilter">' +
      '<option value="">الكل</option>' +
      '<option value="tax">ضريبية</option>' +
      '<option value="simple">عادية</option></select></div>' +
      '<div class="form-group"><label class="form-label">من تاريخ</label>' +
      '<div class="lh-date-shell">' +
      '<input type="date" class="form-control" id="invFrom" /></div></div>' +
      '<div class="form-group"><label class="form-label">إلى تاريخ</label>' +
      '<div class="lh-date-shell">' +
      '<input type="date" class="form-control" id="invTo" /></div></div>' +
      '<div class="form-group"><label class="form-label">ترتيب العرض</label>' +
      '<select class="form-select" id="invSort">' +
      '<option value="issue-desc" selected>تلقائي — تنازلي (الأحدث أولاً)</option>' +
      '<option value="issue-asc">الأقدم أولاً (تاريخ الإصدار)</option>' +
      '<option value="total-desc">الأعلى إجمالياً</option>' +
      '<option value="total-asc">الأقل إجمالياً</option>' +
      '<option value="num-asc">رقم الفاتورة تصاعدياً</option>' +
      '<option value="num-desc">رقم الفاتورة تنازلياً</option>' +
      "</select></div></div>" +
      '<p id="invSummary" style="font-weight:600;margin-bottom:0.75rem;color:var(--color-primary)"></p>' +
      '<div class="table-wrap">' +
      '<table class="data-table data-table--invoices"><thead><tr>' +
      "<th>رقم الفاتورة</th><th>التاريخ</th><th>العميل</th><th>النوع</th><th>الإجمالي</th><th class=\"no-print\">إجراءات</th>" +
      "</tr></thead><tbody id=\"invTableBody\"></tbody></table></div></div></div>";

    var invSortEl = document.getElementById("invSort");
    if (invSortEl) invSortEl.value = "issue-desc";

    ["invSearch", "invTypeFilter", "invFrom", "invTo", "invSort"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", draw);
      if (el) el.addEventListener("change", draw);
    });

    document.getElementById("invTableBody").addEventListener("click", function (e) {
      var tr = e.target.closest("tr[data-id]");
      if (tr && !e.target.closest("a")) {
        location.hash = "#/invoice/" + tr.getAttribute("data-id");
      }
    });

    draw();
    container._cleanup = function () {};
  }

  global.LHInvoicesList = { render: render };
})(typeof window !== "undefined" ? window : this);
