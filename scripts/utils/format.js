/**
 * تنسيق التواريخ، العملة، المبلغ بالكلمات العربية
 */
(function (global) {
  function toLatinDigits(str) {
    return String(str)
      .replace(/[٠-٩]/g, function (d) {
        return "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)];
      })
      .replace(/[۰-۹]/g, function (d) {
        return "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)];
      });
  }

  function formatNumber(amount, options) {
    var n = Number(amount);
    if (isNaN(n)) n = 0;
    var out = n.toLocaleString("ar-SA", options || {});
    return toLatinDigits(out);
  }

  function parseLocalDate(isoOrDate) {
    if (!isoOrDate) return null;
    if (typeof isoOrDate === "string") {
      var s = isoOrDate.trim();
      // تاريخ فقط بدون وقت: افصله يدوياً لتجنب اختلافات المنطقة الزمنية بين المتصفحات
      var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        var y = Number(m[1]);
        var mo = Number(m[2]);
        var da = Number(m[3]);
        if (!isNaN(y) && !isNaN(mo) && !isNaN(da)) {
          return new Date(y, mo - 1, da, 12, 0, 0, 0);
        }
      }
    }
    var d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    return d instanceof Date && !isNaN(d.getTime()) ? d : null;
  }

  function formatCurrency(amount, currency) {
    currency = currency || "ر.س";
    var n = Number(amount);
    if (isNaN(n)) n = 0;
    // اعرض بدون أصفار أخيرة: 5000.00 -> 5,000 ، و 5500.30 -> 5,500.30
    var cents = Math.round(n * 100) % 100;
    var parts = formatNumber(n, cents === 0 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return parts + " " + currency;
  }

  function formatDate(isoOrDate) {
    var d = parseLocalDate(isoOrDate);
    if (!d) return "";
    var out = d.toLocaleDateString("ar-SA", {
      calendar: "gregory",
      numberingSystem: "latn",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return toLatinDigits(out);
  }

  function formatDateShort(isoOrDate) {
    var d = parseLocalDate(isoOrDate);
    if (!d) return "";
    // إجبار التقويم الميلادي (تجنب عرض هجري على بعض أجهزة iOS عند locale=ar-SA)
    return toLatinDigits(
      d.toLocaleDateString("ar-SA", {
        calendar: "gregory",
        numberingSystem: "latn",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    );
  }

  /** تاريخ اليوم بتقويم الجهاز الميلادي (ليس UTC) — ليتطابق مع التقويم الظاهر على النظام */
  function todayISO() {
    var d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  var ones = [
    "",
    "واحد",
    "اثنان",
    "ثلاثة",
    "أربعة",
    "خمسة",
    "ستة",
    "سبعة",
    "ثمانية",
    "تسعة",
    "عشرة",
    "أحد عشر",
    "اثنا عشر",
    "ثلاثة عشر",
    "أربعة عشر",
    "خمسة عشر",
    "ستة عشر",
    "سبعة عشر",
    "ثمانية عشر",
    "تسعة عشر",
  ];

  var tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];

  function underHundred(n) {
    if (n < 20) return ones[n];
    var t = Math.floor(n / 10);
    var o = n % 10;
    if (o === 0) return tens[t];
    return ones[o] + " و" + tens[t];
  }

  function underThousand(n) {
    if (n < 100) return underHundred(n);
    var h = Math.floor(n / 100);
    var rest = n % 100;
    var hWord =
      h === 1
        ? "مائة"
        : h === 2
        ? "مائتان"
        : ones[h] + " مائة";
    if (rest === 0) return hWord;
    return hWord + " و" + underHundred(rest);
  }

  function integerToArabicWords(n) {
    if (n === 0) return "صفر";
    if (n < 0) return "سالب " + integerToArabicWords(-n);
    if (n < 1000) return underThousand(n);

    if (n < 1000000) {
      var thousands = Math.floor(n / 1000);
      var rest = n % 1000;
      var thWord =
        thousands === 1
          ? "ألف"
          : thousands === 2
          ? "ألفان"
          : thousands < 11
          ? underThousand(thousands) + " آلاف"
          : underThousand(thousands) + " ألف";
      if (rest === 0) return thWord;
      return thWord + " و" + integerToArabicWords(rest);
    }

    var millions = Math.floor(n / 1000000);
    var restM = n % 1000000;
    var mWord =
      millions === 1
        ? "مليون"
        : millions === 2
        ? "مليونان"
        : millions < 11
        ? underThousand(millions) + " ملايين"
        : underThousand(millions) + " مليون";
    if (restM === 0) return mWord;
    return mWord + " و" + integerToArabicWords(restM);
  }

  function amountToArabicWords(amount) {
    var n = Math.round(Number(amount) * 100) / 100;
    if (isNaN(n)) return "";
    var riyals = Math.floor(n);
    var halalas = Math.round((n - riyals) * 100);
    var parts = [];
    parts.push(integerToArabicWords(riyals) + (riyals === 1 ? " ريال سعودي" : " ريال سعودي"));
    if (halalas > 0) {
      parts.push(integerToArabicWords(halalas) + (halalas === 1 ? " هللة" : " هللة"));
    }
    return "فقط " + parts.join(" و ") + " لا غير";
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function generateId() {
    return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 11);
  }

  global.LHFormat = {
    formatCurrency: formatCurrency,
    formatNumber: formatNumber,
    toLatinDigits: toLatinDigits,
    parseLocalDate: parseLocalDate,
    formatDate: formatDate,
    formatDateShort: formatDateShort,
    todayISO: todayISO,
    amountToArabicWords: amountToArabicWords,
    escapeHtml: escapeHtml,
    generateId: generateId,
  };
})(typeof window !== "undefined" ? window : this);
