import { saveAs } from 'file-saver';

export function downloadTextFile(filename: string, text: string) {
    saveAs(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
}

export function downloadJsonFile(filename: string, object: any) {
    downloadTextFile(filename, JSON.stringify(object));
}