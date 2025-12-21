'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Hero = () => {
    return (
        <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/hero.jpg"
                    alt="თხილამურების გაქირავება გუდაურში"
                    fill
                    priority
                    className="object-cover"
                    quality={90}
                />
                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="space-y-6">
                    {/* Main Title */}
                    <h1 className=" md:text-[30px] text-[20px] font-bold text-white uppercase tracking-tight">
                        SKI RENTAL IN GUDAURI
                    </h1>
                    
                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-white font-light">
                       საუკეთესო აღჭურვილობა • საუკეთესო ფასები
                    </p>
                    
                    {/* CTA Button */}
                    <div className="pt-4">
                        <Link
                            href="/book"
                            className="inline-block bg-orange-500 md:text-[20px] text-[16px] font-bold hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg"
                        >
                            დაჯავშნა
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero
