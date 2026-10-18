export interface EconomicActivity {
  code: string | null; // Ej: "46494"
  name: string;
  isActive: boolean;
}

export const economicActivity: EconomicActivity[] = [
  {
    code: null,
    name: 'AGRICULTURA, GANADERÍA, SILVICULTURA Y PESCA',
    isActive: true,
  },
  {
    code: null,
    name: 'PRODUCCIÓN AGRÍCOLA, PECUARIA, CAZA Y ACTIVIDADES DE SERVICIOS CONEXAS',
    isActive: true,
  },
  {
    code: '01111',
    name: 'Cultivo de cereales excepto arroz y para forrajes',
    isActive: true,
  },
  {
    code: '01112',
    name: 'Cultivo de legumbres',
    isActive: true,
  },
  {
    code: '01113',
    name: 'Cultivo de semillas oleaginosas',
    isActive: true,
  },
  {
    code: '01114',
    name: 'Cultivo de plantas para la preparación de semillas',
    isActive: true,
  },
  {
    code: '01119',
    name: 'Cultivo de otros cereales excepto arroz y forrajeros n.c.p.',
    isActive: true,
  },
  {
    code: '01120',
    name: 'Cultivo de arroz',
    isActive: true,
  },
  {
    code: '01131',
    name: 'Cultivo de raíces y tubérculos',
    isActive: true,
  },
  {
    code: '01132',
    name: 'Cultivo de brotes, bulbos, vegetales tubérculos y cultivos similares',
    isActive: true,
  },
  {
    code: '01133',
    name: 'Cultivo hortícola de fruto',
    isActive: true,
  },
  {
    code: '01134',
    name: 'Cultivo de hortalizas de hoja y otras hortalizas ncp',
    isActive: true,
  },
  {
    code: '01140',
    name: 'Cultivo de caña de azúcar',
    isActive: true,
  },
  {
    code: '01150',
    name: 'Cultivo de tabaco',
    isActive: true,
  },
  {
    code: '01161',
    name: 'Cultivo de algodón',
    isActive: true,
  },
  {
    code: '01162',
    name: 'Cultivo de fibras vegetales excepto algodón',
    isActive: true,
  },
  {
    code: '01191',
    name: 'Cultivo de plantas no perennes para la producción de semillas y flores',
    isActive: true,
  },
  {
    code: '01192',
    name: 'Cultivo de cereales y pastos para la alimentación animal',
    isActive: true,
  },
  {
    code: '01199',
    name: 'Producción de cultivos no estacionales ncp',
    isActive: true,
  },
  {
    code: '01220',
    name: 'Cultivo de frutas tropicales',
    isActive: true,
  },
  {
    code: '01230',
    name: 'Cultivo de cítricos',
    isActive: true,
  },
  {
    code: '01240',
    name: 'Cultivo de frutas de pepita y hueso',
    isActive: true,
  },
  {
    code: '01251',
    name: 'Cultivo de frutas ncp',
    isActive: true,
  },
  {
    code: '01252',
    name: 'Cultivo de otros frutos y nueces de árboles y arbustos',
    isActive: true,
  },
  {
    code: '01260',
    name: 'Cultivo de frutos oleaginosos',
    isActive: true,
  },
  {
    code: '01271',
    name: 'Cultivo de café',
    isActive: true,
  },
  {
    code: '01272',
    name: 'Cultivo de plantas para la elaboración de bebidas excepto café',
    isActive: true,
  },
  {
    code: '01281',
    name: 'Cultivo de especias y aromáticas',
    isActive: true,
  },
  {
    code: '01282',
    name: 'Cultivo de plantas para la obtención de productos medicinales y farmacéuticos',
    isActive: true,
  },
  {
    code: '01291',
    name: 'Cultivo de árboles de hule (caucho) para la obtención de látex',
    isActive: true,
  },
  {
    code: '01292',
    name: 'Cultivo de plantas para la obtención de productos químicos y colorantes',
    isActive: true,
  },
  {
    code: '01299',
    name: 'Producción de cultivos perennes ncp',
    isActive: true,
  },
  {
    code: '01300',
    name: 'Propagación de plantas',
    isActive: true,
  },
  {
    code: '01301',
    name: 'Cultivo de plantas y flores ornamentales',
    isActive: true,
  },
  {
    code: '01410',
    name: 'Cría y engorde de ganado bovino',
    isActive: true,
  },
  {
    code: '01420',
    name: 'Cría de caballos y otros equinos',
    isActive: true,
  },
  {
    code: '01440',
    name: 'Cría de ovejas y cabras',
    isActive: true,
  },
  {
    code: '01450',
    name: 'Cría de cerdos',
    isActive: true,
  },
  {
    code: '01460',
    name: 'Cría de aves de corral y producción de huevos',
    isActive: true,
  },
  {
    code: '01491',
    name: 'Cría de abejas apicultura para la obtención de miel y otros productos apícolas',
    isActive: true,
  },
  {
    code: '01492',
    name: 'Cría de conejos',
    isActive: true,
  },
  {
    code: '01493',
    name: 'Cría de iguanas y garrobos',
    isActive: true,
  },
  {
    code: '01494',
    name: 'Cría de mariposas y otros insectos',
    isActive: true,
  },
  {
    code: '01499',
    name: 'Cría y obtención de productos animales n.c.p.',
    isActive: true,
  },
  {
    code: '01500',
    name: 'Cultivo de productos agrícolas en combinación con la cría de animales',
    isActive: true,
  },
  {
    code: '01611',
    name: 'Servicios de maquinaria agrícola',
    isActive: true,
  },
  {
    code: '01612',
    name: 'Control de plagas',
    isActive: true,
  },
  {
    code: '01613',
    name: 'Servicios de riego',
    isActive: true,
  },
  {
    code: '01614',
    name: 'Servicios de contratación de mano de obra para la agricultura',
    isActive: true,
  },
  {
    code: '01619',
    name: 'Servicios agrícolas ncp',
    isActive: true,
  },
  {
    code: '01621',
    name: 'Actividades para mejorar la reproducción, el crecimiento y el rendimiento de los animales y sus productos',
    isActive: true,
  },
  {
    code: '01622',
    name: 'Servicios de mano de obra pecuaria',
    isActive: true,
  },
  {
    code: '01629',
    name: 'Servicios pecuarios ncp',
    isActive: true,
  },
  {
    code: '01631',
    name: 'Labores post cosecha de preparación de los productos agrícolas para su comercialización o para la industria',
    isActive: true,
  },
  {
    code: '01632',
    name: 'Servicio de beneficio de café',
    isActive: true,
  },
  {
    code: '01633',
    name: 'Servicio de beneficiado de plantas textiles (incluye el beneficiado cuando este es realizado en la misma explotación agropecuaria)',
    isActive: true,
  },
  {
    code: '01640',
    name: 'Tratamiento de semillas para la propagación',
    isActive: true,
  },
  {
    code: '01700',
    name: 'Caza ordinaria y mediante trampas, repoblación de animales de caza y servicios conexos',
    isActive: true,
  },
  {
    code: null,
    name: 'SILVICULTURA Y EXTRACCIÓN DE MADERA',
    isActive: true,
  },
  {
    code: '02100',
    name: 'Silvicultura y otras actividades forestales',
    isActive: true,
  },
  {
    code: '02200',
    name: 'Extracción de madera',
    isActive: true,
  },
  {
    code: '02300',
    name: 'Recolección de productos diferentes a la madera',
    isActive: true,
  },
  {
    code: '02400',
    name: 'Servicios de apoyo a la silvicultura',
    isActive: true,
  },
  {
    code: null,
    name: 'PESCA Y ACUICULTURA',
    isActive: true,
  },
  {
    code: '03110',
    name: 'Pesca marítima de altura y costera',
    isActive: true,
  },
  {
    code: '03120',
    name: 'Pesca de agua dulce',
    isActive: true,
  },
  {
    code: '03210',
    name: 'Acuicultura marítima',
    isActive: true,
  },
  {
    code: '03220',
    name: 'Acuicultura de agua dulce',
    isActive: true,
  },
  {
    code: '03300',
    name: 'Servicios de apoyo a la pesca y acuicultura',
    isActive: true,
  },
  {
    code: null,
    name: 'EXPLOTACIÓN DE MINAS Y CANTERAS',
    isActive: true,
  },
  {
    code: null,
    name: 'EXTRACCIÓN CARBÓN DE PIEDRA Y LIGNITO',
    isActive: true,
  },
  {
    code: '05100',
    name: 'Extracción de hulla',
    isActive: true,
  },
  {
    code: '05200',
    name: 'Extracción y aglomeración de lignito',
    isActive: true,
  },
  {
    code: null,
    name: 'EXTRACCIÓN DE PETRÓLEO CRUDO Y GAS NATURAL',
    isActive: true,
  },
  {
    code: '06100',
    name: 'Extracción de petróleo crudo',
    isActive: true,
  },
  {
    code: '06200',
    name: 'Extracción de gas natural',
    isActive: true,
  },
  {
    code: null,
    name: 'EXTRACCIÓN DE MINERALES METALÍFEROS',
    isActive: true,
  },
  {
    code: '07100',
    name: 'Extracción de minerales de hierro',
    isActive: true,
  },
  {
    code: '07210',
    name: 'Extracción de minerales de uranio y torio',
    isActive: true,
  },
  {
    code: '07290',
    name: 'Extracción de minerales metalíferos no ferrosos',
    isActive: true,
  },
  {
    code: null,
    name: 'EXPLOTACIÓN DE OTRAS MINAS Y CANTERAS',
    isActive: true,
  },
  {
    code: '08100',
    name: 'Extracción de piedra, arena y arcilla',
    isActive: true,
  },
  {
    code: '08910',
    name: 'Extracción de minerales para la fabricación de abonos y productos químicos',
    isActive: true,
  },
  {
    code: '08920',
    name: 'Extracción y aglomeración de turba',
    isActive: true,
  },
  {
    code: '08930',
    name: 'Extracción de sal',
    isActive: true,
  },
  {
    code: '08990',
    name: 'Explotación de otras minas y canteras ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE SERVICIOS DE APOYO A LA EXPLOTACIÓN DE MINAS Y CANTERAS',
    isActive: true,
  },
  {
    code: '09100',
    name: 'Actividades de apoyo a la extracción de petróleo y gas natural',
    isActive: true,
  },
  {
    code: '09900',
    name: 'Actividades de apoyo a la explotación de minas y canteras',
    isActive: true,
  },
  {
    code: null,
    name: 'INDUSTRIAS MANUFACTURERAS',
    isActive: true,
  },
  {
    code: null,
    name: 'ELABORACIÓN DE PRODUCTOS ALIMENTICIOS',
    isActive: true,
  },
  {
    code: '10101',
    name: 'Servicio de rastros y mataderos de bovinos y porcinos',
    isActive: true,
  },
  {
    code: '10102',
    name: 'Matanza y procesamiento de bovinos y porcinos',
    isActive: true,
  },
  {
    code: '10103',
    name: 'Matanza y procesamientos de aves de corral',
    isActive: true,
  },
  {
    code: '10104',
    name: 'Elaboración y conservación de embutidos y tripas naturales',
    isActive: true,
  },
  {
    code: '10105',
    name: 'Servicios de conservación y empaque de carnes',
    isActive: true,
  },
  {
    code: '10106',
    name: 'Elaboración y conservación de grasas y aceites animales',
    isActive: true,
  },
  {
    code: '10107',
    name: 'Servicios de molienda de carne',
    isActive: true,
  },
  {
    code: '10108',
    name: 'Elaboración de productos de carne ncp',
    isActive: true,
  },
  {
    code: '10201',
    name: 'Procesamiento y conservación de pescado, crustáceos y moluscos',
    isActive: true,
  },
  {
    code: '10209',
    name: 'Fabricación de productos de pescado ncp',
    isActive: true,
  },
  {
    code: '10301',
    name: 'Elaboración de jugos de frutas y hortalizas',
    isActive: true,
  },
  {
    code: '10302',
    name: 'Elaboración y envase de jaleas, mermeladas y frutas deshidratadas',
    isActive: true,
  },
  {
    code: '10309',
    name: 'Elaboración de productos de frutas y hortalizas n.c.p.',
    isActive: true,
  },
  {
    code: '10401',
    name: 'Fabricación de aceites y grasas vegetales y animales comestibles',
    isActive: true,
  },
  {
    code: '10402',
    name: 'Fabricación de aceites y grasas vegetales y animales no comestibles',
    isActive: true,
  },
  {
    code: '10409',
    name: 'Servicio de maquilado de aceites',
    isActive: true,
  },
  {
    code: '10501',
    name: 'Fabricación de productos lácteos excepto sorbetes y quesos sustitutos',
    isActive: true,
  },
  {
    code: '10502',
    name: 'Fabricación de sorbetes y helados',
    isActive: true,
  },
  {
    code: '10503',
    name: 'Fabricación de quesos',
    isActive: true,
  },
  {
    code: '10611',
    name: 'Molienda de cereales',
    isActive: true,
  },
  {
    code: '10612',
    name: 'Elaboración de cereales para el desayuno y similares',
    isActive: true,
  },
  {
    code: '10613',
    name: 'Servicios de beneficiado de productos agrícolas ncp (excluye Beneficio de azúcar rama 1072 y beneficio de café rama 0163)',
    isActive: true,
  },
  {
    code: '10621',
    name: 'Fabricación de almidón',
    isActive: true,
  },
  {
    code: '10628',
    name: 'Servicio de molienda de maíz húmedo molino para nixtamal',
    isActive: true,
  },
  {
    code: '10711',
    name: 'Elaboración de tortillas',
    isActive: true,
  },
  {
    code: '10712',
    name: 'Fabricación de pan, galletas y barquillos',
    isActive: true,
  },
  {
    code: '10713',
    name: 'Fabricación de repostería',
    isActive: true,
  },
  {
    code: '10721',
    name: 'Ingenios azucareros',
    isActive: true,
  },
  {
    code: '10722',
    name: 'Molienda de caña de azúcar para la elaboración de dulces',
    isActive: true,
  },
  {
    code: '10723',
    name: 'Elaboración de jarabes de azúcar y otros similares',
    isActive: true,
  },
  {
    code: '10724',
    name: 'Maquilado de azúcar de caña',
    isActive: true,
  },
  {
    code: '10730',
    name: 'Fabricación de cacao, chocolates y productos de confitería',
    isActive: true,
  },
  {
    code: '10740',
    name: 'Elaboración de macarrones, fideos, y productos farináceos similares',
    isActive: true,
  },
  {
    code: '10750',
    name: 'Elaboración de comidas y platos preparados para la reventa en locales y/o para exportación',
    isActive: true,
  },
  {
    code: '10791',
    name: 'Elaboración de productos de café',
    isActive: true,
  },
  {
    code: '10792',
    name: 'Elaboración de especies, sazonadores y condimentos',
    isActive: true,
  },
  {
    code: '10793',
    name: 'Elaboración de sopas, cremas y consomé',
    isActive: true,
  },
  {
    code: '10794',
    name: 'Fabricación de bocadillos tostados y/o fritos',
    isActive: true,
  },
  {
    code: '10799',
    name: 'Elaboración de productos alimenticios ncp',
    isActive: true,
  },
  {
    code: '10800',
    name: 'Elaboración de alimentos preparados para animales',
    isActive: true,
  },
  {
    code: null,
    name: 'ELABORACIÓN DE BEBIDAS',
    isActive: true,
  },
  {
    code: '11012',
    name: 'Fabricación de aguardiente y licores',
    isActive: true,
  },
  {
    code: '11020',
    name: 'Elaboración de vinos',
    isActive: true,
  },
  {
    code: '11030',
    name: 'Fabricación de cerveza',
    isActive: true,
  },
  {
    code: '11041',
    name: 'Fabricación de aguas gaseosas',
    isActive: true,
  },
  {
    code: '11042',
    name: 'Fabricación y envasado de agua',
    isActive: true,
  },
  {
    code: '11043',
    name: 'Elaboración de refrescos',
    isActive: true,
  },
  {
    code: '11048',
    name: 'Maquilado de aguas gaseosas',
    isActive: true,
  },
  {
    code: '11049',
    name: 'Elaboración de bebidas no alcohólicas',
    isActive: true,
  },
  {
    code: null,
    name: 'ELABORACIÓN DE PRODUCTOS DE TABACO',
    isActive: true,
  },
  {
    code: '12000',
    name: 'Elaboración de productos de tabaco',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE PRODUCTOS TEXTILES',
    isActive: true,
  },
  {
    code: '13111',
    name: 'Preparación de fibras textiles',
    isActive: true,
  },
  {
    code: '13112',
    name: 'Fabricación de hilados',
    isActive: true,
  },
  {
    code: '13120',
    name: 'Fabricación de telas',
    isActive: true,
  },
  {
    code: '13130',
    name: 'Acabado de productos textiles',
    isActive: true,
  },
  {
    code: '13910',
    name: 'Fabricación de tejidos de punto y ganchillo',
    isActive: true,
  },
  {
    code: '13921',
    name: 'Fabricación de productos textiles para el hogar',
    isActive: true,
  },
  {
    code: '13922',
    name: 'Sacos, bolsas y otros artículos textiles',
    isActive: true,
  },
  {
    code: '13929',
    name: 'Fabricación de artículos confeccionados con materiales textiles, excepto prendas de vestir n.c.p',
    isActive: true,
  },
  {
    code: '13930',
    name: 'Fabricación de tapices y alfombras',
    isActive: true,
  },
  {
    code: '13941',
    name: 'Fabricación de cuerdas de henequén y otras fibras naturales (lazos, pitas)',
    isActive: true,
  },
  {
    code: '13942',
    name: 'Fabricación de redes de diversos materiales',
    isActive: true,
  },
  {
    code: '13948',
    name: 'Maquilado de productos trenzables de cualquier material (petates, sillas, etc.)',
    isActive: true,
  },
  {
    code: '13991',
    name: 'Fabricación de adornos, etiquetas y otros artículos para prendas de vestir',
    isActive: true,
  },
  {
    code: '13992',
    name: 'Servicio de bordados en artículos y prendas de tela',
    isActive: true,
  },
  {
    code: '13999',
    name: 'Fabricación de productos textiles ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE PRENDAS DE VESTIR',
    isActive: true,
  },
  {
    code: '14101',
    name: 'Fabricación de ropa interior, para dormir y similares',
    isActive: true,
  },
  {
    code: '14102',
    name: 'Fabricación de ropa para niños',
    isActive: true,
  },
  {
    code: '14103',
    name: 'Fabricación de prendas de vestir para ambos sexos',
    isActive: true,
  },
  {
    code: '14104',
    name: 'Confección de prendas a medida',
    isActive: true,
  },
  {
    code: '14105',
    name: 'Fabricación de prendas de vestir para deportes',
    isActive: true,
  },
  {
    code: '14106',
    name: 'Elaboración de artesanías de uso personal confeccionadas especialmente de materiales textiles',
    isActive: true,
  },
  {
    code: '14108',
    name: 'Maquilado de prendas de vestir, accesorios y otros',
    isActive: true,
  },
  {
    code: '14109',
    name: 'Fabricación de prendas y accesorios de vestir n.c.p.',
    isActive: true,
  },
  {
    code: '14200',
    name: 'Fabricación de artículos de piel',
    isActive: true,
  },
  {
    code: '14301',
    name: 'Fabricación de calcetines, calcetas, medias (panty house) y otros similares',
    isActive: true,
  },
  {
    code: '14302',
    name: 'Fabricación de ropa interior de tejido de punto',
    isActive: true,
  },
  {
    code: '14309',
    name: 'Fabricación de prendas de vestir de tejido de punto ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE CUEROS Y PRODUCTOS CONEXOS',
    isActive: true,
  },
  {
    code: '15110',
    name: 'Curtido y adobo de cueros; adobo y teñido de pieles',
    isActive: true,
  },
  {
    code: '15121',
    name: 'Fabricación de maletas, bolsos de mano y otros artículos de marroquinería',
    isActive: true,
  },
  {
    code: '15122',
    name: 'Fabricación de monturas, accesorios y vainas talabartería',
    isActive: true,
  },
  {
    code: '15123',
    name: 'Fabricación de artesanías principalmente de cuero natural y sintético',
    isActive: true,
  },
  {
    code: '15128',
    name: 'Maquilado de artículos de cuero natural, sintético y de otros materiales',
    isActive: true,
  },
  {
    code: '15201',
    name: 'Fabricación de calzado',
    isActive: true,
  },
  {
    code: '15202',
    name: 'Fabricación de partes y accesorios de calzado',
    isActive: true,
  },
  {
    code: '15208',
    name: 'Maquilado de partes y accesorios de calzado',
    isActive: true,
  },
  {
    code: null,
    name: 'PRODUCCIÓN DE MADERA Y FABRICACIÓN DE PRODUCTOS DE MADERA Y CORCHO EXCEPTO MUEBLES; FABRICACIÓN DE ARTÍCULOS DE PAJA Y DE MATERIALES TRENZABLES',
    isActive: true,
  },
  {
    code: '16100',
    name: 'Aserradero y acepilladura de madera',
    isActive: true,
  },
  {
    code: '16210',
    name: 'Fabricación de madera laminada, terciada, enchapada y contrachapada, paneles para la construcción',
    isActive: true,
  },
  {
    code: '16220',
    name: 'Fabricación de partes y piezas de carpintería para edificios y construcciones',
    isActive: true,
  },
  {
    code: '16230',
    name: 'Fabricación de envases y recipientes de madera',
    isActive: true,
  },
  {
    code: '16292',
    name: 'Fabricación de artesanías de madera, semillas, materiales trenzables',
    isActive: true,
  },
  {
    code: '16299',
    name: 'Fabricación de productos de madera, corcho, paja y materiales trenzables ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE PAPEL Y DE PRODUCTOS DE PAPEL',
    isActive: true,
  },
  {
    code: '17010',
    name: 'Fabricación de pasta de madera, papel y cartón',
    isActive: true,
  },
  {
    code: '17020',
    name: 'Fabricación de papel y cartón ondulado y envases de papel y cartón',
    isActive: true,
  },
  {
    code: '17091',
    name: 'Fabricación de artículos de papel y cartón de uso personal y doméstico',
    isActive: true,
  },
  {
    code: '17092',
    name: 'Fabricación de productos de papel ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'IMPRESIÓN Y REPRODUCCIÓN DE GRABACIONES',
    isActive: true,
  },
  {
    code: '18110',
    name: 'Impresión',
    isActive: true,
  },
  {
    code: '18120',
    name: 'Servicios relacionados con la impresión',
    isActive: true,
  },
  {
    code: '18200',
    name: 'Reproducción de grabaciones',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE COQUE Y DE PRODUCTOS DE LA REFINACIÓN DE PETRÓLEO',
    isActive: true,
  },
  {
    code: '19100',
    name: 'Fabricación de productos de hornos de coque',
    isActive: true,
  },
  {
    code: '19201',
    name: 'Fabricación de combustible',
    isActive: true,
  },
  {
    code: '19202',
    name: 'Fabricación de aceites y lubricantes',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE SUSTANCIAS Y PRODUCTOS QUÍMICOS',
    isActive: true,
  },
  {
    code: '20111',
    name: 'Fabricación de materias primas para la fabricación de colorantes',
    isActive: true,
  },
  {
    code: '20112',
    name: 'Fabricación de materiales curtientes',
    isActive: true,
  },
  {
    code: '20113',
    name: 'Fabricación de gases industriales',
    isActive: true,
  },
  {
    code: '20114',
    name: 'Fabricación de alcohol etílico',
    isActive: true,
  },
  {
    code: '20119',
    name: 'Fabricación de sustancias químicas básicas',
    isActive: true,
  },
  {
    code: '20120',
    name: 'Fabricación de abonos y fertilizantes',
    isActive: true,
  },
  {
    code: '20130',
    name: 'Fabricación de plástico y caucho en formas primarias',
    isActive: true,
  },
  {
    code: '20210',
    name: 'Fabricación de plaguicidas y otros productos químicos de uso agropecuario',
    isActive: true,
  },
  {
    code: '20220',
    name: 'Fabricación de pinturas, barnices y productos de revestimiento similares; tintas de imprenta y masillas',
    isActive: true,
  },
  {
    code: '20231',
    name: 'Fabricación de jabones, detergentes y similares para limpieza',
    isActive: true,
  },
  {
    code: '20232',
    name: 'Fabricación de perfumes, cosméticos y productos de higiene y cuidado personal, incluyendo tintes, champú, etc.',
    isActive: true,
  },
  {
    code: '20291',
    name: 'Fabricación de tintas y colores para escribir y pintar; fabricación de cintas para impresoras',
    isActive: true,
  },
  {
    code: '20292',
    name: 'Fabricación de productos pirotécnicos, explosivos y municiones',
    isActive: true,
  },
  {
    code: '20299',
    name: 'Fabricación de productos químicos n.c.p.',
    isActive: true,
  },
  {
    code: '20300',
    name: 'Fabricación de fibras artificiales',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE PRODUCTOS FARMACÉUTICOS, SUSTANCIAS QUÍMICAS MEDICINALES Y PRODUCTOS BOTÁNICOS DE USO FARMACÉUTICO',
    isActive: true,
  },
  {
    code: '21001',
    name: 'Manufactura de productos farmacéuticos, sustancias químicas y productos botánicos',
    isActive: true,
  },
  {
    code: '21008',
    name: 'Maquilado de medicamentos',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE PRODUCTOS DE CAUCHO Y PLÁSTICO',
    isActive: true,
  },
  {
    code: '22110',
    name: 'Fabricación de cubiertas y cámaras; renovación y recauchutado de cubiertas',
    isActive: true,
  },
  {
    code: '22190',
    name: 'Fabricación de otros productos de caucho',
    isActive: true,
  },
  {
    code: '22201',
    name: 'Fabricación de envases plásticos',
    isActive: true,
  },
  {
    code: '22202',
    name: 'Fabricación de productos plásticos para uso personal o doméstico',
    isActive: true,
  },
  {
    code: '22208',
    name: 'Maquila de plásticos',
    isActive: true,
  },
  {
    code: '22209',
    name: 'Fabricación de productos plásticos n.c.p.',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE PRODUCTOS MINERALES NO METÁLICOS',
    isActive: true,
  },
  {
    code: '23101',
    name: 'Fabricación de vidrio',
    isActive: true,
  },
  {
    code: '23102',
    name: 'Fabricación de recipientes y envases de vidrio',
    isActive: true,
  },
  {
    code: '23108',
    name: 'Servicio de maquilado',
    isActive: true,
  },
  {
    code: '23109',
    name: 'Fabricación de productos de vidrio ncp',
    isActive: true,
  },
  {
    code: '23910',
    name: 'Fabricación de productos refractarios',
    isActive: true,
  },
  {
    code: '23920',
    name: 'Fabricación de productos de arcilla para la construcción',
    isActive: true,
  },
  {
    code: '23931',
    name: 'Fabricación de productos de cerámica y porcelana no refractaria',
    isActive: true,
  },
  {
    code: '23932',
    name: 'Fabricación de productos de cerámica y porcelana ncp',
    isActive: true,
  },
  {
    code: '23940',
    name: 'Fabricación de cemento, cal y yeso',
    isActive: true,
  },
  {
    code: '23950',
    name: 'Fabricación de artículos de hormigón, cemento y yeso',
    isActive: true,
  },
  {
    code: '23960',
    name: 'Corte, tallado y acabado de la piedra',
    isActive: true,
  },
  {
    code: '23990',
    name: 'Fabricación de productos minerales no metálicos ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE METALES COMUNES',
    isActive: true,
  },
  {
    code: '24100',
    name: 'Industrias básicas de hierro y acero',
    isActive: true,
  },
  {
    code: '24200',
    name: 'Fabricación de productos primarios de metales preciosos y metales no ferrosos',
    isActive: true,
  },
  {
    code: '24310',
    name: 'Fundición de hierro y acero',
    isActive: true,
  },
  {
    code: '24320',
    name: 'Fundición de metales no ferrosos',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE PRODUCTOS DERIVADOS DE METAL, EXCEPTO MAQUINARIA Y EQUIPO',
    isActive: true,
  },
  {
    code: '25111',
    name: 'Fabricación de productos metálicos para uso estructural',
    isActive: true,
  },
  {
    code: '25118',
    name: 'Servicio de maquila para la fabricación de estructuras metálicas',
    isActive: true,
  },
  {
    code: '25120',
    name: 'Fabricación de tanques, depósitos y recipientes de metal',
    isActive: true,
  },
  {
    code: '25130',
    name: 'Fabricación de generadores de vapor, excepto calderas de agua caliente para calefacción central',
    isActive: true,
  },
  {
    code: '25200',
    name: 'Fabricación de armas y municiones',
    isActive: true,
  },
  {
    code: '25910',
    name: 'Forjado, prensado, estampado y laminado de metales; pulvimetalurgia',
    isActive: true,
  },
  {
    code: '25920',
    name: 'Tratamiento y revestimiento de metales',
    isActive: true,
  },
  {
    code: '25930',
    name: 'Fabricación de artículos de cuchillería, herramientas de mano y artículos de ferretería',
    isActive: true,
  },
  {
    code: '25991',
    name: 'Fabricación de envases y artículos conexos de metal',
    isActive: true,
  },
  {
    code: '25992',
    name: 'Fabricación de artículos metálicos de uso personal y/o doméstico',
    isActive: true,
  },
  {
    code: '25999',
    name: 'Fabricación de productos elaborados de metal ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE PRODUCTOS DE INFORMÁTICA, ELECTRÓNICA Y ÓPTICA',
    isActive: true,
  },
  {
    code: '26100',
    name: 'Fabricación de componentes electrónicos',
    isActive: true,
  },
  {
    code: '26200',
    name: 'Fabricación de computadoras y equipo conexo',
    isActive: true,
  },
  {
    code: '26300',
    name: 'Fabricación de equipo de comunicaciones',
    isActive: true,
  },
  {
    code: '26400',
    name: 'Fabricación de aparatos electrónicos de consumo para audio, video radio y televisión',
    isActive: true,
  },
  {
    code: '26510',
    name: 'Fabricación de instrumentos y aparatos para medir, verificar, ensayar, navegar y de control de procesos industriales',
    isActive: true,
  },
  {
    code: '26520',
    name: 'Fabricación de relojes y piezas de relojes',
    isActive: true,
  },
  {
    code: '26600',
    name: 'Fabricación de equipo médico de irradiación y equipo electrónico de uso médico y terapéutico',
    isActive: true,
  },
  {
    code: '26700',
    name: 'Fabricación de instrumentos de óptica y equipo fotográfico',
    isActive: true,
  },
  {
    code: '26800',
    name: 'Fabricación de medios magnéticos y ópticos',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE EQUIPO ELÉCTRICO',
    isActive: true,
  },
  {
    code: '27100',
    name: 'Fabricación de motores, generadores, transformadores eléctricos, aparatos de distribución y control de electricidad',
    isActive: true,
  },
  {
    code: '27200',
    name: 'Fabricación de pilas, baterías y acumuladores',
    isActive: true,
  },
  {
    code: '27310',
    name: 'Fabricación de cables de fibra óptica',
    isActive: true,
  },
  {
    code: '27320',
    name: 'Fabricación de otros hilos y cables eléctricos',
    isActive: true,
  },
  {
    code: '27330',
    name: 'Fabricación de dispositivos de cableados',
    isActive: true,
  },
  {
    code: '27400',
    name: 'Fabricación de equipo eléctrico de iluminación',
    isActive: true,
  },
  {
    code: '27500',
    name: 'Fabricación de aparatos de uso doméstico',
    isActive: true,
  },
  {
    code: '27900',
    name: 'Fabricación de otros tipos de equipo eléctrico',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE MAQUINARIA Y EQUIPO NCP',
    isActive: true,
  },
  {
    code: '28110',
    name: 'Fabricación de motores y turbinas, excepto motores para aeronaves, vehículos automotores y motocicletas',
    isActive: true,
  },
  {
    code: '28120',
    name: 'Fabricación de equipo hidráulico',
    isActive: true,
  },
  {
    code: '28130',
    name: 'Fabricación de otras bombas, compresores, grifos y válvulas',
    isActive: true,
  },
  {
    code: '28140',
    name: 'Fabricación de cojinetes, engranajes, trenes de engranajes y piezas de transmisión',
    isActive: true,
  },
  {
    code: '28150',
    name: 'Fabricación de hornos y quemadores',
    isActive: true,
  },
  {
    code: '28160',
    name: 'Fabricación de equipo de elevación y manipulación',
    isActive: true,
  },
  {
    code: '28170',
    name: 'Fabricación de maquinaria y equipo de oficina',
    isActive: true,
  },
  {
    code: '28180',
    name: 'Fabricación de herramientas manuales',
    isActive: true,
  },
  {
    code: '28190',
    name: 'Fabricación de otros tipos de maquinaria de uso general',
    isActive: true,
  },
  {
    code: '28210',
    name: 'Fabricación de maquinaria agropecuaria y forestal',
    isActive: true,
  },
  {
    code: '28220',
    name: 'Fabricación de máquinas para conformar metales y maquinaria herramienta ',
    isActive: true,
  },
  {
    code: '28230',
    name: 'Fabricación de maquinaria metalúrgica',
    isActive: true,
  },
  {
    code: '28240',
    name: 'Fabricación de maquinaria para la explotación de minas y canteras y para obras de construcción',
    isActive: true,
  },
  {
    code: '28250',
    name: 'Fabricación de maquinaria para la elaboración de alimentos, bebidas y tabaco',
    isActive: true,
  },
  {
    code: '28260',
    name: 'Fabricación de maquinaria para la elaboración de productos textiles, prendas de vestir y cueros',
    isActive: true,
  },
  {
    code: '28291',
    name: 'Fabricación de máquinas para imprenta',
    isActive: true,
  },
  {
    code: '28299',
    name: 'Fabricación de maquinaria de uso especial ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE VEHÍCULOS AUTOMOTORES, REMOLQUES Y SEMIRREMOLQUES',
    isActive: true,
  },
  {
    code: '29100',
    name: 'Fabricación vehículos automotores',
    isActive: true,
  },
  {
    code: '29200',
    name: 'Fabricación de carrocerías para vehículos automotores; fabricación de remolques y semiremolques',
    isActive: true,
  },
  {
    code: '29300',
    name: 'Fabricación de partes, piezas y accesorios para vehículos automotores',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE OTROS TIPOS DE EQUIPO DE TRANSPORTE',
    isActive: true,
  },
  {
    code: '30110',
    name: 'Fabricación de buques',
    isActive: true,
  },
  {
    code: '30120',
    name: 'Construcción y reparación de embarcaciones de recreo',
    isActive: true,
  },
  {
    code: '30200',
    name: 'Fabricación de locomotoras y de material rodante',
    isActive: true,
  },
  {
    code: '30300',
    name: 'Fabricación de aeronaves y naves espaciales',
    isActive: true,
  },
  {
    code: '30400',
    name: 'Fabricación de vehículos militares de combate',
    isActive: true,
  },
  {
    code: '30910',
    name: 'Fabricación de motocicletas',
    isActive: true,
  },
  {
    code: '30920',
    name: 'Fabricación de bicicletas y sillones de ruedas para inválidos',
    isActive: true,
  },
  {
    code: '30990',
    name: 'Fabricación de equipo de transporte ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'FABRICACIÓN DE MUEBLES',
    isActive: true,
  },
  {
    code: '31001',
    name: 'Fabricación de colchones y somier',
    isActive: true,
  },
  {
    code: '31002',
    name: 'Fabricación de muebles y otros productos de madera a medida',
    isActive: true,
  },
  {
    code: '31008',
    name: 'Servicios de maquilado de muebles',
    isActive: true,
  },
  {
    code: '31009',
    name: 'Fabricación de muebles ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'OTRAS INDUSTRIAS MANUFACTURERAS',
    isActive: true,
  },
  {
    code: '32110',
    name: 'Fabricación de joyas platerías y joyerías',
    isActive: true,
  },
  {
    code: '32120',
    name: 'Fabricación de joyas de imitación (fantasía) y artículos conexos',
    isActive: true,
  },
  {
    code: '32200',
    name: 'Fabricación de instrumentos musicales',
    isActive: true,
  },
  {
    code: '32301',
    name: 'Fabricación de artículos de deporte',
    isActive: true,
  },
  {
    code: '32308',
    name: 'Servicio de maquila de productos deportivos',
    isActive: true,
  },
  {
    code: '32401',
    name: 'Fabricación de juegos de mesa y de salón',
    isActive: true,
  },
  {
    code: '32402',
    name: 'Servicio de maquilado de juguetes y juegos',
    isActive: true,
  },
  {
    code: '32409',
    name: 'Fabricación de juegos y juguetes n.c.p.',
    isActive: true,
  },
  {
    code: '32500',
    name: 'Fabricación de instrumentos y materiales médicos y odontológicos',
    isActive: true,
  },
  {
    code: '32901',
    name: 'Fabricación de lápices, bolígrafos, sellos y artículos de librería en general',
    isActive: true,
  },
  {
    code: '32902',
    name: 'Fabricación de escobas, cepillos, pinceles y similares',
    isActive: true,
  },
  {
    code: '32903',
    name: 'Fabricación de artesanías de materiales diversos',
    isActive: true,
  },
  {
    code: '32904',
    name: 'Fabricación de artículos de uso personal y domésticos n.c.p.',
    isActive: true,
  },
  {
    code: '32905',
    name: 'Fabricación de accesorios para las confecciones y la marroquinería n.c.p.',
    isActive: true,
  },
  {
    code: '32908',
    name: 'Servicios de maquila ncp',
    isActive: true,
  },
  {
    code: '32909',
    name: 'Fabricación de productos manufacturados n.c.p.',
    isActive: true,
  },
  {
    code: null,
    name: 'REPARACIÓN E INSTALACIÓN DE MAQUINARIA Y EQUIPO',
    isActive: true,
  },
  {
    code: '33110',
    name: 'Reparación y mantenimiento de productos elaborados de metal',
    isActive: true,
  },
  {
    code: '33120',
    name: 'Reparación y mantenimiento de maquinaria',
    isActive: true,
  },
  {
    code: '33130',
    name: 'Reparación y mantenimiento de equipo electrónico y óptico',
    isActive: true,
  },
  {
    code: '33140',
    name: 'Reparación y mantenimiento de equipo eléctrico',
    isActive: true,
  },
  {
    code: '33150',
    name: 'Reparación y mantenimiento de equipo de transporte, excepto vehículos automotores',
    isActive: true,
  },
  {
    code: '33190',
    name: 'Reparación y mantenimiento de equipos n.c.p.',
    isActive: true,
  },
  {
    code: '33200',
    name: 'Instalación de maquinaria y equipo industrial',
    isActive: true,
  },
  {
    code: null,
    name: 'SUMINISTROS DE ELECTRICIDAD, GAS, VAPOR Y AIRE ACONDICIONADO',
    isActive: true,
  },
  {
    code: null,
    name: 'SUMINISTROS DE ELECTRICIDAD, GAS, VAPOR Y AIRE ACONDICIONADO',
    isActive: true,
  },
  {
    code: '35101',
    name: 'Generación de energía eléctrica',
    isActive: true,
  },
  {
    code: '35102',
    name: 'Transmisión de energía eléctrica',
    isActive: true,
  },
  {
    code: '35103',
    name: 'Distribución de energía eléctrica',
    isActive: true,
  },
  {
    code: '35200',
    name: 'Fabricación de gas, distribución de combustibles gaseosos por tuberías',
    isActive: true,
  },
  {
    code: '35300',
    name: 'Suministro de vapor y agua caliente',
    isActive: true,
  },
  {
    code: null,
    name: 'SUMINISTRO DE AGUA, EVACUACIÓN DE AGUAS RESIDUALES (ALCANTARILLADO); GESTIÓN DE DESECHOS Y ACTIVIDADES DE SANEAMIENTO',
    isActive: true,
  },
  {
    code: null,
    name: 'CAPTACIÓN, TRATAMIENTO Y SUMINISTRO DE AGUA',
    isActive: true,
  },
  {
    code: '36000',
    name: 'Captación, tratamiento y suministro de agua',
    isActive: true,
  },
  {
    code: null,
    name: 'EVACUACIÓN DE AGUAS RESIDUALES (ALCANTARILLADO)',
    isActive: true,
  },
  {
    code: '37000',
    name: 'Evacuación de aguas residuales (alcantarillado)',
    isActive: true,
  },
  {
    code: null,
    name: 'RECOLECCIÓN, TRATAMIENTO Y ELIMINACIÓN DE DESECHOS; RECICLAJE',
    isActive: true,
  },
  {
    code: '38110',
    name: 'Recolección y transporte de desechos sólidos proveniente de hogares y sector urbano',
    isActive: true,
  },
  {
    code: '38120',
    name: 'Recolección de desechos peligrosos',
    isActive: true,
  },
  {
    code: '38210',
    name: 'Tratamiento y eliminación de desechos inicuos',
    isActive: true,
  },
  {
    code: '38220',
    name: 'Tratamiento y eliminación de desechos peligrosos',
    isActive: true,
  },
  {
    code: '38301',
    name: 'Reciclaje de desperdicios y desechos textiles',
    isActive: true,
  },
  {
    code: '38302',
    name: 'Reciclaje de desperdicios y desechos de plástico y caucho',
    isActive: true,
  },
  {
    code: '38303',
    name: 'Reciclaje de desperdicios y desechos de vidrio',
    isActive: true,
  },
  {
    code: '38304',
    name: 'Reciclaje de desperdicios y desechos de papel y cartón',
    isActive: true,
  },
  {
    code: '38305',
    name: 'Reciclaje de desperdicios y desechos metálicos',
    isActive: true,
  },
  {
    code: '38309',
    name: 'Reciclaje de desperdicios y desechos no metálicos n.c.p.',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE SANEAMIENTO Y OTROS SERVICIOS DE GESTIÓN DE DESECHOS',
    isActive: true,
  },
  {
    code: '39000',
    name: 'Actividades de Saneamiento y otros Servicios de Gestión de Desechos',
    isActive: true,
  },
  {
    code: null,
    name: 'CONSTRUCCIÓN',
    isActive: true,
  },
  {
    code: null,
    name: 'CONSTRUCCIÓN DE EDIFICIOS',
    isActive: true,
  },
  {
    code: '41001',
    name: 'Construcción de edificios residenciales',
    isActive: true,
  },
  {
    code: '41002',
    name: 'Construcción de edificios no residenciales',
    isActive: true,
  },
  {
    code: null,
    name: 'OBRAS DE INGENIERÍA CIVIL',
    isActive: true,
  },
  {
    code: '42100',
    name: 'Construcción de carreteras, calles y caminos',
    isActive: true,
  },
  {
    code: '42200',
    name: 'Construcción de proyectos de servicio público',
    isActive: true,
  },
  {
    code: '42900',
    name: 'Construcción de obras de ingeniería civil n.c.p.',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES ESPECIALIZADAS DE CONSTRUCCIÓN',
    isActive: true,
  },
  {
    code: '43110',
    name: 'Demolición',
    isActive: true,
  },
  {
    code: '43120',
    name: 'Preparación de terreno',
    isActive: true,
  },
  {
    code: '43210',
    name: 'Instalaciones eléctricas',
    isActive: true,
  },
  {
    code: '43220',
    name: 'Instalación de fontanería, calefacción y aire acondicionado',
    isActive: true,
  },
  {
    code: '43290',
    name: 'Otras instalaciones para obras de construcción',
    isActive: true,
  },
  {
    code: '43300',
    name: 'Terminación y acabado de edificios',
    isActive: true,
  },
  {
    code: '43900',
    name: 'Otras actividades especializadas de construcción',
    isActive: true,
  },
  {
    code: '43901',
    name: 'Fabricación de techos y materiales diversos',
    isActive: true,
  },
  {
    code: null,
    name: 'COMERCIO AL POR MAYOR Y AL POR MENOR; REPARACIÓN DE VEHÍCULOS AUTOMOTORES Y MOTOCICLETAS',
    isActive: true,
  },
  {
    code: null,
    name: 'COMERCIO AL POR MAYOR Y AL POR MENOR Y REPARACIÓN DE VEHÍCULOS AUTOMOTORES Y MOTOCICLETAS',
    isActive: true,
  },
  {
    code: '45100',
    name: 'Venta de vehículos automotores',
    isActive: true,
  },
  {
    code: '45201',
    name: 'Reparación mecánica de vehículos automotores',
    isActive: true,
  },
  {
    code: '45202',
    name: 'Reparaciones eléctricas del automotor y recarga de baterías',
    isActive: true,
  },
  {
    code: '45203',
    name: 'Enderezado y pintura de vehículos automotores',
    isActive: true,
  },
  {
    code: '45204',
    name: 'Reparaciones de radiadores, escapes y silenciadores',
    isActive: true,
  },
  {
    code: '45205',
    name: 'Reparación y reconstrucción de vías, stop y otros artículos de fibra de vidrio',
    isActive: true,
  },
  {
    code: '45206',
    name: 'Reparación de llantas de vehículos automotores',
    isActive: true,
  },
  {
    code: '45207',
    name: 'Polarizado de vehículos (mediante la adhesión de papel especial a los vidrios)',
    isActive: true,
  },
  {
    code: '45208',
    name: 'Lavado y pasteado de vehículos (carwash)',
    isActive: true,
  },
  {
    code: '45209',
    name: 'Reparaciones de vehículos n.c.p.',
    isActive: true,
  },
  {
    code: '45211',
    name: 'Remolque de vehículos automotores',
    isActive: true,
  },
  {
    code: '45301',
    name: 'Venta de partes, piezas y accesorios nuevos para vehículos automotores',
    isActive: true,
  },
  {
    code: '45302',
    name: 'Venta de partes, piezas y accesorios usados para vehículos automotores',
    isActive: true,
  },
  {
    code: '45401',
    name: 'Venta de motocicletas',
    isActive: true,
  },
  {
    code: '45402',
    name: 'Venta de repuestos, piezas y accesorios de motocicletas',
    isActive: true,
  },
  {
    code: '45403',
    name: 'Mantenimiento y reparación de motocicletas',
    isActive: true,
  },
  {
    code: null,
    name: 'COMERCIO AL POR MAYOR, EXCEPTO EL COMERCIO DE VEHÍCULOS AUTOMOTORES Y MOTOCICLETAS (Parte 1)',
    isActive: true,
  },
  {
    code: '46100',
    name: 'Venta al por mayor a cambio de retribución o por contrata',
    isActive: true,
  },
  {
    code: '46201',
    name: 'Venta al por mayor de materias primas agrícolas',
    isActive: true,
  },
  {
    code: '46202',
    name: 'Venta al por mayor de productos de la silvicultura',
    isActive: true,
  },
  {
    code: '46203',
    name: 'Venta al por mayor de productos pecuarios y de granja',
    isActive: true,
  },
  {
    code: '46211',
    name: 'Venta de productos para uso agropecuario',
    isActive: true,
  },
  {
    code: '46291',
    name: 'Venta al por mayor de granos básicos (cereales, leguminosas)',
    isActive: true,
  },
  {
    code: '46292',
    name: 'Venta al por mayor de semillas mejoradas para cultivo',
    isActive: true,
  },
  {
    code: '46293',
    name: 'Venta al por mayor de café oro y uva',
    isActive: true,
  },
  {
    code: '46294',
    name: 'Venta al por mayor de caña de azúcar',
    isActive: true,
  },
  {
    code: '46295',
    name: 'Venta al por mayor de flores, plantas y otros productos naturales',
    isActive: true,
  },
  {
    code: '46296',
    name: 'Venta al por mayor de productos agrícolas',
    isActive: true,
  },
  {
    code: '46297',
    name: 'Venta al por mayor de ganado bovino (vivo)',
    isActive: true,
  },
  {
    code: '46298',
    name: 'Venta al por mayor de animales porcinos, ovinos, caprino, canículas, apícolas, avícolas vivos',
    isActive: true,
  },
  {
    code: '46299',
    name: 'Venta de otras especies vivas del reino animal',
    isActive: true,
  },
  {
    code: '46301',
    name: 'Venta al por mayor de alimentos',
    isActive: true,
  },
  {
    code: '46302',
    name: 'Venta al por mayor de bebidas',
    isActive: true,
  },
  {
    code: '46303',
    name: 'Venta al por mayor de tabaco',
    isActive: true,
  },
  {
    code: '46371',
    name: 'Venta al por mayor de frutas, hortalizas (verduras), legumbres y tubérculos',
    isActive: true,
  },
  {
    code: '46372',
    name: 'Venta al por mayor de pollos, gallinas destazadas, pavos y otras aves',
    isActive: true,
  },
  {
    code: '46373',
    name: 'Venta al por mayor de carne bovina y porcina, productos de carne y embutidos',
    isActive: true,
  },
  {
    code: '46374',
    name: 'Venta al por mayor de huevos',
    isActive: true,
  },
  {
    code: '46375',
    name: 'Venta al por mayor de productos lácteos',
    isActive: true,
  },
  {
    code: '46376',
    name: 'Venta al por mayor de productos farináceos de panadería (pan dulce, cakes, respostería, etc.)',
    isActive: true,
  },
  {
    code: '46377',
    name: 'Venta al por mayor de pastas alimenticias, aceites y grasas comestibles vegetal y animal',
    isActive: true,
  },
  {
    code: '46378',
    name: 'Venta al por mayor de sal comestible',
    isActive: true,
  },
  {
    code: '46379',
    name: 'Venta al por mayor de azúcar',
    isActive: true,
  },
  {
    code: '46391',
    name: 'Venta al por mayor de abarrotes (vinos, licores, productos alimenticios envasados, etc.)',
    isActive: true,
  },
  {
    code: '46392',
    name: 'Venta al por mayor de aguas gaseosas',
    isActive: true,
  },
  {
    code: '46393',
    name: 'Venta al por mayor de agua purificada',
    isActive: true,
  },
  {
    code: '46394',
    name: 'Venta al por mayor de refrescos y otras bebidas, líquidas o en polvo',
    isActive: true,
  },
  {
    code: '46395',
    name: 'Venta al por mayor de cerveza y licores',
    isActive: true,
  },
  {
    code: '46396',
    name: 'Venta al por mayor de hielo',
    isActive: true,
  },
  {
    code: '46411',
    name: 'Venta al por mayor de hilados, tejidos y productos textiles de mercería',
    isActive: true,
  },
  {
    code: '46412',
    name: 'Venta al por mayor de artículos textiles excepto confecciones para el hogar',
    isActive: true,
  },
  {
    code: '46413',
    name: 'Venta al por mayor de confecciones textiles para el hogar',
    isActive: true,
  },
  {
    code: '46414',
    name: 'Venta al por mayor de prendas de vestir y accesorios de vestir',
    isActive: true,
  },
  {
    code: '46415',
    name: 'Venta al por mayor de ropa usada',
    isActive: true,
  },
  {
    code: '46416',
    name: 'Venta al por mayor de calzado',
    isActive: true,
  },
  {
    code: '46417',
    name: 'Venta al por mayor de artículos de marroquinería y talabartería',
    isActive: true,
  },
  {
    code: '46418',
    name: 'Venta al por mayor de artículos de peletería',
    isActive: true,
  },
  {
    code: '46419',
    name: 'Venta al por mayor de otros artículos textiles n.c.p.',
    isActive: true,
  },
  {
    code: '46471',
    name: 'Venta al por mayor de instrumentos musicales',
    isActive: true,
  },
  {
    code: '46472',
    name: 'Venta al por mayor de colchones, almohadas, cojines, etc.',
    isActive: true,
  },
  {
    code: '46473',
    name: 'Venta al por mayor de artículos de aluminio para el hogar y para otros usos',
    isActive: true,
  },
  {
    code: '46474',
    name: 'Venta al por mayor de depósitos y otros artículos plásticos para el hogar y otros usos, incluyendo los desechables de durapax y no desechables',
    isActive: true,
  },
  {
    code: '46475',
    name: 'Venta al por mayor de cámaras fotográficas, accesorios y materiales',
    isActive: true,
  },
  {
    code: '46482',
    name: 'Venta al por mayor de medicamentos, artículos y otros productos de uso veterinario',
    isActive: true,
  },
  {
    code: '46483',
    name: 'Venta al por mayor de productos y artículos de belleza y de uso personal',
    isActive: true,
  },
  {
    code: '46484',
    name: 'Venta de productos farmacéuticos y medicinales',
    isActive: true,
  },
  {
    code: '46491',
    name: 'Venta al por mayor de productos medicinales, cosméticos, perfumería y productos de limpieza',
    isActive: true,
  },
  {
    code: '46492',
    name: 'Venta al por mayor de relojes y artículos de joyería',
    isActive: true,
  },
  {
    code: '46493',
    name: 'Venta al por mayor de electrodomésticos y artículos del hogar excepto bazar; artículos de iluminación',
    isActive: true,
  },
  {
    code: '46494',
    name: 'Venta al por mayor de artículos de bazar y similares',
    isActive: true,
  },
  {
    code: '46495',
    name: 'Venta al por mayor de artículos de óptica',
    isActive: true,
  },
  {
    code: '46496',
    name: 'Venta al por mayor de revistas, periódicos, libros, artículos de librería y artículos de papel y cartón en general',
    isActive: true,
  },
  {
    code: '46497',
    name: 'Venta de artículos deportivos, juguetes y rodados',
    isActive: true,
  },
  {
    code: '46498',
    name: 'Venta al por mayor de productos usados para el hogar o el uso personal',
    isActive: true,
  },
  {
    code: '46499',
    name: 'Venta al por mayor de enseres domésticos y de uso personal n.c.p.',
    isActive: true,
  },
  {
    code: '46500',
    name: 'Venta al por mayor de bicicletas, partes, accesorios y otros',
    isActive: true,
  },
  {
    code: '46510',
    name: 'Venta al por mayor de computadoras, equipo periférico y programas informáticos',
    isActive: true,
  },
  {
    code: '46520',
    name: 'Venta al por mayor de equipos de comunicación',
    isActive: true,
  },
  {
    code: '46530',
    name: 'Venta al por mayor de maquinaria y equipo agropecuario, accesorios, partes y suministros',
    isActive: true,
  },
  {
    code: '46590',
    name: 'Venta de equipos e instrumentos de uso profesional y científico y aparatos de medida y control',
    isActive: true,
  },
  {
    code: '46591',
    name: 'Venta al por mayor de maquinaria equipo, accesorios y materiales para la industria de la madera y sus productos',
    isActive: true,
  },
  {
    code: '46592',
    name: 'Venta al por mayor de maquinaria, equipo, accesorios y materiales para la industria gráfica y del papel, cartón y productos de papel y cartón',
    isActive: true,
  },
  {
    code: '46593',
    name: 'Venta al por mayor de maquinaria, equipo, accesorios y materiales para la industria de productos químicos, plástico y caucho',
    isActive: true,
  },
  {
    code: '46594',
    name: 'Venta al por mayor de maquinaria, equipo, accesorios y materiales para la industria metálica y de sus productos',
    isActive: true,
  },
  {
    code: '46595',
    name: 'Venta al por mayor de equipamiento para uso médico, odontológico, veterinario y servicios conexos',
    isActive: true,
  },
  {
    code: '46596',
    name: 'Venta al por mayor de maquinaria, equipo, accesorios y partes para la industria de la alimentación',
    isActive: true,
  },
  {
    code: '46597',
    name: 'Venta al por mayor de maquinaria, equipo, accesorios y partes para la industria textil, confecciones y cuero',
    isActive: true,
  },
  {
    code: '46598',
    name: 'Venta al por mayor de maquinaria, equipo y accesorios para la construcción y explotación de minas y canteras',
    isActive: true,
  },
  {
    code: '46599',
    name: 'Venta al por mayor de otro tipo de maquinaria y equipo con sus accesorios y partes',
    isActive: true,
  },
  {
    code: '46610',
    name: 'Venta al por mayor de otros combustibles sólidos, líquidos, gaseosos y de productos conexos',
    isActive: true,
  },
  {
    code: '46612',
    name: 'Venta al por mayor de combustibles para automotores, aviones, barcos, maquinaria y otros',
    isActive: true,
  },
  {
    code: '46613',
    name: 'Venta al por mayor de lubricantes, grasas y otros aceites para automotores, maquinaria industrial, etc.',
    isActive: true,
  },
  {
    code: '46614',
    name: 'Venta al por mayor de gas propano',
    isActive: true,
  },
  {
    code: '46615',
    name: 'Venta al por mayor de leña y carbón',
    isActive: true,
  },
  {
    code: '46620',
    name: 'Venta al por mayor de metales y minerales metalíferos',
    isActive: true,
  },
  {
    code: '46631',
    name: 'Venta al por mayor de puertas, ventanas, vitrinas y similares',
    isActive: true,
  },
  {
    code: '46632',
    name: 'Venta al por mayor de artículos de ferretería y pinturerías',
    isActive: true,
  },
  {
    code: '46633',
    name: 'Vidrierías',
    isActive: true,
  },
  {
    code: '46634',
    name: 'Venta al por mayor de maderas',
    isActive: true,
  },
  {
    code: '46639',
    name: 'Venta al por mayor de materiales para la construcción n.c.p.',
    isActive: true,
  },
  {
    code: '46691',
    name: 'Venta al por mayor de sal industrial sin yodar',
    isActive: true,
  },
  {
    code: '46692',
    name: 'Venta al por mayor de productos intermedios y desechos de origen textil',
    isActive: true,
  },
  {
    code: '46693',
    name: 'Venta al por mayor de productos intermedios y desechos de origen metálico',
    isActive: true,
  },
  {
    code: '46694',
    name: 'Venta al por mayor de productos intermedios y desechos de papel y cartón',
    isActive: true,
  },
  {
    code: null,
    name: 'COMERCIO AL POR MAYOR, EXCEPTO EL COMERCIO DE VEHÍCULOS AUTOMOTORES Y MOTOCICLETAS (Parte 2)',
    isActive: true,
  },
  {
    code: '46695',
    name: 'Venta al por mayor fertilizantes, abonos, agroquímicos y productos similares',
    isActive: true,
  },
  {
    code: '46696',
    name: 'Venta al por mayor de productos intermedios y desechos de origen plástico',
    isActive: true,
  },
  {
    code: '46697',
    name: 'Venta al por mayor de tintas para imprenta, productos curtientes y materias y productos colorantes',
    isActive: true,
  },
  {
    code: '46698',
    name: 'Venta de productos intermedios y desechos de origen químico y de caucho',
    isActive: true,
  },
  {
    code: '46699',
    name: 'Venta al por mayor de productos intermedios y desechos ncp',
    isActive: true,
  },
  {
    code: '46701',
    name: 'Venta de algodón en oro',
    isActive: true,
  },
  {
    code: '46900',
    name: 'Venta al por mayor de otros productos',
    isActive: true,
  },
  {
    code: '46901',
    name: 'Venta al por mayor de cohetes y otros productos pirotécnicos',
    isActive: true,
  },
  {
    code: '46902',
    name: 'Venta al por mayor de artículos diversos para consumo humano',
    isActive: true,
  },
  {
    code: '46903',
    name: 'Venta al por mayor de armas de fuego, municiones y accesorios',
    isActive: true,
  },
  {
    code: '46904',
    name: 'Venta al por mayor de toldos y tiendas de campaña de cualquier material',
    isActive: true,
  },
  {
    code: '46905',
    name: 'Venta al por mayor de exhibidores publicitarios y rótulos',
    isActive: true,
  },
  {
    code: '46906',
    name: 'Venta al por mayor de artículos promocionales diversos',
    isActive: true,
  },
  {
    code: null,
    name: 'COMERCIO AL POR MENOR, EXCEPTO DE VEHÍCULOS AUTOMOTORES Y MOTOCICLETAS',
    isActive: true,
  },
  {
    code: '47111',
    name: 'Venta en supermercados',
    isActive: true,
  },
  {
    code: '47112',
    name: 'Venta en tiendas de artículos de primera necesidad',
    isActive: true,
  },
  {
    code: '47119',
    name: 'Almacenes (venta de diversos artículos)',
    isActive: true,
  },
  {
    code: '47120',
    name: 'Almacenes (venta de diversos artículos), y venta de vehículos automotores y motocicletas',
    isActive: true,
  },
  {
    code: '47190',
    name: 'Venta al por menor de otros productos en comercios no especializados',
    isActive: true,
  },
  {
    code: '47199',
    name: 'Venta de establecimientos no especializados con surtido compuesto principalmente de alimentos, bebidas y tabaco',
    isActive: true,
  },
  {
    code: '47211',
    name: 'Venta al por menor de frutas y hortalizas',
    isActive: true,
  },
  {
    code: '47212',
    name: 'Venta al por menor de carnes, embutidos y productos de granja',
    isActive: true,
  },
  {
    code: '47213',
    name: 'Venta al por menor de pescado y mariscos',
    isActive: true,
  },
  {
    code: '47214',
    name: 'Venta al por menor de productos lácteos',
    isActive: true,
  },
  {
    code: '47215',
    name: 'Venta al por menor de productos de panadería, repostería y galletas',
    isActive: true,
  },
  {
    code: '47216',
    name: 'Venta al por menor de huevos',
    isActive: true,
  },
  {
    code: '47217',
    name: 'Venta al por menor de carnes y productos cárnicos',
    isActive: true,
  },
  {
    code: '47218',
    name: 'Venta al por menor de granos básicos y otros',
    isActive: true,
  },
  {
    code: '47219',
    name: 'Venta al por menor de alimentos n.c.p.',
    isActive: true,
  },
  {
    code: '47221',
    name: 'Venta al por menor de hielo',
    isActive: true,
  },
  {
    code: '47223',
    name: 'Venta de bebidas no alcohólicas, para su consumo fuera del establecimiento',
    isActive: true,
  },
  {
    code: '47224',
    name: 'Venta de bebidas alcohólicas, para su consumo fuera del establecimiento',
    isActive: true,
  },
  {
    code: '47225',
    name: 'Venta de bebidas alcohólicas para su consumo dentro del establecimiento',
    isActive: true,
  },
  {
    code: '47230',
    name: 'Venta al por menor de tabaco',
    isActive: true,
  },
  {
    code: '47300',
    name: 'Venta de combustibles, lubricantes y otros (gasolineras)',
    isActive: true,
  },
  {
    code: '47411',
    name: 'Venta al por menor de computadoras y equipo periférico',
    isActive: true,
  },
  {
    code: '47412',
    name: 'Venta de equipo y accesorios de telecomunicación',
    isActive: true,
  },
  {
    code: '47420',
    name: 'Venta al por menor de equipo de audio y video',
    isActive: true,
  },
  {
    code: '47510',
    name: 'Venta al por menor de hilados, tejidos y productos textiles de mercería; confecciones para el hogar y textiles n.c.p.',
    isActive: true,
  },
  {
    code: '47521',
    name: 'Venta al por menor de productos de madera',
    isActive: true,
  },
  {
    code: '47522',
    name: 'Venta al por menor de artículos de ferretería',
    isActive: true,
  },
  {
    code: '47523',
    name: 'Venta al por menor de productos de pinturerías',
    isActive: true,
  },
  {
    code: '47524',
    name: 'Venta al por menor en vidrierías',
    isActive: true,
  },
  {
    code: '47529',
    name: 'Venta al por menor de materiales de construcción y artículos conexos',
    isActive: true,
  },
  {
    code: '47530',
    name: 'Venta al por menor de tapices, alfombras y revestimientos de paredes y pisos en comercios especializados',
    isActive: true,
  },
  {
    code: '47591',
    name: 'Venta al por menor de muebles',
    isActive: true,
  },
  {
    code: '47592',
    name: 'Venta al por menor de artículos de bazar',
    isActive: true,
  },
  {
    code: '47593',
    name: 'Venta al por menor de aparatos electrodomésticos, repuestos y accesorios',
    isActive: true,
  },
  {
    code: '47594',
    name: 'Venta al por menor de artículos eléctricos y de iluminación',
    isActive: true,
  },
  {
    code: '47598',
    name: 'Venta al por menor de instrumentos musicales',
    isActive: true,
  },
  {
    code: '47610',
    name: 'Venta al por menor de libros, periódicos y artículos de papelería en comercios especializados',
    isActive: true,
  },
  {
    code: '47620',
    name: 'Venta al por menor de discos láser, cassettes, cintas de video y otros',
    isActive: true,
  },
  {
    code: '47630',
    name: 'Venta al por menor de productos y equipos de deporte',
    isActive: true,
  },
  {
    code: '47631',
    name: 'Venta al por menor de bicicletas, accesorios y repuestos',
    isActive: true,
  },
  {
    code: '47640',
    name: 'Venta al por menor de juegos y juguetes en comercios especializados',
    isActive: true,
  },
  {
    code: '47711',
    name: 'Venta al por menor de prendas de vestir y accesorios de vestir',
    isActive: true,
  },
  {
    code: '47712',
    name: 'Venta al por menor de calzado',
    isActive: true,
  },
  {
    code: '47713',
    name: 'Venta al por menor de artículos de peletería, marroquinería y talabartería',
    isActive: true,
  },
  {
    code: '47721',
    name: 'Venta al por menor de medicamentos farmacéuticos y otros materiales y artículos de uso médico, odontológico y veterinario',
    isActive: true,
  },
  {
    code: '47722',
    name: 'Venta al por menor de productos cosméticos y de tocador',
    isActive: true,
  },
  {
    code: '47731',
    name: 'Venta al por menor de productos de joyería, bisutería, óptica, relojería',
    isActive: true,
  },
  {
    code: '47732',
    name: 'Venta al por menor de plantas, semillas, animales y artículos conexos',
    isActive: true,
  },
  {
    code: '47733',
    name: 'Venta al por menor de combustibles de uso doméstico (gas propano y gas licuado)',
    isActive: true,
  },
  {
    code: '47734',
    name: 'Venta al por menor de artesanías, artículos cerámicos y recuerdos en general',
    isActive: true,
  },
  {
    code: '47735',
    name: 'Venta al por menor de ataúdes, lápidas y cruces, trofeos, artículos religiosos en general',
    isActive: true,
  },
  {
    code: '47736',
    name: 'Venta al por menor de armas de fuego, municiones y accesorios',
    isActive: true,
  },
  {
    code: '47737',
    name: 'Venta al por menor de artículos de cohetería y pirotécnicos',
    isActive: true,
  },
  {
    code: '47738',
    name: 'Venta al por menor de artículos desechables de uso personal y doméstico (servilletas, papel higiénico, pañales, toallas sanitarias, etc.)',
    isActive: true,
  },
  {
    code: '47739',
    name: 'Venta al por menor de otros productos n.c.p.',
    isActive: true,
  },
  {
    code: '47741',
    name: 'Venta al por menor de artículos usados',
    isActive: true,
  },
  {
    code: '47742',
    name: 'Venta al por menor de textiles y confecciones usados',
    isActive: true,
  },
  {
    code: '47743',
    name: 'Venta al por menor de libros, revistas, papel y cartón usados',
    isActive: true,
  },
  {
    code: '47749',
    name: 'Venta al por menor de productos usados n.c.p.',
    isActive: true,
  },
  {
    code: '47811',
    name: 'Venta al por menor de frutas, verduras y hortalizas',
    isActive: true,
  },
  {
    code: '47814',
    name: 'Venta al por menor de productos lácteos',
    isActive: true,
  },
  {
    code: '47815',
    name: 'Venta al por menor de productos de panadería, galletas y similares',
    isActive: true,
  },
  {
    code: '47816',
    name: 'Venta al por menor de bebidas',
    isActive: true,
  },
  {
    code: '47818',
    name: 'Venta al por menor en tiendas de mercado y puestos',
    isActive: true,
  },
  {
    code: '47821',
    name: 'Venta al por menor de hilados, tejidos y productos textiles de mercería en puestos de mercados y ferias',
    isActive: true,
  },
  {
    code: '47822',
    name: 'Venta al por menor de artículos textiles excepto confecciones para el hogar en puestos de mercados y ferias',
    isActive: true,
  },
  {
    code: '47823',
    name: 'Venta al por menor de confecciones textiles para el hogar en puestos de mercados y ferias',
    isActive: true,
  },
  {
    code: '47824',
    name: 'Venta al por menor de prendas de vestir, accesorios de vestir y similares en puestos de mercados y ferias',
    isActive: true,
  },
  {
    code: '47825',
    name: 'Venta al por menor de ropa usada',
    isActive: true,
  },
  {
    code: '47826',
    name: 'Venta al por menor de calzado, artículos de marroquinería y talabartería en puestos de mercados y ferias',
    isActive: true,
  },
  {
    code: '47827',
    name: 'Venta al por menor de artículos de marroquinería y talabartería en puestos de mercados y ferias',
    isActive: true,
  },
  {
    code: '47829',
    name: 'Venta al por menor de artículos textiles ncp en puestos de mercados y ferias',
    isActive: true,
  },
  {
    code: '47891',
    name: 'Venta al por menor de animales, flores y productos conexos en puestos de feria y mercados',
    isActive: true,
  },
  {
    code: '47892',
    name: 'Venta al por menor de productos medicinales, cosméticos, de tocador y de limpieza en puestos de ferias y mercados',
    isActive: true,
  },
  {
    code: '47893',
    name: 'Venta al por menor de artículos de bazar en puestos de ferias y mercados',
    isActive: true,
  },
  {
    code: '47894',
    name: 'Venta al por menor de artículos de papel, envases, libros, revistas y conexos en puestos de feria y mercados',
    isActive: true,
  },
  {
    code: '47895',
    name: 'Venta al por menor de materiales de construcción, electrodomésticos, accesorios para autos y similares en puestos de feria y mercados',
    isActive: true,
  },
  {
    code: '47896',
    name: 'Venta al por menor de equipos accesorios para las comunicaciones en puestos de feria y mercados',
    isActive: true,
  },
  {
    code: '47899',
    name: 'Venta al por menor en puestos de ferias y mercados n.c.p.',
    isActive: true,
  },
  {
    code: '47910',
    name: 'Venta al por menor por correo o Internet',
    isActive: true,
  },
  {
    code: '47990',
    name: 'Otros tipos de venta al por menor no realizada, en almacenes, puestos de venta o mercado',
    isActive: true,
  },
  {
    code: null,
    name: 'TRANSPORTE Y ALMACENAMIENTO',
    isActive: true,
  },
  {
    code: null,
    name: 'TRANSPORTE POR VÍA TERRESTRE Y TRANSPORTE POR TUBERÍAS',
    isActive: true,
  },
  {
    code: '49110',
    name: 'Transporte interurbano de pasajeros por ferrocarril',
    isActive: true,
  },
  {
    code: '49120',
    name: 'Transporte de carga por ferrocarril',
    isActive: true,
  },
  {
    code: '49211',
    name: 'Transporte de pasajeros urbanos e interurbano mediante buses',
    isActive: true,
  },
  {
    code: '49212',
    name: 'Transporte de pasajeros interdepartamental mediante microbuses',
    isActive: true,
  },
  {
    code: '49213',
    name: 'Transporte de pasajeros urbanos e interurbano mediante microbuses',
    isActive: true,
  },
  {
    code: '49214',
    name: 'Transporte de pasajeros interdepartamental mediante buses',
    isActive: true,
  },
  {
    code: '49221',
    name: 'Transporte internacional de pasajeros',
    isActive: true,
  },
  {
    code: '49222',
    name: 'Transporte de pasajeros mediante taxis y autos con chofer',
    isActive: true,
  },
  {
    code: '49223',
    name: 'Transporte escolar',
    isActive: true,
  },
  {
    code: '49225',
    name: 'Transporte de pasajeros para excursiones',
    isActive: true,
  },
  {
    code: '49226',
    name: 'Servicios de transporte de personal',
    isActive: true,
  },
  {
    code: '49229',
    name: 'Transporte de pasajeros por vía terrestre ncp',
    isActive: true,
  },
  {
    code: '49231',
    name: 'Transporte de carga urbano',
    isActive: true,
  },
  {
    code: '49232',
    name: 'Transporte nacional de carga',
    isActive: true,
  },
  {
    code: '49233',
    name: 'Transporte de carga internacional',
    isActive: true,
  },
  {
    code: '49234',
    name: 'Servicios de mudanza',
    isActive: true,
  },
  {
    code: '49235',
    name: 'Alquiler de vehículos de carga con conductor',
    isActive: true,
  },
  {
    code: '49300',
    name: 'Transporte por oleoducto o gasoducto',
    isActive: true,
  },
  {
    code: null,
    name: 'TRANSPORTE POR VÍA ACUÁTICA',
    isActive: true,
  },
  {
    code: '50110',
    name: 'Transporte de pasajeros marítimo y de cabotaje',
    isActive: true,
  },
  {
    code: '50120',
    name: 'Transporte de carga marítimo y de cabotaje',
    isActive: true,
  },
  {
    code: '50211',
    name: 'Transporte de pasajeros por vías de navegación interiores',
    isActive: true,
  },
  {
    code: '50212',
    name: 'Alquiler de equipo de transporte de pasajeros por vías de navegación interior con conductor',
    isActive: true,
  },
  {
    code: '50220',
    name: 'Transporte de carga por vías de navegación interiores',
    isActive: true,
  },
  {
    code: null,
    name: 'TRANSPORTE POR VÍA AÉREA',
    isActive: true,
  },
  {
    code: '51100',
    name: 'Transporte aéreo de pasajeros',
    isActive: true,
  },
  {
    code: '51201',
    name: 'Transporte de carga por vía aérea',
    isActive: true,
  },
  {
    code: '51202',
    name: 'Alquiler de equipo de aerotransporte con operadores para el propósito de transportar carga',
    isActive: true,
  },
  {
    code: null,
    name: 'ALMACENAMIENTO Y ACTIVIDADES DE APOYO AL TRANSPORTE',
    isActive: true,
  },
  {
    code: '52101',
    name: 'Alquiler de instalaciones de almacenamiento en zonas francas',
    isActive: true,
  },
  {
    code: '52102',
    name: 'Alquiler de silos para conservación y almacenamiento de granos',
    isActive: true,
  },
  {
    code: '52103',
    name: 'Alquiler de instalaciones con refrigeración para almacenamiento y conservación de alimentos y otros productos',
    isActive: true,
  },
  {
    code: '52109',
    name: 'Alquiler de bodegas para almacenamiento y depósito n.c.p.',
    isActive: true,
  },
  {
    code: '52211',
    name: 'Servicio de garaje y estacionamiento',
    isActive: true,
  },
  {
    code: '52212',
    name: 'Servicios de terminales para el transporte por vía terrestre',
    isActive: true,
  },
  {
    code: '52219',
    name: 'Servicios para el transporte por vía terrestre n.c.p.',
    isActive: true,
  },
  {
    code: '52220',
    name: 'Servicios para el transporte acuático',
    isActive: true,
  },
  {
    code: '52230',
    name: 'Servicios para el transporte aéreo',
    isActive: true,
  },
  {
    code: '52240',
    name: 'Manipulación de carga',
    isActive: true,
  },
  {
    code: '52290',
    name: 'Servicios para el transporte ncp',
    isActive: true,
  },
  {
    code: '52291',
    name: 'Agencias de tramitaciones aduanales',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES POSTALES Y DE MENSAJERÍA',
    isActive: true,
  },
  {
    code: '53100',
    name: 'Servicios de correo nacional',
    isActive: true,
  },
  {
    code: '53200',
    name: 'Actividades de correo distintas a las actividades postales nacionales',
    isActive: true,
  },
  {
    code: '53201',
    name: 'Agencia privada de correo y encomiendas',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE ALOJAMIENTO Y DE SERVICIO DE COMIDAS',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE ALOJAMIENTO',
    isActive: true,
  },
  {
    code: '55101',
    name: 'Actividades de alojamiento para estancias cortas',
    isActive: true,
  },
  {
    code: '55102',
    name: 'Hoteles',
    isActive: true,
  },
  {
    code: '55200',
    name: 'Actividades de campamentos, parques de vehículos de recreo y parques de caravanas',
    isActive: true,
  },
  {
    code: '55900',
    name: 'Alojamiento n.c.p.',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE SERVICIO DE COMIDAS Y BEBIDAS',
    isActive: true,
  },
  {
    code: '56101',
    name: 'Restaurantes',
    isActive: true,
  },
  {
    code: '56106',
    name: 'Pupusería',
    isActive: true,
  },
  {
    code: '56107',
    name: 'Actividades varias de restaurantes',
    isActive: true,
  },
  {
    code: '56108',
    name: 'Comedores',
    isActive: true,
  },
  {
    code: '56109',
    name: 'Merenderos ambulantes',
    isActive: true,
  },
  {
    code: '56210',
    name: 'Preparación de comida para eventos especiales',
    isActive: true,
  },
  {
    code: '56291',
    name: 'Servicios de provisión de comidas por contrato',
    isActive: true,
  },
  {
    code: '56292',
    name: 'Servicios de concesión de cafetines y chalet en empresas e instituciones',
    isActive: true,
  },
  {
    code: '56299',
    name: 'Servicios de preparación de comidas ncp',
    isActive: true,
  },
  {
    code: '56301',
    name: 'Servicio de expendio de bebidas en salones y bares',
    isActive: true,
  },
  {
    code: '56302',
    name: 'Servicio de expendio de bebidas en puestos callejeros, mercados y ferias',
    isActive: true,
  },
  {
    code: null,
    name: 'INFORMACIÓN Y COMUNICACIONES',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE EDICIÓN',
    isActive: true,
  },
  {
    code: '58110',
    name: 'Edición de libros, folletos, partituras y otras ediciones distintas a estas',
    isActive: true,
  },
  {
    code: '58120',
    name: 'Edición de directorios y listas de correos',
    isActive: true,
  },
  {
    code: '58130',
    name: 'Edición de periódicos, revistas y otras publicaciones periódicas',
    isActive: true,
  },
  {
    code: '58190',
    name: 'Otras actividades de edición',
    isActive: true,
  },
  {
    code: '58200',
    name: 'Edición de programas informáticos (software)',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE PRODUCCIÓN DE PELÍCULAS CINEMATOGRÁFICAS, VIDEOS Y PROGRAMAS DE TELEVISIÓN, GRABACIÓN DE SONIDO Y EDICIÓN DE MÚSICA',
    isActive: true,
  },
  {
    code: '59110',
    name: 'Actividades de producción cinematográfica',
    isActive: true,
  },
  {
    code: '59120',
    name: 'Actividades de post producción de películas, videos y programas de televisión',
    isActive: true,
  },
  {
    code: '59130',
    name: 'Actividades de distribución de películas cinematográficas, videos y programas de televisión',
    isActive: true,
  },
  {
    code: '59140',
    name: 'Actividades de exhibición de películas cinematográficas y cintas de vídeo',
    isActive: true,
  },
  {
    code: '59200',
    name: 'Actividades de edición y grabación de música',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE PROGRAMACIÓN Y TRANSMISIÓN',
    isActive: true,
  },
  {
    code: '60100',
    name: 'Servicios de difusiones de radio',
    isActive: true,
  },
  {
    code: '60201',
    name: 'Actividades de programación y difusión de televisión abierta',
    isActive: true,
  },
  {
    code: '60202',
    name: 'Actividades de suscripción y difusión de televisión por cable y/o suscripción',
    isActive: true,
  },
  {
    code: '60299',
    name: 'Servicios de televisión, incluye televisión por cable',
    isActive: true,
  },
  {
    code: '60900',
    name: 'Programación y transmisión de radio y televisión',
    isActive: true,
  },
  {
    code: null,
    name: 'TELECOMUNICACIONES',
    isActive: true,
  },
  {
    code: '61101',
    name: 'Servicio de telefonía',
    isActive: true,
  },
  {
    code: '61102',
    name: 'Servicio de Internet ',
    isActive: true,
  },
  {
    code: '61103',
    name: 'Servicio de telefonía fija',
    isActive: true,
  },
  {
    code: '61109',
    name: 'Servicio de Internet n.c.p.',
    isActive: true,
  },
  {
    code: '61201',
    name: 'Servicios de telefonía celular',
    isActive: true,
  },
  {
    code: '61202',
    name: 'Servicios de Internet inalámbrico',
    isActive: true,
  },
  {
    code: '61209',
    name: 'Servicios de telecomunicaciones inalámbrico n.c.p.',
    isActive: true,
  },
  {
    code: '61301',
    name: 'Telecomunicaciones satelitales',
    isActive: true,
  },
  {
    code: '61309',
    name: 'Comunicación vía satélite n.c.p.',
    isActive: true,
  },
  {
    code: '61900',
    name: 'Actividades de telecomunicación n.c.p.',
    isActive: true,
  },
  {
    code: null,
    name: 'PROGRAMACIÓN INFORMÁTICA, CONSULTORÍA INFORMÁTICA Y ACTIVIDADES CONEXAS',
    isActive: true,
  },
  {
    code: '62010',
    name: 'Programación Informática',
    isActive: true,
  },
  {
    code: '62020',
    name: 'Consultorías y gestión de servicios informáticos',
    isActive: true,
  },
  {
    code: '62090',
    name: 'Otras actividades de tecnología de información y servicios de computadora',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE SERVICIOS DE INFORMACIÓN',
    isActive: true,
  },
  {
    code: '63110',
    name: 'Procesamiento de datos y Actividades relacionadas',
    isActive: true,
  },
  {
    code: '63120',
    name: 'Portales WEB',
    isActive: true,
  },
  {
    code: '63910',
    name: 'Servicios de Agencias de Noticias',
    isActive: true,
  },
  {
    code: '63990',
    name: 'Otros servicios de información n.c.p.',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES FINANCIERAS Y DE SEGUROS',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE SERVICIOS FINANCIEROS EXCEPTO LAS DE SEGUROS Y FONDOS DE PENSIONES',
    isActive: true,
  },
  {
    code: '64110',
    name: 'Servicios provistos por el Banco Central de El salvador',
    isActive: true,
  },
  {
    code: '64190',
    name: 'Bancos',
    isActive: true,
  },
  {
    code: '64192',
    name: 'Entidades dedicadas al envío de remesas',
    isActive: true,
  },
  {
    code: '64199',
    name: 'Otras entidades financieras',
    isActive: true,
  },
  {
    code: '64200',
    name: 'Actividades de sociedades de cartera',
    isActive: true,
  },
  {
    code: '64300',
    name: 'Fideicomisos, fondos y otras fuentes de financiamiento',
    isActive: true,
  },
  {
    code: '64910',
    name: 'Arrendamientos financieros',
    isActive: true,
  },
  {
    code: '64920',
    name: 'Asociaciones cooperativas de ahorro y crédito dedicadas a la intermediación financiera',
    isActive: true,
  },
  {
    code: '64921',
    name: 'Instituciones emisoras de tarjetas de crédito y otros',
    isActive: true,
  },
  {
    code: '64922',
    name: 'Tipos de crédito ncp',
    isActive: true,
  },
  {
    code: '64928',
    name: 'Prestamistas y casas de empeño',
    isActive: true,
  },
  {
    code: '64990',
    name: 'Actividades de servicios financieros, excepto la financiación de planes de seguros y de pensiones n.c.p.',
    isActive: true,
  },
  {
    code: null,
    name: 'SEGUROS, REASEGUROS Y FONDOS DE PENSIONES, EXCEPTO PLANES DE SEGURIDAD SOCIAL DE AFILIACIÓN OBLIGATORIA.',
    isActive: true,
  },
  {
    code: '65110',
    name: 'Planes de seguros de vida',
    isActive: true,
  },
  {
    code: '65120',
    name: 'Planes de seguro excepto de vida',
    isActive: true,
  },
  {
    code: '65199',
    name: 'Seguros generales de todo tipo',
    isActive: true,
  },
  {
    code: '65200',
    name: 'Planes se seguro',
    isActive: true,
  },
  {
    code: '65300',
    name: 'Planes de pensiones',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES AUXILIARES DE LAS ACTIVIDADES DE SERVICIOS FINANCIEROS',
    isActive: true,
  },
  {
    code: '66110',
    name: 'Administración de mercados financieros (Bolsa de Valores)',
    isActive: true,
  },
  {
    code: '66120',
    name: 'Actividades bursátiles (Corredores de Bolsa)',
    isActive: true,
  },
  {
    code: '66190',
    name: 'Actividades auxiliares de la intermediación financiera ncp',
    isActive: true,
  },
  {
    code: '66210',
    name: 'Evaluación de riesgos y daños',
    isActive: true,
  },
  {
    code: '66220',
    name: 'Actividades de agentes y corredores de seguros',
    isActive: true,
  },
  {
    code: '66290',
    name: 'Otras actividades auxiliares de seguros y fondos de pensiones',
    isActive: true,
  },
  {
    code: '66300',
    name: 'Actividades de administración de fondos',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES INMOBILIARIAS',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES INMOBILIARIAS',
    isActive: true,
  },
  {
    code: '68101',
    name: 'Servicio de alquiler y venta de lotes en cementerios',
    isActive: true,
  },
  {
    code: '68109',
    name: 'Actividades inmobiliarias realizadas con bienes propios o arrendados n.c.p.',
    isActive: true,
  },
  {
    code: '68200',
    name: 'Actividades Inmobiliarias Realizadas a Cambio de una Retribución o por Contrata',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES PROFESIONALES, CIENTÍFICAS Y TÉCNICAS',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES JURÍDICAS Y CONTABLES',
    isActive: true,
  },
  {
    code: '69100',
    name: 'Actividades jurídicas',
    isActive: true,
  },
  {
    code: '69200',
    name: 'Actividades de contabilidad, teneduría de libros y auditoría; asesoramiento en materia de impuestos',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE OFICINAS CENTRALES; ACTIVIDADES DE CONSULTORIA EN GESTIÓN EMPRESARIAL',
    isActive: true,
  },
  {
    code: '70100',
    name: 'Actividades de oficinas centrales de sociedades de cartera',
    isActive: true,
  },
  {
    code: '70200',
    name: 'Actividades de consultoría en gestión empresarial',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE ARQUITECTURA E INGENIERÍA; ENSAYOS Y ANÁLISIS TÉCNICOS',
    isActive: true,
  },
  {
    code: '71101',
    name: 'Servicios de arquitectura y planificación urbana y servicios conexos',
    isActive: true,
  },
  {
    code: '71102',
    name: 'Servicios de ingeniería',
    isActive: true,
  },
  {
    code: '71103',
    name: 'Servicios de agrimensura, topografía, cartografía, prospección y geofísica y servicios conexos',
    isActive: true,
  },
  {
    code: '71200',
    name: 'Ensayos y análisis técnicos',
    isActive: true,
  },
  {
    code: null,
    name: 'INVESTIGACIÓN CIENTÍFICA Y DESARROLLO',
    isActive: true,
  },
  {
    code: '72100',
    name: 'Investigaciones y desarrollo experimental en el campo de las ciencias naturales y la ingeniería',
    isActive: true,
  },
  {
    code: '72199',
    name: 'Investigaciones científicas',
    isActive: true,
  },
  {
    code: '72200',
    name: 'Investigaciones y desarrollo experimental en el campo de las ciencias sociales y las humanidades científica y desarrollo',
    isActive: true,
  },
  {
    code: null,
    name: 'PUBLICIDAD Y ESTUDIOS DE MERCADO',
    isActive: true,
  },
  {
    code: '73100',
    name: 'Publicidad',
    isActive: true,
  },
  {
    code: '73200',
    name: 'Investigación de mercados y realización de encuestas de opinión pública',
    isActive: true,
  },
  {
    code: null,
    name: 'OTRAS ACTIVIDADES PROFESIONALES, CIENTÍFICAS Y TÉCNICAS',
    isActive: true,
  },
  {
    code: '74100',
    name: 'Actividades de diseño especializado',
    isActive: true,
  },
  {
    code: '74200',
    name: 'Actividades de fotografía',
    isActive: true,
  },
  {
    code: '74900',
    name: 'Servicios profesionales y científicos ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES VETERINARIAS',
    isActive: true,
  },
  {
    code: '75000',
    name: 'Actividades veterinarias',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE SERVICIOS ADMINISTRATIVOS Y DE APOYO',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE ALQUILER Y ARRENDAMIENTO',
    isActive: true,
  },
  {
    code: '77101',
    name: 'Alquiler de equipo de transporte terrestre',
    isActive: true,
  },
  {
    code: '77102',
    name: 'Alquiler de equipo de transporte acuático',
    isActive: true,
  },
  {
    code: '77103',
    name: 'Alquiler de equipo de transporte por vía aérea',
    isActive: true,
  },
  {
    code: '77210',
    name: 'Alquiler y arrendamiento de equipo de recreo y deportivo',
    isActive: true,
  },
  {
    code: '77220',
    name: 'Alquiler de cintas de video y discos',
    isActive: true,
  },
  {
    code: '77290',
    name: 'Alquiler de otros efectos personales y enseres domésticos',
    isActive: true,
  },
  {
    code: '77300',
    name: 'Alquiler de maquinaria y equipo',
    isActive: true,
  },
  {
    code: '77400',
    name: 'Arrendamiento de productos de propiedad intelectual',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE EMPLEO',
    isActive: true,
  },
  {
    code: '78100',
    name: 'Obtención y dotación de personal',
    isActive: true,
  },
  {
    code: '78200',
    name: 'Actividades de las agencias de trabajo temporal',
    isActive: true,
  },
  {
    code: '78300',
    name: 'Dotación de recursos humanos y gestión; gestión de las funciones de recursos humanos',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE AGENCIAS DE VIAJES, OPERADORES TURÍSTICOS Y OTROS SERVICIOS DE RESERVA Y ACTIVIDADES CONEXAS',
    isActive: true,
  },
  {
    code: '79110',
    name: 'Actividades de agencias de viajes y organizadores de viajes; actividades de asistencia a turistas',
    isActive: true,
  },
  {
    code: '79120',
    name: 'Actividades de los operadores turísticos',
    isActive: true,
  },
  {
    code: '79900',
    name: 'Otros servicios de reservas y actividades relacionadas',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE INVESTIGACIÓN Y SEGURIDAD',
    isActive: true,
  },
  {
    code: '80100',
    name: 'Servicios de seguridad privados',
    isActive: true,
  },
  {
    code: '80201',
    name: 'Actividades de servicios de sistemas de seguridad',
    isActive: true,
  },
  {
    code: '80202',
    name: 'Actividades para la prestación de sistemas de seguridad',
    isActive: true,
  },
  {
    code: '80300',
    name: 'Actividades de investigación',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE SERVICIOS A EDIFICIOS Y PAISAJISMO',
    isActive: true,
  },
  {
    code: '81100',
    name: 'Actividades combinadas de mantenimiento de edificios e instalaciones',
    isActive: true,
  },
  {
    code: '81210',
    name: 'Limpieza general de edificios',
    isActive: true,
  },
  {
    code: '81290',
    name: 'Otras actividades combinadas de mantenimiento de edificios e instalaciones ncp',
    isActive: true,
  },
  {
    code: '81300',
    name: 'Servicio de jardinería',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES ADMINISTRATIVAS Y DE APOYO DE OFICINAS Y OTRAS ACTIVIDADES DE APOYO A LAS EMPRESAS',
    isActive: true,
  },
  {
    code: '82110',
    name: 'Servicios administrativos de oficinas',
    isActive: true,
  },
  {
    code: '82190',
    name: 'Servicio de fotocopiado y similares, excepto en imprentas',
    isActive: true,
  },
  {
    code: '82200',
    name: 'Actividades de las centrales de llamadas (call center)',
    isActive: true,
  },
  {
    code: '82300',
    name: 'Organización de convenciones y ferias de negocios',
    isActive: true,
  },
  {
    code: '82910',
    name: 'Actividades de agencias de cobro y oficinas de crédito',
    isActive: true,
  },
  {
    code: '82921',
    name: 'Servicios de envase y empaque de productos alimenticios',
    isActive: true,
  },
  {
    code: '82922',
    name: 'Servicios de envase y empaque de productos medicinales',
    isActive: true,
  },
  {
    code: '82929',
    name: 'Servicio de envase y empaque ncp',
    isActive: true,
  },
  {
    code: '82990',
    name: 'Actividades de apoyo empresariales ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'ADMINISTRACIÓN PÚBLICA Y DEFENSA; PLANES DE SEGURIDAD SOCIAL DE AFILIACIÓN OBLIGATORIA',
    isActive: true,
  },
  {
    code: null,
    name: 'ADMINISTRACIÓN PÚBLICA Y DEFENSA; PLANES DE SEGURIDAD SOCIAL DE AFILIACIÓN OBLIGATORIA',
    isActive: true,
  },
  {
    code: '84110',
    name: 'Actividades de la Administración Pública en general',
    isActive: true,
  },
  {
    code: '84111',
    name: 'Alcaldías Municipales',
    isActive: true,
  },
  {
    code: '84120',
    name: 'Regulación de las actividades de prestación de servicios sanitarios, educativos, culturales y otros servicios sociales, excepto seguridad social',
    isActive: true,
  },
  {
    code: '84130',
    name: 'Regulación y facilitación de la actividad económica',
    isActive: true,
  },
  {
    code: '84210',
    name: 'Actividades de administración y funcionamiento del Ministerio de Relaciones Exteriores',
    isActive: true,
  },
  {
    code: '84220',
    name: 'Actividades de defensa',
    isActive: true,
  },
  {
    code: '84230',
    name: 'Actividades de mantenimiento del orden público y de seguridad',
    isActive: true,
  },
  {
    code: '84300',
    name: 'Actividades de planes de seguridad social de afiliación obligatoria',
    isActive: true,
  },
  {
    code: null,
    name: 'ENSEÑANZA',
    isActive: true,
  },
  {
    code: '85101',
    name: 'Guardería educativa',
    isActive: true,
  },
  {
    code: '85102',
    name: 'Enseñanza preescolar o parvularia',
    isActive: true,
  },
  {
    code: '85103',
    name: 'Enseñanza primaria',
    isActive: true,
  },
  {
    code: '85104',
    name: 'Servicio de educación preescolar y primaria integrada',
    isActive: true,
  },
  {
    code: '85211',
    name: 'Enseñanza secundaria tercer ciclo (7°, 8° y 9°)',
    isActive: true,
  },
  {
    code: '85212',
    name: 'Enseñanza secundaria de formación general bachillerato',
    isActive: true,
  },
  {
    code: '85221',
    name: 'Enseñanza secundaria de formación técnica y profesional',
    isActive: true,
  },
  {
    code: '85222',
    name: 'Enseñanza secundaria de formación técnica y profesional integrada con enseñanza primaria',
    isActive: true,
  },
  {
    code: '85301',
    name: 'Enseñanza superior universitaria',
    isActive: true,
  },
  {
    code: '85302',
    name: 'Enseñanza superior no universitaria',
    isActive: true,
  },
  {
    code: '85303',
    name: 'Enseñanza superior integrada a educación secundaria y/o primaria',
    isActive: true,
  },
  {
    code: '85410',
    name: 'Educación deportiva y recreativa',
    isActive: true,
  },
  {
    code: '85420',
    name: 'Educación cultural',
    isActive: true,
  },
  {
    code: '85490',
    name: 'Otros tipos de enseñanza n.c.p.',
    isActive: true,
  },
  {
    code: '85499',
    name: 'Enseñanza formal',
    isActive: true,
  },
  {
    code: '85500',
    name: 'Servicios de apoyo a la enseñanza',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE ATENCIÓN A LA SALUD HUMANA Y DE ASISTENCIA SOCIAL',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE ATENCIÓN DE LA SALUD HUMANA',
    isActive: true,
  },
  {
    code: '86100',
    name: 'Actividades de hospitales',
    isActive: true,
  },
  {
    code: '86201',
    name: 'Clínicas médicas',
    isActive: true,
  },
  {
    code: '86202',
    name: 'Servicios de Odontología',
    isActive: true,
  },
  {
    code: '86203',
    name: 'Servicios médicos',
    isActive: true,
  },
  {
    code: '86901',
    name: 'Servicios de análisis y estudios de diagnóstico',
    isActive: true,
  },
  {
    code: '86902',
    name: 'Actividades de atención de la salud humana',
    isActive: true,
  },
  {
    code: '86909',
    name: 'Otros Servicio relacionados con la salud ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE ATENCIÓN DE ENFERMERÍA EN INSTITUCIONES',
    isActive: true,
  },
  {
    code: '87100',
    name: 'Residencias de ancianos con atención de enfermería',
    isActive: true,
  },
  {
    code: '87200',
    name: 'Instituciones dedicadas al tratamiento del retraso mental, problemas de salud mental y el uso indebido de sustancias nocivas',
    isActive: true,
  },
  {
    code: '87300',
    name: 'Instituciones dedicadas al cuidado de ancianos y discapacitados',
    isActive: true,
  },
  {
    code: '87900',
    name: 'Actividades de asistencia a niños y jóvenes',
    isActive: true,
  },
  {
    code: '87901',
    name: 'Otras actividades de atención en instituciones',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE ASISTENCIA SOCIAL SIN ALOJAMIENTO',
    isActive: true,
  },
  {
    code: '88100',
    name: 'Actividades de asistencia sociales sin alojamiento para ancianos y discapacitados',
    isActive: true,
  },
  {
    code: '88900',
    name: 'servicios sociales sin alojamiento ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES ARTÍSTICAS, DE ENTRETENIMIENTO Y RECREATIVAS',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES CREATIVAS ARTÍSTICAS Y DE ESPARCIMIENTO',
    isActive: true,
  },
  {
    code: '90000',
    name: 'Actividades creativas artísticas y de esparcimiento',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES BIBLIOTECAS, ARCHIVOS, MUSEOS Y OTRAS ACTIVIDADES CULTURALES',
    isActive: true,
  },
  {
    code: '91010',
    name: 'Actividades de bibliotecas y archivos',
    isActive: true,
  },
  {
    code: '91020',
    name: 'Actividades de museos y preservación de lugares y edificios históricos',
    isActive: true,
  },
  {
    code: '91030',
    name: 'Actividades de jardines botánicos, zoológicos y de reservas naturales',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE JUEGOS DE AZAR Y APUESTAS',
    isActive: true,
  },
  {
    code: '92000',
    name: 'Actividades de juegos y apuestas',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DEPORTIVAS, DE ESPARCIMIENTO Y RECREATIVAS',
    isActive: true,
  },
  {
    code: '93110',
    name: 'Gestión de instalaciones deportivas',
    isActive: true,
  },
  {
    code: '93120',
    name: 'Actividades de clubes deportivos',
    isActive: true,
  },
  {
    code: '93190',
    name: 'Otras actividades deportivas',
    isActive: true,
  },
  {
    code: '93210',
    name: 'Actividades de parques de atracciones y parques temáticos',
    isActive: true,
  },
  {
    code: '93291',
    name: 'Discotecas y salas de baile',
    isActive: true,
  },
  {
    code: '93298',
    name: 'Centros vacacionales',
    isActive: true,
  },
  {
    code: '93299',
    name: 'Actividades de esparcimiento ncp',
    isActive: true,
  },
  {
    code: null,
    name: 'OTRAS ACTIVIDADES DE SERVICIOS',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE ASOCIACIONES',
    isActive: true,
  },
  {
    code: '94110',
    name: 'Actividades de organizaciones empresariales y de empleadores',
    isActive: true,
  },
  {
    code: '94120',
    name: 'Actividades de organizaciones profesionales',
    isActive: true,
  },
  {
    code: '94200',
    name: 'Actividades de sindicatos',
    isActive: true,
  },
  {
    code: '94910',
    name: 'Actividades de organizaciones religiosas',
    isActive: true,
  },
  {
    code: '94920',
    name: 'Actividades de organizaciones políticas',
    isActive: true,
  },
  {
    code: '94990',
    name: 'Actividades de asociaciones n.c.p.',
    isActive: true,
  },
  {
    code: null,
    name: 'REPARACIÓN DE COMPUTADORAS Y DE EFECTOS PERSONALES Y ENSERES DOMÉSTICOS',
    isActive: true,
  },
  {
    code: '95110',
    name: 'Reparación de computadoras y equipo periférico',
    isActive: true,
  },
  {
    code: '95120',
    name: 'Reparación de equipo de comunicación',
    isActive: true,
  },
  {
    code: '95210',
    name: 'Reparación de aparatos electrónicos de consumo',
    isActive: true,
  },
  {
    code: '95220',
    name: 'Reparación de aparatos doméstico y equipo de hogar y jardín',
    isActive: true,
  },
  {
    code: '95230',
    name: 'Reparación de calzado y artículos de cuero',
    isActive: true,
  },
  {
    code: '95240',
    name: 'Reparación de muebles y accesorios para el hogar',
    isActive: true,
  },
  {
    code: '95291',
    name: 'Reparación de Instrumentos musicales',
    isActive: true,
  },
  {
    code: '95292',
    name: 'Servicios de cerrajería y copiado de llaves',
    isActive: true,
  },
  {
    code: '95293',
    name: 'Reparación de joyas y relojes',
    isActive: true,
  },
  {
    code: '95294',
    name: 'Reparación de bicicletas, sillas de ruedas y rodados n.c.p.',
    isActive: true,
  },
  {
    code: '95299',
    name: 'Reparaciones de enseres personales n.c.p.',
    isActive: true,
  },
  {
    code: null,
    name: 'OTRAS ACTIVIDADES DE SERVICIOS PERSONALES',
    isActive: true,
  },
  {
    code: '96010',
    name: 'Lavado y limpieza de prendas de tela y de piel, incluso la limpieza en seco',
    isActive: true,
  },
  {
    code: '96020',
    name: 'Peluquería y otros tratamientos de belleza',
    isActive: true,
  },
  {
    code: '96030',
    name: 'Pompas fúnebres y actividades conexas',
    isActive: true,
  },
  {
    code: '96091',
    name: 'Servicios de sauna y otros servicios para la estética corporal n.c.p.',
    isActive: true,
  },
  {
    code: '96092',
    name: 'Servicios n.c.p.',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE LOS HOGARES COMO EMPLEADORES, ACTIVIDADES INDIFERENCIADAS DE PRODUCCIÓN DE BIENES Y SERVICIOS DE LOS HOGARES PARA USO PROPIO',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDAD DE LOS HOGARES EN CALIDAD DE EMPLEADORES DE PERSONAL DOMESTICO',
    isActive: true,
  },
  {
    code: '97000',
    name: 'Actividad de los hogares en calidad de empleadores de personal doméstico',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES INDIFERENCIADAS DE PRODUCCIÓN DE BIENES Y SERVICIOS DE LOS HOGARES PARA USO PROPIO',
    isActive: true,
  },
  {
    code: '98100',
    name: 'Actividades indiferenciadas de producción de bienes de los hogares privados para uso propio',
    isActive: true,
  },
  {
    code: '98200',
    name: 'Actividades indiferenciadas de producción de servicios de los hogares privados para uso propio',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE ORGANIZACIONES Y ÓRGANOS EXTRATERRITORIALES',
    isActive: true,
  },
  {
    code: null,
    name: 'ACTIVIDADES DE ORGANIZACIONES Y ÓRGANOS EXTRATERRITORIALES',
    isActive: true,
  },
  {
    code: '99000',
    name: 'Actividades de organizaciones y órganos extraterritoriales',
    isActive: true,
  },
  {
    code: null,
    name: 'EMPLEADOS Y OTRAS PERSONAS NATURALES',
    isActive: true,
  },
  {
    code: null,
    name: 'EMPLEADOS Y OTRAS PERSONAS NATURALES',
    isActive: true,
  },
  {
    code: '10001',
    name: 'Empleados',
    isActive: true,
  },
  {
    code: '10002',
    name: 'Pensionado',
    isActive: true,
  },
  {
    code: '10003',
    name: 'Estudiante',
    isActive: true,
  },
  {
    code: '10004',
    name: 'Desempleado',
    isActive: true,
  },
  {
    code: '10005',
    name: 'Otros',
    isActive: true,
  },
  {
    code: '10006',
    name: 'Comerciante',
    isActive: true,
  },
];
