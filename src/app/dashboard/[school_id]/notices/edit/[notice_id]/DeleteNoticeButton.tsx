'use client';

interface DeleteNoticeButtonProps {
    noticeId: string;
    schoolId: string;
}

export default function DeleteNoticeButton({ noticeId, schoolId }: DeleteNoticeButtonProps) {
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this notice?')) {
            return;
        }

        const formData = new FormData();
        const response = await fetch(`/dashboard/${schoolId}/notices/delete/${noticeId}`, {
            method: 'POST',
        });

        if (response.ok) {
            window.location.href = `/dashboard/${schoolId}/notices`;
        }
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--error)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--error)',
                cursor: 'pointer',
                fontWeight: '600',
            }}
        >
            🗑️ Delete Notice
        </button>
    );
}
