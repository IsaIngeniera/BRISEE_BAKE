const fs = require('fs');
const path = require('path');

const srcDir = path.join('frontend', 'src', 'app', 'catalogo', 'macarrones');
const cats = [
  {
    id: 'galletas',
    name: 'Galletas',
    css: 'Galletas.module.css',
    comp: 'GalletasPage',
    isFunc: 'isGalletaProduct',
    getFunc: 'getGalletasProducts',
    isSearch: 'galleta',
    empty: 'galletas registradas. Utiliza la tarjeta "Añadir producto" para crear la primera.',
    desc: 'Crujientes, suaves y llenas de sabor artesanal para disfrutar en cualquier momento.',
    addUrl: 'galletas',
    addDesc: 'Crea una galleta nueva y agrégala al catálogo.',
    title: 'Galletas',
    imgSuffix: 'galletas',
    cssVars: `--primary-pink: #7bb5a1;\n  --secondary-pink: #b8d9cd;\n  --coral: #578878;\n  --dark-pink: #578878;\n  --soft-pink: #f2f8f6;\n  --pale-pink: #e5f1eb;`
  },
  {
    id: 'granolas',
    name: 'Granolas',
    css: 'Granolas.module.css',
    comp: 'GranolasPage',
    isFunc: 'isGranolaProduct',
    getFunc: 'getGranolaProducts',
    isSearch: 'granola',
    empty: 'granolas registradas. Utiliza la tarjeta "Añadir producto" para crear la primera.',
    desc: 'Ingredientes naturales seleccionados, frutos secos y combinaciones deliciosas para comenzar bien el día.',
    addUrl: 'granolas',
    addDesc: 'Crea una granola nueva y agrégala al catálogo.',
    title: 'Granolas',
    imgSuffix: 'granolas',
    cssVars: `--primary-pink: #c79a6d;\n  --secondary-pink: #e3d2bf;\n  --coral: #a87c51;\n  --dark-pink: #a87c51;\n  --soft-pink: #fff9f0;\n  --pale-pink: #fff3df;`
  },
  {
    id: 'linea-saludable',
    name: 'LineaSaludable',
    css: 'LineaSaludable.module.css',
    comp: 'LineaSaludablePage',
    isFunc: 'isSaludableProduct',
    getFunc: 'getSaludableProducts',
    isSearch: 'saludable',
    empty: 'productos saludables registrados. Utiliza la tarjeta "Añadir producto" para crear el primero.',
    desc: 'Opciones deliciosas pensadas para diferentes estilos de alimentación, sin perder el sabor artesanal.',
    addUrl: 'linea_saludable',
    addDesc: 'Crea un producto saludable nuevo y agrégalo al catálogo.',
    title: 'Línea Saludable',
    imgSuffix: 'linea-saludable',
    cssVars: `--primary-pink: #c28870;\n  --secondary-pink: #e3ccc3;\n  --coral: #9b6852;\n  --dark-pink: #9b6852;\n  --soft-pink: #fcf1ef;\n  --pale-pink: #f8e3df;`
  }
];

const pageSrc = fs.readFileSync(path.join(srcDir, 'page.tsx'), 'utf8');
const cssSrc = fs.readFileSync(path.join(srcDir, 'Macarrones.module.css'), 'utf8');

cats.forEach(c => {
  const targetDir = path.join('frontend', 'src', 'app', 'catalogo', c.id);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let page = pageSrc;
  page = page.replace(/Macarrones\.module\.css/g, c.css);
  page = page.replace(/isMacaronProduct/g, c.isFunc);
  page = page.replace(/macaron/g, c.isSearch);
  page = page.replace(/getMacaronProducts/g, c.getFunc);
  page = page.replace(/MacarronesPage/g, c.comp);
  page = page.replace(/<h1>Macarrones<\/h1>/g, '<h1>' + c.title + '</h1>');
  page = page.replace(/Delicados, coloridos y elaborados artesanalmente\s+para hacer especial cada momento\./g, c.desc);
  page = page.replace(/macarrones-placeholder/g, c.imgSuffix + '-placeholder');
  page = page.replace(/categoria=macarrones/g, 'categoria=' + c.addUrl);
  page = page.replace(/Crear un macarrón nuevo/g, 'Crear ' + c.name);
  page = page.replace(/Crea un macarrón nuevo y agrégalo al catálogo\./g, c.addDesc);
  page = page.replace(/Aún no hay macarrones registrados\. Utiliza la\s+tarjeta “Añadir producto” para crear el primero\./g, 'Aún no hay ' + c.empty);
  page = page.replace(/macarrón/g, c.isSearch);
  
  fs.writeFileSync(path.join(targetDir, 'page.tsx'), page);

  let css = cssSrc;
  css = css.replace(/--primary-pink: #e48abd;\s+--secondary-pink: #edaccc;\s+--coral: #f26f71;\s+--dark-pink: #d66098;\s+--soft-pink: #fff5fa;\s+--pale-pink: #fbe3f1;/g, c.cssVars);
  
  fs.writeFileSync(path.join(targetDir, c.css), css);
});
console.log("Done");
