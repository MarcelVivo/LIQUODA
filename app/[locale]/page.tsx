import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import HowItWorks from '@/components/sections/HowItWorks';
import ProjectPreview from '@/components/sections/ProjectPreview';
import RegisterForm from '@/components/sections/RegisterForm';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ProjectPreview />
        <RegisterForm />
      </main>
      <Footer />
    </>
  );
}
