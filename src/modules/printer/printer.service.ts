import { Injectable } from '@nestjs/common';
import pdfmake from 'pdfmake';
import { join } from 'path';
import { CustomTableLayout, TDocumentDefinitions } from 'pdfmake/interfaces';

const fonts = {
  Roboto: {
    normal: join(process.cwd(), 'fonts/Roboto-Regular.ttf'),
    bold: join(process.cwd(), 'fonts/Roboto-Medium.ttf'),
    italics: join(process.cwd(), 'fonts/Roboto-Italic.ttf'),
    bolditalics: join(process.cwd(), 'fonts/Roboto-MediumItalic.ttf'),
  },
};

const fontDit = join(process.cwd(), 'fonts');

const customTableLayouts: Record<string, CustomTableLayout> = {
  customLayout01: {
    hLineWidth: function (i, node) {
      if (i === 0 || i === node.table.body.length) {
        return 0;
      }
      return i === node.table.headerRows ? 2 : 1;
    },
    vLineWidth: function () {
      return 0;
    },
    hLineColor: function (i) {
      return i === 1 ? 'black' : '#bbbbbb';
    },
    paddingLeft: function (i) {
      return i === 0 ? 0 : 8;
    },
    paddingRight: function (i, node) {
      const widths = node.table.widths;
      const lastIndex = Array.isArray(widths) ? widths.length - 1 : -1;
      return i === lastIndex ? 0 : 8;
    },
    fillColor: function (i, node) {
      if (i === 0) {
        return '#7b90be';
      }
      if (i === node.table.body.length - 1) {
        return '#acb3c1';
      }

      return i % 2 === 0 ? '#f3f3f3' : null;
    },
  },
};

@Injectable()
export class PrinterService {
  // Note: implement onModuleInit just in case if you use bucket for fonts
  constructor() {
    pdfmake.addFonts(fonts);
    pdfmake.addTableLayouts(customTableLayouts);
    pdfmake.setLocalAccessPolicy((path) => {
      return path.startsWith(fontDit);
    });
    pdfmake.setUrlAccessPolicy((url) => url.startsWith('data:'));
  }

  async createPdfBuffer(docDefinition: TDocumentDefinitions): Promise<Buffer> {
    const pdf = pdfmake.createPdf(docDefinition);
    return await pdf.getBuffer();
  }
}
