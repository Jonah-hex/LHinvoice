/**
 * تصدير عنصر HTML إلى PDF باستخدام html2canvas + jsPDF
 */
(function (global) {
  function buildPdfFromElement(elementId) {
    return new Promise(function (resolve, reject) {
      var el = document.getElementById(elementId);
      if (!el) {
        reject(new Error("عنصر غير موجود"));
        return;
      }
      var JsPDF = global.jspdf && global.jspdf.jsPDF;
      if (typeof html2canvas === "undefined" || !JsPDF) {
        reject(new Error("مكتبات PDF غير محمّلة"));
        return;
      }

      var scale = 2;
      html2canvas(el, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })
        .then(function (canvas) {
          var imgData = canvas.toDataURL("image/png");
          var pdf = new JsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
          });
          var pageWidth = pdf.internal.pageSize.getWidth();
          var pageHeight = pdf.internal.pageSize.getHeight();
          var imgWidth = pageWidth;
          var imgHeight = (canvas.height * imgWidth) / canvas.width;
          // html2canvas قد ينتج فرقاً بسيطاً جداً في الارتفاع (ينشئ صفحة ثانية فارغة).
          // نعالج ذلك بتسامح صغير قبل التقسيم لصفحات.
          var EPS_MM = 1.25; // ~1mm هامش سماح
          if (imgHeight <= pageHeight + EPS_MM) {
            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
            resolve(pdf);
            return;
          }

          var heightLeft = imgHeight;
          var position = 0;

          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft > EPS_MM) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          resolve(pdf);
        })
        .catch(reject);
    });
  }

  function exportElementToPdf(elementId, fileName) {
    return buildPdfFromElement(elementId).then(function (pdf) {
      pdf.save(fileName || "invoice.pdf");
    });
  }

  /** فتح ملف PDF في تبويب جديد (معاينة) دون حفظ الفاتورة */
  function openElementPdfPreview(elementId, fileName) {
    var previewWin = global.open("about:blank", "_blank");
    if (!previewWin) {
      return Promise.reject(new Error("المتصفّح منع نافذة المعاينة"));
    }
    try {
      previewWin.document.write(
        '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>معاينة PDF</title></head><body style="margin:0;font-family:sans-serif;padding:1rem;text-align:center">جاري إنشاء ملف PDF...</body></html>'
      );
      previewWin.document.close();
    } catch (e) {}

    return buildPdfFromElement(elementId)
      .then(function (pdf) {
        var blob = null;
        if (typeof pdf.output === "function") {
          try {
            blob = pdf.output("blob");
          } catch (e0) {
            try {
              var buf = pdf.output("arraybuffer");
              if (buf) {
                blob = new Blob([buf], { type: "application/pdf" });
              }
            } catch (e1) {}
          }
        }
        if (!blob || typeof blob.size !== "number") {
          throw new Error("تعذر إنشاء ملف PDF للمعاينة");
        }
        var url = URL.createObjectURL(blob);
        previewWin.location.href = url;
        global.setTimeout(function () {
          try {
            URL.revokeObjectURL(url);
          } catch (e2) {}
        }, 120000);
      })
      .catch(function (err) {
        try {
          previewWin.close();
        } catch (e3) {}
        throw err;
      });
  }

  global.LHPdf = {
    buildPdfFromElement: buildPdfFromElement,
    exportElementToPdf: exportElementToPdf,
    openElementPdfPreview: openElementPdfPreview,
  };
})(typeof window !== "undefined" ? window : this);
