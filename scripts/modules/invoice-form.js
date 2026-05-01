/**
 * إنشاء وتعديل الفاتورة
 */
(function (global) {
  var F = global.LHFormat;
  var S = global.LHStorage;
  var N = global.LHNumbering;

  function calcInvoice(lines, isTax, taxRate) {
    taxRate = typeof taxRate === "number" ? taxRate : 0.15;
    var subtotal = 0;
    (lines || []).forEach(function (line) {
      var qty = Math.max(0, Math.round(Number(line.quantity) || 0));
      var up = Number(line.unitPrice) || 0;
      subtotal += qty * up;
    });
    subtotal = Math.round(subtotal * 100) / 100;
    var vatAmount = 0;
    if (isTax) {
      vatAmount = Math.round(subtotal * taxRate * 100) / 100;
    }
    var total = Math.round((subtotal + vatAmount) * 100) / 100;
    return { subtotal: subtotal, vatAmount: vatAmount, total: total };
  }

  function defaultLine() {
    return { id: F.generateId(), description: "", quantity: 1, unit: "", unitPrice: 0 };
  }

  function parseLineQty(input) {
    return Math.max(0, Math.round(Number(input && input.value) || 0));
  }

  /** أرقام لاتينية فقط؛ 966xxxxxxxx ← يُختصر إلى صيغة محلية تبدأ بـ 0 */
  function normalizePhoneDigits(raw) {
    var d = F.toLatinDigits(String(raw || '')).replace(/\D/g, '');
    if (d.length >= 12 && d.slice(0, 3) === '966') {
      d = '0' + d.slice(3);
    }
    return d;
  }

  function coerceCustPhoneField(el) {
    if (!el) return;
    var d = normalizePhoneDigits(el.value);
    if (d.length > 10) {
      d = d.slice(0, 10);
    }
    el.value = d;
  }

  function buildFormHtml(opts) {
    var inv = opts.invoice;
    var settings = opts.settings;
    var isNew = opts.isNew;

    var hiddenCustVal = F.escapeHtml(inv.customerId || "");
    var searchInit = F.escapeHtml((inv.customer && inv.customer.name) || "");

    var lines = inv.lines && inv.lines.length ? inv.lines : [defaultLine()];
    var linesRows = lines
      .map(function (line, idx) {
        return (
          "<tr data-line-id=\"" +
          F.escapeHtml(line.id) +
          "\">" +
          "<td><input type=\"text\" class=\"form-control line-desc\" placeholder=\"البيان / وصف العمل\" value=\"" +
          F.escapeHtml(line.description) +
          "\" /></td>" +
          "<td><input type=\"number\" min=\"0\" step=\"1\" class=\"form-control line-qty\" value=\"" +
          Math.max(0, Math.round(Number(line.quantity) || 0)) +
          "\" /></td>" +
          "<td><input type=\"text\" class=\"form-control line-unit\" inputmode=\"text\" placeholder=\"م²، حبة…\" value=\"" +
          F.escapeHtml(line.unit != null ? String(line.unit) : "") +
          "\" /></td>" +
          "<td><input type=\"number\" min=\"0\" step=\"0.01\" class=\"form-control line-price\" value=\"" +
          line.unitPrice +
          "\" /></td>" +
          "<td class=\"line-total-cell num\">0</td>" +
          "<td class=\"lines-actions-cell\"><button type=\"button\" class=\"btn btn--ghost btn--sm btn-remove-line\" title=\"حذف\">✕</button></td>" +
          "</tr>"
        );
      })
      .join("");

    return (
      '<div class="card">' +
      '<div class="card__header">' +
      '<h2 class="card__title">' +
      (isNew ? "فاتورة جديدة" : "تعديل الفاتورة") +
      "</h2>" +
      '<span class="badge ' +
      (inv.isTaxInvoice ? "badge--tax" : "badge--simple") +
      '" id="taxBadge">' +
      (inv.isTaxInvoice ? "ضريبية" : "عادية") +
      "</span></div>" +
      '<div class="card__body">' +
      '<form id="invoiceForm" class="invoice-form">' +
      '<div class="invoice-form__section">' +
      '<div class="form-group invoice-grid__taxRow"><label class="form-check" style="margin-top:0">' +
      '<input type="checkbox" name="isTaxInvoice" id="isTaxInvoice"' +
      (inv.isTaxInvoice ? " checked" : "") +
      " />" +
      "<span>فاتورة ضريبية (احتساب ضريبة القيمة المضافة " +
      Math.round((settings.taxRate || 0.15) * 100) +
      "%)</span></label></div>" +
      '<div class="form-grid invoice-grid--meta">' +
      '<div class="form-group"><label class="form-label">رقم الفاتورة</label>' +
      '<input type="text" class="form-control" name="number" id="invNumber" value="' +
      F.escapeHtml(inv.number) +
      '" readonly aria-readonly="true" />' +
      "</div>" +
      '<div class="form-group"><label class="form-label">تاريخ الإصدار</label>' +
      '<div class="lh-date-shell">' +
      '<input type="date" class="form-control" name="issueDate" id="issueDate" value="' +
      F.escapeHtml((inv.issueDate || "").slice(0, 10)) +
      '" /></div></div>' +
      '<div class="form-group"><label class="form-label">تاريخ الاستحقاق</label>' +
      '<div class="lh-date-shell">' +
      '<input type="date" class="form-control" name="dueDate" id="dueDate" value="' +
      F.escapeHtml((inv.dueDate || "").slice(0, 10)) +
      '" /></div></div></div>' +
      '<div class="form-grid invoice-grid--pick" style="margin-top:0.75rem">' +
      '<div class="form-group invoice-form__customerSelect"><label class="form-label">اختيار عميل</label>' +
      '<div class="customer-combobox">' +
      '<input type="hidden" id="customerSelect" value="' +
      hiddenCustVal +
      '" />' +
      '<div class="customer-combobox__field">' +
      '<span class="customer-combobox__icon" aria-hidden="true"><i class="bi bi-search"></i></span>' +
      '<input type="text" id="customerSearch" class="form-control customer-combobox__input" placeholder="اسم العميل أو رقم الجوال…" autocomplete="off" spellcheck="false" ' +
      'role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-controls="customerListbox" aria-expanded="false" value="' +
      searchInit +
      '" />' +
      '<span class="customer-combobox__chevron" aria-hidden="true"><i class="bi bi-chevron-down"></i></span>' +
      "</div>" +
      '<ul class="customer-combobox__list" id="customerListbox" role="listbox" hidden></ul>' +
      "</div></div>" +
      '<div class="form-group"><label class="form-label">اسم العميل <abbr title="إجباري" style="color:var(--color-danger);text-decoration:none">*</abbr></label>' +
      '<input type="text" class="form-control" id="custName" maxlength="200" value="' +
      F.escapeHtml((inv.customer && inv.customer.name) || "") +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">جوال العميل <abbr title="إجباري — 10 أرقام" style="color:var(--color-danger);text-decoration:none">*</abbr></label>' +
      '<input type="text" class="form-control" id="custPhone" inputmode="numeric" autocomplete="tel" placeholder="05xxxxxxxx" value="' +
      F.escapeHtml((inv.customer && inv.customer.phone) || "") +
      "\" /></div></div></div>" +
      '<div class="invoice-form__section">' +
      '<div class="form-grid invoice-grid--extras">' +
      '<div class="form-group"><label class="form-label">البريد الإلكتروني</label>' +
      '<input type="email" class="form-control" id="custEmail" value="' +
      F.escapeHtml((inv.customer && inv.customer.email) || "") +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">الرقم الضريبي للعميل</label>' +
      '<input type="text" class="form-control" id="custTax" value="' +
      F.escapeHtml((inv.customer && inv.customer.taxNumber) || "") +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">السجل التجاري / الموحد</label>' +
      '<input type="text" class="form-control" id="custCommercialReg" value="' +
      F.escapeHtml((inv.customer && inv.customer.commercialReg) || "") +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">عنوان العميل</label>' +
      '<input type="text" class="form-control" id="custAddress" value="' +
      F.escapeHtml((inv.customer && inv.customer.address) || "") +
      "\" /></div></div></div>" +
      '<div class="card invoice-lines-card" style="margin:1rem 0;border:1px solid var(--color-border)">' +
      '<div class="card__header invoice-lines-card__head"><h3 class="card__title invoice-lines-card__title">بنود الفاتورة</h3></div>' +
      '<div class="card__body invoice-lines-card__body" style="padding:0">' +
      '<div class="table-wrap invoice-lines-card__table-wrap" style="border:none">' +
      "<table class=\"data-table\" id=\"linesTable\"><thead><tr>" +
      "<th>البيان</th><th>الكمية</th><th>الوحدة</th><th>سعر الوحدة (ر.س)</th><th>الإجمالي</th><th></th>" +
      "</tr></thead><tbody>" +
      linesRows +
      "</tbody></table></div>" +
      '<div class="invoice-lines-add-row no-print">' +
      '<button type="button" class="btn btn--outline" id="btnAddLine">+ إضافة بند</button></div></div></div>' +
      '<div class="form-grid invoice-summary-grid">' +
      '<div class="form-group" id="sumSubGroup"><label id="sumSubLabel">المجموع قبل الضريبة</label>' +
      '<input type="text" class="form-control" id="sumSub" readonly /></div>' +
      '<div class="form-group" id="vatGroup"><label>ضريبة القيمة المضافة</label>' +
      '<input type="text" class="form-control" id="sumVat" readonly /></div>' +
      '<div class="form-group" id="sumTotalGroup"><label id="sumTotalLabel"><strong>الإجمالي النهائي</strong></label>' +
      '<input type="text" class="form-control" id="sumTotal" readonly style="font-weight:800;font-size:1.1rem;color:var(--color-primary)" /></div></div>' +
      '<div class="form-group invoice-grid__stampRow">' +
      '<label class="form-check" style="margin-top:0">' +
      '<input type="checkbox" name="isStamped" id="isStamped"' +
      (inv.isStamped ? " checked" : "") +
      " />" +
      '<span>فاتورة مختومة</span></label></div>' +
      '<div class="form-group"><label class="form-label">ملاحظات</label>' +
      '<textarea class="form-control" id="invNotes" rows="3">' +
      F.escapeHtml(inv.notes || "") +
      "</textarea></div>" +
      '<div class="btn-group btn-group--toolbar lh-toolbar-strip no-print" role="group" aria-label="إجراءات الفاتورة" style="margin-top:1rem">' +
      '<button type="submit" class="btn btn--sm" id="btnSave">حفظ</button>' +
      '<button type="button" class="btn btn--sm" id="btnSavePreview">معاينة PDF</button>' +
      '<button type="button" class="btn btn--sm" id="btnSavePrint">طباعة</button>' +
      '<a class="btn btn--sm" id="btnInvCancel" href="#/invoices">إلغاء</a>' +
      "</div></form></div></div>"
    );
  }

  function gatherLines(tbody) {
    var lines = [];
    tbody.querySelectorAll("tr").forEach(function (tr) {
      var unitEl = tr.querySelector(".line-unit");
      lines.push({
        id: tr.getAttribute("data-line-id") || F.generateId(),
        description: tr.querySelector(".line-desc").value.trim(),
        quantity: parseLineQty(tr.querySelector(".line-qty")),
        unit: unitEl ? unitEl.value.trim() : "",
        unitPrice: Number(tr.querySelector(".line-price").value) || 0,
      });
    });
    return lines;
  }

  function updateTotals(root, settings) {
    var tbody = root.querySelector("#linesTable tbody");
    var isTax = root.querySelector("#isTaxInvoice").checked;
    var lines = gatherLines(tbody);
    tbody.querySelectorAll("tr").forEach(function (tr) {
      var qty = parseLineQty(tr.querySelector(".line-qty"));
      var up = Number(tr.querySelector(".line-price").value) || 0;
      var lt = Math.round(qty * up * 100) / 100;
      var cents = Math.round(lt * 100) % 100;
      tr.querySelector(".line-total-cell").textContent = F.formatNumber(
        lt,
        cents === 0 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      );
    });
    var c = calcInvoice(lines, isTax, settings.taxRate);
    root.querySelector("#sumSub").value = F.formatCurrency(c.subtotal);
    root.querySelector("#sumVat").value = F.formatCurrency(c.vatAmount);
    root.querySelector("#sumTotal").value = F.formatCurrency(c.total);
    var vg = root.querySelector("#vatGroup");
    var subLabel = root.querySelector("#sumSubLabel");
    var totalGroup = root.querySelector("#sumTotalGroup");
    if (isTax) {
      vg.style.display = "";
      if (totalGroup) totalGroup.style.display = "";
      if (subLabel) subLabel.textContent = "المجموع قبل الضريبة";
      root.querySelector("#sumSub").value = F.formatCurrency(c.subtotal);
    } else {
      // فاتورة عادية: أظهر مجموع الفاتورة فقط
      vg.style.display = "none";
      if (totalGroup) totalGroup.style.display = "none";
      if (subLabel) subLabel.textContent = "مجموع الفاتورة";
      root.querySelector("#sumSub").value = F.formatCurrency(c.total);
    }
    var badge = root.querySelector("#taxBadge");
    badge.textContent = isTax ? "ضريبية" : "عادية";
    badge.className = "badge " + (isTax ? "badge--tax" : "badge--simple");
    return c;
  }

  function refreshNumberIfNew(root, isNew) {
    if (!isNew) return;
    var issue = root.querySelector("#issueDate").value || F.todayISO();
    var data = S.getData();
    var next = N.peekNextInvoiceNumber(data.settings, issue);
    root.querySelector("#invNumber").value = next;
  }

  function render(container, editId) {
    var data = S.getData();
    var settings = data.settings;
    var customers = S.getCustomers();
    var isNew = !editId;
    var inv;

    if (isNew) {
      inv = {
        id: F.generateId(),
        number: N.peekNextInvoiceNumber(settings, F.todayISO()),
        issueDate: F.todayISO(),
        dueDate: "",
        isTaxInvoice: true,
        isStamped: false,
        customerId: null,
        customer: { name: "", taxNumber: "", phone: "", email: "", commercialReg: "", address: "" },
        lines: [defaultLine(), defaultLine()],
        notes: "",
      };
    } else {
      inv = S.getInvoiceById(editId);
      if (!inv) {
        container.innerHTML =
          '<div class="empty-state"><p>الفاتورة غير موجودة.</p><a class="btn btn--primary" href="#/invoices">السجل</a></div>';
        container._cleanup = function () {};
        return;
      }
      inv = JSON.parse(JSON.stringify(inv));
    }

    container.innerHTML = buildFormHtml({ invoice: inv, settings: settings, isNew: isNew });
    var root = container.firstElementChild;

    function wire() {
      var tbody = root.querySelector("#linesTable tbody");

      function onInput() {
        updateTotals(root, settings);
      }

      root.querySelector("#isTaxInvoice").addEventListener("change", onInput);
      root.querySelector("#issueDate").addEventListener("change", function () {
        refreshNumberIfNew(root, isNew);
        onInput();
      });

      tbody.addEventListener("input", onInput);

      root.querySelector("#btnAddLine").onclick = function () {
        var tr = document.createElement("tr");
        var id = F.generateId();
        tr.setAttribute("data-line-id", id);
        tr.innerHTML =
          "<td><input type=\"text\" class=\"form-control line-desc\" placeholder=\"البيان\" /></td>" +
          "<td><input type=\"number\" min=\"0\" step=\"1\" class=\"form-control line-qty\" value=\"1\" /></td>" +
          "<td><input type=\"text\" class=\"form-control line-unit\" inputmode=\"text\" placeholder=\"م²، حبة…\" /></td>" +
          "<td><input type=\"number\" min=\"0\" step=\"0.01\" class=\"form-control line-price\" value=\"0\" /></td>" +
          "<td class=\"line-total-cell num\">0</td>" +
          "<td><button type=\"button\" class=\"btn btn--ghost btn--sm btn-remove-line\">✕</button></td>";
        tbody.appendChild(tr);
        onInput();
      };

      tbody.addEventListener("click", function (e) {
        if (e.target.closest(".btn-remove-line")) {
          if (tbody.querySelectorAll("tr").length <= 1) {
            global.showToast("يجب أن يبقى بند واحد على الأقل", "error");
            return;
          }
          e.target.closest("tr").remove();
          onInput();
        }
      });

      var custHidden = root.querySelector("#customerSelect");
      var custSearch = root.querySelector("#customerSearch");
      var custList = root.querySelector("#customerListbox");
      var custCombo = root.querySelector(".customer-combobox");
      var custField = root.querySelector(".customer-combobox__field");
      var custBlurTimer = null;

      if (custField) {
        custField.addEventListener("click", function (e) {
          if (e.target.closest("#customerSearch")) return;
          custSearch.focus();
        });
      }

      function syncSearchDatasetFromSelection() {
        var id = custHidden.value;
        if (!id) {
          custSearch.removeAttribute("data-selected-id");
          custSearch.removeAttribute("data-selected-label");
          return;
        }
        var c = S.getCustomerById(id);
        if (!c) {
          custSearch.removeAttribute("data-selected-id");
          custSearch.removeAttribute("data-selected-label");
          return;
        }
        custSearch.setAttribute("data-selected-id", id);
        custSearch.setAttribute("data-selected-label", c.name || "");
      }

      function openCustList() {
        custList.hidden = false;
        custCombo.classList.add("is-open");
        custSearch.setAttribute("aria-expanded", "true");
      }

      function closeCustList() {
        custList.hidden = true;
        custCombo.classList.remove("is-open");
        custSearch.setAttribute("aria-expanded", "false");
      }

      function customerMatchesQuery(c, q) {
        if (!q || !String(q).trim()) return true;
        var ql = String(q).trim().toLowerCase();
        var name = (c.name || "").toLowerCase();
        if (name.indexOf(ql) !== -1) return true;
        var p = normalizePhoneDigits(c.phone);
        var qd = normalizePhoneDigits(q);
        if (qd && p.indexOf(qd) !== -1) return true;
        var qDigits = String(q).replace(/\D/g, "");
        if (qDigits.length >= 3 && p.indexOf(qDigits) !== -1) return true;
        return false;
      }

      function renderCustList(q) {
        custList.textContent = "";
        var frag = document.createDocumentFragment();
        var matches = customers.filter(function (c) {
          return customerMatchesQuery(c, q);
        });
        var hasQuery = !!(q && String(q).trim());

        if (customers.length === 0) {
          var noCust = document.createElement("li");
          noCust.className = "customer-combobox__empty";
          noCust.setAttribute("role", "presentation");
          noCust.textContent =
            "لا يوجد عملاء في السجل بعد. املأ الاسم والجوال أدناه — يُسجَّل العميل تلقائياً عند حفظ الفاتورة.";
          frag.appendChild(noCust);
        } else {
          matches.forEach(function (c) {
            var li = document.createElement("li");
            li.className = "customer-combobox__item";
            li.setAttribute("role", "option");
            li.dataset.id = c.id;
            var line = (c.name || "—") + (c.phone ? " · " + c.phone : "");
            li.textContent = line;
            frag.appendChild(li);
          });

          if (hasQuery && matches.length === 0) {
            var emptyLi = document.createElement("li");
            emptyLi.className = "customer-combobox__empty";
            emptyLi.setAttribute("role", "presentation");
            emptyLi.textContent =
              "لا يوجد عميل مطابق. يمكنك إدخال بيانات عميل جديد في الحقول أدناه ثم الحفظ — سيُضاف للسجل مع الفاتورة.";
            frag.appendChild(emptyLi);
          }
        }

        custList.appendChild(frag);
      }

      function applyCustomerById(id) {
        if (!id) {
          custHidden.value = "";
          custSearch.removeAttribute("data-selected-id");
          custSearch.removeAttribute("data-selected-label");
          root.querySelector("#custCommercialReg").value = "";
          closeCustList();
          return;
        }
        var c = S.getCustomerById(id);
        if (!c) return;
        custHidden.value = id;
        custSearch.value = c.name || "";
        custSearch.setAttribute("data-selected-id", id);
        custSearch.setAttribute("data-selected-label", c.name || "");
        root.querySelector("#custName").value = c.name || "";
        root.querySelector("#custTax").value = c.taxNumber || "";
        root.querySelector("#custPhone").value = c.phone || "";
        coerceCustPhoneField(root.querySelector("#custPhone"));
        root.querySelector("#custEmail").value = c.email || "";
        root.querySelector("#custCommercialReg").value = c.commercialReg || "";
        root.querySelector("#custAddress").value = c.address || "";
        closeCustList();
      }

      syncSearchDatasetFromSelection();

      custSearch.addEventListener("focus", function () {
        if (custBlurTimer) {
          global.clearTimeout(custBlurTimer);
          custBlurTimer = null;
        }
        renderCustList(custSearch.value);
        openCustList();
      });

      custSearch.addEventListener("input", function () {
        var label = custSearch.getAttribute("data-selected-label");
        if (label != null && custSearch.value.trim() !== String(label).trim()) {
          custHidden.value = "";
          custSearch.removeAttribute("data-selected-id");
          custSearch.removeAttribute("data-selected-label");
        }
        renderCustList(custSearch.value);
        openCustList();
      });

      custSearch.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          closeCustList();
          custSearch.blur();
        }
      });

      custList.addEventListener("mousedown", function (e) {
        if (e.target.closest(".customer-combobox__item")) e.preventDefault();
      });

      custList.addEventListener("click", function (e) {
        var li = e.target.closest(".customer-combobox__item");
        if (!li || !li.dataset.id) return;
        applyCustomerById(li.dataset.id);
      });

      custSearch.addEventListener("blur", function () {
        custBlurTimer = global.setTimeout(closeCustList, 180);
      });

      function onDocClickCust(ev) {
        if (!custCombo || custCombo.contains(ev.target)) return;
        closeCustList();
      }
      document.addEventListener("click", onDocClickCust);

      // إصدار فاتورة لعميل محدد من شاشة العملاء (مفتاح مؤقت)
      if (isNew) {
        try {
          var pre = localStorage.getItem("lh_prefill_customer_id");
          if (pre) {
            localStorage.removeItem("lh_prefill_customer_id");
            applyCustomerById(pre);
          }
        } catch (e) {}
      }

      var custPhoneEl = root.querySelector("#custPhone");
      custPhoneEl.addEventListener("input", function () {
        coerceCustPhoneField(custPhoneEl);
      });
      custPhoneEl.addEventListener("paste", function () {
        global.setTimeout(function () {
          coerceCustPhoneField(custPhoneEl);
        }, 0);
      });
      coerceCustPhoneField(custPhoneEl);

      function buildInvoiceFromForm() {
        var lines = gatherLines(tbody).filter(function (l) {
          return l.description || l.quantity || l.unitPrice;
        });
        if (!lines.length) {
          global.showToast("أضف بنداً واحداً على الأقل", "error");
          return null;
        }
        var custName = root.querySelector("#custName").value.trim();
        if (!custName) {
          global.showToast("أدخل اسم العميل", "error");
          return null;
        }
        var custPhoneDigits = normalizePhoneDigits(root.querySelector("#custPhone").value);
        if (!/^\d{10}$/.test(custPhoneDigits)) {
          global.showToast("أدخل جوال العميل", "error");
          return null;
        }
        var isTax = root.querySelector("#isTaxInvoice").checked;
        var c = calcInvoice(lines, isTax, settings.taxRate);
        var sel = root.querySelector("#customerSelect").value;
        return {
          id: inv.id,
          number: root.querySelector("#invNumber").value.trim(),
          issueDate: root.querySelector("#issueDate").value,
          dueDate: root.querySelector("#dueDate").value || null,
          isTaxInvoice: isTax,
          isStamped: root.querySelector("#isStamped").checked,
          customerId: sel || null,
          customer: {
            name: custName,
            taxNumber: root.querySelector("#custTax").value.trim(),
            phone: custPhoneDigits,
            email: root.querySelector("#custEmail").value.trim(),
            commercialReg: root.querySelector("#custCommercialReg").value.trim(),
            address: root.querySelector("#custAddress").value.trim(),
          },
          lines: lines,
          subtotal: c.subtotal,
          vatAmount: c.vatAmount,
          total: c.total,
          notes: root.querySelector("#invNotes").value.trim(),
          createdAt: inv.createdAt,
        };
      }

      function upsertCustomerForInvoice(saved) {
        var sel = root.querySelector("#customerSelect").value;
        var name = (saved.customer && saved.customer.name) || "";
        var phone = normalizePhoneDigits(saved.customer && saved.customer.phone);
        var tax = (saved.customer && saved.customer.taxNumber) || "";
        var email = (saved.customer && saved.customer.email) || "";
        var cr = (saved.customer && saved.customer.commercialReg) || "";
        var addr = (saved.customer && saved.customer.address) || "";

        // إذا تم اختيار عميل من القائمة: حدّث بياناته من الحقول (بدون تغيير المعرف)
        if (sel) {
          var existing = S.getCustomerById(sel);
          if (!existing) return sel;
          var wrote = S.saveCustomer({
            id: existing.id,
            name: name || existing.name,
            taxNumber: tax,
            phone: saved.customer.phone || "",
            email: email,
            commercialReg: cr,
            address: addr,
            createdAt: existing.createdAt,
          });
          return wrote ? existing.id : sel;
        }

        var customers = S.getCustomers();
        var found = null;

        // جوال موجود: مطابقة بالجوال فقط (لا ندمج بالاسم لتجنّب استبدال جوال عميل آخر).
        // بدون جوال: مطابقة بالاسم لدمج السجلات القديمة التي بدون رقم.
        if (phone) {
          found =
            customers.find(function (c) {
              return normalizePhoneDigits(c.phone) === phone;
            }) || null;
        } else if (name) {
          var nl = name.toLowerCase();
          found =
            customers.find(function (c) {
              return !(normalizePhoneDigits(c.phone)) && (c.name || "").trim().toLowerCase() === nl;
            }) || null;
        }

        var custId = found ? found.id : F.generateId();
        var createdAt = found && found.createdAt ? found.createdAt : new Date().toISOString();

        var wroteCust = S.saveCustomer({
          id: custId,
          name: name,
          taxNumber: tax,
          phone: saved.customer.phone || "",
          email: email,
          commercialReg: cr,
          address: addr,
          createdAt: createdAt,
        });

        if (!wroteCust) return null;

        saved.customerId = custId;
        return custId;
      }

      function persistAndNavigate(saved) {
        var full = S.getData();
        var newSettings = N.commitInvoiceNumber(full.settings, saved.number, saved.issueDate);
        S.updateSettings({ yearCounters: newSettings.yearCounters });
        upsertCustomerForInvoice(saved);
        var wrote = S.saveInvoice(saved);
        if (!wrote) {
          global.showToast("تعذر حفظ الفاتورة (LocalStorage). جرّب إفراغ مساحة المتصفح أو تعطيل وضع الخصوصية.", "error");
          return;
        }
        // تحقق سريع بعد الحفظ (حتى لا نكمل ونكتشف لاحقاً أن السجل فاضي)
        if (!S.getInvoiceById(saved.id)) {
          global.showToast("تمت محاولة الحفظ لكن لم تُقرأ الفاتورة من التخزين. قد تكون بيانات المتصفح تُمسح تلقائياً.", "error");
          return;
        }
        global.showToast("تم حفظ الفاتورة", "success");
        global.location.hash = "#/invoices";
      }

      root.querySelector("#invoiceForm").addEventListener("submit", function (e) {
        e.preventDefault();
        var saved = buildInvoiceFromForm();
        if (!saved) return;
        persistAndNavigate(saved);
      });

      root.querySelector("#btnSavePreview").onclick = function () {
        var draft = buildInvoiceFromForm();
        if (!draft) return;
        if (draft.isStamped && !settings.stampDataUrl) {
          global.showToast("فعّلت «فاتورة مختومة» لكن لا توجد صورة ختم في الإعدادات.", "info");
        }
        if (!global.LHInvoicePreview || !global.LHPdf || !global.LHPdf.openElementPdfPreview) {
          global.showToast("معاينة PDF غير متاحة", "error");
          return;
        }
        var fileSafe = String(draft.number || "preview").replace(/[^\w\u0600-\u06FF-]+/g, "_") + ".pdf";
        var host = document.createElement("div");
        host.setAttribute("aria-hidden", "true");
        host.style.cssText =
          "position:fixed;left:-12000px;top:0;width:794px;background:#fff;padding:8px;z-index:-1;pointer-events:none";
        host.innerHTML = global.LHInvoicePreview.renderInvoiceSheet(draft, settings);
        document.body.appendChild(host);
        var btn = root.querySelector("#btnSavePreview");
        btn.disabled = true;
        global.LHPdf.openElementPdfPreview("invoicePdfTarget", fileSafe)
          .then(function () {
            global.showToast("تم فتح معاينة PDF", "success");
          })
          .catch(function (e) {
            global.showToast(e.message || "فشل إنشاء PDF", "error");
          })
          .finally(function () {
            btn.disabled = false;
            if (host.parentNode) {
              host.parentNode.removeChild(host);
            }
          });
      };

      root.querySelector("#btnSavePrint").onclick = function () {
        var draft = buildInvoiceFromForm();
        if (!draft) return;
        if (draft.isStamped && !settings.stampDataUrl) {
          global.showToast("فعّلت «فاتورة مختومة» لكن لا توجد صورة ختم في الإعدادات.", "info");
        }
        if (!global.LHInvoicePreview || !global.LHInvoicePreview.openPrintWindow) {
          global.showToast("الطباعة غير متاحة", "error");
          return;
        }
        global.LHInvoicePreview.openPrintWindow(draft, settings);
      };

      function onKeySave(ev) {
        if ((ev.ctrlKey || ev.metaKey) && ev.key === "s") {
          ev.preventDefault();
          root.querySelector("#invoiceForm").requestSubmit();
        }
      }
      document.addEventListener("keydown", onKeySave);
      root._cleanupForm = function () {
        document.removeEventListener("keydown", onKeySave);
        document.removeEventListener("click", onDocClickCust);
        if (custBlurTimer) global.clearTimeout(custBlurTimer);
      };

      updateTotals(root, settings);
    }

    wire();
    container._cleanup = function () {
      var r = container.firstElementChild;
      if (r && r._cleanupForm) r._cleanupForm();
    };
  }

  global.LHInvoiceForm = { render: render, calcInvoice: calcInvoice };
})(typeof window !== "undefined" ? window : this);
