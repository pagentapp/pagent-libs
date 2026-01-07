import React, { memo, useState, useEffect, useRef, useMemo } from 'react';
import { HyperlinkModal } from './HyperlinkModal';
import type { FormatType } from '@pagent-libs/sheets-core';

interface ToolbarProps {
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onStrikethrough?: () => void;
  onFontFamily?: (fontFamily: string) => void;
  onFontSize?: (fontSize: number) => void;
  onFontColor?: (color: string) => void;
  onBackgroundColor?: (color: string) => void;
  onBorder?: (border: 'top' | 'right' | 'bottom' | 'left' | 'all' | 'none') => void;
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignRight?: () => void;
  onVerticalAlign?: (align: 'top' | 'middle' | 'bottom') => void;
  onTextWrap?: () => void;
  onTextRotation?: (angle: number) => void;
  onFormatCurrency?: () => void;
  onFormatPercentage?: () => void;
  onFormatNumber?: () => void;
  onMergeCells?: () => void;
  onHyperlink?: (url: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  // Freeze pane controls
  onFreezeRows?: (rows: number) => void;
  onFreezeCols?: (cols: number) => void;
  onUnfreeze?: () => void;
  frozenRows?: number;
  frozenCols?: number;
  selectedFormat?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
    backgroundColor?: string;
    align?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    textWrap?: boolean;
    format?: FormatType;
    hyperlink?: string;
  };
}

export const Toolbar = memo(function Toolbar({
  onBold,
  onItalic,
  onUnderline,
  onStrikethrough,
  onFontFamily,
  onFontSize,
  onFontColor,
  onBackgroundColor,
  onBorder,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onVerticalAlign,
  onTextWrap,
  onTextRotation,
  onFormatCurrency,
  onFormatPercentage,
  onFormatNumber,
  onMergeCells,
  onHyperlink,
  onUndo,
  onRedo,
  onFreezeRows,
  onFreezeCols,
  onUnfreeze,
  frozenRows = 0,
  frozenCols = 0,
  selectedFormat,
}: ToolbarProps) {
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<'font' | 'background' | null>(null);
  const [showBorderMenu, setShowBorderMenu] = useState(false);
  const [showVerticalAlignMenu, setShowVerticalAlignMenu] = useState(false);
  const [showHyperlinkModal, setShowHyperlinkModal] = useState(false);
  const [showFreezeMenu, setShowFreezeMenu] = useState(false);
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const loadedFontsRef = useRef<Set<string>>(new Set());
  
  const hasFrozenPanes = frozenRows > 0 || frozenCols > 0;

  const Button = memo(
    ({
      onClick,
      children,
      active,
      title,
    }: {
      onClick?: () => void;
      children: React.ReactNode;
      active?: boolean;
      title?: string;
    }) => (
      <button
        onClick={onClick}
        title={title}
        style={{
          padding: '6px 10px',
          border: 'none',
          backgroundColor: active ? '#e8f0fe' : 'transparent',
          cursor: onClick ? 'pointer' : 'default',
          fontSize: '13px',
          minWidth: '32px',
          height: '32px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          color: active ? '#1a73e8' : '#5f6368',
          fontWeight: active ? 500 : 400,
          transition: 'all 0.15s ease',
        }}
        disabled={!onClick}
        onMouseEnter={(e) => {
          if (onClick && !active) {
            e.currentTarget.style.backgroundColor = '#f1f3f4';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {children}
      </button>
    )
  );

  Button.displayName = 'ToolbarButton';

  const DropdownButton = memo(
    ({
      onClick,
      children,
      active,
      title,
      showDropdown,
      onToggle,
    }: {
      onClick?: () => void;
      children: React.ReactNode;
      active?: boolean;
      title?: string;
      showDropdown?: boolean;
      onToggle?: () => void;
    }) => (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={onToggle || onClick}
          title={title}
          style={{
            padding: '6px 10px',
            border: 'none',
            backgroundColor: active || showDropdown ? '#e8f0fe' : 'transparent',
            cursor: onClick || onToggle ? 'pointer' : 'default',
            fontSize: '13px',
            minWidth: '80px',
            height: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '4px',
            borderRadius: '4px',
            color: active || showDropdown ? '#1a73e8' : '#5f6368',
            fontWeight: active ? 500 : 400,
            transition: 'all 0.15s ease',
          }}
          disabled={!onClick && !onToggle}
          onMouseEnter={(e) => {
            if ((onClick || onToggle) && !active && !showDropdown) {
              e.currentTarget.style.backgroundColor = '#f1f3f4';
            }
          }}
          onMouseLeave={(e) => {
            if (!active && !showDropdown) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {children}
          <span style={{ fontSize: '10px' }}>▼</span>
        </button>
      </div>
    )
  );

  DropdownButton.displayName = 'ToolbarDropdownButton';

  // Comprehensive list of Google Fonts
  const googleFonts = [
    // Sans-serif fonts
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro', 'Raleway', 'Poppins', 'Oswald', 'Ubuntu', 'Nunito',
    'Playfair Display', 'Merriweather', 'PT Sans', 'Roboto Condensed', 'Roboto Slab', 'Dosis', 'Cabin', 'Arimo',
    'Fira Sans', 'Noto Sans', 'Work Sans', 'Muli', 'Quicksand', 'Droid Sans', 'Titillium Web', 'Cantarell',
    'Josefin Sans', 'Libre Franklin', 'Rubik', 'Barlow', 'Hind', 'Varela Round', 'Karla', 'Comfortaa',
    'Crimson Text', 'Lora', 'PT Serif', 'Playfair Display SC', 'Libre Baskerville', 'Bitter', 'Cormorant Garamond',
    'EB Garamond', 'Lora', 'Merriweather Sans', 'Source Serif Pro', 'Abril Fatface', 'Anton', 'Bebas Neue',
    'Fjalla One', 'Righteous', 'Satisfy', 'Dancing Script', 'Pacifico', 'Shadows Into Light', 'Indie Flower',
    'Permanent Marker', 'Amatic SC', 'Caveat', 'Kalam', 'Gloria Hallelujah', 'Handlee', 'Patrick Hand',
    'Shadows Into Light Two', 'Architects Daughter', 'Coming Soon', 'Covered By Your Grace', 'Kaushan Script',
    'Lobster', 'Lobster Two', 'Marck Script', 'Satisfy', 'Yellowtail', 'Abril Fatface', 'Alfa Slab One',
    'Bangers', 'Bebas Neue', 'Bungee', 'Bungee Inline', 'Bungee Shade', 'Creepster', 'Fascinate', 'Fascinate Inline',
    'Faster One', 'Fredoka One', 'Frijole', 'Gravitas One', 'Iceberg', 'Impact', 'Irish Grover', 'Keania One',
    'Lilita One', 'Luckiest Guy', 'Monoton', 'Nosifer', 'Orbitron', 'Piedra', 'Plaster', 'Press Start 2P',
    'Ribeye', 'Ribeye Marrow', 'Russo One', 'Seymour One', 'Sigmar One', 'Stalinist One', 'Stardos Stencil',
    'Stint Ultra Condensed', 'Ultra', 'UnifrakturCook', 'UnifrakturMaguntia', 'Vast Shadow', 'Vampiro One',
    'Wallpoet', 'Wellfleet', 'Alegreya', 'Alegreya Sans', 'Alegreya SC', 'Alice', 'Alike', 'Alike Angular',
    'Allan', 'Allerta', 'Allerta Stencil', 'Amarante', 'Amaranth', 'Amethysta', 'Anaheim', 'Andada', 'Andika',
    'Angkor', 'Annie Use Your Telescope', 'Anonymous Pro', 'Antic', 'Antic Didone', 'Antic Slab', 'Anton',
    'Arapey', 'Arbutus', 'Arbutus Slab', 'Architects Daughter', 'Archivo', 'Archivo Black', 'Archivo Narrow',
    'Arimo', 'Arizonia', 'Armata', 'Artifika', 'Arvo', 'Asap', 'Asap Condensed', 'Asset', 'Astloch', 'Asul',
    'Atomic Age', 'Aubrey', 'Audiowide', 'Autour One', 'Average', 'Average Sans', 'Averia Gruesa Libre',
    'Averia Libre', 'Averia Sans Libre', 'Averia Serif Libre', 'Bad Script', 'Balthazar', 'Bangers', 'Basic',
    'Battambang', 'Baumans', 'Bayon', 'Belgrano', 'Belleza', 'BenchNine', 'Bentham', 'Berkshire Swash',
    'Bevan', 'Bigelow Rules', 'Bigshot One', 'Bilbo', 'Bilbo Swash Caps', 'Biryani', 'Bitter', 'Black Ops One',
    'Bokor', 'Bonbon', 'Boogaloo', 'Bowlby One', 'Bowlby One SC', 'Brawler', 'Bree Serif', 'Bubblegum Sans',
    'Bubbler One', 'Buda', 'Buenard', 'Butcherman', 'Butterfly Kids', 'Cabin', 'Cabin Condensed', 'Cabin Sketch',
    'Caesar Dressing', 'Cagliostro', 'Calligraffitti', 'Cambay', 'Cambo', 'Candal', 'Cantarell', 'Cantata One',
    'Cantora One', 'Capriola', 'Cardo', 'Carme', 'Carrois Gothic', 'Carrois Gothic SC', 'Carter One', 'Catamaran',
    'Caudex', 'Cedarville Cursive', 'Ceviche One', 'Changa', 'Changa One', 'Chango', 'Chau Philomene One',
    'Chela One', 'Chelsea Market', 'Chenla', 'Cherry Cream Soda', 'Cherry Swash', 'Chewy', 'Chicle', 'Chivo',
    'Chonburi', 'Cinzel', 'Cinzel Decorative', 'Clicker Script', 'Coda', 'Coda Caption', 'Codystar', 'Combo',
    'Comfortaa', 'Coming Soon', 'Concert One', 'Condiment', 'Content', 'Contrail One', 'Convergence', 'Cookie',
    'Copse', 'Corben', 'Courgette', 'Cousine', 'Coustard', 'Covered By Your Grace', 'Crafty Girls', 'Creepster',
    'Crete Round', 'Crimson Text', 'Croissant One', 'Crushed', 'Cuprum', 'Cutive', 'Cutive Mono', 'Damion',
    'Dancing Script', 'Dangrek', 'Dawning of a New Day', 'Days One', 'Dekko', 'Delius', 'Delius Swash Caps',
    'Delius Unicase', 'Della Respira', 'Denk One', 'Devonshire', 'Dhurjati', 'Didact Gothic', 'Diplomata',
    'Diplomata SC', 'Domine', 'Donegal One', 'Doppio One', 'Dorsa', 'Dosis', 'Dr Sugiyama', 'Droid Sans',
    'Droid Sans Mono', 'Droid Serif', 'Duru Sans', 'Dynalight', 'EB Garamond', 'Eagle Lake', 'Eater', 'Economica',
    'Eczar', 'Ek Mukta', 'Electrolize', 'Elsie', 'Elsie Swash Caps', 'Emblema One', 'Emilys Candy', 'Engagement',
    'Englebert', 'Enriqueta', 'Erica One', 'Esteban', 'Euphoria Script', 'Ewert', 'Exo', 'Exo 2', 'Expletus Sans',
    'Fanwood Text', 'Fascinate', 'Fascinate Inline', 'Faster One', 'Fasthand', 'Fauna One', 'Federant',
    'Federo', 'Felipa', 'Fenix', 'Finger Paint', 'Fira Mono', 'Fira Sans', 'Fjalla One', 'Fjord One', 'Flamenco',
    'Flavors', 'Fondamento', 'Fontdiner Swanky', 'Forum', 'Francois One', 'Freckle Face', 'Fredericka the Great',
    'Fredoka One', 'Freehand', 'Fresca', 'Frijole', 'Fruktur', 'Fugaz One', 'GFS Didot', 'GFS Neohellenic',
    'Gabriela', 'Gafata', 'Galdeano', 'Galindo', 'Gentium Basic', 'Gentium Book Basic', 'Geo', 'Geostar',
    'Geostar Fill', 'Germania One', 'Gidugu', 'Gilda Display', 'Give You Glory', 'Glass Antiqua', 'Glegoo',
    'Gloria Hallelujah', 'Goblin One', 'Gochi Hand', 'Gorditas', 'Goudy Bookletter 1911', 'Graduate', 'Grand Hotel',
    'Gravitas One', 'Great Vibes', 'Griffy', 'Gruppo', 'Gudea', 'Gurajada', 'Habibi', 'Halant', 'Hammersmith One',
    'Hanalei', 'Hanalei Fill', 'Handlee', 'Hanuman', 'Happy Monkey', 'Harmattan', 'Headland One', 'Henny Penny',
    'Herr Von Muellerhoff', 'Hind', 'Hind Guntur', 'Hind Madurai', 'Hind Siliguri', 'Hind Vadodara', 'Holtwood One SC',
    'Homemade Apple', 'Homenaje', 'IM Fell DW Pica', 'IM Fell DW Pica SC', 'IM Fell Double Pica', 'IM Fell Double Pica SC',
    'IM Fell English', 'IM Fell English SC', 'IM Fell French Canon', 'IM Fell French Canon SC', 'IM Fell Great Primer',
    'IM Fell Great Primer SC', 'Iceberg', 'Iceland', 'Imprima', 'Inconsolata', 'Inder', 'Indie Flower', 'Inika',
    'Inknut Antiqua', 'Irish Grover', 'Istok Web', 'Italiana', 'Itim', 'Jacques Francois', 'Jacques Francois Shadow',
    'Jaldi', 'Jim Nightshade', 'Jockey One', 'Jolly Lodger', 'Josefin Sans', 'Josefin Slab', 'Joti One', 'Judson',
    'Julee', 'Julius Sans One', 'Junge', 'Jura', 'Just Another Hand', 'Just Me Again Down Here', 'Kadwa', 'Kalam',
    'Kameron', 'Kanit', 'Kantumruy', 'Karla', 'Karma', 'Katibeh', 'Kaushan Script', 'Kavivanar', 'Kavoon',
    'Kdam Thmor', 'Keania One', 'Kelly Slab', 'Kenia', 'Khand', 'Khmer', 'Khula', 'Kite One', 'Knewave',
    'Kotta One', 'Koulen', 'Kranky', 'Kreon', 'Kristi', 'Krona One', 'Kumar One', 'Kumar One Outline', 'Kurale',
    'La Belle Aurore', 'Laila', 'Lakki Reddy', 'Lancelot', 'Lateef', 'Lato', 'League Script', 'Leckerli One',
    'Ledger', 'Lekton', 'Lemon', 'Lemonada', 'Libre Baskerville', 'Libre Franklin', 'Life Savers', 'Lilita One',
    'Lily Script One', 'Limelight', 'Linden Hill', 'Lobster', 'Lobster Two', 'Londrina Outline', 'Londrina Shadow',
    'Londrina Sketch', 'Londrina Solid', 'Lora', 'Love Ya Like A Sister', 'Loved by the King', 'Lovers Quarrel',
    'Luckiest Guy', 'Lusitana', 'Lustria', 'Macondo', 'Macondo Swash Caps', 'Magra', 'Maiden Orange', 'Mako',
    'Mallanna', 'Mandali', 'Marcellus', 'Marcellus SC', 'Marck Script', 'Margarine', 'Marko One', 'Marmelad',
    'Martel', 'Martel Sans', 'Marvel', 'Mate', 'Mate SC', 'Maven Pro', 'McLaren', 'Meddon', 'MedievalSharp',
    'Medula One', 'Megrim', 'Meie Script', 'Merienda', 'Merienda One', 'Merriweather', 'Merriweather Sans',
    'Metal', 'Metal Mania', 'Metamorphous', 'Metrophobic', 'Michroma', 'Milonga', 'Miltonian', 'Miltonian Tattoo',
    'Miniver', 'Mirza', 'Miss Fajardose', 'Modak', 'Modern Antiqua', 'Mogra', 'Molengo', 'Molle', 'Monda',
    'Monofett', 'Monoton', 'Monsieur La Doulaise', 'Montaga', 'Montez', 'Montserrat', 'Montserrat Alternates',
    'Montserrat Subrayada', 'Moul', 'Moulpali', 'Mountains of Christmas', 'Mouse Memoirs', 'Mr Bedfort',
    'Mr Dafoe', 'Mr De Haviland', 'Mrs Saint Delafield', 'Mrs Sheppards', 'Muli', 'Mystery Quest', 'NTR',
    'Neucha', 'Neuton', 'New Rocker', 'News Cycle', 'Niconne', 'Nixie One', 'Nobile', 'Nokora', 'Norican', 'Nosifer',
    'Nothing You Could Do', 'Noticia Text', 'Noto Sans', 'Noto Serif', 'Nova Cut', 'Nova Flat', 'Nova Mono',
    'Nova Oval', 'Nova Round', 'Nova Script', 'Nova Slim', 'Nova Square', 'Numans', 'Nunito', 'Odor Mean Chey',
    'Offside', 'Old Standard TT', 'Oldenburg', 'Oleo Script', 'Oleo Script Swash Caps', 'Open Sans', 'Open Sans Condensed',
    'Oranienbaum', 'Orbitron', 'Oregano', 'Orienta', 'Original Surfer', 'Oswald', 'Over the Rainbow', 'Overlock',
    'Overlock SC', 'Ovo', 'Oxygen', 'Oxygen Mono', 'PT Mono', 'PT Sans', 'PT Sans Caption', 'PT Sans Narrow',
    'PT Serif', 'PT Serif Caption', 'Pacifico', 'Palanquin', 'Palanquin Dark', 'Pangolin', 'Paprika', 'Parisienne',
    'Passero One', 'Passion One', 'Pathway Gothic One', 'Patrick Hand', 'Patrick Hand SC', 'Pattaya', 'Patua One',
    'Paytone One', 'Peddana', 'Peralta', 'Permanent Marker', 'Petit Formal Script', 'Petrona', 'Philosopher',
    'Piedra', 'Pinyon Script', 'Pirata One', 'Plaster', 'Play', 'Playball', 'Playfair Display', 'Playfair Display SC',
    'Podkova', 'Poiret One', 'Poller One', 'Poly', 'Pompiere', 'Pontano Sans', 'Poppins', 'Port Lligat Sans',
    'Port Lligat Slab', 'Pragati Narrow', 'Prata', 'Preahvihear', 'Press Start 2P', 'Princess Sofia', 'Prociono',
    'Prosto One', 'Puritan', 'Purple Purse', 'Quando', 'Quantico', 'Quattrocento', 'Quattrocento Sans', 'Questrial',
    'Quicksand', 'Quintessential', 'Qwigley', 'Racing Sans One', 'Radley', 'Rajdhani', 'Raleway', 'Raleway Dots',
    'Ramabhadra', 'Ramaraja', 'Rambla', 'Rammetto One', 'Ranchers', 'Rancho', 'Ranga', 'Rasa', 'Rationale',
    'Ravi Prakash', 'Redressed', 'Reem Kufi', 'Reenie Beanie', 'Revalia', 'Rhodium Libre', 'Ribeye', 'Ribeye Marrow',
    'Righteous', 'Risque', 'Roboto', 'Roboto Condensed', 'Roboto Mono', 'Roboto Slab', 'Rochester', 'Rock Salt',
    'Rokkitt', 'Romanesco', 'Ropa Sans', 'Rosario', 'Rosarivo', 'Rouge Script', 'Rozha One', 'Rubik', 'Rubik Mono One',
    'Ruda', 'Rufina', 'Ruge Boogie', 'Ruluko', 'Rum Raisin', 'Ruslan Display', 'Russo One', 'Ruthie', 'Rye',
    'Sacramento', 'Sahitya', 'Sail', 'Salsa', 'Sanchez', 'Sancreek', 'Sansita One', 'Sarabun', 'Sarala', 'Sarina',
    'Sarpanch', 'Satisfy', 'Scada', 'Scheherazade', 'Schoolbell', 'Seaweed Script', 'Sevillana', 'Seymour One',
    'Shadows Into Light', 'Shadows Into Light Two', 'Shanti', 'Share', 'Share Tech', 'Share Tech Mono', 'Shojumaru',
    'Short Stack', 'Shrikhand', 'Siemreap', 'Sigmar One', 'Signika', 'Signika Negative', 'Simonetta', 'Sintony',
    'Sirin Stencil', 'Six Caps', 'Skranji', 'Slabo 13px', 'Slabo 27px', 'Slackey', 'Smokum', 'Smythe', 'Sniglet',
    'Snippet', 'Snowburst One', 'Sofadi One', 'Sofia', 'Sonsie One', 'Sorts Mill Goudy', 'Source Code Pro',
    'Source Sans Pro', 'Source Serif Pro', 'Space Mono', 'Special Elite', 'Spicy Rice', 'Spinnaker', 'Spirax',
    'Squada One', 'Sree Krushnadevaraya', 'Sriracha', 'Stalemate', 'Stalinist One', 'Stardos Stencil', 'Stint Ultra Condensed',
    'Stint Ultra Expanded', 'Stoke', 'Strait', 'Sue Ellen Francisco', 'Suez One', 'Sumana', 'Sunshiney', 'Supermercado One',
    'Sura', 'Suranna', 'Suravaram', 'Suwannaphum', 'Swanky and Moo Moo', 'Syncopate', 'Tangerine', 'Taprom', 'Tauri',
    'Taviraj', 'Teko', 'Telex', 'Tenor Sans', 'Text Me One', 'The Girl Next Door', 'Tienne', 'Tillana', 'Timmana',
    'Tinos', 'Titan One', 'Titillium Web', 'Trade Winds', 'Trirong', 'Trocchi', 'Trochut', 'Trykker', 'Tulpen One',
    'Ubuntu', 'Ubuntu Condensed', 'Ubuntu Mono', 'Ultra', 'Uncial Antiqua', 'Underdog', 'Unica One', 'UnifrakturCook',
    'UnifrakturMaguntia', 'Unkempt', 'Unlock', 'Unna', 'VT323', 'Vampiro One', 'Varela', 'Varela Round', 'Vast Shadow',
    'Vesper Libre', 'Vibur', 'Vidaloka', 'Viga', 'Voces', 'Volkhov', 'Vollkorn', 'Voltaire', 'Waiting for the Sunrise',
    'Wallpoet', 'Walter Turncoat', 'Warnes', 'Wellfleet', 'Wendy One', 'Wire One', 'Work Sans', 'Yanone Kaffeesatz',
    'Yantramanav', 'Yatra One', 'Yellowtail', 'Yeseva One', 'Yesteryear', 'Yrsa', 'Zeyada', 'Zilla Slab'
  ];

  // Filter fonts based on search query
  const filteredFonts = useMemo(() => 
    googleFonts.filter(font =>
      font.toLowerCase().includes(fontSearchQuery.toLowerCase())
    ),
    [fontSearchQuery]
  );

  // Dynamically load Google Fonts on demand
  useEffect(() => {
    if (!showFontDropdown) return;

    const loadGoogleFontsBatch = (fontFamilies: string[]) => {
      // Filter out already loaded fonts
      const fontsToLoad = fontFamilies.filter(font => {
        if (loadedFontsRef.current.has(font)) return false;
        const existingLink = document.querySelector(`link[data-font="${font}"]`);
        if (existingLink) {
          loadedFontsRef.current.add(font);
          return false;
        }
        return true;
      });

      if (fontsToLoad.length === 0) return;

      // Load fonts in batches of 10 (Google Fonts API limit is around 30 per request)
      const batchSize = 10;
      for (let i = 0; i < fontsToLoad.length; i += batchSize) {
        const batch = fontsToLoad.slice(i, i + batchSize);
        const fontNames = batch.map(font => font.replace(/\s+/g, '+')).join('&family=');
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontNames}:wght@400&display=swap`;
        link.setAttribute('data-fonts', batch.join(','));
        document.head.appendChild(link);
        
        batch.forEach(font => loadedFontsRef.current.add(font));
      }
    };

    // Load fonts that are currently visible (first 50 for performance)
    const fontsToLoad = filteredFonts.slice(0, 50);
    loadGoogleFontsBatch(fontsToLoad);
  }, [showFontDropdown, filteredFonts]);
  const commonFontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
  const commonColors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
    '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
    '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130',
  ];

  return (
    <div
      className="toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '6px 12px',
        borderBottom: '1px solid #e8eaed',
        backgroundColor: '#ffffff',
        flexWrap: 'wrap',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        position: 'relative',
      }}
    >
      {/* Undo/Redo */}
      <div style={{ display: 'flex', gap: '2px', marginRight: '4px' }}>
        <Button onClick={onUndo} title="Undo (Ctrl+Z)">
          ↶
        </Button>
        <Button onClick={onRedo} title="Redo (Ctrl+Y)">
          ↷
        </Button>
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e8eaed', margin: '0 6px' }} />

      {/* Font Family */}
      <div style={{ position: 'relative', marginRight: '4px' }}>
        <DropdownButton
          title="Font Family"
          active={!!selectedFormat?.fontFamily}
          showDropdown={showFontDropdown}
          onToggle={() => setShowFontDropdown(!showFontDropdown)}
        >
          <span>{selectedFormat?.fontFamily || 'Arial'}</span>
        </DropdownButton>
        {showFontDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #e8eaed',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              maxHeight: '400px',
              overflowY: 'auto',
              minWidth: '250px',
              marginTop: '4px',
            }}
            onMouseLeave={() => {
              setShowFontDropdown(false);
              setFontSearchQuery('');
            }}
          >
            {/* Search input */}
            <div style={{ padding: '8px', borderBottom: '1px solid #e8eaed' }}>
              <input
                type="text"
                placeholder="Search fonts..."
                value={fontSearchQuery}
                onChange={(e) => setFontSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #e8eaed',
                  borderRadius: '4px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />
            </div>
            {filteredFonts.length === 0 ? (
              <div style={{ padding: '12px', color: '#5f6368', fontSize: '13px', textAlign: 'center' }}>
                No fonts found
              </div>
            ) : (
              filteredFonts.map((font, index) => (
              <div
                key={`${font}-${index}`}
                onClick={() => {
                  onFontFamily?.(font);
                  setShowFontDropdown(false);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: `"${font}", sans-serif`,
                  backgroundColor: selectedFormat?.fontFamily === font ? '#e8f0fe' : 'transparent',
                  color: selectedFormat?.fontFamily === font ? '#1a73e8' : '#202124',
                }}
                onMouseEnter={(e) => {
                  if (selectedFormat?.fontFamily !== font) {
                    e.currentTarget.style.backgroundColor = '#f1f3f4';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedFormat?.fontFamily !== font) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {font}
              </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Font Size */}
      <div style={{ position: 'relative', marginRight: '4px' }}>
        <DropdownButton
          title="Font Size"
          active={!!selectedFormat?.fontSize}
          showDropdown={showFontSizeDropdown}
          onToggle={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
        >
          <span>{selectedFormat?.fontSize || 11}</span>
        </DropdownButton>
        {showFontSizeDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #e8eaed',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              maxHeight: '200px',
              overflowY: 'auto',
              minWidth: '80px',
              marginTop: '4px',
            }}
            onMouseLeave={() => setShowFontSizeDropdown(false)}
          >
            {commonFontSizes.map((size) => (
              <div
                key={size}
                onClick={() => {
                  onFontSize?.(size);
                  setShowFontSizeDropdown(false);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  backgroundColor: selectedFormat?.fontSize === size ? '#e8f0fe' : 'transparent',
                  color: selectedFormat?.fontSize === size ? '#1a73e8' : '#202124',
                }}
                onMouseEnter={(e) => {
                  if (selectedFormat?.fontSize !== size) {
                    e.currentTarget.style.backgroundColor = '#f1f3f4';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedFormat?.fontSize !== size) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {size}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e8eaed', margin: '0 6px' }} />

      {/* Text Formatting */}
      <div style={{ display: 'flex', gap: '2px', marginRight: '4px' }}>
        <Button onClick={onBold} active={selectedFormat?.bold} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </Button>
        <Button onClick={onItalic} active={selectedFormat?.italic} title="Italic (Ctrl+I)">
          <em>I</em>
        </Button>
        <Button onClick={onUnderline} active={selectedFormat?.underline} title="Underline (Ctrl+U)">
          <u>U</u>
        </Button>
        <Button onClick={onStrikethrough} active={selectedFormat?.strikethrough} title="Strikethrough">
          <span style={{ textDecoration: 'line-through' }}>S</span>
        </Button>
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e8eaed', margin: '0 6px' }} />

      {/* Font Color */}
      <div style={{ position: 'relative', marginRight: '4px' }}>
        <button
          onClick={() => setShowColorPicker(showColorPicker === 'font' ? null : 'font')}
          title="Font Color"
          style={{
            padding: '6px 10px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '20px',
            minWidth: '32px',
            height: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            color: selectedFormat?.fontColor || '#5f6368',
            transition: 'all 0.15s ease',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f3f4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          A
          <span
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '16px',
              height: '3px',
              backgroundColor: selectedFormat?.fontColor || '#000000',
              borderRadius: '2px',
            }}
          />
        </button>
        {showColorPicker === 'font' && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #e8eaed',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              padding: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: '4px',
              width: '240px',
              marginTop: '4px',
            }}
            onMouseLeave={() => setShowColorPicker(null)}
          >
            {commonColors.map((color) => (
              <div
                key={color}
                onClick={() => {
                  onFontColor?.(color);
                  setShowColorPicker(null);
                }}
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: color,
                  border: '1px solid #e8eaed',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
                title={color}
              />
            ))}
            <input
              type="color"
              onChange={(e) => {
                onFontColor?.(e.target.value);
                setShowColorPicker(null);
              }}
              style={{
                gridColumn: '1 / -1',
                width: '100%',
                height: '32px',
                border: '1px solid #e8eaed',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
          </div>
        )}
      </div>

      {/* Background Color */}
      <div style={{ position: 'relative', marginRight: '4px' }}>
        <button
          onClick={() => setShowColorPicker(showColorPicker === 'background' ? null : 'background')}
          title="Background Color"
          style={{
            padding: '6px 10px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '20px',
            minWidth: '32px',
            height: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'all 0.15s ease',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f3f4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span
            style={{
              fontSize: '16px',
              display: 'inline-block',
              width: '20px',
              height: '20px',
              backgroundColor: selectedFormat?.backgroundColor || '#ffffff',
              border: '2px solid #5f6368',
              borderRadius: '2px',
            }}
          />
        </button>
        {showColorPicker === 'background' && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #e8eaed',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              padding: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: '4px',
              width: '240px',
              marginTop: '4px',
            }}
            onMouseLeave={() => setShowColorPicker(null)}
          >
            {commonColors.map((color) => (
              <div
                key={color}
                onClick={() => {
                  onBackgroundColor?.(color);
                  setShowColorPicker(null);
                }}
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: color,
                  border: '1px solid #e8eaed',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
                title={color}
              />
            ))}
            <input
              type="color"
              onChange={(e) => {
                onBackgroundColor?.(e.target.value);
                setShowColorPicker(null);
              }}
              style={{
                gridColumn: '1 / -1',
                width: '100%',
                height: '32px',
                border: '1px solid #e8eaed',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
          </div>
        )}
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e8eaed', margin: '0 6px' }} />

      {/* Borders */}
      <div style={{ position: 'relative', marginRight: '4px' }}>
        <button
          onClick={() => setShowBorderMenu(!showBorderMenu)}
          title="Borders"
          style={{
            padding: '6px 10px',
            border: 'none',
            backgroundColor: showBorderMenu ? '#e8f0fe' : 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            minWidth: '32px',
            height: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            color: showBorderMenu ? '#1a73e8' : '#5f6368',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!showBorderMenu) {
              e.currentTarget.style.backgroundColor = '#f1f3f4';
            }
          }}
          onMouseLeave={(e) => {
            if (!showBorderMenu) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          ⧉
        </button>
        {showBorderMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #e8eaed',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              padding: '8px',
              marginTop: '4px',
              minWidth: '120px',
            }}
            onMouseLeave={() => setShowBorderMenu(false)}
          >
            {(['all', 'top', 'right', 'bottom', 'left', 'none'] as const).map((border) => (
              <div
                key={border}
                onClick={() => {
                  onBorder?.(border);
                  setShowBorderMenu(false);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textTransform: 'capitalize',
                  backgroundColor: 'transparent',
                  color: '#202124',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f3f4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {border === 'all' ? 'All Borders' : border === 'none' ? 'No Border' : `${border} Border`}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alignment */}
      <div style={{ display: 'flex', gap: '2px', marginRight: '4px' }}>
        <Button onClick={onAlignLeft} active={selectedFormat?.align === 'left'} title="Align Left">
          ⬅
        </Button>
        <Button onClick={onAlignCenter} active={selectedFormat?.align === 'center'} title="Align Center">
          ⬌
        </Button>
        <Button onClick={onAlignRight} active={selectedFormat?.align === 'right'} title="Align Right">
          ➡
        </Button>
      </div>

      {/* Vertical Alignment */}
      <div style={{ position: 'relative', marginRight: '4px' }}>
        <button
          onClick={() => setShowVerticalAlignMenu(!showVerticalAlignMenu)}
          title="Vertical Alignment"
          style={{
            padding: '6px 10px',
            border: 'none',
            backgroundColor: showVerticalAlignMenu ? '#e8f0fe' : 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            minWidth: '32px',
            height: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            color: showVerticalAlignMenu ? '#1a73e8' : '#5f6368',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!showVerticalAlignMenu) {
              e.currentTarget.style.backgroundColor = '#f1f3f4';
            }
          }}
          onMouseLeave={(e) => {
            if (!showVerticalAlignMenu) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          ⬍
        </button>
        {showVerticalAlignMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #e8eaed',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              padding: '8px',
              marginTop: '4px',
              minWidth: '120px',
            }}
            onMouseLeave={() => setShowVerticalAlignMenu(false)}
          >
            {(['top', 'middle', 'bottom'] as const).map((align) => (
              <div
                key={align}
                onClick={() => {
                  onVerticalAlign?.(align);
                  setShowVerticalAlignMenu(false);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textTransform: 'capitalize',
                  backgroundColor: selectedFormat?.verticalAlign === align ? '#e8f0fe' : 'transparent',
                  color: selectedFormat?.verticalAlign === align ? '#1a73e8' : '#202124',
                }}
                onMouseEnter={(e) => {
                  if (selectedFormat?.verticalAlign !== align) {
                    e.currentTarget.style.backgroundColor = '#f1f3f4';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedFormat?.verticalAlign !== align) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {align}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Text Wrap */}
      <Button onClick={onTextWrap} active={selectedFormat?.textWrap} title="Text Wrap">
        ↲
      </Button>

      {/* Text Rotation */}
      <div style={{ position: 'relative', marginRight: '4px' }}>
        <button
          onClick={() => {
            const currentAngle = 0; // TODO: Get from selectedFormat
            onTextRotation?.(currentAngle === 0 ? 45 : currentAngle === 45 ? 90 : 0);
          }}
          title="Text Rotation"
          style={{
            padding: '6px 10px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            minWidth: '32px',
            height: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            color: '#5f6368',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f3f4';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ↻
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e8eaed', margin: '0 6px' }} />

      {/* Number Formatting */}
      <div style={{ display: 'flex', gap: '2px', marginRight: '4px' }}>
        <Button onClick={onFormatCurrency} active={selectedFormat?.format === 'currency'} title="Currency Format">
          $
        </Button>
        <Button onClick={onFormatPercentage} active={selectedFormat?.format === 'percentage'} title="Percentage Format">
          %
        </Button>
        <Button onClick={onFormatNumber} active={selectedFormat?.format === 'number'} title="Number Format">
          123
        </Button>
      </div>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e8eaed', margin: '0 6px' }} />

      {/* Merge Cells */}
      <Button onClick={onMergeCells} title="Merge Cells">
        ⧉
      </Button>

      {/* Hyperlink */}
      <Button
        onClick={() => setShowHyperlinkModal(true)}
        active={!!selectedFormat?.hyperlink}
        title="Insert Hyperlink"
      >
        🔗
      </Button>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e8eaed', margin: '0 6px' }} />

      {/* Freeze Panes */}
      <div style={{ position: 'relative', marginRight: '4px' }}>
        <button
          onClick={() => setShowFreezeMenu(!showFreezeMenu)}
          title="Freeze Panes"
          style={{
            padding: '6px 10px',
            border: 'none',
            backgroundColor: showFreezeMenu || hasFrozenPanes ? '#e8f0fe' : 'transparent',
            cursor: 'pointer',
            fontSize: '12px',
            minWidth: '64px',
            height: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            borderRadius: '4px',
            color: showFreezeMenu || hasFrozenPanes ? '#1a73e8' : '#5f6368',
            fontWeight: hasFrozenPanes ? 500 : 400,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!showFreezeMenu && !hasFrozenPanes) {
              e.currentTarget.style.backgroundColor = '#f1f3f4';
            }
          }}
          onMouseLeave={(e) => {
            if (!showFreezeMenu && !hasFrozenPanes) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          ❄️ View
          <span style={{ fontSize: '10px' }}>▼</span>
        </button>
        {showFreezeMenu && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #e8eaed',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              padding: '4px 0',
              marginTop: '4px',
              minWidth: '180px',
            }}
            onMouseLeave={() => setShowFreezeMenu(false)}
          >
            <div style={{ padding: '4px 12px', color: '#5f6368', fontSize: '11px', fontWeight: 500 }}>
              Freeze Panes
            </div>
            
            <div
              onClick={() => {
                onFreezeRows?.(1);
                setShowFreezeMenu(false);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                backgroundColor: frozenRows === 1 && frozenCols === 0 ? '#e8f0fe' : 'transparent',
                color: frozenRows === 1 && frozenCols === 0 ? '#1a73e8' : '#202124',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!(frozenRows === 1 && frozenCols === 0)) {
                  e.currentTarget.style.backgroundColor = '#f1f3f4';
                }
              }}
              onMouseLeave={(e) => {
                if (!(frozenRows === 1 && frozenCols === 0)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>━</span>
              Freeze Top Row
            </div>
            
            <div
              onClick={() => {
                onFreezeCols?.(1);
                setShowFreezeMenu(false);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                backgroundColor: frozenCols === 1 && frozenRows === 0 ? '#e8f0fe' : 'transparent',
                color: frozenCols === 1 && frozenRows === 0 ? '#1a73e8' : '#202124',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!(frozenCols === 1 && frozenRows === 0)) {
                  e.currentTarget.style.backgroundColor = '#f1f3f4';
                }
              }}
              onMouseLeave={(e) => {
                if (!(frozenCols === 1 && frozenRows === 0)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>┃</span>
              Freeze First Column
            </div>
            
            <div
              onClick={() => {
                onFreezeRows?.(1);
                onFreezeCols?.(1);
                setShowFreezeMenu(false);
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                backgroundColor: frozenRows === 1 && frozenCols === 1 ? '#e8f0fe' : 'transparent',
                color: frozenRows === 1 && frozenCols === 1 ? '#1a73e8' : '#202124',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!(frozenRows === 1 && frozenCols === 1)) {
                  e.currentTarget.style.backgroundColor = '#f1f3f4';
                }
              }}
              onMouseLeave={(e) => {
                if (!(frozenRows === 1 && frozenCols === 1)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>┏</span>
              Freeze First Row & Column
            </div>
            
            {hasFrozenPanes && (
              <>
                <div style={{ borderTop: '1px solid #e8eaed', margin: '4px 0' }} />
                
                <div
                  onClick={() => {
                    onUnfreeze?.();
                    setShowFreezeMenu(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    backgroundColor: 'transparent',
                    color: '#ea4335',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fce8e6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>✕</span>
                  Unfreeze Panes
                </div>
              </>
            )}
            
            {hasFrozenPanes && (
              <div style={{ 
                padding: '4px 12px', 
                color: '#5f6368', 
                fontSize: '11px',
                borderTop: '1px solid #e8eaed',
                marginTop: '4px',
                paddingTop: '8px',
              }}>
                Current: {frozenRows > 0 ? `${frozenRows} row${frozenRows > 1 ? 's' : ''}` : ''}
                {frozenRows > 0 && frozenCols > 0 ? ', ' : ''}
                {frozenCols > 0 ? `${frozenCols} col${frozenCols > 1 ? 's' : ''}` : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hyperlink Modal */}
      <HyperlinkModal
        isOpen={showHyperlinkModal}
        initialUrl={selectedFormat?.hyperlink || ''}
        onClose={() => setShowHyperlinkModal(false)}
        onConfirm={(url) => {
          onHyperlink?.(url);
          setShowHyperlinkModal(false);
        }}
      />
    </div>
  );
});
