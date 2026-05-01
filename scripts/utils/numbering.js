/**
 * ترقيم الفواتير التسلسلي LH-YEAR-NNNN (بادئة ثابتة)
 */
(function (global) {
  function peekNextInvoiceNumber(settings, dateRef) {
    var d = dateRef ? new Date(dateRef) : new Date();
    var y = d.getFullYear();
    var prefix = "LH";
    var counters = settings.yearCounters || {};
    var last = counters[String(y)] || 0;
    var next = last + 1;
    var padded = String(next).padStart(4, "0");
    return prefix + "-" + y + "-" + padded;
  }

  function commitInvoiceNumber(settings, invoiceNumber, dateRef) {
    var d = dateRef ? new Date(dateRef) : new Date();
    var y = String(d.getFullYear());
    var parts = String(invoiceNumber).split("-");
    var seq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(seq)) {
      var counters = Object.assign({}, settings.yearCounters || {});
      var current = counters[y] || 0;
      if (seq > current) counters[y] = seq;
      return Object.assign({}, settings, { yearCounters: counters });
    }
    return settings;
  }

  global.LHNumbering = {
    peekNextInvoiceNumber: peekNextInvoiceNumber,
    commitInvoiceNumber: commitInvoiceNumber,
  };
})(typeof window !== "undefined" ? window : this);
