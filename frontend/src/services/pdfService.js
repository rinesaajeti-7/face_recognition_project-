// frontend/src/services/pdfService.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Ngjyrat e dizajnit Gold & Black
const COLORS = {
  primary: [255, 215, 0],
  primaryDark: [255, 140, 0],
  secondary: [10, 10, 10],
  textDark: [30, 30, 30],
  textLight: [255, 255, 255],
  border: [200, 200, 200],
  success: [16, 185, 129],
  warning: [245, 158, 11],
  danger: [239, 68, 68],
};

// ============= HELPER: Only fix orientation, keep full resolution =============
const getCorrectedImageData = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      // Draw the image onto a canvas – browser auto-corrects EXIF
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      // Return as PNG (lossless) at original resolution
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// Header i dokumentit
const addHeader = (doc, title, subtitle = null) => {
  doc.setFillColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setLineWidth(2);
  doc.line(0, 45, 210, 45);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 25, { align: 'center' });
  if (subtitle) {
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(11);
    doc.text(subtitle, 105, 35, { align: 'center' });
  }
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  const today = new Date().toLocaleString('sq-AL', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  doc.text(`Data e printimit: ${today}`, 105, 42, { align: 'center' });
};

const addFooter = (doc, pageCount) => {
  const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.setLineWidth(0.5);
  doc.line(15, 280, 195, 280);
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('Face Recognition System - Law Enforcement Division', 105, 288, { align: 'center' });
  doc.text(`Faqe ${pageNumber} nga ${pageCount}`, 105, 293, { align: 'center' });
};

const getTableStyles = () => ({
  headStyles: {
    fillColor: COLORS.primary,
    textColor: COLORS.secondary,
    fontStyle: 'bold',
    fontSize: 10,
    halign: 'left',
    valign: 'middle',
    lineWidth: 0.5,
    lineColor: COLORS.primaryDark,
  },
  bodyStyles: { textColor: COLORS.textDark, fontSize: 9, valign: 'middle' },
  alternateRowStyles: { fillColor: [245, 245, 245] },
  margin: { left: 15, right: 15, top: 10 },
  theme: 'striped',
});

// ================= PRINT PERSONI INDIVIDUAL =================
export const printPersonToPDF = async (person, imageUrl) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  addHeader(doc, 'RAPORT PËR PERSON', 'Dosja zyrtare e identifikimit');

  let yOffset = 55;
  const frameWidth = 65;   // mm
  const frameHeight = 75;  // mm
  const frameX = (210 - frameWidth) / 2;

  if (imageUrl) {
    try {
      const correctedDataUrl = await getCorrectedImageData(imageUrl);
      const img = new Image();
      img.src = correctedDataUrl;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });

      // Calculate draw dimensions to fit inside frame while preserving aspect ratio
      const imgAspect = img.width / img.height;
      const frameAspect = frameWidth / frameHeight;
      let drawWidth, drawHeight;
      if (imgAspect > frameAspect) {
        drawWidth = frameWidth;
        drawHeight = frameWidth / imgAspect;
      } else {
        drawHeight = frameHeight;
        drawWidth = frameHeight * imgAspect;
      }
      const drawX = frameX + (frameWidth - drawWidth) / 2;
      const drawY = yOffset + (frameHeight - drawHeight) / 2;

      // Gold frame
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(2);
      doc.rect(frameX - 3, yOffset - 3, frameWidth + 6, frameHeight + 6, 'D');

      // Draw image with correct dimensions (mm)
      doc.addImage(correctedDataUrl, 'PNG', drawX, drawY, drawWidth, drawHeight);
      yOffset += frameHeight + 20;
    } catch (error) {
      console.error('Error loading image:', error);
      // Placeholder
      doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
      doc.setFillColor(240, 240, 240);
      doc.rect(frameX, yOffset, frameWidth, frameHeight, 'FD');
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.text('Pa foto', frameX + frameWidth / 2, yOffset + frameHeight / 2, { align: 'center' });
      yOffset += frameHeight + 20;
    }
  } else {
    // No image – placeholder
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.setFillColor(240, 240, 240);
    doc.rect(frameX, yOffset, frameWidth, frameHeight, 'FD');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    doc.text('Pa foto', frameX + frameWidth / 2, yOffset + frameHeight / 2, { align: 'center' });
    yOffset += frameHeight + 20;
  }

  const getStatusText = (status) => {
    if (status === 'missing') return 'I zhdukur';
    if (status === 'wanted') return 'Në kërkim';
    return status || 'N/A';
  };

  const tableData = [
    ['Emri i plotë', person.name || 'N/A'],
    ['Statusi', getStatusText(person.status)],
    ['Numri i leternjoftimit', person.id_number || 'N/A'],
    ['Telefoni', person.phone || 'N/A'],
    ['Vendbanimi', person.residence_location || 'N/A'],
    ['Lokacioni i fotos', person.photo_location || 'N/A'],
    ['Stacioni shtues', person.station_added || 'N/A'],
    ['Datëlindja', person.birth_date || 'N/A'],
    ['Përshkrimi', person.description || 'N/A'],
    ['Të dhëna shtesë', person.additional_info || 'N/A'],
  ];

  autoTable(doc, {
    ...getTableStyles(),
    startY: yOffset,
    head: [['Fusha', 'Informacioni']],
    body: tableData,
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: COLORS.primaryDark },
      1: { cellWidth: 'auto' },
    },
  });

  const finalY = doc.lastAutoTable.finalY + 15;
  if (finalY < 250) {
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.setLineWidth(0.5);
    doc.line(30, finalY, 90, finalY);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Nënshkrimi i Oficerit', 60, finalY + 5, { align: 'center' });

    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setLineWidth(1);
    doc.circle(170, finalY - 5, 15, 'D');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text('POLICE', 170, finalY - 8, { align: 'center' });
    doc.text('VULA ZYRTARE', 170, finalY - 2, { align: 'center' });
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, pageCount);
  }

  const fileName = `raport_${person.name.replace(/\s/g, '_')}_${person.id}.pdf`;
  doc.save(fileName);
};

// ================= PRINT LISTA E PERSONAVE =================
export const printMissingPersonsList = async (persons) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  addHeader(doc, ' LISTA E PERSONAVE', 'Regjistri zyrtar i personave të zhdukur dhe në kërkim');

  const missingCount = persons.filter(p => p.status === 'missing').length;
  const wantedCount = persons.filter(p => p.status === 'wanted').length;

  doc.setFillColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.rect(15, 55, 180, 25, 'F');
  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setLineWidth(1);
  doc.rect(15, 55, 180, 25, 'D');

  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setFontSize(10);
  doc.text(`📊 TOTALI I PERSONAVE: ${persons.length}`, 105, 65, { align: 'center' });
  doc.setTextColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
  doc.text(`Të zhdukur: ${missingCount}`, 75, 75, { align: 'center' });
  doc.setTextColor(COLORS.danger[0], COLORS.danger[1], COLORS.danger[2]);
  doc.text(`Në kërkim: ${wantedCount}`, 135, 75, { align: 'center' });

  const tableData = persons.map(p => [
    p.id,
    p.name,
    p.status === 'missing' ? 'I zhdukur' : 'Në kërkim',
    p.id_number || '—',
    p.phone || '—',
    p.residence_location || '—',
  ]);

  autoTable(doc, {
    ...getTableStyles(),
    startY: 90,
    head: [['ID', 'Emri', 'Statusi', 'Leternjoftimi', 'Telefoni', 'Vendbanimi']],
    body: tableData,
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 50 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 'auto' },
    },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, pageCount);
  }
  doc.save('lista_e_personave.pdf');
};

// ================= PRINT RAPORT STATISTIKOR =================
export const printStatisticsReport = async (stats, chartImages = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  addHeader(doc, ' RAPORT STATISTIKOR', 'Analiza e të dhënave të sistemit');

  let yOffset = 55;
  const statsData = [
    { label: 'Totali i personave', value: stats.galleryCount || 0, color: COLORS.primary },
    { label: 'Të zhdukur', value: stats.missingCount || 0, color: COLORS.warning },
    { label: 'Në kërkim', value: stats.wantedCount || 0, color: COLORS.danger },
    { label: 'Alerte aktive', value: stats.alertTotal || 0, color: COLORS.primaryDark },
    { label: 'Kërkime të kryera', value: stats.searchCount || 0, color: COLORS.success },
    { label: 'Saktësia mesatare', value: `${stats.avgSimilarity || 0}%`, color: COLORS.success },
  ];

  let col = 0, row = 0;
  for (let i = 0; i < statsData.length; i++) {
    const stat = statsData[i];
    const x = 20 + (col * 90);
    const y = yOffset + (row * 35);
    doc.setFillColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.rect(x, y, 80, 28, 'F');
    doc.setDrawColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.setLineWidth(0.5);
    doc.rect(x, y, 80, 28, 'D');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(stat.label, x + 5, y + 8);
    doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(String(stat.value), x + 5, y + 23);
    doc.setFont('helvetica', 'normal');
    col++;
    if (col >= 2) { col = 0; row++; }
  }

  if (chartImages && chartImages.length > 0) {
    doc.addPage();
    addHeader(doc, ' GRAFIKËT STATISTIKOR', 'Paraqitja vizuale e të dhënave');
    let yChart = 55;
    for (let i = 0; i < chartImages.length; i++) {
      if (chartImages[i]) {
        try {
          doc.addImage(chartImages[i], 'PNG', 20, yChart, 170, 80);
          yChart += 90;
        } catch (error) { console.error('Error adding chart:', error); }
      }
    }
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, pageCount);
  }
  doc.save('raport_statistikor.pdf');
};

// ================= PRINT DETAILED CASE REPORT =================
export const printCaseReport = async (person, imageUrl, alerts = []) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  addHeader(doc, ' RAPORT I DETAJURAR I RASTIT', `Rasti: ${person.name}`);

  let yOffset = 55;
  const imgMaxWidth = 50;   // mm
  const imgMaxHeight = 60;  // mm
  const imgX = 20;

  if (imageUrl) {
    try {
      const correctedDataUrl = await getCorrectedImageData(imageUrl);
      const img = new Image();
      img.src = correctedDataUrl;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });

      // Calculate draw dimensions to fit inside the max box (preserve aspect)
      const imgAspect = img.width / img.height;
      const boxAspect = imgMaxWidth / imgMaxHeight;
      let drawWidth, drawHeight;
      if (imgAspect > boxAspect) {
        drawWidth = imgMaxWidth;
        drawHeight = imgMaxWidth / imgAspect;
      } else {
        drawHeight = imgMaxHeight;
        drawWidth = imgMaxHeight * imgAspect;
      }
      // Optional: center vertically in the allocated space? We'll just place at (imgX, yOffset)
      doc.addImage(correctedDataUrl, 'PNG', imgX, yOffset, drawWidth, drawHeight);

      // Person basic info next to the photo
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.primaryDark[0], COLORS.primaryDark[1], COLORS.primaryDark[2]);
      doc.text('Të dhënat e personit:', 85, yOffset + 10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
      doc.text(`Emri: ${person.name || 'N/A'}`, 85, yOffset + 25);
      doc.text(`Statusi: ${person.status === 'missing' ? 'I zhdukur' : 'Në kërkim'}`, 85, yOffset + 35);
      doc.text(`ID në sistem: ${person.id}`, 85, yOffset + 45);

      yOffset += imgMaxHeight + 15;
    } catch (error) {
      console.error('Error loading image:', error);
      yOffset += 15;
    }
  } else {
    yOffset += 15;
  }

  const tableData = [
    ['Numri i leternjoftimit', person.id_number || 'N/A'],
    ['Telefoni', person.phone || 'N/A'],
    ['Vendbanimi', person.residence_location || 'N/A'],
    ['Lokacioni i fotos', person.photo_location || 'N/A'],
    ['Stacioni shtues', person.station_added || 'N/A'],
    ['Datëlindja', person.birth_date || 'N/A'],
    ['Përshkrimi', person.description || 'N/A'],
    ['Të dhëna shtesë', person.additional_info || 'N/A'],
  ];

  autoTable(doc, {
    startY: yOffset,
    head: [['Fusha', 'Informacioni']],
    body: tableData,
    ...getTableStyles(),
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: COLORS.primaryDark },
      1: { cellWidth: 'auto' },
    },
  });

  yOffset = doc.lastAutoTable.finalY + 10;

  if (alerts && alerts.length > 0) {
    const alertsData = alerts.map(a => [
      new Date(a.timestamp).toLocaleDateString(),
      `${(a.similarity * 100).toFixed(1)}%`,
      a.reviewed ? 'I shqyrtuar' : 'I pa shqyrtuar',
    ]);
    autoTable(doc, {
      startY: yOffset,
      head: [['HISTORIKU I ALERTEVE', '', '']],
      body: alertsData,
      headStyles: { fillColor: COLORS.warning, textColor: COLORS.secondary },
      ...getTableStyles(),
    });
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, pageCount);
  }
  doc.save(`raport_rasti_${person.id}.pdf`);
};