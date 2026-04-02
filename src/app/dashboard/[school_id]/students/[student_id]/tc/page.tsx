import db from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function TCPage({ params }: { params: Promise<{ school_id: string, student_id: string }> }) {
    const { school_id, student_id } = await params;

    const student = await db.studentProfile.findUnique({
        where: { id: student_id },
        include: {
            user: { include: { school: true } },
            class: true,
            section: true,
        },
    });

    if (!student || student.user.schoolId !== school_id) notFound();

    return (
        <div style={{ background: 'white', color: 'black', padding: '4rem', maxWidth: '800px', margin: '2rem auto', border: '10px double #ccc', fontFamily: 'serif' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{student.user.school?.name}</h1>
                <p style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{student.user.school?.address}</p>
                <p style={{ fontSize: '1rem', fontStyle: 'italic' }}>Affiliated to {student.user.school?.board}</p>
                <div style={{ borderBottom: '2px solid black', margin: '1rem 0' }}></div>
                <h2 style={{ textDecoration: 'underline' }}>TRANSFER CERTIFICATE</h2>
            </div>

            {/* Body */}
            <div style={{ lineHeight: '2.5', fontSize: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p>TC No: <b>TC/{new Date().getFullYear()}/{student.rollNumber || '000'}</b></p>
                    <p>Date: <b>{new Date().toLocaleDateString()}</b></p>
                </div>

                <p>1. Name of Pupil: <b>{student.user.name}</b></p>
                <p>2. Father's/Guardian's Name: <b>{student.parentName}</b></p>
                <p>3. Nationality: <b>Indian</b></p>
                <p>4. Date of first admission in the school: <b>{new Date(student.user.createdAt).toLocaleDateString()}</b></p>
                <p>5. Date of Birth: <b>{student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}</b></p>
                <p>6. Class in which the pupil last studied: <b>Class {student.class?.name} - {student.section?.name}</b></p>
                <p>7. School/Board Annual Examination last taken: <b>Passed</b></p>
                <p>8. Whether failed, if so once/twice in the same class: <b>No</b></p>
                <p>9. Subjects Studied: <b>General</b></p>
                <p>10. Whether qualified for promotion to the higher class: <b>Yes</b></p>
                <p>11. Month up to which the pupil has paid school dues: <b>Fully Paid</b></p>
                <p>12. General Conduct: <b>Good</b></p>
                <p>13. Reason for leaving the school: <b>Completed Term / Personal</b></p>
                <p>14. Any other remarks: <b>N/A</b></p>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5rem', textAlign: 'center' }}>
                <div>
                   <div style={{ borderTop: '1px solid black', width: '150px', paddingTop: '0.5rem' }}>Class Teacher</div>
                </div>
                <div>
                   <div style={{ borderTop: '1px solid black', width: '150px', paddingTop: '0.5rem' }}>Principal</div>
                </div>
            </div>

            {/* Print Button - Hidden when printing */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0; padding: 0; }
                    .page-content { padding: 0 !important; }
                }
            ` }} />
            <div className="no-print" style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', gap: '1rem' }}>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>🖨️ Print Certificate</button>
            </div>
        </div>
    );
}
