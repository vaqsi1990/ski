import Hero from "@/components/Hero";
import Weather from "@/components/Weather";
import Equipment from "@/components/Equipment";

import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <Weather />
      <Equipment />

      <Services />
      <Testimonials />
      <Footer />
    </>
  );
}
