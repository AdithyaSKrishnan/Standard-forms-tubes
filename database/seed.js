require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

function seed() {
  console.log('--- Starting database seeding ---');

  // 1. Seed Admin User
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUser);

  if (!existingUser) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPass, salt);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run(adminUser, hash, 'admin');
    console.log(`✓ Admin user created: "${adminUser}" with password: "${adminPass}"`);
  } else {
    console.log(`- Admin user "${adminUser}" already exists.`);
  }

  // 2. Seed Default Settings
  const defaultSettings = [
    { key: 'company_name', value: process.env.COMPANY_NAME || 'Standard Forms & Tubes' },
    { key: 'phone_primary', value: '+91 79943 38833' },
    { key: 'phone_secondary', value: '+91 94978 81734' },
    { key: 'email', value: 'standardformsclt@gmail.com' },
    { key: 'whatsapp', value: '917994338833' },
    { key: 'address', value: 'AM Complex, 7/179 A-13, Near Cherooty Road, Lorry Stand, Calicut – 673001, Kerala' },
    { key: 'working_hours', value: 'Mon - Sat: 9:00 AM - 7:00 PM' }
  ];

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const s of defaultSettings) {
    insertSetting.run(s.key, s.value);
  }
  console.log('✓ Site settings seeded.');

  // 3. Seed Products if empty
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    console.log('Seeding initial product catalog...');
    const products = [
      // K-Flex
      {
        category_id: 'kflex',
        category_name: 'K-Flex Insulation',
        title: 'K-Flex ST Sheets',
        tag: 'Closed-cell elastomeric',
        description: 'For ducts, large flat surfaces, equipment and large-diameter pipes. Used in industrial air-conditioning & refrigeration, process lines, heating, tanks, vessels, under-deck roof insulation and floor & wall lining. Available with protective coverings and one-side self adhesive.',
        image_url: 'assets/img/kflex-tubes-sheets.jpg',
        specs: JSON.stringify({ material: 'Microcellular closed-cell nitrile rubber', temp_range: '-200 °C to +116 °C', fire_rating: 'Class "O" (BS 476 P 6 & 7)' }),
        in_stock: 1
      },
      {
        category_id: 'kflex',
        category_name: 'K-Flex Insulation',
        title: 'K-Flex ST Tubes',
        tag: 'Closed-cell elastomeric',
        description: 'Condensation control for AC & refrigeration piping and fittings — HVAC, industrial process, oil & gas, petrochemicals, low-temperature cryogenics and plumbing. Available with protective glass fabric and co-extruded polymeric covering for UV & mechanical protection.',
        image_url: 'assets/img/st-tubes.jpg',
        specs: JSON.stringify({ material: 'Closed-cell nitrile rubber', temp_range: '-200 °C to +116 °C', permeability: '> 7000' }),
        in_stock: 1
      },
      {
        category_id: 'kflex',
        category_name: 'K-Flex Insulation',
        title: 'K-Flex K-Fonik Acoustic Systems',
        tag: 'Acoustic insulation',
        description: 'Open-cell elastomeric foam for HVAC and industrial noise control: duct lining, AHU rooms, DG set enclosures, building noise control, marine & offshore. Ultra-Fresh® antimicrobial protection, clean fibre-free installation, excellent sound absorption.',
        image_url: 'assets/img/kfonik.jpg',
        specs: JSON.stringify({ material: 'Open-cell nitrile rubber', density: '140 – 180 kg/m³', fire_rating: 'Class 1 (BS 476 P 7)' }),
        in_stock: 1
      },
      {
        category_id: 'kflex',
        category_name: 'K-Flex Insulation',
        title: 'K-Flex Joint Sealing Tape',
        tag: 'Accessory',
        description: 'Self-adhesive elastomeric tape for sealing joints and seams in K-Flex sheet and tube installations.',
        image_url: 'assets/img/kflex-joint-tape.jpg',
        specs: JSON.stringify({ type: 'Self-adhesive elastomeric' }),
        in_stock: 1
      },
      {
        category_id: 'kflex',
        category_name: 'K-Flex Insulation',
        title: 'K-Flex Glue',
        tag: 'Accessory',
        description: 'Contact adhesive for K-Flex insulation. Available in 5-litre and 30-litre tins.',
        image_url: 'assets/img/kflex-glue.jpg',
        specs: JSON.stringify({ sizes: '5 L, 30 L' }),
        in_stock: 1
      },
      {
        category_id: 'kflex',
        category_name: 'K-Flex Insulation',
        title: 'Alu-Clad Tubes & Pipe Fittings',
        tag: 'Accessory',
        description: 'Aluminium-faced tubes and pre-formed fitting covers for neat, protected finishes on exposed pipework.',
        image_url: 'assets/img/kflex-alu-tubes.jpg',
        specs: JSON.stringify({ finish: 'Aluminium clad' }),
        in_stock: 1
      },

      // Supreme
      {
        category_id: 'supreme',
        category_name: 'Supreme Civil Accessories',
        title: 'Insu Board',
        tag: '1 · XPS insulation board',
        description: 'Extruded polystyrene (XPS) rigid thermal insulation board with closed-cell structure, high compressive strength, high R-value and water absorption below 1% by volume. For roofs, under-deck, external/internal/cavity walls, EIFS, cold-storage floors and underground construction.',
        image_url: 'assets/img/insuboard.jpg',
        specs: JSON.stringify({ thickness: '20, 25, 30, 50, 75, 100 mm', standard_size: '600 × 1250 mm', fire: 'DIN 4102, Class B2 & B1' }),
        in_stock: 1
      },
      {
        category_id: 'supreme',
        category_name: 'Supreme Civil Accessories',
        title: 'Insu Shield',
        tag: '2 · PEB roof insulation',
        description: 'Roof insulation with aluminium foil on both sides — a radiant barrier and vapour barrier for pre-engineered buildings, installed over purlins together with the metal roofing. Also acts as a secondary waterproof barrier.',
        image_url: 'assets/img/insushield.jpg',
        specs: JSON.stringify({ formerly: 'SIL-XL-C', temp: '-40 °C to +115 °C', thermal_conductivity: '0.0328 W/m·K' }),
        in_stock: 1
      },
      {
        category_id: 'supreme',
        category_name: 'Supreme Civil Accessories',
        title: 'Dura Backer Rod',
        tag: '3 · Joint backing',
        description: 'Closed-cell foam backer rod placed in joints before sealant — controls sealant depth and prevents three-sided adhesion.',
        image_url: 'assets/img/dura-rods.jpg',
        specs: JSON.stringify({ formerly: 'Silseal', sizes: 'Ø 6 mm to 60 mm' }),
        in_stock: 1
      },
      {
        category_id: 'supreme',
        category_name: 'Supreme Civil Accessories',
        title: 'Dura Board HD 100',
        tag: '4 · Joint filler board',
        description: 'High-density closed-cell expansion-joint filler board for concrete joints in slabs, walls, roads and structures.',
        image_url: 'assets/img/dura-board.jpg',
        specs: JSON.stringify({ formerly: 'Silflex / Capcell HD 100' }),
        in_stock: 1
      },
      {
        category_id: 'supreme',
        category_name: 'Supreme Civil Accessories',
        title: 'Dura Vapour Barrier XF',
        tag: '5 · Vapour barrier',
        description: 'Vapour barrier layer that protects insulation and structures from moisture ingress.',
        image_url: 'assets/img/dura-vapour.jpg',
        specs: JSON.stringify({ formerly: 'SIL Vapour Barrier' }),
        in_stock: 1
      },
      {
        category_id: 'supreme',
        category_name: 'Supreme Civil Accessories',
        title: 'Dura Roof Fill',
        tag: '6 · Roof profile filler',
        description: 'Profiled foam filler that closes the gaps under metal roof sheets at eaves and ridges — keeping out dust, rain, birds and insects.',
        image_url: 'assets/img/dura-roofill.jpg',
        specs: JSON.stringify({ formerly: 'SIL Roofill' }),
        in_stock: 1
      },
      {
        category_id: 'supreme',
        category_name: 'Supreme Civil Accessories',
        title: 'Insu Reflector',
        tag: '7 · Reflective insulation',
        description: 'Reflective insulation that cuts radiant heat gain under roofs and in walls.',
        image_url: 'assets/img/insu-reflector.jpg',
        specs: JSON.stringify({ type: 'Reflective thermal barrier' }),
        in_stock: 1
      },
      {
        category_id: 'supreme',
        category_name: 'Supreme Civil Accessories',
        title: 'Shuttering Mate',
        tag: '8 · Formwork accessory',
        description: 'Shuttering accessory for concrete formwork, supporting neat and consistent concrete finishes.',
        image_url: 'assets/img/shuttering-mate.jpg',
        specs: JSON.stringify({ application: 'Concrete formwork' }),
        in_stock: 1
      },
      {
        category_id: 'supreme',
        category_name: 'Supreme Civil Accessories',
        title: 'Dura Membrane',
        tag: '9 · Waterproofing membrane',
        description: 'High-performance waterproofing membrane for roofs, terraces and wet areas.',
        image_url: 'assets/img/dura-membrane.jpg',
        specs: JSON.stringify({ application: 'Roofs, terraces, wet areas' }),
        in_stock: 1
      },
      {
        category_id: 'supreme',
        category_name: 'Supreme Civil Accessories',
        title: 'Dura Protector XF',
        tag: '10 · Floor protection',
        description: 'High-strength temporary protection sheet for new flooring and tiles during construction work.',
        image_url: 'assets/img/dura-protector.jpg',
        specs: JSON.stringify({ application: 'Temporary floor protection' }),
        in_stock: 1
      },

      // Wool
      {
        category_id: 'wool',
        category_name: 'Insulation Wool',
        title: 'Polywool',
        tag: '11 · Polyester wadding',
        description: 'Polyester wadding — fibre insulation for thermal and acoustic applications.',
        image_url: 'assets/img/polywool.jpg',
        specs: JSON.stringify({ sizes: '50 mm × 1.2 × 15 m (1000 GSM), 50 mm × 1.2 × 20 m (500 GSM)' }),
        in_stock: 1
      },
      {
        category_id: 'wool',
        category_name: 'Insulation Wool',
        title: 'Polywool Board',
        tag: '11 · Polyester board',
        description: 'Rigid polyester wadding board for panels and acoustic infill.',
        image_url: 'assets/img/polywool-board.jpg',
        specs: JSON.stringify({ size: '20 mm × 6 × 4 ft', density: '2000 GSM' }),
        in_stock: 1
      },
      {
        category_id: 'wool',
        category_name: 'Insulation Wool',
        title: 'Rock Wool',
        tag: '12 · Mineral wool',
        description: 'Mineral wool slabs and rolls for thermal insulation, fire protection and acoustic absorption.',
        image_url: 'assets/img/rock-wool.jpg',
        specs: JSON.stringify({ application: 'Thermal, fire protection, acoustic' }),
        in_stock: 1
      },
      {
        category_id: 'wool',
        category_name: 'Insulation Wool',
        title: 'Ceramic Wool',
        tag: '13 · High-temperature',
        description: 'High-temperature ceramic fibre blanket for furnaces, kilns, boilers and hot process equipment.',
        image_url: 'assets/img/ceramic-wool.jpg',
        specs: JSON.stringify({ application: 'High temp process, furnaces' }),
        in_stock: 1
      },

      // HVAC
      {
        category_id: 'hvac',
        category_name: 'HVAC & Ducting',
        title: 'Insulated Flexible Duct',
        tag: '14 · Flexible duct',
        description: 'Pre-insulated flexible duct for AC supply and return connections.',
        image_url: 'assets/img/duct-insulated.jpg',
        specs: JSON.stringify({ sizes: '4", 6", 8", 10", 12", 14"', length: '7.62 m' }),
        in_stock: 1
      },
      {
        category_id: 'hvac',
        category_name: 'HVAC & Ducting',
        title: 'Uninsulated Flexible Duct',
        tag: '14 · Flexible duct',
        description: 'Lightweight flexible duct for ventilation and exhaust connections.',
        image_url: 'assets/img/duct-uninsulated.jpg',
        specs: JSON.stringify({ sizes: '4" – 14"', length: '7.62 m' }),
        in_stock: 1
      },
      {
        category_id: 'hvac',
        category_name: 'HVAC & Ducting',
        title: 'Flexible Duct Connector',
        tag: '17 · Duct connector',
        description: 'Canvas connector that isolates fan and AHU vibration from ductwork.',
        image_url: 'assets/img/duct-connector.jpg',
        specs: JSON.stringify({ sizes: '2", 4", 6"', length: '25 m' }),
        in_stock: 1
      },
      {
        category_id: 'hvac',
        category_name: 'HVAC & Ducting',
        title: 'Tapes',
        tag: '15 · Tapes',
        description: 'A full range of tapes for insulation, ducting and finishing work: black, white, aluminium foiled, double-sided, nitrile.',
        image_url: 'assets/img/sheet-alu.jpg',
        specs: JSON.stringify({ types: 'Black, White, Aluminium, Double-sided, Nitrile' }),
        in_stock: 1
      },

      // Acoustic
      {
        category_id: 'acoustic',
        category_name: 'Acoustic Solutions',
        title: 'Acoustic Wall Panels',
        tag: 'Absorption',
        description: 'Fabric-wrapped absorptive panels in a choice of colours and weaves for theatres, studios, offices and auditoriums.',
        image_url: 'assets/img/ac-wall-panels.jpg',
        specs: JSON.stringify({ finish: 'Fabric-wrapped', application: 'Theatres, studios, auditoriums' }),
        in_stock: 1
      },
      {
        category_id: 'acoustic',
        category_name: 'Acoustic Solutions',
        title: 'Acoustic Ceiling Tile',
        tag: 'Ceilings',
        description: 'Sound-absorbing ceiling tiles to control reverberation in large rooms.',
        image_url: 'assets/img/ac-ceiling-tile.jpg',
        specs: JSON.stringify({ application: 'Ceiling reverberation control' }),
        in_stock: 1
      },
      {
        category_id: 'acoustic',
        category_name: 'Acoustic Solutions',
        title: 'Acoustic Wall Diffuser',
        tag: 'Diffusion',
        description: 'Sculpted diffuser panels that scatter reflections for a natural, even sound field.',
        image_url: 'assets/img/ac-wall-diffuser.jpg',
        specs: JSON.stringify({ type: 'Quadratic residue diffuser' }),
        in_stock: 1
      },
      {
        category_id: 'acoustic',
        category_name: 'Acoustic Solutions',
        title: 'Corner Diffuser / Bass Trap',
        tag: 'Low frequency',
        description: 'Corner units that tame low-frequency build-up in home theatres and studios.',
        image_url: 'assets/img/ac-corner-diffuser.jpg',
        specs: JSON.stringify({ type: 'Low-frequency bass trap' }),
        in_stock: 1
      },

      // Civil
      {
        category_id: 'civil',
        category_name: 'Waterproofing & Civil',
        title: 'PVC Water Stopper',
        tag: 'Joints',
        description: 'PVC waterstop cast into construction and expansion joints to block water passage in basements, tanks and retaining walls.',
        image_url: 'assets/img/pvc-water-stopper.jpg',
        specs: JSON.stringify({ application: 'Basements, tanks, retaining walls' }),
        in_stock: 1
      },
      {
        category_id: 'civil',
        category_name: 'Waterproofing & Civil',
        title: 'Swellable Water Bar',
        tag: 'Joints',
        description: 'Hydrophilic strip that swells on contact with water to seal construction joints.',
        image_url: 'assets/img/swellable-water-bar.jpg',
        specs: JSON.stringify({ material: 'Hydrophilic sodium bentonite / rubber' }),
        in_stock: 1
      },
      {
        category_id: 'civil',
        category_name: 'Waterproofing & Civil',
        title: 'PVC Rungs',
        tag: 'Access',
        description: 'Corrosion-free step rungs for manholes, sumps and inspection chambers.',
        image_url: 'assets/img/pvc-rungs.jpg',
        specs: JSON.stringify({ application: 'Manholes, sumps, inspection chambers' }),
        in_stock: 1
      },
      {
        category_id: 'civil',
        category_name: 'Waterproofing & Civil',
        title: 'Non-Woven Geo Textile Fabric',
        tag: 'Ground works',
        description: 'Geotextile for separation, filtration and drainage in roads, landscaping and foundations.',
        image_url: 'assets/img/geotextile.jpg',
        specs: JSON.stringify({ application: 'Drainage, filtration, roadworks' }),
        in_stock: 1
      }
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (category_id, category_name, title, tag, description, image_url, specs, in_stock)
      VALUES (@category_id, @category_name, @title, @tag, @description, @image_url, @specs, @in_stock)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) insertProd.run(item);
    });

    insertMany(products);
    console.log(`✓ Seeded ${products.length} products.`);
  }

  // 4. Seed Projects if empty
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  if (projectCount === 0) {
    console.log('Seeding initial project gallery...');
    const projects = [
      {
        title: 'Home Theatre — Dark acoustic wall treatment with feature lighting',
        category: 'theatre',
        description: 'Dark acoustic wall treatment with feature lighting',
        image_url: 'assets/img/g-home-theatre-1.jpg'
      },
      {
        title: 'Home Theatre — Faceted diffuser walls and acoustic ceiling',
        category: 'theatre',
        description: 'Faceted diffuser walls and acoustic ceiling',
        image_url: 'assets/img/g-home-theatre-2.jpg'
      },
      {
        title: 'Home Theatre — Fabric panels and recliner seating',
        category: 'theatre',
        description: 'Fabric panels and recliner seating',
        image_url: 'assets/img/g-home-theatre-3.jpg'
      },
      {
        title: 'School Auditorium — Wall absorbers across a large seating hall',
        category: 'auditorium',
        description: 'Wall absorbers across a large seating hall',
        image_url: 'assets/img/g-school-auditorium.jpg'
      },
      {
        title: 'Air Force School Auditorium — Acoustic wall treatment',
        category: 'auditorium',
        description: 'Acoustic wall treatment',
        image_url: 'assets/img/g-airforce-auditorium.jpg'
      },
      {
        title: 'Auditorium Acoustics — Ceiling and wall treatment',
        category: 'auditorium',
        description: 'Ceiling and wall treatment',
        image_url: 'assets/img/g-auditorium-1.jpg'
      },
      {
        title: 'Conference Room — Acoustic treatment for clear speech',
        category: 'conference',
        description: 'Acoustic treatment for clear speech',
        image_url: 'assets/img/g-conference.jpg'
      },
      {
        title: 'Recording Studio — Control-room wall absorbers',
        category: 'studio',
        description: 'Control-room wall absorbers',
        image_url: 'assets/img/g-studio-1.jpg'
      },
      {
        title: 'Recording Studio — Chroma studio with acoustic ceiling',
        category: 'studio',
        description: 'Chroma studio with acoustic ceiling',
        image_url: 'assets/img/g-studio-2.jpg'
      },
      {
        title: 'Recording Studio — Treated mixing room',
        category: 'studio',
        description: 'Treated mixing room',
        image_url: 'assets/img/g-studio-3.jpg'
      },
      {
        title: 'Drums Booth — Isolated, treated drum room',
        category: 'studio',
        description: 'Isolated, treated drum room',
        image_url: 'assets/img/g-drums-booth.jpg'
      }
    ];

    const insertProj = db.prepare(`
      INSERT INTO projects (title, category, description, image_url)
      VALUES (@title, @category, @description, @image_url)
    `);

    const insertManyProj = db.transaction((items) => {
      for (const item of items) insertProj.run(item);
    });

    insertManyProj(projects);
    console.log(`✓ Seeded ${projects.length} gallery projects.`);
  }

  // 5. Seed a sample enquiry so dashboard is immediately demonstrative
  const enquiryCount = db.prepare('SELECT COUNT(*) as count FROM enquiries').get().count;
  if (enquiryCount === 0) {
    db.prepare(`
      INSERT INTO enquiries (name, phone, email, company, product, message, channel, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Muhammed Rashid',
      '+91 98460 12345',
      'rashid.mep@gmail.com',
      'Apex MEP Contractors',
      'K-Flex ST Sheets',
      'Need quotation for 40 rolls of 19mm K-Flex ST Sheets for an IT park project in Calicut.',
      'web',
      'new',
      'Customer requested rate card by tomorrow morning.'
    );
    console.log('✓ Seeded sample enquiry for dashboard testing.');
  }

  console.log('--- Database seeding completed successfully ---');
}

if (require.main === module) {
  seed();
}

module.exports = seed;
