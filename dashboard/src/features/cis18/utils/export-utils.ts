import { type Column } from '@tanstack/react-table';
import { type CIS18Assessment, CIS18ControlNames } from '../types/cis18-types';

export function exportToCSV(data: CIS18Assessment[], visibleColumns: Column<CIS18Assessment>[]) {
  const _controlNames = CIS18ControlNames;
  
  // Create headers
  const headers: string[] = [];
  visibleColumns.forEach(col => {
    if (col.id === 'organizationId') {
      headers.push('Organización');
    } else if (col.id === 'assessmentDate') {
      headers.push('Fecha');
    } else if (col.id === 'totalScore') {
      headers.push('Puntuación Total');
    } else if (col.id.startsWith('control')) {
      const controlNum = col.id.replace('control', '');
      headers.push(`CIS-${controlNum}`);
    }
  });

  // Create rows
  const rows = data.map(row => {
    const values: (string | number)[] = [];
    visibleColumns.forEach(col => {
      const key = col.id as keyof CIS18Assessment;
      const value = row[key];
      
      if (key === 'assessmentDate') {
        values.push(new Date(value as Date).toLocaleDateString('es-ES'));
      } else if (key === 'organizationId') {
        values.push(value as string);
      } else if (value == null) {
        values.push('');
      } else {
        values.push(value as string | number);
      }
    });
    return values;
  });

  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${val}"`).join(','))
  ].join('\n');

  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `cis18-assessment-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportToExcel(data: CIS18Assessment[], visibleColumns: Column<CIS18Assessment>[]) {
  // Dynamically import xlsx to avoid SSR issues
  const XLSX = await import('xlsx');
  
  const controlNames = CIS18ControlNames;
  
  // Prepare data for Excel
  const excelData = data.map(row => {
    const excelRow: Record<string, unknown> = {};
    
    visibleColumns.forEach(col => {
      const key = col.id as keyof CIS18Assessment;
      let header = '';
      
      if (key === 'organizationId') {
        header = 'Organización';
      } else if (key === 'assessmentDate') {
        header = 'Fecha';
      } else if (key === 'totalScore') {
        header = 'Puntuación Total';
      } else if (key.startsWith('control')) {
        const controlNum = key.replace('control', '');
        header = `CIS-${controlNum}`;
      }
      
      const value = row[key];
      
      if (key === 'assessmentDate') {
        excelRow[header] = new Date(value as Date).toLocaleDateString('es-ES');
      } else if (value == null) {
        excelRow[header] = '';
      } else {
        excelRow[header] = value;
      }
    });
    
    return excelRow;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths
  const columnWidths = visibleColumns.map(col => {
    if (col.id === 'organizationId') return { wch: 15 };
    if (col.id === 'assessmentDate') return { wch: 12 };
    return { wch: 10 };
  });
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CIS-18 Assessment');

  // Add a second sheet with control descriptions
  const controlDescriptions = Object.entries(controlNames).map(([key, name]) => ({
    Control: key.replace('control', 'CIS-'),
    Descripción: name
  }));
  const descSheet = XLSX.utils.json_to_sheet(controlDescriptions);
  descSheet['!cols'] = [{ wch: 10 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, descSheet, 'Descripciones');

  // Download file
  XLSX.writeFile(workbook, `cis18-assessment-${new Date().toISOString().split('T')[0]}.xlsx`);
}