import './globals.css';
import type { Metadata } from 'next';

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
            <body suppressHydrationWarning>{children}</body>
        </html>
    );
}
