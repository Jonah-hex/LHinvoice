/**
 * طبقة التخزين المحلي - LocalStorage
 */
(function (global) {
  var STORAGE_KEY = "layla_hekmi_invoice_system_v1";

  function defaultSettings() {
    return {
      companyName: "مؤسسة ليلى حكمي للمقاولات العامة",
      commercialReg: "4030384492",
      taxNumber: "",
      address: "",
      phone: "",
      email: "",
      taxRate: 0.15,
      invoicePrefix: "LH",
      yearCounters: {},
      footerText: "شكراً لتعاملكم معنا",
      termsText: "يُسدد المبلغ خلال المدة المتفق عليها. الفاتورة نافذة دون ختم المؤسسة.",
      logoDataUrl: null,
      stampDataUrl: null,
    };
  }

  function defaultData() {
    return {
      settings: defaultSettings(),
      invoices: [],
      customers: [],
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      var data = JSON.parse(raw);
      if (!data.settings) data.settings = defaultSettings();
      if (!Array.isArray(data.invoices)) data.invoices = [];
      if (!Array.isArray(data.customers)) data.customers = [];
      mergeSettingsDefaults(data.settings);
      if (!data._customerLifetimeMigrated) {
        migrateCustomerLifetimeFromLiveInvoices(data);
        data._customerLifetimeMigrated = true;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
          console.warn(e);
        }
      }
      return data;
    } catch (e) {
      console.error(e);
      return defaultData();
    }
  }

  function mergeSettingsDefaults(s) {
    var d = defaultSettings();
    Object.keys(d).forEach(function (k) {
      if (s[k] === undefined || s[k] === null) s[k] = d[k];
    });
    if (typeof s.taxRate !== "number" || s.taxRate < 0 || s.taxRate > 1) s.taxRate = 0.15;
    if (!s.yearCounters || typeof s.yearCounters !== "object") s.yearCounters = {};
    s.invoicePrefix = "LH";
  }

  function aggregateLiveStatsForCustomer(data, customerId) {
    var n = 0;
    var sum = 0;
    (data.invoices || []).forEach(function (inv) {
      if (inv.customerId === customerId) {
        n += 1;
        sum += Number(inv.total) || 0;
      }
    });
    return { count: n, total: Math.round(sum * 100) / 100 };
  }

  /** مرة واحدة على مستوى الملف: يملأ حقول lifetime الناقصة من الفواتير الحالية (لا يسترجع فواتير محذوفة سابقاً) */
  function migrateCustomerLifetimeFromLiveInvoices(data) {
    (data.customers || []).forEach(function (c) {
      if (!c || !c.id) return;
      if (c.lifetimeInvoiceCount != null && c.lifetimePurchaseTotal != null) return;
      var ag = aggregateLiveStatsForCustomer(data, c.id);
      if (c.lifetimeInvoiceCount == null) c.lifetimeInvoiceCount = ag.count;
      if (c.lifetimePurchaseTotal == null) c.lifetimePurchaseTotal = ag.total;
    });
  }

  function applyCustomerLifetimeOnInvoiceSave(data, inv, prev) {
    var cid = inv.customerId;
    var newTot = Number(inv.total) || 0;

    function bumpCustomer(custId, deltaCount, deltaTotal) {
      if (!custId) return;
      var cust = data.customers.find(function (c) {
        return c.id === custId;
      });
      if (!cust) return;
      var cnt = Math.max(0, Number(cust.lifetimeInvoiceCount) || 0);
      var tot = Number(cust.lifetimePurchaseTotal) || 0;
      cust.lifetimeInvoiceCount = Math.max(0, cnt + deltaCount);
      cust.lifetimePurchaseTotal = Math.round((tot + deltaTotal) * 100) / 100;
      if (cust.lifetimePurchaseTotal < 0) cust.lifetimePurchaseTotal = 0;
    }

    if (!prev) {
      if (cid) bumpCustomer(cid, 1, newTot);
      return;
    }

    var prevCid = prev.customerId || null;
    var prevTot = Number(prev.total) || 0;

    if (prevCid === cid) {
      if (cid) bumpCustomer(cid, 0, newTot - prevTot);
      return;
    }

    if (!prevCid && cid) {
      bumpCustomer(cid, 1, newTot);
      return;
    }

    if (prevCid && !cid) {
      return;
    }

    if (prevCid && cid && prevCid !== cid) {
      bumpCustomer(prevCid, -1, -prevTot);
      bumpCustomer(cid, 1, newTot);
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  function getData() {
    return load();
  }

  function setData(data) {
    return save(data);
  }

  function getSettings() {
    return load().settings;
  }

  function updateSettings(partial) {
    var data = load();
    Object.assign(data.settings, partial);
    save(data);
    try {
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent("lh:settings-updated"));
      }
    } catch (e) {}
    return data.settings;
  }

  function getInvoices() {
    return load().invoices.slice().sort(function (a, b) {
      return new Date(b.issueDate || b.createdAt) - new Date(a.issueDate || a.createdAt);
    });
  }

  function getInvoiceById(id) {
    return load().invoices.find(function (inv) {
      return inv.id === id;
    });
  }

  function saveInvoice(invoice) {
    var data = load();
    var idx = data.invoices.findIndex(function (i) {
      return i.id === invoice.id;
    });
    var prev = idx >= 0 ? JSON.parse(JSON.stringify(data.invoices[idx])) : null;
    invoice.updatedAt = new Date().toISOString();
    if (idx >= 0) data.invoices[idx] = invoice;
    else {
      invoice.createdAt = invoice.createdAt || new Date().toISOString();
      data.invoices.push(invoice);
    }
    applyCustomerLifetimeOnInvoiceSave(data, invoice, prev);
    var ok = save(data);
    return ok ? invoice : null;
  }

  function deleteInvoice(id) {
    var data = load();
    data.invoices = data.invoices.filter(function (i) {
      return i.id !== id;
    });
    save(data);
  }

  function getCustomers() {
    return load().customers.slice().sort(function (a, b) {
      return (a.name || "").localeCompare(b.name || "", "ar");
    });
  }

  function getCustomerById(id) {
    return load().customers.find(function (c) {
      return c.id === id;
    });
  }

  function saveCustomer(customer) {
    var data = load();
    var idx = data.customers.findIndex(function (c) {
      return c.id === customer.id;
    });
    customer.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      data.customers[idx] = Object.assign({}, data.customers[idx], customer);
    } else {
      customer.createdAt = customer.createdAt || new Date().toISOString();
      if (customer.lifetimeInvoiceCount == null) customer.lifetimeInvoiceCount = 0;
      if (customer.lifetimePurchaseTotal == null) customer.lifetimePurchaseTotal = 0;
      data.customers.push(customer);
    }
    var ok = save(data);
    return ok ? customer : null;
  }

  function deleteCustomer(id) {
    var data = load();
    data.customers = data.customers.filter(function (c) {
      return c.id !== id;
    });
    save(data);
  }

  function exportAll() {
    return JSON.stringify(load(), null, 2);
  }

  function importAll(jsonString, replace) {
    var parsed = JSON.parse(jsonString);
    if (!parsed.settings || !Array.isArray(parsed.invoices) || !Array.isArray(parsed.customers)) {
      throw new Error("ملف غير صالح");
    }
    if (replace) {
      save(parsed);
    } else {
      var data = load();
      var invIds = {};
      data.invoices.forEach(function (i) {
        invIds[i.id] = true;
      });
      parsed.invoices.forEach(function (i) {
        if (!invIds[i.id]) {
          data.invoices.push(i);
          invIds[i.id] = true;
        }
      });
      var custIds = {};
      data.customers.forEach(function (c) {
        custIds[c.id] = true;
      });
      parsed.customers.forEach(function (c) {
        if (!custIds[c.id]) {
          data.customers.push(c);
          custIds[c.id] = true;
        }
      });
      save(data);
    }
  }

  global.LHStorage = {
    STORAGE_KEY: STORAGE_KEY,
    load: load,
    save: save,
    getData: getData,
    setData: setData,
    getSettings: getSettings,
    updateSettings: updateSettings,
    getInvoices: getInvoices,
    getInvoiceById: getInvoiceById,
    saveInvoice: saveInvoice,
    deleteInvoice: deleteInvoice,
    getCustomers: getCustomers,
    getCustomerById: getCustomerById,
    saveCustomer: saveCustomer,
    deleteCustomer: deleteCustomer,
    exportAll: exportAll,
    importAll: importAll,
    defaultSettings: defaultSettings,
  };
})(typeof window !== "undefined" ? window : this);
