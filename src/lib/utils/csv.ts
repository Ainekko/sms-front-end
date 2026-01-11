/**
 * CSV Utility Functions
 * ======================
 * Utility functions for generating and downloading CSV files.
 */

/**
 * Escape a value for CSV format.
 * Handles commas, quotes, and newlines.
 */
export function escapeCsvValue(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) {
        return '';
    }
    
    const stringValue = String(value);
    
    // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
}

/**
 * Generate CSV content from contact data.
 */
export function generateContactsCsv(contacts: ContactForExport[]): string {
    const headers = [
        'Name',
        'Last Name',
        'Phone Number',
        'Email',
        'AI Priority',
        'Do Not Contact',
        'Sentiment',
        'Last Analyzed'
    ];
    
    const rows = contacts.map(contact => [
        escapeCsvValue(contact.name),
        escapeCsvValue(contact.last_name),
        escapeCsvValue(contact.phone_number),
        escapeCsvValue(contact.email),
        escapeCsvValue(contact.ai_priority),
        escapeCsvValue(contact.ai_do_not_contact ? 'Yes' : 'No'),
        escapeCsvValue(contact.sentiment),
        escapeCsvValue(contact.ai_last_analyzed)
    ].join(','));
    
    return [headers.join(','), ...rows].join('\n');
}

/**
 * Trigger a browser download of CSV content.
 */
export function downloadCsv(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

/**
 * Contact data structure for CSV export.
 */
export interface ContactForExport {
    id: string;
    phone_number: string;
    name: string | null;
    last_name: string | null;
    email: string | null;
    ai_priority: number | null;
    ai_do_not_contact: boolean;
    ai_last_analyzed: string | null;
    sentiment: string | null;
}
