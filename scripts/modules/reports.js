/**
 * التقارير والتصدير CSV
 */
(function (global) {
  var F = global.LHFormat;
  var S = global.LHStorage;

  function chartDevicePixelRatio() {
    var dpr = typeof window !== "undefined" && window.devicePixelRatio ? window.devicePixelRatio : 1;
    return Math.min(dpr, 2);
  }

  function inRange(iso, from, to) {
    var d = (iso || "").slice(0, 10);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  }

  function downloadCsv(filename, text) {
    var blob = new Blob(["\ufeff" + text], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function render(container) {
    var from = F.todayISO().slice(0, 8) + "01";
    var to = F.todayISO();

    container.innerHTML =
      '<div class="card">' +
      '<div class="card__header"><h2 class="card__title">التقارير</h2></div>' +
      '<div class="card__body">' +
      '<div class="filters-bar filters-bar--reports">' +
      '<div class="form-group"><label class="form-label">من</label>' +
      '<input type="date" class="form-control" id="repFrom" value="' +
      from +
      '" /></div>' +
      '<div class="form-group"><label class="form-label">إلى</label>' +
      '<input type="date" class="form-control" id="repTo" value="' +
      to +
      "\" /></div>" +
      '<div class="lh-toolbar-strip lh-toolbar-strip--rep">' +
      '<button type="button" class="btn btn--sm btn--primary" id="repApply">تحديث</button>' +
      '<button type="button" class="btn btn--sm btn--outline" id="repCsv">تصدير CSV</button></div></div>' +
      '<div class="stats-grid" id="repStats"></div>' +
      '<div class="card" style="margin-bottom:1rem;border:1px solid var(--color-border)">' +
      '<div class="card__header"><h3 class="card__title" style="font-size:1rem">مبيعات حسب الشهر (ضمن الفترة)</h3></div>' +
      '<div class="card__body"><div class="chart-container"><canvas id="repChart"></canvas></div></div></div>' +
      '<div class="card" style="border:1px solid var(--color-border)">' +
      '<div class="card__header"><h3 class="card__title" style="font-size:1rem">أعلى العملاء (ضمن الفترة)</h3></div>' +
      '<div class="card__body" style="padding:0"><div class="table-wrap" style="border:none"><table class="data-table" id="repTop"></table></div></div></div>' +
      "</div></div>";

    var chartInstance = null;

    function monthKey(iso) {
      var d = new Date(iso);
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    }

    function draw() {
      var f = document.getElementById("repFrom").value;
      var t = document.getElementById("repTo").value;
      var invoices = S.getInvoices().filter(function (inv) {
        return inRange(inv.issueDate || inv.createdAt, f, t);
      });

      var sales = invoices.reduce(function (a, i) {
        return a + (Number(i.total) || 0);
      }, 0);
      var vat = invoices.reduce(function (a, i) {
        return a + (Number(i.vatAmount) || 0);
      }, 0);
      var sub = invoices.reduce(function (a, i) {
        return a + (Number(i.subtotal) || 0);
      }, 0);

      document.getElementById("repStats").innerHTML =
        '<div class="stat-card"><div class="stat-card__label">عدد الفواتير</div><div class="stat-card__value">' +
        invoices.length +
        "</div></div>" +
        '<div class="stat-card"><div class="stat-card__label">المجموع قبل الضريبة</div><div class="stat-card__value">' +
        F.formatCurrency(sub).replace(" ر.س", "") +
        "</div></div>" +
        '<div class="stat-card"><div class="stat-card__label">ضريبة VAT</div><div class="stat-card__value">' +
        F.formatCurrency(vat).replace(" ر.س", "") +
        "</div></div>" +
        '<div class="stat-card"><div class="stat-card__label">إجمالي المبيعات</div><div class="stat-card__value">' +
        F.formatCurrency(sales).replace(" ر.س", "") +
        "</div></div>";

      var map = {};
      invoices.forEach(function (inv) {
        var mk = monthKey(inv.issueDate || inv.createdAt);
        map[mk] = (map[mk] || 0) + (Number(inv.total) || 0);
      });
      var keys = Object.keys(map).sort();

      var custMap = {};
      invoices.forEach(function (inv) {
        var name = (inv.customer && inv.customer.name) || "بدون اسم";
        if (!custMap[name]) custMap[name] = 0;
        custMap[name] += Number(inv.total) || 0;
      });
      var top = Object.keys(custMap)
        .map(function (k) {
          return { name: k, total: custMap[k] };
        })
        .sort(function (a, b) {
          return b.total - a.total;
        })
        .slice(0, 10);

      var topHtml =
        "<thead><tr><th>العميل</th><th>إجمالي المبيعات</th></tr></thead><tbody>" +
        top
          .map(function (r) {
            return "<tr><td>" + F.escapeHtml(r.name) + "</td><td class=\"num\">" + F.formatCurrency(r.total) + "</td></tr>";
          })
          .join("") +
        "</tbody>";

      document.getElementById("repTop").innerHTML =
        topHtml ||
        '<tbody><tr><td colspan="2" class="empty-state">لا بيانات</td></tr></tbody>';

      var canvas = document.getElementById("repChart");
      if (typeof Chart !== "undefined" && canvas) {
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(canvas.getContext("2d"), {
          type: "line",
          data: {
            labels: keys.map(function (k) {
              var p = k.split("-");
              return p[1] + "/" + p[0];
            }),
            datasets: [
              {
                label: "المبيعات",
                data: keys.map(function (k) {
                  return map[k];
                }),
                borderColor: "#1e3a5f",
                backgroundColor: "rgba(201, 169, 97, 0.25)",
                fill: true,
                tension: 0.2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: chartDevicePixelRatio(),
            layout: {
              padding: { top: 6, right: 6, bottom: 6, left: 6 },
            },
            plugins: { legend: { display: false } },
            scales: {
              x: {
                ticks: { maxRotation: 0, autoSkip: true },
                grid: { display: false },
              },
              y: {
                beginAtZero: true,
                ticks: { maxTicksLimit: 6 },
                grid: { color: "rgba(30, 58, 95, 0.08)" },
              },
            },
          },
        });
      }

      container._reportRows = invoices;
      container._repFrom = f;
      container._repTo = t;
    }

    document.getElementById("repApply").onclick = draw;
    document.getElementById("repCsv").onclick = function () {
      var rows = container._reportRows || [];
      var f = container._repFrom;
      var t = container._repTo;
      var header = ["رقم الفاتورة", "التاريخ", "العميل", "ضريبية", "قبل الضريبة", "الضريبة", "الإجمالي"];
      var lines = [header.join(",")];
      rows.forEach(function (inv) {
        lines.push(
          [
            inv.number,
            (inv.issueDate || "").slice(0, 10),
            '"' + ((inv.customer && inv.customer.name) || "").replace(/"/g, '""') + '"',
            inv.isTaxInvoice ? "نعم" : "لا",
            inv.subtotal,
            inv.vatAmount,
            inv.total,
          ].join(",")
        );
      });
      downloadCsv("تقرير_فواتير_" + f + "_" + t + ".csv", lines.join("\n"));
      global.showToast("تم تصدير CSV", "success");
    };

    draw();

    container._cleanup = function () {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    };
  }

  global.LHReports = { render: render };
})(typeof window !== "undefined" ? window : this);
