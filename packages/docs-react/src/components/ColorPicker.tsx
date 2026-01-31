/**
 * ColorPicker - A dropdown color picker with preset colors and custom input
 */

import { useState, useRef, memo } from 'react';

interface ColorPickerProps {
  /** Currently selected color */
  currentColor?: string | null;
  /** Called when a color is selected */
  onColorSelect: (color: string) => void;
  /** Called when picker should close */
  onClose: () => void;
  /** Whether to show "No color" / transparent option */
  showNoColor?: boolean;
  /** Label for no color option */
  noColorLabel?: string;
}

// Preset color palette - organized by hue
const presetColors = [
  // Grays
  ['#000000', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6', '#ffffff'],
  // Reds
  ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', '#fef2f2'],
  // Oranges
  ['#7c2d12', '#9a3412', '#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed'],
  // Yellows
  ['#713f12', '#854d0e', '#a16207', '#ca8a04', '#eab308', '#facc15', '#fde047', '#fef08a', '#fef9c3', '#fefce8'],
  // Greens
  ['#14532d', '#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', '#f0fdf4'],
  // Teals
  ['#134e4a', '#115e59', '#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1', '#f0fdfa'],
  // Blues
  ['#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'],
  // Purples
  ['#4c1d95', '#5b21b6', '#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff'],
];

const styles = {
  container: {
    position: 'absolute' as const,
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    zIndex: 1000,
    padding: 12,
    width: 280,
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gap: 2,
  },
  colorSwatch: {
    width: 22,
    height: 22,
    borderRadius: 4,
    cursor: 'pointer',
    border: 'none',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    outline: 'none',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    margin: '10px 0',
  },
  customSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  customLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 500,
    minWidth: 50,
  },
  customInput: {
    flex: 1,
    height: 32,
    padding: '0 10px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'monospace',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: '1px solid #d1d5db',
    flexShrink: 0,
  },
  noColorButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 10px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    color: '#374151',
    transition: 'background-color 0.15s ease',
  },
  noColorIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
    border: '1px solid #d1d5db',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
};

export const ColorPicker = memo(function ColorPicker({
  currentColor,
  onColorSelect,
  onClose,
  showNoColor = false,
  noColorLabel = 'No color',
}: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(currentColor || '#000000');
  const [inputValue, setInputValue] = useState(currentColor || '#000000');
  const inputRef = useRef<HTMLInputElement>(null);

  // Validate and normalize color input
  const parseColor = (value: string): string | null => {
    const trimmed = value.trim();
    
    // Hex color (3 or 6 digits)
    if (/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
      const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
      // Expand 3-digit hex to 6-digit
      if (hex.length === 4) {
        return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
      }
      return hex.toLowerCase();
    }
    
    // RGB format: rgb(r, g, b)
    const rgbMatch = trimmed.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
    if (rgbMatch) {
      const r = Math.min(255, parseInt(rgbMatch[1]));
      const g = Math.min(255, parseInt(rgbMatch[2]));
      const b = Math.min(255, parseInt(rgbMatch[3]));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // HSL format: hsl(h, s%, l%)
    const hslMatch = trimmed.match(/^hsl\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)$/i);
    if (hslMatch) {
      const h = parseInt(hslMatch[1]) % 360;
      const s = Math.min(100, parseInt(hslMatch[2])) / 100;
      const l = Math.min(100, parseInt(hslMatch[3])) / 100;
      
      // Convert HSL to RGB
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - c / 2;
      
      let r = 0, g = 0, b = 0;
      if (h < 60) { r = c; g = x; b = 0; }
      else if (h < 120) { r = x; g = c; b = 0; }
      else if (h < 180) { r = 0; g = c; b = x; }
      else if (h < 240) { r = 0; g = x; b = c; }
      else if (h < 300) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }
      
      const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const parsed = parseColor(value);
    if (parsed) {
      setCustomColor(parsed);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const parsed = parseColor(inputValue);
      if (parsed) {
        onColorSelect(parsed);
        onClose();
      }
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSwatchClick = (color: string) => {
    onColorSelect(color);
    onClose();
  };

  const handleNoColor = () => {
    onColorSelect('transparent');
    onClose();
  };

  // Use native color picker
  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setInputValue(color);
  };

  const handleNativePickerClose = () => {
    if (customColor) {
      onColorSelect(customColor);
      onClose();
    }
  };

  return (
    <div 
      style={styles.container}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* No color option */}
      {showNoColor && (
        <>
          <button
            style={styles.noColorButton}
            onClick={handleNoColor}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <div style={styles.noColorIcon}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: -2,
                right: -2,
                height: 2,
                backgroundColor: '#dc2626',
                transform: 'rotate(-45deg)',
              }} />
            </div>
            {noColorLabel}
          </button>
          <div style={styles.divider} />
        </>
      )}

      {/* Preset color grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {presetColors.map((row, rowIndex) => (
          <div key={rowIndex} style={styles.colorGrid}>
            {row.map((color) => (
              <button
                key={color}
                onClick={() => handleSwatchClick(color)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15)';
                  e.currentTarget.style.zIndex = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.zIndex = '0';
                }}
                style={{
                  ...styles.colorSwatch,
                  backgroundColor: color,
                  boxShadow: color === '#ffffff' 
                    ? 'inset 0 0 0 1px rgba(0,0,0,0.1)' 
                    : currentColor === color 
                      ? `0 0 0 2px #fff, 0 0 0 4px ${color}` 
                      : 'none',
                }}
                title={color}
              />
            ))}
          </div>
        ))}
      </div>

      <div style={styles.divider} />

      {/* Custom color input */}
      <div style={styles.customSection}>
        {/* Hidden native color picker */}
        <input
          type="color"
          value={customColor}
          onChange={handleNativePickerChange}
          onBlur={handleNativePickerClose}
          style={{
            ...styles.colorPreview,
            padding: 0,
            cursor: 'pointer',
          }}
          title="Click to open color picker"
        />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
          style={styles.customInput}
          placeholder="#hex, rgb(), or hsl()"
        />
      </div>
      
      <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af' }}>
        Enter hex (#ff0000), RGB (rgb(255,0,0)), or HSL (hsl(0,100,50))
      </div>
    </div>
  );
});

export default ColorPicker;
