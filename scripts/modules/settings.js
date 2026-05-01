/**
 * الإعدادات — النسخ الاحتياطي والاستعادة
 */
(function (global) {
  var F = global.LHFormat;
  var S = global.LHStorage;

  function taxRateToPercentDisplay(rate) {
    var r = Number(rate);
    if (isNaN(r) || r < 0) {
      r = 0.15;
    }
    return Math.round(r * 10000) / 100;
  }

  function percentInputToTaxRate(pct) {
    var raw = pct == null ? "" : String(pct).trim();
    if (raw === "") {
      return 0.15;
    }
    var n = Number(raw);
    if (isNaN(n)) {
      return 0.15;
    }
    return Math.min(1, Math.max(0, n / 100));
  }

  function render(container) {
    var s = S.getSettings();

    container.innerHTML =
      '<div class="card">' +
      '<div class="card__header"><h2 class="card__title">إعدادات المؤسسة</h2></div>' +
      '<div class="card__body">' +
      '<form id="setForm">' +
      '<div class="form-grid">' +
      '<div class="form-group" style="grid-column:1/-1"><label class="form-label">اسم المؤسسة</label>' +
      '<input type="text" class="form-control" name="companyName" value="' +
      F.escapeHtml(s.companyName) +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">السجل / الرقم الموحد</label>' +
      '<input type="text" class="form-control" name="commercialReg" value="' +
      F.escapeHtml(s.commercialReg) +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">الرقم الضريبي للمؤسسة</label>' +
      '<input type="text" class="form-control" name="taxNumber" value="' +
      F.escapeHtml(s.taxNumber || "") +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">العنوان</label>' +
      '<input type="text" class="form-control" name="address" value="' +
      F.escapeHtml(s.address || "") +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">الجوال</label>' +
      '<input type="text" class="form-control" name="phone" value="' +
      F.escapeHtml(s.phone || "") +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">البريد الإلكتروني</label>' +
      '<input type="email" class="form-control" name="email" value="' +
      F.escapeHtml(s.email || "") +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">نسبة الضريبة (%)</label>' +
      '<input type="number" step="0.01" min="0" max="100" class="form-control" name="taxRate" placeholder="مثال: 15" value="' +
      taxRateToPercentDisplay(s.taxRate) +
      "\" /></div></div>" +
      '<div class="form-group logo-upload">' +
      '<label class="form-label">شعار المؤسسة (صورة)</label>' +
      '<input type="file" class="logo-upload__input" id="logoFile" accept="image/*" />' +
      '<div class="logo-upload__card">' +
      '<div class="logo-upload__preview">' +
      (s.logoDataUrl
        ? '<img src="' + F.escapeHtml(s.logoDataUrl) + '" alt="شعار المؤسسة" class="logo-upload__img" />'
        : '<div class="logo-upload__placeholder"><i class="bi bi-image"></i><span>لا يوجد شعار</span></div>') +
      "</div>" +
      '<div class="logo-upload__actions">' +
      '<label for="logoFile" class="btn btn--outline btn--sm"><i class="bi bi-upload"></i><span>رفع شعار</span></label>' +
      (s.logoDataUrl
        ? '<button type="button" class="btn btn--ghost btn--sm" id="clearLogo"><i class="bi bi-trash3"></i><span>إزالة الشعار</span></button>'
        : "") +
      "</div>" +
      '<p class="logo-upload__hint">يُحفظ محلياً في المتصفح كصورة مضمنة، ويفضّل شعار مربع بخلفية شفافة.</p>' +
      "</div>" +
      "</div>" +
      '<div class="form-group logo-upload stamp-upload">' +
      '<label class="form-label">صورة ختم المؤسسة (اختياري)</label>' +
      '<input type="file" class="logo-upload__input" id="stampFile" accept="image/*" />' +
      '<div class="logo-upload__card">' +
      '<div class="logo-upload__preview">' +
      (s.stampDataUrl
        ? '<img src="' + F.escapeHtml(s.stampDataUrl) + '" alt="ختم المؤسسة" class="logo-upload__img" />'
        : '<div class="logo-upload__placeholder"><i class="bi bi-image"></i><span>لا يوجد ختم</span></div>') +
      "</div>" +
      '<div class="logo-upload__actions">' +
      '<label for="stampFile" class="btn btn--outline btn--sm"><i class="bi bi-upload"></i><span>رفع الختم</span></label>' +
      (s.stampDataUrl
        ? '<button type="button" class="btn btn--ghost btn--sm" id="clearStamp"><i class="bi bi-trash3"></i><span>إزالة الختم</span></button>'
        : "") +
      "</div>" +
      '<p class="logo-upload__hint">يُحفظ محلياً كصورة مضمنة. يُفضّل PNG بخلفية شفافة، بعرض تقريبي <strong>200–280 بكسل</strong> ونسبة قريبة من المربع ليتناسب مع مساحة «التوقيع والختم» في الفاتورة.</p>' +
      "</div>" +
      "</div>" +
      '<div class="form-group"><label class="form-label">نص التذييل</label>' +
      '<input type="text" class="form-control" name="footerText" value="' +
      F.escapeHtml(s.footerText || "") +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">الشروط والأحكام (يظهر في الفاتورة)</label>' +
      '<textarea class="form-control" name="termsText" rows="3">' +
      F.escapeHtml(s.termsText || "") +
      "</textarea></div>" +
      '<div class="btn-group lh-toolbar-strip lh-toolbar-strip--single">' +
      '<button type="submit" class="btn btn--sm btn--primary">حفظ الإعدادات</button></div></form>' +
      "<hr style=\"margin:2rem 0;border:none;border-top:1px solid var(--color-border)\" />" +
      '<h3 style="margin-top:0">نسخ احتياطي واستعادة</h3>' +
      '<p style="color:var(--color-text-muted)">صدّر كل البيانات (فواتير، عملاء، إعدادات) كملف Excel (XLS) يمكن فتحه مباشرةً. ويمكنك استيراده لاحقاً لإرجاع البيانات.</p>' +
      '<div class="btn-group lh-toolbar-strip lh-toolbar-strip--xls" style="margin-bottom:1rem">' +
      '<button type="button" class="btn btn--sm btn--accent" id="btnExport">تصدير نسخة Excel</button>' +
      '<label class="btn btn--sm btn--outline" style="cursor:pointer">استيراد Excel<input type="file" id="importFile" accept=".xls,text/html,application/vnd.ms-excel" style="display:none" /></label>' +
      "</div>" +
      '<label class="form-check"><input type="checkbox" id="importReplace" />' +
      "<span>استبدال كل البيانات عند الاستيراد (إلا إذا أزلت التحديد يُدمج مع الموجود)</span></label>" +
      "</div></div>";

    function xlsEscape(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function downloadXls(filename, html) {
      var blob = new Blob(["\ufeff" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }

    function buildBackupXls() {
      var data = S.getData();
      var settings = data.settings || {};
      var invoices = data.invoices || [];
      var customers = data.customers || [];

      var settingsRows = Object.keys(settings)
        .sort()
        .map(function (k) {
          return "<tr><td>" + xlsEscape(k) + "</td><td>" + xlsEscape(settings[k]) + "</td></tr>";
        })
        .join("");

      var customerRows = customers
        .map(function (c) {
          return (
            "<tr>" +
            "<td>" + xlsEscape(c.id) + "</td>" +
            "<td>" + xlsEscape(c.name) + "</td>" +
            "<td>" + xlsEscape(c.phone) + "</td>" +
            "<td>" + xlsEscape(c.email) + "</td>" +
            "<td>" + xlsEscape(c.taxNumber) + "</td>" +
            "<td>" + xlsEscape(c.commercialReg || "") + "</td>" +
            "<td>" + xlsEscape(c.address) + "</td>" +
            "<td>" + xlsEscape(c.createdAt) + "</td>" +
            "<td>" + xlsEscape(c.updatedAt) + "</td>" +
            "</tr>"
          );
        })
        .join("");

      var invoiceRows = invoices
        .map(function (inv) {
          var cust = inv.customer || {};
          return (
            "<tr>" +
            "<td>" + xlsEscape(inv.id) + "</td>" +
            "<td>" + xlsEscape(inv.number) + "</td>" +
            "<td>" + xlsEscape(inv.issueDate) + "</td>" +
            "<td>" + xlsEscape(inv.dueDate) + "</td>" +
            "<td>" + xlsEscape(inv.isTaxInvoice ? "1" : "0") + "</td>" +
            "<td>" + xlsEscape(inv.customerId) + "</td>" +
            "<td>" + xlsEscape(cust.name) + "</td>" +
            "<td>" + xlsEscape(cust.taxNumber) + "</td>" +
            "<td>" + xlsEscape(cust.phone) + "</td>" +
            "<td>" + xlsEscape(cust.email) + "</td>" +
            "<td>" + xlsEscape(cust.address) + "</td>" +
            "<td>" + xlsEscape(inv.subtotal) + "</td>" +
            "<td>" + xlsEscape(inv.vatAmount) + "</td>" +
            "<td>" + xlsEscape(inv.total) + "</td>" +
            "<td>" + xlsEscape(inv.notes) + "</td>" +
            "<td>" + xlsEscape(inv.createdAt) + "</td>" +
            "<td>" + xlsEscape(inv.updatedAt) + "</td>" +
            "<td>" + xlsEscape(JSON.stringify(inv.lines || [])) + "</td>" +
            "<td>" + xlsEscape(inv.isStamped ? "1" : "0") + "</td>" +
            "</tr>"
          );
        })
        .join("");

      return (
        '<html><head><meta charset="UTF-8" /></head><body>' +
        '<h2>LaylaHekmiInvoices Backup</h2>' +
        '<p>Generated: ' + xlsEscape(new Date().toISOString()) + "</p>" +
        '<h3>Settings</h3>' +
        '<table border="1" data-type="settings"><thead><tr><th>key</th><th>value</th></tr></thead><tbody>' +
        settingsRows +
        "</tbody></table>" +
        '<h3>Customers</h3>' +
        '<table border="1" data-type="customers"><thead><tr>' +
        "<th>id</th><th>name</th><th>phone</th><th>email</th><th>taxNumber</th><th>commercialReg</th><th>address</th><th>createdAt</th><th>updatedAt</th>" +
        "</tr></thead><tbody>" +
        customerRows +
        "</tbody></table>" +
        '<h3>Invoices</h3>' +
        '<table border="1" data-type="invoices"><thead><tr>' +
        "<th>id</th><th>number</th><th>issueDate</th><th>dueDate</th><th>isTaxInvoice</th><th>customerId</th><th>customerName</th><th>customerTax</th><th>customerPhone</th><th>customerEmail</th><th>customerAddress</th><th>subtotal</th><th>vatAmount</th><th>total</th><th>notes</th><th>createdAt</th><th>updatedAt</th><th>linesJson</th><th>isStamped</th>" +
        "</tr></thead><tbody>" +
        invoiceRows +
        "</tbody></table>" +
        "</body></html>"
      );
    }

    function parseXlsBackup(htmlText) {
      var doc = new DOMParser().parseFromString(htmlText, "text/html");
      var out = { settings: S.defaultSettings(), invoices: [], customers: [] };

      var settingsTable = doc.querySelector('table[data-type="settings"]');
      if (settingsTable) {
        settingsTable.querySelectorAll("tbody tr").forEach(function (tr) {
          var tds = tr.querySelectorAll("td");
          if (tds.length >= 2) {
            var k = (tds[0].textContent || "").trim();
            var v = (tds[1].textContent || "").trim();
            if (k) out.settings[k] = v;
          }
        });
        // أعِد بعض الأنواع
        if (out.settings.taxRate != null) {
          var trImp = Number(out.settings.taxRate);
          if (isNaN(trImp)) {
            trImp = 0.15;
          } else if (trImp > 1) {
            trImp = trImp / 100;
          }
          out.settings.taxRate = Math.min(1, Math.max(0, trImp));
        }
        if (!out.settings.yearCounters || typeof out.settings.yearCounters !== "object") out.settings.yearCounters = {};
      }

      var customersTable = doc.querySelector('table[data-type="customers"]');
      if (customersTable) {
        customersTable.querySelectorAll("tbody tr").forEach(function (tr) {
          var td = tr.querySelectorAll("td");
          if (td.length < 2) return;
          if (td.length >= 10) {
            out.customers.push({
              id: (td[0].textContent || "").trim(),
              name: (td[1].textContent || "").trim(),
              phone: (td[2].textContent || "").trim(),
              email: (td[3].textContent || "").trim(),
              taxNumber: (td[4].textContent || "").trim(),
              commercialReg: (td[5].textContent || "").trim(),
              address: (td[6].textContent || "").trim(),
              createdAt: (td[7].textContent || "").trim(),
              updatedAt: (td[8].textContent || "").trim(),
            });
          } else {
            out.customers.push({
              id: (td[0].textContent || "").trim(),
              name: (td[1].textContent || "").trim(),
              taxNumber: (td[2] && td[2].textContent ? td[2].textContent : "").trim(),
              phone: (td[3] && td[3].textContent ? td[3].textContent : "").trim(),
              email: (td[4] && td[4].textContent ? td[4].textContent : "").trim(),
              commercialReg: "",
              address: (td[5] && td[5].textContent ? td[5].textContent : "").trim(),
              createdAt: (td[6] && td[6].textContent ? td[6].textContent : "").trim(),
              updatedAt: (td[7] && td[7].textContent ? td[7].textContent : "").trim(),
            });
          }
        });
      }

      var invoicesTable = doc.querySelector('table[data-type="invoices"]');
      if (invoicesTable) {
        invoicesTable.querySelectorAll("tbody tr").forEach(function (tr) {
          var td = tr.querySelectorAll("td");
          if (td.length < 10) return;
          var isTax = (td[4].textContent || "").trim() === "1";
          var lines = [];
          try {
            lines = JSON.parse((td[17] && td[17].textContent ? td[17].textContent : "[]") || "[]");
          } catch (e) {
            lines = [];
          }
          var isStamped = td.length >= 19 && (td[18].textContent || "").trim() === "1";
          out.invoices.push({
            id: (td[0].textContent || "").trim(),
            number: (td[1].textContent || "").trim(),
            issueDate: (td[2].textContent || "").trim(),
            dueDate: (td[3].textContent || "").trim() || null,
            isTaxInvoice: isTax,
            isStamped: isStamped,
            customerId: (td[5] && td[5].textContent ? td[5].textContent : "").trim() || null,
            customer: {
              name: (td[6] && td[6].textContent ? td[6].textContent : "").trim(),
              taxNumber: (td[7] && td[7].textContent ? td[7].textContent : "").trim(),
              phone: (td[8] && td[8].textContent ? td[8].textContent : "").trim(),
              email: (td[9] && td[9].textContent ? td[9].textContent : "").trim(),
              address: (td[10] && td[10].textContent ? td[10].textContent : "").trim(),
            },
            subtotal: Number((td[11] && td[11].textContent ? td[11].textContent : "").trim()) || 0,
            vatAmount: Number((td[12] && td[12].textContent ? td[12].textContent : "").trim()) || 0,
            total: Number((td[13] && td[13].textContent ? td[13].textContent : "").trim()) || 0,
            notes: (td[14] && td[14].textContent ? td[14].textContent : "").trim(),
            createdAt: (td[15] && td[15].textContent ? td[15].textContent : "").trim(),
            updatedAt: (td[16] && td[16].textContent ? td[16].textContent : "").trim(),
            lines: Array.isArray(lines) ? lines : [],
          });
        });
      }

      // حد أدنى من التحقق
      if (!out.settings || !Array.isArray(out.invoices) || !Array.isArray(out.customers)) {
        throw new Error("ملف Excel غير صالح");
      }
      return out;
    }

    container.querySelector("#setForm").onsubmit = function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      S.updateSettings({
        companyName: String(fd.get("companyName") || "").trim(),
        commercialReg: String(fd.get("commercialReg") || "").trim(),
        taxNumber: String(fd.get("taxNumber") || "").trim(),
        address: String(fd.get("address") || "").trim(),
        phone: String(fd.get("phone") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        invoicePrefix: "LH",
        taxRate: percentInputToTaxRate(fd.get("taxRate")),
        footerText: String(fd.get("footerText") || "").trim(),
        termsText: String(fd.get("termsText") || "").trim(),
      });
      global.showToast("تم حفظ الإعدادات", "success");
    };

    var logoInput = container.querySelector("#logoFile");
    logoInput.onchange = function () {
      var file = logoInput.files && logoInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        S.updateSettings({ logoDataUrl: reader.result });
        global.showToast("تم حفظ الشعار", "success");
        render(container);
      };
      reader.readAsDataURL(file);
    };

    var clr = container.querySelector("#clearLogo");
    if (clr)
      clr.onclick = function () {
        S.updateSettings({ logoDataUrl: null });
        global.showToast("تمت إزالة الشعار", "info");
        render(container);
      };

    var stampInput = container.querySelector("#stampFile");
    stampInput.onchange = function () {
      var file = stampInput.files && stampInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        S.updateSettings({ stampDataUrl: reader.result });
        global.showToast("تم حفظ صورة الختم", "success");
        render(container);
      };
      reader.readAsDataURL(file);
    };

    var clrStamp = container.querySelector("#clearStamp");
    if (clrStamp)
      clrStamp.onclick = function () {
        S.updateSettings({ stampDataUrl: null });
        global.showToast("تمت إزالة الختم", "info");
        render(container);
      };

    container.querySelector("#btnExport").onclick = function () {
      var html = buildBackupXls();
      downloadXls("layla_hekmi_backup_" + F.todayISO() + ".xls", html);
      global.showToast("تم التصدير", "success");
    };

    container.querySelector("#importFile").onchange = function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var replace = container.querySelector("#importReplace").checked;
          var parsed = parseXlsBackup(reader.result);
          if (replace) {
            var ok = S.setData(parsed);
            if (!ok) throw new Error("تعذر حفظ البيانات (LocalStorage)");
          } else {
            S.importAll(JSON.stringify(parsed), false);
          }
          global.showToast("تم الاستيراد بنجاح", "success");
          render(container);
        } catch (err) {
          global.showToast(err.message || "فشل الاستيراد", "error");
        }
      };
      reader.readAsText(file, "UTF-8");
      ev.target.value = "";
    };

    container._cleanup = function () {};
  }

  global.LHSettings = { render: render };
})(typeof window !== "undefined" ? window : this);
