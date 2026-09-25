import Hero from '@/components/sections/Hero';
import WhatLiquodaIs from '@/components/sections/WhatLiquodaIs';
import RoleEntry from '@/components/sections/RoleEntry';
import HowItWorks from '@/components/sections/HowItWorks';
import ProjectPreview from '@/components/sections/ProjectPreview';
import TrustNotes from '@/components/sections/TrustNotes';
import RegisterForm from '@/components/sections/RegisterForm';

// Startseite gemäss Spec, Abschnitt 3: Was LIQUODA ist und nicht ist, für wen,
// Einstieg für beide Rollen, Ablauf, Beispielprojekte, Trust-Hinweise.
// Die Warteliste ersetzt bis Etappe 3 die Kontoerstellung.
export default function HomePage() {
  return (
    <>
      <Hero />
      <WhatLiquodaIs />
      <RoleEntry />
      <HowItWorks />
      <ProjectPreview />
      <TrustNotes />
      <RegisterForm />
    </>
  );
}
