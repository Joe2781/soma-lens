import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Soma Lens | Analyze • Understand • Decide',
  description: 'Technical intelligence workspace for developers, engineers, and researchers',
};

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
