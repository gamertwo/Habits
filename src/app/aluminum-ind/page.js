"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowRight, 
  Recycle, 
  Award, 
  Factory, 
  Shield, 
  Truck, 
  Users, 
  Send 
} from "lucide-react";

export default function AluminumLandingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    inquiryType: "General",
    message: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would handle form submission here
    console.log("Form submitted:", formData);
    alert("Thank you for your inquiry! We'll get back to you soon.");
    setFormData({
      name: "",
      email: "",
      inquiryType: "General",
      message: ""
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-gray-800">
                <span className="text-blue-600">Alu</span>Tech
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">
                About
              </Link>
              <Link href="#products" className="text-gray-600 hover:text-blue-600 transition-colors">
                Products
              </Link>
              <Link href="#industries" className="text-gray-600 hover:text-blue-600 transition-colors">
                Industries
              </Link>
              <Link href="#sustainability" className="text-gray-600 hover:text-blue-600 transition-colors">
                Sustainability
              </Link>
              <Link href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                Contact
              </Link>
            </nav>
            <div className="md:hidden">
              {/* Mobile menu button would go here */}
              <button className="text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[600px] bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="absolute inset-0 opacity-30">
            <Image 
              src="/aluminum-production.jpg" 
              alt="Aluminum Production" 
              fill 
              style={{objectFit: "cover"}}
              priority
            />
          </div>
          <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Innovating Aluminum for a Stronger Tomorrow
              </h1>
              <p className="text-xl mb-8 text-gray-200">
                Premium aluminum solutions for industrial and commercial needs with unmatched quality and precision.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="#contact" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors flex items-center">
                  Get a Quote <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link href="#products" className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white px-6 py-3 rounded-md font-medium transition-colors">
                  View Products
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">About AluTech</h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Excellence in Aluminum Since 1985</h3>
                <p className="text-gray-600 mb-6">
                  With over 35 years of experience, AluTech has established itself as a leader in the aluminum industry. 
                  We combine cutting-edge technology with traditional craftsmanship to deliver superior aluminum products 
                  that meet the highest standards of quality and performance.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-1 mr-2" />
                    <div>
                      <h4 className="font-semibold text-gray-800">ISO 9001:2015</h4>
                      <p className="text-sm text-gray-600">Quality Management</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-1 mr-2" />
                    <div>
                      <h4 className="font-semibold text-gray-800">ISO 14001:2015</h4>
                      <p className="text-sm text-gray-600">Environmental Management</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-1 mr-2" />
                    <div>
                      <h4 className="font-semibold text-gray-800">OHSAS 18001</h4>
                      <p className="text-sm text-gray-600">Occupational Health & Safety</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-1 mr-2" />
                    <div>
                      <h4 className="font-semibold text-gray-800">ASI Certified</h4>
                      <p className="text-sm text-gray-600">Aluminum Stewardship Initiative</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
                <Image 
                  src="/aluminum-factory.jpg" 
                  alt="Our Factory" 
                  fill 
                  style={{objectFit: "cover"}}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Products & Services */}
        <section id="products" className="py-20 bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Products & Services</h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
              <p className="max-w-2xl mx-auto text-gray-600">
                We offer a comprehensive range of aluminum products and services to meet diverse industry needs.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Aluminum Extrusions",
                  image: "/extrusions.jpg",
                  description: "Custom and standard profiles for various applications with precise tolerances."
                },
                {
                  title: "Aluminum Sheets & Plates",
                  image: "/sheets.jpg",
                  description: "High-quality flat-rolled products available in various alloys, tempers, and dimensions."
                },
                {
                  title: "Aluminum Castings",
                  image: "/castings.jpg",
                  description: "Die-cast and sand-cast components with excellent surface finish and dimensional accuracy."
                },
                {
                  title: "Surface Treatments",
                  image: "/anodizing.jpg",
                  description: "Anodizing, powder coating, and other finishes to enhance durability and aesthetics."
                },
                {
                  title: "CNC Machining",
                  image: "/machining.jpg",
                  description: "Precision machining services for complex aluminum components with tight tolerances."
                },
                {
                  title: "Custom Fabrication",
                  image: "/fabrication.jpg",
                  description: "Tailored solutions including cutting, bending, welding, and assembly services."
                }
              ].map((product, index) => (
                <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg transition-transform hover:transform hover:scale-105">
                  <div className="relative h-48">
                    <Image 
                      src={product.image} 
                      alt={product.title} 
                      fill 
                      style={{objectFit: "cover"}}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 text-gray-800">{product.title}</h3>
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    <Link href="#contact" className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                      Learn More <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Why Choose AluTech</h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
              <p className="max-w-2xl mx-auto text-gray-600">
                Our commitment to excellence sets us apart in the aluminum industry.
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6 mb-16">
              {[
                {
                  icon: <Shield className="h-10 w-10 text-blue-600" />,
                  title: "Quality Assurance",
                  description: "Rigorous testing and quality control at every stage of production."
                },
                {
                  icon: <Truck className="h-10 w-10 text-blue-600" />,
                  title: "Reliable Delivery",
                  description: "On-time delivery with flexible logistics solutions worldwide."
                },
                {
                  icon: <Recycle className="h-10 w-10 text-blue-600" />,
                  title: "Sustainability",
                  description: "Eco-friendly processes and commitment to reducing carbon footprint."
                },
                {
                  icon: <Users className="h-10 w-10 text-blue-600" />,
                  title: "Expert Team",
                  description: "Skilled professionals with decades of industry experience."
                }
              ].map((feature, index) => (
                <div key={index} className="text-center p-6 border border-gray-200 rounded-lg hover:border-blue-600 transition-colors">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
            
            {/* Testimonials */}
            <div className="bg-gray-100 p-8 rounded-xl">
              <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800">What Our Clients Say</h3>
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    quote: "AluTech has been our trusted supplier for over a decade. Their aluminum components are consistently high-quality and their technical support is exceptional.",
                    author: "John Smith",
                    position: "Procurement Director, Aerospace Industries Ltd."
                  },
                  {
                    quote: "The custom extrusions provided by AluTech helped us reduce weight while maintaining structural integrity in our latest automotive design.",
                    author: "Sarah Johnson",
                    position: "Chief Engineer, Advanced Motors Inc."
                  }
                ].map((testimonial, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                    <p className="italic text-gray-600 mb-4">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold text-gray-800">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Industries Served */}
        <section id="industries" className="py-20 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Industries We Serve</h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
              <p className="max-w-2xl mx-auto text-gray-300">
                Our aluminum solutions are trusted across diverse industries worldwide.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Aerospace",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>,
                  description: "Lightweight, high-strength components for aircraft and spacecraft applications."
                },
                {
                  title: "Automotive",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>,
                  description: "Fuel-efficient solutions for vehicle bodies, engines, and structural components."
                },
                {
                  title: "Construction",
                  icon: <Factory className="h-12 w-12" />,
                  description: "Durable and aesthetic profiles for facades, windows, doors, and structural applications."
                },
                {
                  title: "Electronics",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>,
                  description: "Heat sinks, enclosures, and components for electronic devices and equipment."
                },
                {
                  title: "Packaging",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>,
                  description: "Sustainable aluminum foils and containers for food and beverage packaging."
                },
                {
                  title: "Renewable Energy",
                  icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>,
                  description: "Frames and components for solar panels, wind turbines, and energy systems."
                }
              ].map((industry, index) => (
                <div key={index} className="bg-gray-800 p-8 rounded-lg text-center hover:bg-gray-700 transition-colors">
                  <div className="flex justify-center mb-4 text-blue-400">
                    {industry.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{industry.title}</h3>
                  <p className="text-gray-300">{industry.description}</p>
                </div>
              ))}
            </div>
            
            {/* Client Logos */}
            <div className="mt-20">
              <h3 className="text-xl font-semibold mb-8 text-center">Trusted By Industry Leaders</h3>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                {[1, 2, 3, 4, 5].map((logo) => (
                  <div key={logo} className="bg-gray-800 p-4 rounded-lg w-32 h-16 flex items-center justify-center">
                    <div className="text-gray-400 font-semibold">Client Logo</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sustainability & Innovation */}
        <section id="sustainability" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Sustainability & Innovation</h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
              <p className="max-w-2xl mx-auto text-gray-600">
                We're committed to environmentally responsible practices and continuous innovation.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Leading the Way in Sustainable Aluminum</h3>
                <p className="text-gray-600 mb-6">
                  At AluTech, sustainability isn't just a buzzword—it's integrated into everything we do. 
                  Our state-of-the-art facilities are designed to minimize environmental impact while 
                  maximizing efficiency and product quality.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Recycle className="h-6 w-6 text-green-600 mt-1 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-800">100% Recyclable Material</h4>
                      <p className="text-gray-600">Our aluminum products are fully recyclable, supporting a circular economy.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mt-1 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-800">Reduced Carbon Footprint</h4>
                      <p className="text-gray-600">Energy-efficient production processes and renewable energy sources.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mt-1 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-gray-800">Energy-Efficient Products</h4>
                      <p className="text-gray-600">Our aluminum solutions help customers reduce their energy consumption.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2 relative h-[400px] rounded-lg overflow-hidden shadow-xl">
                <Image 
                  src="/sustainability.jpg" 
                  alt="Sustainable Aluminum Production" 
                  fill 
                  style={{objectFit: "cover"}}
                />
              </div>
            </div>
            
            {/* Innovation Section */}
            <div className="mt-20 bg-gray-100 p-8 rounded-xl">
              <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800">Innovation at Our Core</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Advanced Alloys",
                    description: "Developing next-generation aluminum alloys with enhanced properties for demanding applications."
                  },
                  {
                    title: "Smart Manufacturing",
                    description: "Industry 4.0 technologies for precision control and real-time quality monitoring."
                  },
                  {
                    title: "Digital Solutions",
                    description: "Online tools for customers to design, visualize, and order custom aluminum products."
                  }
                ].map((innovation, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                    <h4 className="font-semibold text-gray-800 mb-2">{innovation.title}</h4>
                    <p className="text-gray-600">{innovation.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact & CTA */}
        <section id="contact" className="py-20 bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Contact Us</h2>
              <div className="w-20 h-1 bg-blue-600 mx-auto mb-6"></div>
              <p className="max-w-2xl mx-auto text-gray-600">
                Get in touch with our team to discuss your aluminum needs and how we can help.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-6 text-gray-800">Send Us a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-1">Inquiry Type</label>
                    <select
                      id="inquiryType"
                      name="inquiryType"
                      value={formData.inquiryType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="General">General Inquiry</option>
                      <option value="Quote">Request a Quote</option>
                      <option value="Technical">Technical Support</option>
                      <option value="Partnership">Partnership Opportunity</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell us about your project or inquiry..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center"
                  >
                    Send Message <Send className="ml-2 h-5 w-5" />
                  </button>
                </form>
              </div>
              
              <div>
                <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
                  <h3 className="text-2xl font-semibold mb-6 text-gray-800">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                    <MapPin className="h-6 w-6 text-blue-600 mt-1 mr-3" />
                      <div>
                        <h4 className="font-semibold text-gray-800">Address</h4>
                        <p className="text-gray-600">123 Aluminum Way, Industrial District<br />New York, NY 10001, USA</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="h-6 w-6 text-blue-600 mt-1 mr-3" />
                      <div>
                        <h4 className="font-semibold text-gray-800">Phone</h4>
                        <p className="text-gray-600">+1 (555) 123-4567</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="h-6 w-6 text-blue-600 mt-1 mr-3" />
                      <div>
                        <h4 className="font-semibold text-gray-800">Email</h4>
                        <p className="text-gray-600">info@alutech-industry.com</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-8 rounded-lg shadow-lg">
                  <h3 className="text-2xl font-semibold mb-6 text-gray-800">Business Hours</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monday - Friday:</span>
                      <span className="text-gray-800 font-medium">8:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saturday:</span>
                      <span className="text-gray-800 font-medium">9:00 AM - 1:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sunday:</span>
                      <span className="text-gray-800 font-medium">Closed</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2">Global Presence</h4>
                    <p className="text-gray-600">
                      With manufacturing facilities and sales offices across North America, Europe, and Asia, 
                      we provide local support with global capabilities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Your Aluminum Project?</h2>
            <p className="max-w-2xl mx-auto mb-8 text-blue-100">
              Partner with AluTech for innovative aluminum solutions that deliver performance, quality, and value.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="#contact" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-md font-medium transition-colors">
                Request a Quote
              </Link>
              <Link href="#products" className="bg-transparent border-2 border-white hover:bg-white/10 text-white px-8 py-3 rounded-md font-medium transition-colors">
                Explore Products
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">
                <span className="text-blue-500">Alu</span>Tech
              </div>
              <p className="mb-4">
                Premium aluminum solutions for industrial and commercial applications worldwide.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="#about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#products" className="hover:text-white transition-colors">Products</Link></li>
                <li><Link href="#industries" className="hover:text-white transition-colors">Industries</Link></li>
                <li><Link href="#sustainability" className="hover:text-white transition-colors">Sustainability</Link></li>
                <li><Link href="#contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Products</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Aluminum Extrusions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sheets & Plates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Castings</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Surface Treatments</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Custom Solutions</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Technical Specifications</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} AluTech Industries. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Live Chat Button (Fixed) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg flex items-center justify-center transition-all"
          onClick={() => alert("Live chat feature would open here")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
