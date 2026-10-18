export interface DepartmentResponse {
  code: string;
  name: string;
  externalCode: string;
  municipalities: Municipality[];
}

export interface Municipality {
  code: string;
  name: string;
  externalCode: string;
  districts: District[];
}

export interface District {
  code: string;
  name: string;
  agentCode: string;
}

export const departmentData: DepartmentResponse[] = [
  {
    code: '00',
    name: 'Otro (Para extranjeros)',
    externalCode: '00',
    municipalities: [
      {
        code: '00',
        name: 'Otro (Para extranjeros)',
        districts: [
          {
            code: '00',
            name: 'Otro (Para extranjeros)',
            agentCode: '',
          },
        ],
        externalCode: '00',
      },
    ],
  },
  {
    code: '01',
    name: 'Ahuachapán',
    externalCode: '01',
    municipalities: [
      {
        code: '0101',
        name: 'Ahuachapán Centro',
        districts: [
          {
            code: '010101',
            name: 'Ahuachapán',
            agentCode: '01',
          },
          {
            code: '010102',
            name: 'Apaneca',
            agentCode: '02',
          },
          {
            code: '010104',
            name: 'Concepción de Ataco',
            agentCode: '04',
          },
          {
            code: '010111',
            name: 'Tacuba',
            agentCode: '11',
          },
        ],
        externalCode: '14',
      },
      {
        code: '0102',
        name: 'Ahuachapán Norte',
        districts: [
          {
            code: '010203',
            name: 'Atiquizaya',
            agentCode: '03',
          },
          {
            code: '010205',
            name: 'El Refugio',
            agentCode: '05',
          },
          {
            code: '010209',
            name: 'San Lorenzo',
            agentCode: '09',
          },
          {
            code: '010212',
            name: 'Turín',
            agentCode: '12',
          },
        ],
        externalCode: '13',
      },
      {
        code: '0103',
        name: 'Ahuachapán Sur',
        districts: [
          {
            code: '010306',
            name: 'Guaymango',
            agentCode: '06',
          },
          {
            code: '010307',
            name: 'Jujutla',
            agentCode: '07',
          },
          {
            code: '010308',
            name: 'San Francisco Menéndez',
            agentCode: '08',
          },
          {
            code: '010310',
            name: 'San Pedro Puxtla',
            agentCode: '10',
          },
        ],
        externalCode: '15',
      },
    ],
  },
  {
    code: '02',
    name: 'Santa Ana',
    externalCode: '02',
    municipalities: [
      {
        code: '0201',
        name: 'Santa Ana Centro',
        districts: [
          {
            code: '020110',
            name: 'Santa Ana',
            agentCode: '10',
          },
        ],
        externalCode: '15',
      },
      {
        code: '0202',
        name: 'Santa Ana Este',
        districts: [
          {
            code: '020202',
            name: 'Coatepeque',
            agentCode: '02',
          },
          {
            code: '020204',
            name: 'El Congo',
            agentCode: '04',
          },
        ],
        externalCode: '16',
      },
      {
        code: '0203',
        name: 'Santa Ana Norte',
        districts: [
          {
            code: '020306',
            name: 'Masahuat',
            agentCode: '06',
          },
          {
            code: '020307',
            name: 'Metapán',
            agentCode: '07',
          },
          {
            code: '020311',
            name: 'Santa Rosa Guachipilín',
            agentCode: '11',
          },
          {
            code: '020313',
            name: 'Texistepeque',
            agentCode: '13',
          },
        ],
        externalCode: '14',
      },
      {
        code: '0204',
        name: 'Santa Ana Oeste',
        districts: [
          {
            code: '020401',
            name: 'Candelaria de la Frontera',
            agentCode: '01',
          },
          {
            code: '020403',
            name: 'Chalchuapa',
            agentCode: '03',
          },
          {
            code: '020405',
            name: 'El Porvenir',
            agentCode: '05',
          },
          {
            code: '020408',
            name: 'San Antonio Pajonal',
            agentCode: '08',
          },
          {
            code: '020409',
            name: 'San Sebastián Salitrillo',
            agentCode: '09',
          },
          {
            code: '020412',
            name: 'Santiago de la Frontera',
            agentCode: '12',
          },
        ],
        externalCode: '17',
      },
    ],
  },
  {
    code: '03',
    name: 'Sonsonate',
    externalCode: '03',
    municipalities: [
      {
        code: '0301',
        name: 'Sonsonate Centro',
        districts: [
          {
            code: '030109',
            name: 'Nahulingo',
            agentCode: '09',
          },
          {
            code: '030111',
            name: 'San Antonio del Monte',
            agentCode: '11',
          },
          {
            code: '030114',
            name: 'Santo Domingo de Guzmán',
            agentCode: '14',
          },
          {
            code: '030115',
            name: 'Sonsonate',
            agentCode: '15',
          },
          {
            code: '030116',
            name: 'Sonzacate',
            agentCode: '16',
          },
        ],
        externalCode: '18',
      },
      {
        code: '0302',
        name: 'Sonsonate Este',
        districts: [
          {
            code: '030202',
            name: 'Armenia',
            agentCode: '02',
          },
          {
            code: '030203',
            name: 'Caluco',
            agentCode: '03',
          },
          {
            code: '030204',
            name: 'Cuisnahuat',
            agentCode: '04',
          },
          {
            code: '030205',
            name: 'Santa Isabel Ishuatán',
            agentCode: '05',
          },
          {
            code: '030206',
            name: 'Izalco',
            agentCode: '06',
          },
          {
            code: '030212',
            name: 'San Julián',
            agentCode: '12',
          },
        ],
        externalCode: '19',
      },
      {
        code: '0303',
        name: 'Sonsonate Norte',
        districts: [
          {
            code: '030307',
            name: 'Juayúa',
            agentCode: '07',
          },
          {
            code: '030308',
            name: 'Nahuizalco',
            agentCode: '08',
          },
          {
            code: '030310',
            name: 'Salcoatitán',
            agentCode: '10',
          },
          {
            code: '030313',
            name: 'Santa Catarina Masahuat',
            agentCode: '13',
          },
        ],
        externalCode: '17',
      },
      {
        code: '0304',
        name: 'Sonsonate Oeste',
        districts: [
          {
            code: '030401',
            name: 'Acajutla',
            agentCode: '01',
          },
        ],
        externalCode: '20',
      },
    ],
  },
  {
    code: '04',
    name: 'Chalatenango',
    externalCode: '04',
    municipalities: [
      {
        code: '0401',
        name: 'Chalatenango Centro',
        districts: [
          {
            code: '040101',
            name: 'Agua Caliente',
            agentCode: '01',
          },
          {
            code: '040108',
            name: 'Dulce Nombre de María',
            agentCode: '08',
          },
          {
            code: '040110',
            name: 'El Paraíso',
            agentCode: '10',
          },
          {
            code: '040113',
            name: 'La Reina',
            agentCode: '13',
          },
          {
            code: '040116',
            name: 'Nueva Concepción',
            agentCode: '16',
          },
          {
            code: '040122',
            name: 'San Fernando',
            agentCode: '22',
          },
          {
            code: '040124',
            name: 'San Francisco Morazán',
            agentCode: '24',
          },
          {
            code: '040131',
            name: 'San Rafael',
            agentCode: '31',
          },
          {
            code: '040132',
            name: 'Santa Rita',
            agentCode: '32',
          },
          {
            code: '040133',
            name: 'Tejutla',
            agentCode: '33',
          },
        ],
        externalCode: '35',
      },
      {
        code: '0402',
        name: 'Chalatenango Norte',
        districts: [
          {
            code: '040204',
            name: 'Citalá',
            agentCode: '04',
          },
          {
            code: '040212',
            name: 'La Palma',
            agentCode: '12',
          },
          {
            code: '040225',
            name: 'San Ignacio',
            agentCode: '25',
          },
        ],
        externalCode: '34',
      },
      {
        code: '0403',
        name: 'Chalatenango Sur',
        districts: [
          {
            code: '040302',
            name: 'Arcatao',
            agentCode: '02',
          },
          {
            code: '040303',
            name: 'Azacualpa',
            agentCode: '03',
          },
          {
            code: '040305',
            name: 'Comalapa',
            agentCode: '05',
          },
          {
            code: '040306',
            name: 'Concepción Quezaltepeque',
            agentCode: '06',
          },
          {
            code: '040307',
            name: 'Chalatenango',
            agentCode: '07',
          },
          {
            code: '040309',
            name: 'El Carrizal',
            agentCode: '09',
          },
          {
            code: '040311',
            name: 'La Laguna',
            agentCode: '11',
          },
          {
            code: '040314',
            name: 'Las Vueltas',
            agentCode: '14',
          },
          {
            code: '040315',
            name: 'Nombre de Jesús',
            agentCode: '15',
          },
          {
            code: '040317',
            name: 'Nueva Trinidad',
            agentCode: '17',
          },
          {
            code: '040318',
            name: 'Ojos de Agua',
            agentCode: '18',
          },
          {
            code: '040319',
            name: 'Potonico',
            agentCode: '19',
          },
          {
            code: '040320',
            name: 'San Antonio de la Cruz',
            agentCode: '20',
          },
          {
            code: '040321',
            name: 'San Antonio Los Ranchos',
            agentCode: '21',
          },
          {
            code: '040323',
            name: 'San Francisco Lempa',
            agentCode: '23',
          },
          {
            code: '040326',
            name: 'San Isidro Labrador',
            agentCode: '26',
          },
          {
            code: '040327',
            name: 'San José Cancasque / Cancasque',
            agentCode: '27',
          },
          {
            code: '040328',
            name: 'San José Las Flores / Las Flores',
            agentCode: '28',
          },
          {
            code: '040329',
            name: 'San Luis del Carmen',
            agentCode: '29',
          },
          {
            code: '040330',
            name: 'San Miguel de Mercedes',
            agentCode: '30',
          },
        ],
        externalCode: '36',
      },
    ],
  },
  {
    code: '05',
    name: 'La Libertad',
    externalCode: '05',
    municipalities: [
      {
        code: '0501',
        name: 'La Libertad Centro',
        districts: [
          {
            code: '050102',
            name: 'Ciudad Arce',
            agentCode: '02',
          },
          {
            code: '050115',
            name: 'San Juan Opico',
            agentCode: '15',
          },
        ],
        externalCode: '24',
      },
      {
        code: '0502',
        name: 'La Libertad Costa',
        districts: [
          {
            code: '050205',
            name: 'Chiltiupán',
            agentCode: '05',
          },
          {
            code: '050208',
            name: 'Jicalapa',
            agentCode: '08',
          },
          {
            code: '050209',
            name: 'La Libertad',
            agentCode: '09',
          },
          {
            code: '050218',
            name: 'Tamanique',
            agentCode: '18',
          },
          {
            code: '050220',
            name: 'Teotepeque',
            agentCode: '20',
          },
        ],
        externalCode: '27',
      },
      {
        code: '0503',
        name: 'La Libertad Este',
        districts: [
          {
            code: '050301',
            name: 'Antiguo Cuscatlán',
            agentCode: '01',
          },
          {
            code: '050306',
            name: 'Huizúcar',
            agentCode: '06',
          },
          {
            code: '050310',
            name: 'Nuevo Cuscatlán',
            agentCode: '10',
          },
          {
            code: '050314',
            name: 'San José Villanueva',
            agentCode: '14',
          },
          {
            code: '050322',
            name: 'Zaragoza',
            agentCode: '22',
          },
        ],
        externalCode: '26',
      },
      {
        code: '0504',
        name: 'La Libertad Norte',
        districts: [
          {
            code: '050412',
            name: 'Quezaltepeque',
            agentCode: '12',
          },
          {
            code: '050416',
            name: 'San Matías',
            agentCode: '16',
          },
          {
            code: '050417',
            name: 'San Pablo Tacachico',
            agentCode: '17',
          },
        ],
        externalCode: '23',
      },
      {
        code: '0505',
        name: 'La Libertad Oeste',
        districts: [
          {
            code: '050503',
            name: 'Colón',
            agentCode: '03',
          },
          {
            code: '050507',
            name: 'Jayaque',
            agentCode: '07',
          },
          {
            code: '050513',
            name: 'Sacacoyo',
            agentCode: '13',
          },
          {
            code: '050519',
            name: 'Talnique',
            agentCode: '19',
          },
          {
            code: '050521',
            name: 'Tepecoyo',
            agentCode: '21',
          },
        ],
        externalCode: '25',
      },
      {
        code: '0506',
        name: 'La Libertad Sur',
        districts: [
          {
            code: '050604',
            name: 'Comasagua',
            agentCode: '04',
          },
          {
            code: '050611',
            name: 'Santa Tecla antes: Nueva San Salvador',
            agentCode: '11',
          },
        ],
        externalCode: '28',
      },
    ],
  },
  {
    code: '06',
    name: 'San Salvador',
    externalCode: '06',
    municipalities: [
      {
        code: '0601',
        name: 'San Salvador Centro',
        districts: [
          {
            code: '060103',
            name: 'Ayutuxtepeque',
            agentCode: '03',
          },
          {
            code: '060104',
            name: 'Cuscatancingo',
            agentCode: '04',
          },
          {
            code: '060108',
            name: 'Mejicanos',
            agentCode: '08',
          },
          {
            code: '060114',
            name: 'San Salvador',
            agentCode: '14',
          },
          {
            code: '060119',
            name: 'Delgado',
            agentCode: '19',
          },
        ],
        externalCode: '23',
      },
      {
        code: '0602',
        name: 'San Salvador Este',
        districts: [
          {
            code: '060207',
            name: 'Ilopango',
            agentCode: '07',
          },
          {
            code: '060213',
            name: 'San Martín',
            agentCode: '13',
          },
          {
            code: '060217',
            name: 'Soyapango',
            agentCode: '17',
          },
          {
            code: '060218',
            name: 'Tonacatepeque',
            agentCode: '18',
          },
        ],
        externalCode: '22',
      },
      {
        code: '0603',
        name: 'San Salvador Norte',
        districts: [
          {
            code: '060301',
            name: 'Aguilares',
            agentCode: '01',
          },
          {
            code: '060305',
            name: 'El Paisnal',
            agentCode: '05',
          },
          {
            code: '060306',
            name: 'Guazapa',
            agentCode: '06',
          },
        ],
        externalCode: '20',
      },
      {
        code: '0604',
        name: 'San Salvador Oeste',
        districts: [
          {
            code: '060402',
            name: 'Apopa',
            agentCode: '02',
          },
          {
            code: '060409',
            name: 'Nejapa',
            agentCode: '09',
          },
        ],
        externalCode: '21',
      },
      {
        code: '0605',
        name: 'San Salvador Sur',
        districts: [
          {
            code: '060510',
            name: 'Panchimalco',
            agentCode: '10',
          },
          {
            code: '060511',
            name: 'Rosario de Mora',
            agentCode: '11',
          },
          {
            code: '060512',
            name: 'San Marcos',
            agentCode: '12',
          },
          {
            code: '060515',
            name: 'Santiago Texacuangos',
            agentCode: '15',
          },
          {
            code: '060516',
            name: 'Santo Tomás',
            agentCode: '16',
          },
        ],
        externalCode: '24',
      },
    ],
  },
  {
    code: '07',
    name: 'Cuscatlán',
    externalCode: '07',
    municipalities: [
      {
        code: '0701',
        name: 'Cuscatlán Norte',
        districts: [
          {
            code: '070106',
            name: 'Oratorio de Concepción',
            agentCode: '06',
          },
          {
            code: '070107',
            name: 'San Bartolomé Perulapía',
            agentCode: '07',
          },
          {
            code: '070109',
            name: 'San José Guayabal',
            agentCode: '09',
          },
          {
            code: '070110',
            name: 'San Pedro Perulapán',
            agentCode: '10',
          },
          {
            code: '070115',
            name: 'Suchitoto',
            agentCode: '15',
          },
        ],
        externalCode: '17',
      },
      {
        code: '0702',
        name: 'Cuscatlán Sur',
        districts: [
          {
            code: '070201',
            name: 'Candelaria',
            agentCode: '01',
          },
          {
            code: '070202',
            name: 'Cojutepeque',
            agentCode: '02',
          },
          {
            code: '070203',
            name: 'El Carmen',
            agentCode: '03',
          },
          {
            code: '070204',
            name: 'El Rosario',
            agentCode: '04',
          },
          {
            code: '070205',
            name: 'Monte San Juan',
            agentCode: '05',
          },
          {
            code: '070208',
            name: 'San Cristóbal',
            agentCode: '08',
          },
          {
            code: '070211',
            name: 'San Rafael Cedros',
            agentCode: '11',
          },
          {
            code: '070212',
            name: 'San Ramón',
            agentCode: '12',
          },
          {
            code: '070213',
            name: 'Santa Cruz Analquito',
            agentCode: '13',
          },
          {
            code: '070214',
            name: 'Santa Cruz Michapa',
            agentCode: '14',
          },
          {
            code: '070216',
            name: 'Tenancingo',
            agentCode: '16',
          },
        ],
        externalCode: '18',
      },
    ],
  },
  {
    code: '08',
    name: 'La Paz',
    externalCode: '08',
    municipalities: [
      {
        code: '0801',
        name: 'La Paz Centro',
        districts: [
          {
            code: '080102',
            name: 'El Rosario / Rosario de La Paz',
            agentCode: '02',
          },
          {
            code: '080103',
            name: 'Jerusalén',
            agentCode: '03',
          },
          {
            code: '080104',
            name: 'Mercedes La Ceiba',
            agentCode: '04',
          },
          {
            code: '080106',
            name: 'Paraíso de Osorio',
            agentCode: '06',
          },
          {
            code: '080107',
            name: 'San Antonio Masahuat',
            agentCode: '07',
          },
          {
            code: '080108',
            name: 'San Emigdio',
            agentCode: '08',
          },
          {
            code: '080112',
            name: 'San Juan Tepezontes',
            agentCode: '12',
          },
          {
            code: '080114',
            name: 'San Miguel Tepezontes',
            agentCode: '14',
          },
          {
            code: '080116',
            name: 'San Pedro Nonualco',
            agentCode: '16',
          },
          {
            code: '080118',
            name: 'Santa María Ostuma',
            agentCode: '18',
          },
          {
            code: '080119',
            name: 'Santiago Nonualco',
            agentCode: '19',
          },
          {
            code: '080122',
            name: 'San Luis La Herradura',
            agentCode: '22',
          },
        ],
        externalCode: '24',
      },
      {
        code: '0802',
        name: 'La Paz Este',
        districts: [
          {
            code: '080210',
            name: 'San Juan Nonualco',
            agentCode: '10',
          },
          {
            code: '080217',
            name: 'San Rafael Obrajuelo',
            agentCode: '17',
          },
          {
            code: '080221',
            name: 'Zacatecoluca',
            agentCode: '21',
          },
        ],
        externalCode: '25',
      },
      {
        code: '0803',
        name: 'La Paz Oeste',
        districts: [
          {
            code: '080301',
            name: 'Cuyultitán',
            agentCode: '01',
          },
          {
            code: '080305',
            name: 'Olocuilta',
            agentCode: '05',
          },
          {
            code: '080309',
            name: 'San Francisco Chinameca',
            agentCode: '09',
          },
          {
            code: '080311',
            name: 'San Juan Talpa',
            agentCode: '11',
          },
          {
            code: '080313',
            name: 'San Luis Talpa',
            agentCode: '13',
          },
          {
            code: '080315',
            name: 'San Pedro Masahuat',
            agentCode: '15',
          },
          {
            code: '080320',
            name: 'Tapalhuaca',
            agentCode: '20',
          },
        ],
        externalCode: '23',
      },
    ],
  },
  {
    code: '09',
    name: 'Cabañas',
    externalCode: '09',
    municipalities: [
      {
        code: '0901',
        name: 'Cabañas Este',
        districts: [
          {
            code: '090102',
            name: 'Guacotecti',
            agentCode: '02',
          },
          {
            code: '090105',
            name: 'San Isidro',
            agentCode: '05',
          },
          {
            code: '090106',
            name: 'Sensuntepeque',
            agentCode: '06',
          },
          {
            code: '090108',
            name: 'Victoria',
            agentCode: '08',
          },
          {
            code: '090109',
            name: 'Dolores / Villa Dolores',
            agentCode: '09',
          },
        ],
        externalCode: '11',
      },
      {
        code: '0902',
        name: 'Cabañas Oeste',
        districts: [
          {
            code: '090201',
            name: 'Cinquera',
            agentCode: '01',
          },
          {
            code: '090203',
            name: 'Ilobasco',
            agentCode: '03',
          },
          {
            code: '090204',
            name: 'Jutiapa',
            agentCode: '04',
          },
          {
            code: '090207',
            name: 'Tejutepeque',
            agentCode: '07',
          },
        ],
        externalCode: '10',
      },
    ],
  },
  {
    code: '10',
    name: 'San Vicente',
    externalCode: '10',
    municipalities: [
      {
        code: '1001',
        name: 'San Vicente Norte',
        districts: [
          {
            code: '100101',
            name: 'Apastepeque',
            agentCode: '01',
          },
          {
            code: '100104',
            name: 'Santa Clara',
            agentCode: '04',
          },
          {
            code: '100105',
            name: 'Santo Domingo',
            agentCode: '05',
          },
          {
            code: '100106',
            name: 'San Esteban Catarina',
            agentCode: '06',
          },
          {
            code: '100107',
            name: 'San Ildefonso',
            agentCode: '07',
          },
          {
            code: '100108',
            name: 'San Lorenzo',
            agentCode: '08',
          },
          {
            code: '100109',
            name: 'San Sebastián',
            agentCode: '09',
          },
        ],
        externalCode: '14',
      },
      {
        code: '1002',
        name: 'San Vicente Sur',
        districts: [
          {
            code: '100202',
            name: 'Guadalupe',
            agentCode: '02',
          },
          {
            code: '100203',
            name: 'San Cayetano Istepeque',
            agentCode: '03',
          },
          {
            code: '100210',
            name: 'San Vicente',
            agentCode: '10',
          },
          {
            code: '100211',
            name: 'Tecoluca',
            agentCode: '11',
          },
          {
            code: '100212',
            name: 'Tepetitán',
            agentCode: '12',
          },
          {
            code: '100213',
            name: 'Verapaz',
            agentCode: '13',
          },
        ],
        externalCode: '15',
      },
    ],
  },
  {
    code: '11',
    name: 'Usulután',
    externalCode: '11',
    municipalities: [
      {
        code: '1101',
        name: 'Usulután Este',
        districts: [
          {
            code: '110103',
            name: 'California',
            agentCode: '03',
          },
          {
            code: '110104',
            name: 'Concepción Batres',
            agentCode: '04',
          },
          {
            code: '110106',
            name: 'Ereguayquín',
            agentCode: '06',
          },
          {
            code: '110110',
            name: 'Jucuarán',
            agentCode: '10',
          },
          {
            code: '110113',
            name: 'Ozatlán',
            agentCode: '13',
          },
          {
            code: '110117',
            name: 'San Dionisio',
            agentCode: '17',
          },
          {
            code: '110118',
            name: 'Santa Elena',
            agentCode: '18',
          },
          {
            code: '110120',
            name: 'Santa María',
            agentCode: '20',
          },
          {
            code: '110122',
            name: 'Tecapán',
            agentCode: '22',
          },
          {
            code: '110123',
            name: 'Usulután',
            agentCode: '23',
          },
        ],
        externalCode: '25',
      },
      {
        code: '1102',
        name: 'Usulután Norte',
        districts: [
          {
            code: '110201',
            name: 'Alegría',
            agentCode: '01',
          },
          {
            code: '110202',
            name: 'Berlín',
            agentCode: '02',
          },
          {
            code: '110205',
            name: 'El Triunfo',
            agentCode: '05',
          },
          {
            code: '110207',
            name: 'Estanzuelas',
            agentCode: '07',
          },
          {
            code: '110209',
            name: 'Jucuapa',
            agentCode: '09',
          },
          {
            code: '110211',
            name: 'Mercedes Umaña',
            agentCode: '11',
          },
          {
            code: '110212',
            name: 'Nueva Granada',
            agentCode: '12',
          },
          {
            code: '110216',
            name: 'San Buenaventura',
            agentCode: '16',
          },
          {
            code: '110221',
            name: 'Santiago de María',
            agentCode: '21',
          },
        ],
        externalCode: '24',
      },
      {
        code: '1103',
        name: 'Usulután Oeste',
        districts: [
          {
            code: '110308',
            name: 'Jiquilisco',
            agentCode: '08',
          },
          {
            code: '110314',
            name: 'Puerto El Triunfo',
            agentCode: '14',
          },
          {
            code: '110315',
            name: 'San Agustín',
            agentCode: '15',
          },
          {
            code: '110319',
            name: 'San Francisco Javier',
            agentCode: '19',
          },
        ],
        externalCode: '26',
      },
    ],
  },
  {
    code: '12',
    name: 'San Miguel',
    externalCode: '12',
    municipalities: [
      {
        code: '1201',
        name: 'San Miguel Centro',
        districts: [
          {
            code: '120103',
            name: 'Comacarán',
            agentCode: '03',
          },
          {
            code: '120106',
            name: 'Chirilagua',
            agentCode: '06',
          },
          {
            code: '120109',
            name: 'Moncagua',
            agentCode: '09',
          },
          {
            code: '120112',
            name: 'Quelepa',
            agentCode: '12',
          },
          {
            code: '120117',
            name: 'San Miguel',
            agentCode: '17',
          },
          {
            code: '120120',
            name: 'Uluazapa',
            agentCode: '20',
          },
        ],
        externalCode: '22',
      },
      {
        code: '1202',
        name: 'San Miguel Norte',
        districts: [
          {
            code: '120201',
            name: 'Carolina',
            agentCode: '01',
          },
          {
            code: '120202',
            name: 'Ciudad Barrios',
            agentCode: '02',
          },
          {
            code: '120204',
            name: 'Chapeltique',
            agentCode: '04',
          },
          {
            code: '120211',
            name: 'Nuevo Edén de San Juan',
            agentCode: '11',
          },
          {
            code: '120213',
            name: 'San Antonio del Mosco',
            agentCode: '13',
          },
          {
            code: '120214',
            name: 'San Gerardo',
            agentCode: '14',
          },
          {
            code: '120216',
            name: 'San Luis de La Reina',
            agentCode: '16',
          },
          {
            code: '120219',
            name: 'Sesori',
            agentCode: '19',
          },
        ],
        externalCode: '21',
      },
      {
        code: '1203',
        name: 'San Miguel Oeste',
        districts: [
          {
            code: '120305',
            name: 'Chinameca',
            agentCode: '05',
          },
          {
            code: '120307',
            name: 'El Tránsito',
            agentCode: '07',
          },
          {
            code: '120308',
            name: 'Lolotique',
            agentCode: '08',
          },
          {
            code: '120310',
            name: 'Nueva Guadalupe',
            agentCode: '10',
          },
          {
            code: '120315',
            name: 'San Jorge',
            agentCode: '15',
          },
          {
            code: '120318',
            name: 'San Rafael Oriente',
            agentCode: '18',
          },
        ],
        externalCode: '23',
      },
    ],
  },
  {
    code: '13',
    name: 'Morazán',
    externalCode: '13',
    municipalities: [
      {
        code: '1301',
        name: 'Morazán Norte',
        districts: [
          {
            code: '130101',
            name: 'Arambala',
            agentCode: '01',
          },
          {
            code: '130102',
            name: 'Cacaopera',
            agentCode: '02',
          },
          {
            code: '130103',
            name: 'Corinto',
            agentCode: '03',
          },
          {
            code: '130107',
            name: 'El Rosario',
            agentCode: '07',
          },
          {
            code: '130110',
            name: 'Joateca',
            agentCode: '10',
          },
          {
            code: '130111',
            name: 'Jocoaitique',
            agentCode: '11',
          },
          {
            code: '130114',
            name: 'Meanguera',
            agentCode: '14',
          },
          {
            code: '130116',
            name: 'Perquín',
            agentCode: '16',
          },
          {
            code: '130118',
            name: 'San Fernando',
            agentCode: '18',
          },
          {
            code: '130120',
            name: 'San Isidro',
            agentCode: '20',
          },
          {
            code: '130124',
            name: 'Torola',
            agentCode: '24',
          },
        ],
        externalCode: '27',
      },
      {
        code: '1302',
        name: 'Morazán Sur',
        districts: [
          {
            code: '130204',
            name: 'Chilanga',
            agentCode: '04',
          },
          {
            code: '130205',
            name: 'Delicias de Concepción',
            agentCode: '05',
          },
          {
            code: '130206',
            name: 'El Divisadero',
            agentCode: '06',
          },
          {
            code: '130208',
            name: 'Gualococti',
            agentCode: '08',
          },
          {
            code: '130209',
            name: 'Guatajiagua',
            agentCode: '09',
          },
          {
            code: '130212',
            name: 'Jocoro',
            agentCode: '12',
          },
          {
            code: '130213',
            name: 'Lolotiquillo',
            agentCode: '13',
          },
          {
            code: '130215',
            name: 'Osicala',
            agentCode: '15',
          },
          {
            code: '130217',
            name: 'San Carlos',
            agentCode: '17',
          },
          {
            code: '130219',
            name: 'San Francisco Gotera',
            agentCode: '19',
          },
          {
            code: '130221',
            name: 'San Simón',
            agentCode: '21',
          },
          {
            code: '130222',
            name: 'Sensembra',
            agentCode: '22',
          },
          {
            code: '130223',
            name: 'Sociedad',
            agentCode: '23',
          },
          {
            code: '130225',
            name: 'Yamabal',
            agentCode: '25',
          },
          {
            code: '130226',
            name: 'Yoloaiquín',
            agentCode: '26',
          },
        ],
        externalCode: '28',
      },
    ],
  },
  {
    code: '14',
    name: 'La Unión',
    externalCode: '14',
    municipalities: [
      {
        code: '1401',
        name: 'La Unión Norte',
        districts: [
          {
            code: '140101',
            name: 'Anamorós',
            agentCode: '01',
          },
          {
            code: '140102',
            name: 'Bolívar',
            agentCode: '02',
          },
          {
            code: '140103',
            name: 'Concepción de Oriente',
            agentCode: '03',
          },
          {
            code: '140106',
            name: 'El Sauce',
            agentCode: '06',
          },
          {
            code: '140109',
            name: 'Lislique',
            agentCode: '09',
          },
          {
            code: '140111',
            name: 'Nueva Esparta',
            agentCode: '11',
          },
          {
            code: '140112',
            name: 'Pasaquina',
            agentCode: '12',
          },
          {
            code: '140113',
            name: 'Polorós',
            agentCode: '13',
          },
          {
            code: '140115',
            name: 'San José La Fuente',
            agentCode: '15',
          },
          {
            code: '140116',
            name: 'Santa Rosa de Lima',
            agentCode: '16',
          },
        ],
        externalCode: '19',
      },
      {
        code: '1402',
        name: 'La Unión Sur',
        districts: [
          {
            code: '140204',
            name: 'Conchagua',
            agentCode: '04',
          },
          {
            code: '140205',
            name: 'El Carmen',
            agentCode: '05',
          },
          {
            code: '140207',
            name: 'Intipucá',
            agentCode: '07',
          },
          {
            code: '140208',
            name: 'La Unión',
            agentCode: '08',
          },
          {
            code: '140210',
            name: 'Meanguera del Golfo',
            agentCode: '10',
          },
          {
            code: '140214',
            name: 'San Alejo',
            agentCode: '14',
          },
          {
            code: '140217',
            name: 'Yayantique',
            agentCode: '17',
          },
          {
            code: '140218',
            name: 'Yucuaiquín',
            agentCode: '18',
          },
        ],
        externalCode: '20',
      },
    ],
  },
];
