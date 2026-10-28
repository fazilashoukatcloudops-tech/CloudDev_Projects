import type { DocumentDto } from '../../schemas/documentResponse.schema'

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

function doc(
  n: number,
  name: string,
  sizeBytes: number,
  pages: number | null,
  status: DocumentDto['status'],
  uploadedAt: string,
  errorMessage: string | null = null,
): DocumentDto {
  return { id: id(n), name, sizeBytes, pages, status, errorMessage, uploadedAt, updatedAt: uploadedAt }
}

export const MOCK_DOCUMENTS: DocumentDto[] = [
  doc(1, 'Q3-Financial-Report.pdf', 2_480_000, 42, 'ready', '2026-10-20T10:00:00Z'),
  doc(2, 'Employment-Contract.pdf', 640_000, 12, 'ready', '2026-10-21T09:30:00Z'),
  doc(3, 'Research-Paper-AI.pdf', 5_120_000, 28, 'processing', '2026-10-25T14:15:00Z'),
  doc(4, 'Product-Spec-v2.pdf', 1_350_000, 19, 'queued', '2026-10-26T08:00:00Z'),
  doc(5, 'Scanned-Invoice.pdf', 8_900_000, null, 'failed', '2026-10-26T11:45:00Z',
    'PDF scanned image hai, us mein text extract nahi ho saka.'),
  doc(6, 'Meeting-Notes-Oct.pdf', 310_000, 6, 'ready', '2026-10-27T07:20:00Z'),
  doc(7, 'Lease-Agreement.pdf', 900_000, 15, 'ready', '2026-10-15T12:00:00Z'),
  doc(8, 'Tax-Return-2025.pdf', 1_700_000, 22, 'ready', '2026-10-12T16:40:00Z'),
  doc(9, 'User-Manual-Router.pdf', 4_200_000, 64, 'ready', '2026-10-10T09:10:00Z'),
  doc(10, 'Marketing-Plan-2027.pdf', 2_050_000, 31, 'ready', '2026-10-08T11:25:00Z'),
  doc(11, 'Corrupted-File.pdf', 120_000, null, 'failed', '2026-10-07T18:00:00Z',
    'PDF file corrupt hai ya password se protected hai.'),
  doc(12, 'Thesis-Chapter-3.pdf', 3_300_000, 48, 'ready', '2026-10-05T08:30:00Z'),
  doc(13, 'Insurance-Policy.pdf', 760_000, 18, 'ready', '2026-10-03T13:55:00Z'),
  doc(14, 'Onboarding-Guide.pdf', 1_100_000, 14, 'ready', '2026-10-01T10:05:00Z'),
]
