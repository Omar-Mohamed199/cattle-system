import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Reusable utility to export JSON data to Excel (.xlsx)
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file (without extension)
 */
export const exportToExcel = (data, fileName) => {
  if (!data || data.length === 0) {
    alert('لا توجد بيانات للتصدير');
    return;
  }

  const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  const fileExtension = '.xlsx';

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
  
  // RTL Support hint (best effort for Excel)
  if (!ws['!props']) ws['!props'] = {};
  
  // Auto-width columns based on content length
  const objectMaxWidth = [];
  data.forEach(row => {
    Object.keys(row).forEach((key, i) => {
      const value = row[key] ? row[key].toString() : '';
      objectMaxWidth[i] = Math.max(objectMaxWidth[i] || 0, value.length, key.length);
    });
  });
  
  ws['!cols'] = objectMaxWidth.map(w => ({ wch: w + 5 })); // Add padding for better spacing

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const dataBlob = new Blob([excelBuffer], { type: fileType });
  
  saveAs(dataBlob, fileName + '_' + new Date().toLocaleDateString('ar-EG').replace(/\//g, '-') + fileExtension);
};
