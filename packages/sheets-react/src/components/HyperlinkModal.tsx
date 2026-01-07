import React, { memo, useState, useEffect, useRef } from 'react';

interface HyperlinkModalProps {
  isOpen: boolean;
  initialUrl?: string;
  onClose: () => void;
  onConfirm: (url: string) => void;
  onOpenLink?: (url: string) => void;
}

export const HyperlinkModal = memo(function HyperlinkModal({
  isOpen,
  initialUrl = '',
  onClose,
  onConfirm,
  onOpenLink,
}: HyperlinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      // Focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [isOpen, initialUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onConfirm(url.trim());
      onClose();
    }
  };

  const handleOpenLink = () => {
    if (url.trim() && onOpenLink) {
      onOpenLink(url.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: 500,
            color: '#202124',
          }}
        >
          {initialUrl ? 'Edit Hyperlink' : 'Insert Hyperlink'}
        </h2>
        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              color: '#5f6368',
              fontWeight: 500,
            }}
          >
            URL
          </label>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e8eaed',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
            onKeyDown={handleKeyDown}
          />
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
            }}
          >
            {initialUrl && onOpenLink && (
              <button
                type="button"
                onClick={handleOpenLink}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e8eaed',
                  borderRadius: '4px',
                  backgroundColor: '#ffffff',
                  color: '#1a73e8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f3f4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                Open Link
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid #e8eaed',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                color: '#5f6368',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f3f4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: url.trim() ? '#1a73e8' : '#e8eaed',
                color: url.trim() ? '#ffffff' : '#9aa0a6',
                cursor: url.trim() ? 'pointer' : 'not-allowed',
                fontSize: '13px',
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                if (url.trim()) {
                  e.currentTarget.style.backgroundColor = '#1557b0';
                }
              }}
              onMouseLeave={(e) => {
                if (url.trim()) {
                  e.currentTarget.style.backgroundColor = '#1a73e8';
                }
              }}
            >
              {initialUrl ? 'Update' : 'Insert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

