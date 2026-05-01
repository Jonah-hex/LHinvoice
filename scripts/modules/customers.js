/**
 * إدارة العملاء
 */
(function (global) {
  var F = global.LHFormat;
  var S = global.LHStorage;

  function customerStats(customerId) {
    var invoices = S.getInvoices().filter(function (i) {
      return i.customerId === customerId;
    });
    var liveTotal = invoices.reduce(function (a, i) {
      return a + (Number(i.total) || 0);
    }, 0);
    var liveCount = invoices.length;
    var cust = S.getCustomerById(customerId);
    var count = liveCount;
    var total = liveTotal;
    if (cust) {
      if (cust.lifetimeInvoiceCount != null) count = Math.max(0, Number(cust.lifetimeInvoiceCount) || 0);
      if (cust.lifetimePurchaseTotal != null) total = Number(cust.lifetimePurchaseTotal) || 0;
    }
    return {
      count: count,
      total: total,
      invoices: invoices,
      liveCount: liveCount,
      liveTotal: liveTotal,
    };
  }

  function openModal(container, customer) {
    var isEdit = !!customer;
    var c = customer || {
      id: F.generateId(),
      name: "",
      taxNumber: "",
      phone: "",
      email: "",
      commercialReg: "",
      address: "",
    };

    var backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML =
      '<div class="modal">' +
      '<div class="modal__header"><h3 style="margin:0">' +
      (isEdit ? "تعديل عميل" : "عميل جديد") +
      "</h3>" +
      '<button type="button" class="btn btn--ghost btn--sm" id="modalClose">إغلاق</button></div>' +
      '<div class="modal__body">' +
      '<div class="form-group"><label class="form-label">الاسم</label>' +
      '<input type="text" class="form-control" id="m_name" value="' +
      F.escapeHtml(c.name) +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">الجوال</label>' +
      '<input type="text" class="form-control" id="m_phone" value="' +
      F.escapeHtml(c.phone) +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">البريد</label>' +
      '<input type="email" class="form-control" id="m_email" value="' +
      F.escapeHtml(c.email) +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">الرقم الضريبي</label>' +
      '<input type="text" class="form-control" id="m_tax" value="' +
      F.escapeHtml(c.taxNumber) +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">السجل التجاري / الموحد</label>' +
      '<input type="text" class="form-control" id="m_cr" value="' +
      F.escapeHtml(c.commercialReg || "") +
      "\" /></div>" +
      '<div class="form-group"><label class="form-label">العنوان</label>' +
      '<input type="text" class="form-control" id="m_addr" value="' +
      F.escapeHtml(c.address) +
      "\" /></div></div>" +
      '<div class="modal__footer">' +
      '<button type="button" class="btn btn--primary" id="m_save">حفظ</button>' +
      '<button type="button" class="btn btn--ghost" id="m_cancel">إلغاء</button></div></div>';

    document.body.appendChild(backdrop);

    function close() {
      backdrop.remove();
    }

    backdrop.querySelector("#modalClose").onclick = close;
    backdrop.querySelector("#m_cancel").onclick = close;
    backdrop.onclick = function (e) {
      if (e.target === backdrop) close();
    };

    backdrop.querySelector("#m_save").onclick = function () {
      var name = backdrop.querySelector("#m_name").value.trim();
      if (!name) {
        global.showToast("أدخل اسم العميل", "error");
        return;
      }
      S.saveCustomer({
        id: c.id,
        name: name,
        taxNumber: backdrop.querySelector("#m_tax").value.trim(),
        phone: backdrop.querySelector("#m_phone").value.trim(),
        email: backdrop.querySelector("#m_email").value.trim(),
        commercialReg: backdrop.querySelector("#m_cr").value.trim(),
        address: backdrop.querySelector("#m_addr").value.trim(),
        createdAt: c.createdAt,
      });
      global.showToast("تم حفظ العميل", "success");
      close();
      render(container);
    };
  }

  function openDetailModal(container, customer) {
    var st = customerStats(customer.id);
    var invRows = st.invoices
      .slice(0, 50)
      .map(function (inv) {
        return (
          "<tr class=\"is-clickable\" data-href=\"#/invoice/" +
          inv.id +
          "\">" +
          "<td>" +
          F.escapeHtml(inv.number) +
          "</td>" +
          "<td>" +
          F.formatDateShort(inv.issueDate) +
          "</td>" +
          "<td>" +
          F.formatCurrency(inv.total) +
          "</td></tr>"
        );
      })
      .join("");

    var scrollInvoices = st.count > 5;
    var backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.innerHTML =
      '<div class="modal modal--customer-detail" style="max-width:640px">' +
      '<div class="modal__header">' +
      '<h3 class="modal__title-label">( ملف العميل )</h3>' +
      '<div class="modal__header-actions">' +
      '<button type="button" class="btn btn--primary btn--sm" id="d_edit">تعديل</button>' +
      '<button type="button" class="btn btn--ghost btn--sm" id="d_close">إغلاق</button>' +
      "</div></div>" +
      '<div class="modal__body customer-detail-modal__body">' +
      '<p class="customer-detail-modal__name">' +
      F.escapeHtml(customer.name) +
      "</p>" +
      "<p><strong>الجوال:</strong> " +
      F.escapeHtml(customer.phone || "—") +
      "</p>" +
      "<p><strong>البريد:</strong> " +
      F.escapeHtml(customer.email || "—") +
      "</p>" +
      "<p><strong>الرقم الضريبي:</strong> " +
      F.escapeHtml(customer.taxNumber || "—") +
      "</p>" +
      "<p><strong>السجل التجاري / الموحد:</strong> " +
      F.escapeHtml(customer.commercialReg || "—") +
      "</p>" +
      "<p><strong>العنوان:</strong> " +
      F.escapeHtml(customer.address || "—") +
      "</p>" +
      "<p><strong>عدد الفواتير:</strong> " +
      st.count +
      " — <strong>إجمالي المشتريات:</strong> " +
      F.formatCurrency(st.total) +
      "</p>" +
      '<div class="table-wrap customer-detail-modal__invoices' +
      (scrollInvoices ? " customer-detail-modal__invoices--scroll" : "") +
      '">' +
      '<table class="data-table"><thead><tr><th>رقم الفاتورة</th><th>التاريخ</th><th>المبلغ</th></tr></thead><tbody>' +
      (invRows || '<tr><td colspan="3">لا فواتير</td></tr>') +
      "</tbody></table></div></div></div>";

    document.body.appendChild(backdrop);
    var detailCustId = customer.id;
    backdrop.querySelector("#d_edit").onclick = function () {
      backdrop.remove();
      var fresh = S.getCustomerById(detailCustId);
      if (fresh) openModal(container, fresh);
    };
    backdrop.querySelector("#d_close").onclick = function () {
      backdrop.remove();
    };
    backdrop.onclick = function (e) {
      if (e.target === backdrop) backdrop.remove();
    };
    backdrop.querySelectorAll("tr[data-href]").forEach(function (tr) {
      tr.onclick = function () {
        var href = tr.getAttribute("data-href") || "#/dashboard";
        location.hash = href.indexOf("#") === 0 ? href : "#" + href;
        backdrop.remove();
      };
    });
  }

  function render(container) {
    var customers = S.getCustomers();
    container.innerHTML =
      '<div class="card">' +
      '<div class="card__header">' +
      '<h2 class="card__title">العملاء</h2>' +
      '<button type="button" class="btn btn--primary" id="btnNewCust">+ عميل جديد</button></div>' +
      '<div class="card__body">' +
      '<div class="filters-bar filters-bar--customers" style="margin-bottom:0.75rem">' +
      '<div class="form-group filters-bar__search--wide"><label class="form-label">بحث</label>' +
      '<input type="search" class="form-control" id="custSearch" placeholder="اسم، جوال، رقم ضريبي..." /></div>' +
      '<div class="form-group"><label class="form-label">فلترة</label>' +
      '<select class="form-select" id="custFilter">' +
      '<option value=\"\">الكل</option>' +
      '<option value=\"has\">لديه فواتير</option>' +
      '<option value=\"none\">بدون فواتير</option>' +
      "</select></div></div>" +
      '<div class="table-wrap">' +
      '<table class="data-table data-table--customers"><thead><tr>' +
      "<th>الاسم</th><th>الجوال</th><th>عدد الفواتير</th><th>إجمالي المشتريات</th><th class=\"no-print\">إجراءات</th>" +
      "</tr></thead><tbody id=\"custTableBody\"></tbody></table></div></div></div>";

    function draw() {
      var q = (document.getElementById("custSearch") && document.getElementById("custSearch").value) || "";
      q = (q || "").trim().toLowerCase();
      var flt = document.getElementById("custFilter") ? document.getElementById("custFilter").value : "";

      var rows = customers
        .filter(function (c) {
          var st = customerStats(c.id);
          if (flt === "has" && st.count <= 0) return false;
          if (flt === "none" && st.count > 0) return false;
          if (q) {
            var hay =
              (c.name || "") +
              " " +
              (c.phone || "") +
              " " +
              (c.taxNumber || "") +
              " " +
              (c.email || "") +
              " " +
              (c.commercialReg || "");
            if (!hay.toLowerCase().includes(q)) return false;
          }
          return true;
        })
        .map(function (c) {
          var st = customerStats(c.id);
          return (
            "<tr>" +
            "<td>" +
            F.escapeHtml(c.name) +
            "</td>" +
            "<td>" +
            F.escapeHtml(c.phone || "—") +
            "</td>" +
            "<td>" +
            st.count +
            "</td>" +
            "<td class=\"num\">" +
            F.formatCurrency(st.total) +
            "</td>" +
            '<td class="no-print">' +
            '<div class="cust-row-actions cust-row-actions--toolbar lh-toolbar-strip" role="group" aria-label="إجراءات العميل">' +
            '<button type="button" class="btn btn--sm btn-issue" data-id="' +
            c.id +
            '" title="إصدار فاتورة" aria-label="إصدار فاتورة">' +
            '<i class="bi bi-file-earmark-plus cust-row-actions__ico" aria-hidden="true"></i>' +
            '<span class="cust-row-actions__txt">إصدار فاتورة</span></button>' +
            '<button type="button" class="btn btn--sm btn-detail" data-id="' +
            c.id +
            '" title="تفاصيل العميل" aria-label="تفاصيل العميل">' +
            '<i class="bi bi-person-vcard cust-row-actions__ico" aria-hidden="true"></i>' +
            '<span class="cust-row-actions__txt">تفاصيل العميل</span></button>' +
            '<button type="button" class="btn btn--sm btn-edit" data-id="' +
            c.id +
            '" title="تعديل" aria-label="تعديل">' +
            '<i class="bi bi-pencil-square cust-row-actions__ico" aria-hidden="true"></i>' +
            '<span class="cust-row-actions__txt">تعديل</span></button>' +
            '<button type="button" class="btn btn--sm btn-del" data-id="' +
            c.id +
            '" title="حذف" aria-label="حذف">' +
            '<i class="bi bi-trash3 cust-row-actions__ico" aria-hidden="true"></i>' +
            '<span class="cust-row-actions__txt">حذف</span></button></div></td></tr>'
          );
        })
        .join("");

      var tb = document.getElementById("custTableBody");
      if (tb)
        tb.innerHTML =
          rows || '<tr><td colspan="5"><div class="empty-state">لا عملاء مطابقين.</div></td></tr>';
    }

    container.querySelector("#btnNewCust").onclick = function () {
      openModal(container, null);
    };

    ["custSearch", "custFilter"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", draw);
      if (el) el.addEventListener("change", draw);
    });

    container.querySelector("#custTableBody").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-id]");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      if (!id) return;
      var cust = S.getCustomerById(id);
      if (!cust) return;
      if (btn.classList.contains("btn-issue")) {
        try {
          localStorage.setItem("lh_prefill_customer_id", id);
        } catch (e) {}
        global.location.hash = "#/invoice/new";
        return;
      }
      if (btn.classList.contains("btn-edit")) openModal(container, cust);
      else if (btn.classList.contains("btn-detail")) openDetailModal(container, cust);
      else if (btn.classList.contains("btn-del")) {
        var doDel = function () {
          S.deleteCustomer(id);
          global.showToast("تم حذف العميل", "info");
          render(container);
        };
        if (global.LHConfirm && global.LHConfirm.show) {
          global.LHConfirm.show({
            title: "حذف العميل",
            message: "حذف العميل؟ لن يُحذف سجل الفواتير السابقة.",
            confirmLabel: "حذف",
            cancelLabel: "إلغاء",
            danger: true,
          }).then(function (ok) {
            if (ok) doDel();
          });
        } else {
          if (!global.confirm("حذف العميل؟ لن يُحذف سجل الفواتير السابقة.")) return;
          doDel();
        }
      }
    });

    draw();
    container._cleanup = function () {};
  }

  global.LHCustomers = { render: render, customerStats: customerStats };
})(typeof window !== "undefined" ? window : this);
