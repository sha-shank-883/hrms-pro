const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/payslips');

const ensureDir = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
};

const generatePayslipPDF = async (payslipData, options = {}) => {
  ensureDir();
  const {
    template = null,
    companyName = '',
    companyAddress = '',
    companyEmail = '',
    companyPhone = '',
    companyLogoUrl = '',
    currencySymbol = '$',
    employeeCode = '',
    pan = '',
    bankAccount = '',
    uan = '',
    esic = '',
  } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const filename = `payslip_${payslipData.employeeId}_${payslipData.period.month}_${payslipData.period.year}_${Date.now()}.pdf`;
  const filePath = path.join(UPLOADS_DIR, filename);

  const layout = template?.layout_json || null;
  const t = layout?.colors || {};
  const primary = hexToRgb(t.primary || '#4f46e5');
  const accent = hexToRgb(t.accent || '#10b981');
  const textCol = hexToRgb(t.text || '#1e293b');
  const subtext = hexToRgb(t.subtext || '#64748b');
  const lightBg = hexToRgb(t.background || '#f1f5f9');
  const borderCol = hexToRgb(t.border || '#e2e8f0');
  const white = [255, 255, 255];

  const showLogo = layout ? (layout.show_logo !== false) : true;
  const showCompanyName = layout ? (layout.show_company_name !== false) : true;
  const excluded = layout?.excluded_fields || [];

  let y = 20;
  const margin = 20;
  const right = 190;
  const pageWidth = 170;

  function rgb(color) {
    if (typeof color === 'string') {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return [r, g, b];
    }
    return color;
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  const fmt = (amount) => {
    const num = parseFloat(amount || 0);
    return `${currencySymbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const drawSectionTitle = (title, yPos) => {
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, right, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(textCol[0], textCol[1], textCol[2]);
    doc.text(title, margin, yPos);
    yPos += 2;
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.line(margin, yPos, right, yPos);
    yPos += 6;
    return yPos;
  };

  const drawTableRow = (label, value, yPos, isTotal = false) => {
    doc.setFont(isTotal ? 'helvetica' : 'helvetica', isTotal ? 'bold' : 'normal');
    doc.setFontSize(isTotal ? 10 : 9);
    doc.setTextColor(textCol[0], textCol[1], textCol[2]);
    doc.text(label, margin + 4, yPos);
    doc.text(fmt(value), right, yPos, { align: 'right' });
    yPos += isTotal ? 8 : 6;
    return yPos;
  };

  const isFieldExcluded = (fieldKey) => excluded.includes(fieldKey);

  // COMPANY HEADER
  if (showLogo && companyLogoUrl) {
    try {
      const imgPath = companyLogoUrl.startsWith('http') ? companyLogoUrl : path.join(__dirname, '../../', companyLogoUrl);
      if (fs.existsSync(imgPath)) {
        const imgData = fs.readFileSync(imgPath).toString('base64');
        const ext = path.extname(imgPath).toLowerCase();
        const imgFormat = ext === '.png' ? 'PNG' : 'JPEG';
        doc.addImage(imgData, imgFormat, margin, y - 5, 30, 15);
      }
    } catch (e) {}
  }

  if (showCompanyName && companyName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primary[0], primary[1], primary[2]);
    const nameX = showLogo && companyLogoUrl ? 55 : margin;
    doc.text(companyName, nameX, y + 3);
    y += 7;
    if (companyAddress) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(subtext[0], subtext[1], subtext[2]);
      doc.text(companyAddress, nameX, y);
      y += 4;
    }
    y += 4;
  }

  // PAYSLIP TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text('PAYSLIP', 105, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(subtext[0], subtext[1], subtext[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(`${getMonthName(payslipData.period.month)} ${payslipData.period.year}`, 105, y, { align: 'center' });
  y += 12;

  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, right, y);
  y += 8;

  // RENDER SECTIONS (respects template order)
  const sections = layout?.sections || [
    { key: 'employee_details', label: 'Employee Details', fields: ['employee_name', 'employee_code', 'department', 'designation', 'pan', 'bank_account'] },
    { key: 'earnings', label: 'Earnings', fields: ['basic_salary', 'hra', 'da', 'conveyance', 'medical_allowance', 'special_allowance', 'overtime_pay', 'bonus', 'gross_pay'] },
    { key: 'deductions', label: 'Deductions', fields: ['pf', 'esi', 'professional_tax', 'tds', 'social_security', 'medicare', 'total_deductions'] },
    { key: 'summary', label: 'Summary', fields: ['net_pay', 'payment_status', 'pay_date'] },
  ];

  for (const section of sections) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    if (section.key === 'employee_details') {
      y = drawSectionTitle(section.label, y);
      const empFields = section.fields.filter(f => !isFieldExcluded(f));

      const fieldLabels = {
        employee_name: 'Name', employee_code: 'Employee Code', department: 'Department',
        designation: 'Position', pan: 'PAN', bank_account: 'Bank Account',
        uan: 'UAN', esic: 'ESIC', working_days: 'Working Days', present_days: 'Present',
        absent_days: 'Absent', company_name: 'Company', company_address: 'Address',
      };

      const getFieldValue = (key) => {
        switch (key) {
          case 'employee_name': return payslipData.employeeName || 'N/A';
          case 'employee_code': return employeeCode || `#${payslipData.employeeId}`;
          case 'department': return payslipData.department || 'N/A';
          case 'designation': return payslipData.position || 'N/A';
          case 'pan': return pan || 'N/A';
          case 'bank_account': return bankAccount || 'N/A';
          case 'uan': return uan || 'N/A';
          case 'esic': return esic || 'N/A';
          case 'working_days': return `${payslipData.presentDays || 0}/${payslipData.workingDays || 0}`;
          case 'present_days': return `${payslipData.presentDays || 0}`;
          case 'absent_days': return `${payslipData.absentDays || 0}`;
          case 'company_name': return companyName || 'N/A';
          case 'company_address': return companyAddress || 'N/A';
          default: return 'N/A';
        }
      };

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      empFields.forEach((field, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = margin + col * 90;
        const rowY = y + row * 7;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(textCol[0], textCol[1], textCol[2]);
        doc.text(`${fieldLabels[field] || field}:`, x, rowY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(subtext[0], subtext[1], subtext[2]);
        doc.text(` ${getFieldValue(field)}`, x + 28, rowY);
      });

      const rows = Math.ceil(empFields.length / 2);
      y += rows * 7 + 10;
      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.line(margin, y, right, y);
      y += 8;
    }

    else if (section.key === 'earnings') {
      y = drawSectionTitle(section.label, y);
      const earningFields = section.fields.filter(f => !isFieldExcluded(f));

      const earningMap = {};
      for (const item of (payslipData.earnings || [])) {
        earningMap[item.component_name.toLowerCase().replace(/ /g, '_')] = item.amount;
      }

      let totalEarnings = 0;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const earningsFieldMapping = {
        basic_salary: { label: 'Basic Salary', get: () => payslipData.basicSalary || 0 },
        hra: { label: 'HRA', get: () => earningMap['hra'] || 0 },
        da: { label: 'Dearness Allowance', get: () => earningMap['da'] || earningMap['dearness_allowance'] || 0 },
        conveyance: { label: 'Conveyance Allowance', get: () => earningMap['conveyance'] || earningMap['conveyance_allowance'] || 0 },
        medical_allowance: { label: 'Medical Allowance', get: () => earningMap['medical_allowance'] || earningMap['medical'] || 0 },
        special_allowance: { label: 'Special Allowance', get: () => earningMap['special_allowance'] || 0 },
        overtime_pay: { label: 'Overtime Pay', get: () => earningMap['overtime_pay'] || earningMap['overtime'] || 0 },
        bonus: { label: 'Bonus', get: () => earningMap['bonus'] || 0 },
        gross_pay: { label: 'Gross Pay', get: () => payslipData.grossPay || 0 },
      };

      for (const field of earningFields) {
        const mapping = earningsFieldMapping[field];
        if (!mapping) continue;
        const val = mapping.get();
        totalEarnings += (field === 'gross_pay' ? 0 : val);
        doc.setTextColor(textCol[0], textCol[1], textCol[2]);
        doc.text(mapping.label, margin + 4, y);
        doc.text(fmt(val), right, y, { align: 'right' });
        y += 6;
      }

      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.line(margin, y, right, y);
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(textCol[0], textCol[1], textCol[2]);
      doc.text('Total Earnings', margin + 4, y);
      doc.text(fmt(payslipData.grossPay || totalEarnings), right, y, { align: 'right' });
      y += 12;
    }

    else if (section.key === 'deductions') {
      y = drawSectionTitle(section.label, y);
      const deductionFields = section.fields.filter(f => !isFieldExcluded(f));

      const deductionMap = {};
      for (const item of (payslipData.deductions || [])) {
        deductionMap[item.component_name.toLowerCase().replace(/ /g, '_')] = item.amount;
      }

      let totalDeductions = 0;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const deductionsFieldMapping = {
        pf: { label: 'Provident Fund', get: () => deductionMap['pf'] || deductionMap['provident_fund'] || 0 },
        esi: { label: 'ESI', get: () => deductionMap['esi'] || 0 },
        professional_tax: { label: 'Professional Tax', get: () => deductionMap['professional_tax'] || 0 },
        tds: { label: 'TDS', get: () => deductionMap['tds'] || deductionMap['income_tax'] || 0 },
        social_security: { label: 'Social Security', get: () => deductionMap['social_security'] || 0 },
        medicare: { label: 'Medicare', get: () => deductionMap['medicare'] || 0 },
        total_deductions: { label: 'Total Deductions', get: () => payslipData.totalDeductions || 0 },
      };

      for (const field of deductionFields) {
        const mapping = deductionsFieldMapping[field];
        if (!mapping) continue;
        const val = mapping.get();
        totalDeductions += (field === 'total_deductions' ? 0 : val);
        doc.setTextColor(textCol[0], textCol[1], textCol[2]);
        doc.text(mapping.label, margin + 4, y);
        doc.text(fmt(val), right, y, { align: 'right' });
        y += 6;
      }

      doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
      doc.line(margin, y, right, y);
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(textCol[0], textCol[1], textCol[2]);
      doc.text('Total Deductions', margin + 4, y);
      doc.text(fmt(payslipData.totalDeductions || totalDeductions), right, y, { align: 'right' });
      y += 12;
    }

    else if (section.key === 'summary') {
      const netPay = payslipData.netPay || 0;

      doc.setFillColor(primary[0], primary[1], primary[2]);
      doc.rect(margin, y - 4, pageWidth, 14, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(white[0], white[1], white[2]);
      doc.text('NET PAY (TAKE HOME)', margin + 4, y + 4);
      doc.text(fmt(netPay), right, y + 4, { align: 'right' });
      y += 16;

      if (section.fields.some(f => f === 'payment_status' && !isFieldExcluded('payment_status'))) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(subtext[0], subtext[1], subtext[2]);
        doc.text(`Status: ${payslipData.paymentStatus || 'N/A'}`, margin + 4, y);
        y += 6;
      }
      if (section.fields.some(f => f === 'pay_date' && !isFieldExcluded('pay_date')) && payslipData.paymentDate) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(subtext[0], subtext[1], subtext[2]);
        doc.text(`Paid On: ${new Date(payslipData.paymentDate).toLocaleDateString()}`, margin + 4, y);
        y += 6;
      }

      y += 4;
    }
  }

  // FOOTER
  if (y > 270) {
    doc.addPage();
    y = 20;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(subtext[0], subtext[1], subtext[2]);
  doc.text('This is a computer-generated payslip and does not require a physical signature.', 105, y, { align: 'center' });
  y += 4;
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, y, { align: 'center' });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(filePath, pdfBuffer);

  return filePath;
};

const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || month;
};

module.exports = { generatePayslipPDF };
