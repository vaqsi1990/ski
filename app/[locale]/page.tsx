import Hero from "@/components/Hero";
import Weather from "@/components/Weather";
import Equipment from "@/components/Equipment";

import Services from "@/components/Services";

import Footer from "@/components/Footer";
import Map from "@/components/Map";

export default function Home() {
  return (
    <>
      <Hero />
      <Weather />
      <Equipment />

      <Services />
    <Map />
      <Footer />
    </>
  );
}
