import React from 'react';

const About = () => {
  const team = [
    { name: 'Alex Johnson', role: 'CEO & Founder', image: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
    { name: 'Sarah Chen', role: 'CTO', image: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
    { name: 'Michael Brown', role: 'Head of Design', image: 'https://i.pravatar.cc/150?u=a04258114e29026702d' },
    { name: 'Emily Davis', role: 'Lead Engineer', image: 'https://i.pravatar.cc/150?u=a048581f4e29026701d' }
  ];

  return (
    <div className="pt-20 bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-primary-50 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-5xl font-extrabold text-neutral-900 tracking-tight mb-6">About HRMS Pro</h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">We are on a mission to build software that makes people management a joy, not a chore. We believe in empowering businesses to focus on their most important asset: their people.</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            <div className="bg-white p-12 rounded-3xl shadow-xl border border-neutral-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary-500"></div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">Our Mission</h2>
              <p className="text-lg text-neutral-600 leading-relaxed">To simplify human resources for companies of all sizes, freeing up time for leaders to focus on building culture and growing their business.</p>
            </div>
            <div className="bg-white p-12 rounded-3xl shadow-xl border border-neutral-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-6">Our Vision</h2>
              <p className="text-lg text-neutral-600 leading-relaxed">A world where workplace administration is invisible, seamless, and entirely focused on employee success and well-being.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-neutral-900 mb-16">Meet the Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {team.map((member) => (
              <div key={member.name} className="bg-white p-6 rounded-2xl shadow-md border border-neutral-100 hover:-translate-y-2 transition-transform">
                <img src={member.image} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-primary-50" />
                <h3 className="font-bold text-lg text-neutral-900">{member.name}</h3>
                <p className="text-primary-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
