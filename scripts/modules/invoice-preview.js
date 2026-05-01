/**
 * معاينة الفاتورة وطباعتها وتصدير PDF
 */
(function (global) {
  var F = global.LHFormat;
  var S = global.LHStorage;

  function renderInvoiceSheet(inv, settings) {
    var isTax = !!inv.isTaxInvoice;
    var rate = settings.taxRate || 0.15;
    var logoHtml = settings.logoDataUrl
      ? '<img class="invoice-sheet__logo" src="' + F.escapeHtml(settings.logoDataUrl) + '" alt="شعار" />'
      : '<div class="invoice-sheet__logo-placeholder">ل.ح</div>';

    var typeBadge = isTax
      ? '<div class="invoice-sheet__type-badge invoice-sheet__type-badge--tax">فاتورة ضريبية</div>'
      : '<div class="invoice-sheet__type-badge invoice-sheet__type-badge--simple">فاتورة</div>';

    var linesHtml = (inv.lines || [])
      .map(function (line, i) {
        var qty = Number(line.quantity) || 0;
        var up = Number(line.unitPrice) || 0;
        var lt = qty * up;
        var uRaw = line.unit != null ? String(line.unit).trim() : "";
        var unitStr = uRaw ? F.escapeHtml(uRaw) : "—";
        return (
          "<tr>" +
          "<td>" +
          (i + 1) +
          "</td>" +
          "<td>" +
          F.escapeHtml(line.description || "") +
          "</td>" +
          '<td class="num">' +
          qty +
          "</td>" +
          "<td>" +
          unitStr +
          "</td>" +
          '<td class="num">' +
          F.formatCurrency(up).replace(" ر.س", "") +
          "</td>" +
          '<td class="num">' +
          F.formatCurrency(lt).replace(" ر.س", "") +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    var vatRow = "";
    if (isTax) {
      vatRow =
        "<tr><td>ضريبة القيمة المضافة (" +
        Math.round(rate * 100) +
        "%)</td><td class=\"num\">" +
        F.formatCurrency(inv.vatAmount || 0).replace(" ر.س", "") +
        "</td></tr>";
    }

    var summaryRows;
    if (isTax) {
      summaryRows =
        "<tr><td>المجموع قبل الضريبة</td><td class=\"num\">" +
        F.formatCurrency(inv.subtotal || 0).replace(" ر.س", "") +
        " ر.س</td></tr>" +
        vatRow +
        '<tr class="grand"><td>الإجمالي</td><td class="num">' +
        F.formatCurrency(inv.total || 0).replace(" ر.س", "") +
        " ر.س</td></tr>";
    } else {
      summaryRows =
        '<tr class="grand"><td>إجمالي الفاتورة المستحقة</td><td class="num">' +
        F.formatCurrency(inv.total || 0).replace(" ر.س", "") +
        " ر.س</td></tr>";
    }

    var companyTaxLine =
      isTax && settings.taxNumber
        ? '<p class="invoice-sheet__meta-line">الرقم الضريبي: ' + F.escapeHtml(settings.taxNumber) + "</p>"
        : "";

    var customerTaxLine =
      isTax && inv.customer && inv.customer.taxNumber
        ? "<p><strong>الرقم الضريبي للعميل:</strong> " + F.escapeHtml(inv.customer.taxNumber) + "</p>"
        : "";

    var customerEmailLine =
      inv.customer && inv.customer.email
        ? "<p><strong>البريد:</strong> " + F.escapeHtml(inv.customer.email) + "</p>"
        : "";

    var customerCrLine =
      inv.customer && inv.customer.commercialReg
        ? "<p><strong>السجل التجاري / الموحد:</strong> " + F.escapeHtml(inv.customer.commercialReg) + "</p>"
        : "";

    var showStamp = !!inv.isStamped && !!settings.stampDataUrl;
    var signBlock = showStamp
      ? '<div class="invoice-sheet__sign-wrap">' +
        '<div class="invoice-sheet__stamp-wrap">' +
        '<img class="invoice-sheet__stamp" src="' +
        F.escapeHtml(settings.stampDataUrl) +
        '" alt="ختم المؤسسة" />' +
        "</div>" +
        '<div class="invoice-sheet__sign invoice-sheet__sign--has-stamp">' +
        '<div class="invoice-sheet__sign-line">التوقيع والختم</div>' +
        "</div></div>"
      : '<div class="invoice-sheet__sign">' +
        '<div class="invoice-sheet__sign-line">التوقيع والختم</div>' +
        "</div>";

    var termsTrim = String(settings.termsText || "").trim();
    var termsBlock = termsTrim
      ? '<div class="invoice-sheet__terms">' + F.escapeHtml(termsTrim) + "</div>"
      : "";

    return (
      '<div class="invoice-sheet" id="invoicePdfTarget">' +
      '<div class="invoice-sheet__header">' +
      '<div style="display:flex;align-items:flex-start;gap:12px;">' +
      logoHtml +
      '<div class="invoice-sheet__company">' +
      '<h1 class="invoice-sheet__company-name">' +
      F.escapeHtml(settings.companyName) +
      "</h1>" +
      '<p class="invoice-sheet__meta-line">السجل التجاري: ' +
      F.escapeHtml(settings.commercialReg) +
      "</p>" +
      companyTaxLine +
      (settings.address ? '<p class="invoice-sheet__meta-line">' + F.escapeHtml(settings.address) + "</p>" : "") +
      (settings.phone ? '<p class="invoice-sheet__meta-line">جوال: ' + F.escapeHtml(settings.phone) + "</p>" : "") +
      (settings.email ? '<p class="invoice-sheet__meta-line">' + F.escapeHtml(settings.email) + "</p>" : "") +
      "</div></div>" +
      typeBadge +
      "</div>" +
      '<div class="invoice-sheet__info-row">' +
      '<div class="invoice-sheet__box">' +
      '<div class="invoice-sheet__box-title">بيانات الفاتورة</div>' +
      "<p><strong>رقم الفاتورة:</strong> " +
      F.escapeHtml(inv.number) +
      "</p>" +
      "<p><strong>تاريخ الإصدار:</strong> " +
      F.formatDate(inv.issueDate) +
      "</p>" +
      (inv.dueDate
        ? "<p><strong>تاريخ الاستحقاق:</strong> " + F.formatDate(inv.dueDate) + "</p>"
        : "") +
      "</div>" +
      '<div class="invoice-sheet__box">' +
      '<div class="invoice-sheet__box-title">بيانات العميل</div>' +
      "<p><strong>الاسم:</strong> " +
      F.escapeHtml((inv.customer && inv.customer.name) || "—") +
      "</p>" +
      (inv.customer && inv.customer.phone
        ? "<p><strong>الجوال:</strong> " + F.escapeHtml(inv.customer.phone) + "</p>"
        : "") +
      customerEmailLine +
      customerTaxLine +
      customerCrLine +
      (inv.customer && inv.customer.address
        ? "<p><strong>العنوان:</strong> " + F.escapeHtml(inv.customer.address) + "</p>"
        : "") +
      "</div></div>" +
      "<table class=\"invoice-sheet__lines\">" +
      "<thead><tr><th>#</th><th>البيان</th><th>الكمية</th><th>الوحدة</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>" +
      "<tbody>" +
      linesHtml +
      "</tbody></table>" +
      '<div class="invoice-sheet__summary">' +
      "<table class=\"invoice-sheet__summary-table\">" +
      summaryRows +
      "</table></div>" +
      '<div class="invoice-sheet__words">' +
      F.escapeHtml(F.amountToArabicWords(inv.total || 0)) +
      "</div>" +
      termsBlock +
      (inv.notes
        ? '<div class="invoice-sheet__notes"><strong>ملاحظات:</strong> ' + F.escapeHtml(inv.notes) + "</div>"
        : "") +
      '<div class="invoice-sheet__footer-stack">' +
      '<div class="invoice-sheet__footer">' +
      signBlock +
      "</div>" +
      '<p class="invoice-sheet__footer-thanks">' +
      F.escapeHtml(settings.footerText || "") +
      "</p>" +
      "</div>" +
      "</div>"
    );
  }

  /** نفس class تصدير الـPDF — يُلغى zoom معاينة الجوال مؤقتًا أثناء الطباعة أو اللقطة. */
  var INVOICE_A4_CLASS = "lh-pdf-capture";
  var invoiceA4FallbackTimer = null;

  function invoiceA4OutputEnd() {
    if (invoiceA4FallbackTimer) {
      global.clearTimeout(invoiceA4FallbackTimer);
      invoiceA4FallbackTimer = null;
    }
    try {
      document.documentElement.classList.remove(INVOICE_A4_CLASS);
    } catch (e) {}
  }

  function invoiceA4OutputStart() {
    document.documentElement.classList.add(INVOICE_A4_CLASS);
  }

  function scheduleInvoiceA4FallbackEnd() {
    if (invoiceA4FallbackTimer) global.clearTimeout(invoiceA4FallbackTimer);
    invoiceA4FallbackTimer = global.setTimeout(invoiceA4OutputEnd, 4000);
  }

  /** طباعة: تخطيط A4 حقيقي أثناء معاينة الطباعة فقط، ثم إرجاع زوم الشاشة. */
  function printInvoiceWithA4Layout() {
    invoiceA4OutputStart();
    scheduleInvoiceA4FallbackEnd();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        window.print();
      });
    });
  }

  function wireInvoicePreviewChrome(inv, settings, fileSafe, opts) {
    opts = opts || {};

    function mqPrintOnChange(e) {
      if (!e.matches) invoiceA4OutputEnd();
    }
    window.addEventListener("beforeprint", invoiceA4OutputStart);
    window.addEventListener("afterprint", invoiceA4OutputEnd);
    var mqPrint = global.matchMedia && global.matchMedia("print");
    if (mqPrint) {
      if (mqPrint.addEventListener) {
        mqPrint.addEventListener("change", mqPrintOnChange);
      } else if (mqPrint.addListener) {
        mqPrint.addListener(mqPrintOnChange);
      }
    }

    document.getElementById("btnPrintInv").onclick = function () {
      printInvoiceWithA4Layout();
    };

    document.getElementById("btnPdfInv").onclick = function () {
      var btn = document.getElementById("btnPdfInv");
      btn.disabled = true;
      global.LHPdf.exportElementToPdf("invoicePdfTarget", fileSafe)
        .then(function () {
          global.showToast("تم حفظ PDF بنجاح", "success");
        })
        .catch(function (e) {
          global.showToast(e.message || "فشل التصدير", "error");
        })
        .finally(function () {
          btn.disabled = false;
        });
    };

    if (!opts.noDelete) {
      document.getElementById("btnDelInv").onclick = function () {
        var run = function () {
          S.deleteInvoice(inv.id);
          global.showToast("تم حذف الفاتورة", "info");
          global.location.hash = "#/invoices";
        };
        if (global.LHConfirm && global.LHConfirm.show) {
          global.LHConfirm.show({
            title: "حذف الفاتورة",
            message: "هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.",
            confirmLabel: "حذف نهائياً",
            cancelLabel: "إلغاء",
            danger: true,
          }).then(function (ok) {
            if (ok) run();
          });
        } else {
          if (!global.confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) return;
          run();
        }
      };
    }

    try {
      if (global.sessionStorage.getItem("lh_print_invoice") === inv.id) {
        global.sessionStorage.removeItem("lh_print_invoice");
        setTimeout(function () {
          printInvoiceWithA4Layout();
        }, 400);
      }
    } catch (e) {}

    function onKeyPrint(ev) {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === "p") {
        ev.preventDefault();
        printInvoiceWithA4Layout();
      }
    }
    document.addEventListener("keydown", onKeyPrint);

    return function cleanup() {
      document.removeEventListener("keydown", onKeyPrint);
      window.removeEventListener("beforeprint", invoiceA4OutputStart);
      window.removeEventListener("afterprint", invoiceA4OutputEnd);
      if (mqPrint) {
        if (mqPrint.removeEventListener) {
          mqPrint.removeEventListener("change", mqPrintOnChange);
        } else if (mqPrint.removeListener) {
          mqPrint.removeListener(mqPrintOnChange);
        }
      }
      invoiceA4OutputEnd();
    };
  }

  /** معاينة مسودة من نموذج الفاتورة (جوال) — داخل التطبيق بدل تبويب PDF. */
  function renderDraftPreview(container) {
    var raw = null;
    try {
      raw = global.sessionStorage.getItem("lh_invoice_draft_preview");
    } catch (e) {
      raw = null;
    }
    if (!raw) {
      container.innerHTML =
        '<div class="empty-state"><p>لا توجد معاينة مؤقتة.</p><a class="btn btn--primary" href="#/invoice/new">فاتورة جديدة</a></div>';
      container._cleanup = function () {};
      return;
    }
    var pack = null;
    try {
      pack = JSON.parse(raw);
    } catch (e2) {
      pack = null;
    }
    if (!pack || !pack.inv || !pack.settings) {
      container.innerHTML =
        '<div class="empty-state"><p>معاينة غير صالحة.</p><a class="btn btn--primary" href="#/invoice/new">فاتورة جديدة</a></div>';
      container._cleanup = function () {};
      return;
    }
    var inv = pack.inv;
    var settings = pack.settings;
    var returnTo = pack.returnTo || "#/invoice/new";
    if (!/^#\/invoice\/new$/.test(returnTo)) {
      returnTo = "#/invoice/new";
    }
    var fileSafe = String(inv.number || "preview").replace(/[^\w\u0600-\u06FF-]+/g, "_") + ".pdf";

    container.innerHTML =
      '<div class="invoice-print-area">' +
      '<div class="invoice-actions no-print">' +
      '<div class="invoice-act-strip" role="toolbar" aria-label="معاينة مسودة">' +
      '<button type="button" class="btn btn--sm btn--primary" id="btnPrintInv" title="طباعة" aria-label="طباعة">' +
      '<i class="bi bi-printer invoice-act-ico" aria-hidden="true"></i>' +
      '<span class="invoice-act-txt">طباعة</span></button>' +
      '<button type="button" class="btn btn--sm btn--accent" id="btnPdfInv" title="حفظ PDF" aria-label="حفظ PDF">' +
      '<i class="bi bi-file-earmark-pdf invoice-act-ico" aria-hidden="true"></i>' +
      '<span class="invoice-act-txt">حفظ PDF</span></button>' +
      '<a class="btn btn--sm btn--ghost" href="' +
      F.escapeHtml(returnTo) +
      '" title="رجوع للتعديل" aria-label="رجوع للتعديل">' +
      '<i class="bi bi-pencil-square invoice-act-ico" aria-hidden="true"></i>' +
      '<span class="invoice-act-txt">رجوع للتعديل</span></a>' +
      "</div></div>" +
      '<div class="invoice-page-wrap">' +
      renderInvoiceSheet(inv, settings) +
      "</div></div>";

    var innerCleanup = wireInvoicePreviewChrome(inv, settings, fileSafe, { noDelete: true });

    container._cleanup = function () {
      innerCleanup();
      try {
        global.sessionStorage.removeItem("lh_invoice_draft_preview");
      } catch (e3) {}
    };
  }

  function render(container, invoiceId) {
    var inv = S.getInvoiceById(invoiceId);
    if (!inv) {
      container.innerHTML =
        '<div class="empty-state"><p>الفاتورة غير موجودة.</p><a class="btn btn--primary" href="#/invoices">سجل الفواتير</a></div>';
      container._cleanup = function () {};
      return;
    }
    var settings = S.getSettings();
    var fileSafe = String(inv.number).replace(/[^\w\u0600-\u06FF-]+/g, "_") + ".pdf";

    container.innerHTML =
      '<div class="invoice-print-area">' +
      '<div class="invoice-actions no-print">' +
      '<div class="invoice-act-strip" role="toolbar" aria-label="إجراءات الفاتورة">' +
      '<button type="button" class="btn btn--sm btn--primary" id="btnPrintInv" title="طباعة" aria-label="طباعة">' +
      '<i class="bi bi-printer invoice-act-ico" aria-hidden="true"></i>' +
      '<span class="invoice-act-txt">طباعة</span></button>' +
      '<button type="button" class="btn btn--sm btn--accent" id="btnPdfInv" title="حفظ PDF" aria-label="حفظ PDF">' +
      '<i class="bi bi-file-earmark-pdf invoice-act-ico" aria-hidden="true"></i>' +
      '<span class="invoice-act-txt">حفظ PDF</span></button>' +
      '<button type="button" class="btn btn--sm btn--danger" id="btnDelInv" title="حذف" aria-label="حذف">' +
      '<i class="bi bi-trash3 invoice-act-ico" aria-hidden="true"></i>' +
      '<span class="invoice-act-txt">حذف</span></button>' +
      '<a class="btn btn--sm btn--ghost" href="#/invoices" title="رجوع للسجل" aria-label="رجوع للسجل">' +
      '<i class="bi bi-journal-text invoice-act-ico" aria-hidden="true"></i>' +
      '<span class="invoice-act-txt">رجوع للسجل</span></a>' +
      "</div></div>" +
      '<div class="invoice-page-wrap">' +
      renderInvoiceSheet(inv, settings) +
      "</div></div>";

    container._cleanup = wireInvoicePreviewChrome(inv, settings, fileSafe, { noDelete: false });
  }

  /** طباعة فاتورة (بيانات كاملة) في نافذة جديدة — دون حفظ */
  function openPrintWindow(inv, settings) {
    var w = global.open("", "_blank");
    if (!w) {
      global.showToast("المتصفّح منع نافذة الطباعة", "error");
      return;
    }
    var baseHref = global.location.href.split("#")[0];
    function resolveCss(rel) {
      try {
        return new URL(rel, baseHref).href;
      } catch (e) {
        return rel;
      }
    }
    var googleFonts =
      "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&display=swap";
    var sheetHtml = renderInvoiceSheet(inv, settings);
    w.document.open();
    w.document.write(
      '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">' +
      "<title>طباعة فاتورة</title>" +
      '<link rel="stylesheet" href="' +
      F.escapeHtml(googleFonts) +
      '">' +
      '<link rel="stylesheet" href="' +
      F.escapeHtml(resolveCss("styles/main.css")) +
      '">' +
      '<link rel="stylesheet" href="' +
      F.escapeHtml(resolveCss("styles/invoice-template.css")) +
      '">' +
      '<link rel="stylesheet" href="' +
      F.escapeHtml(resolveCss("styles/print.css")) +
      '">' +
      '</head><body style="margin:0;background:#f5f5f5">' +
      '<div class="invoice-page-wrap" style="max-width:210mm;margin:0 auto">' +
      sheetHtml +
      "</div></body></html>"
    );
    w.document.close();
    function runPrint() {
      try {
        w.focus();
        w.print();
      } catch (e2) {}
    }
    if (w.document.readyState === "complete") {
      global.setTimeout(runPrint, 500);
    } else {
      w.addEventListener("load", function () {
        global.setTimeout(runPrint, 500);
      });
    }
  }

  global.LHInvoicePreview = {
    render: render,
    renderDraftPreview: renderDraftPreview,
    renderInvoiceSheet: renderInvoiceSheet,
    openPrintWindow: openPrintWindow,
  };
})(typeof window !== "undefined" ? window : this);
