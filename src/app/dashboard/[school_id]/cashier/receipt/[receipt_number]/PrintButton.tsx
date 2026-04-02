'use client';

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="btn btn-primary"
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
            🖨️ Print Receipt
        </button>
    );
}
