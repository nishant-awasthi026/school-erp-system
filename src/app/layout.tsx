import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'School ERP System',
    description: 'Multi-tenant School ERP System',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <style dangerouslySetInnerHTML={{ __html: `
                  .material-symbols-outlined {
                      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                  }
                  .no-scrollbar::-webkit-scrollbar { display: none; }
                  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}} />
            </head>
            <body suppressHydrationWarning>{children}</body>
        </html>
    );
}
