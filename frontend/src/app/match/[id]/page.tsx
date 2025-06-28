import dynamic from 'next/dynamic';

const MatchPageClient = dynamic(() => import('./MatchpageComponent'));

export default function MatchPage() {
  return <MatchPageClient />;
}

