import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const BlogPost = () => {
  const { id } = useParams();

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Dummy content mapper based on ID
  const getPostContent = () => {
    return {
      title: 'Automating Payroll: Reducing Errors and Saving Days of Work',
      category: 'Productivity',
      date: 'April 24, 2026',
      readTime: '6 min read',
      author: {
        name: 'Alex Johnson',
        role: 'CEO & Founder, HRMS Pro',
        image: 'https://i.pravatar.cc/150?u=a042581f4e29026024d'
      },
      image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
      content: `
        <p>For many scaling businesses, the end of the month brings a familiar sense of dread: payroll processing. It's a high-stakes, time-consuming administrative burden where even a tiny mistake can lead to massive compliance fines or severely damage employee trust.</p>
        
        <h2>The Cost of Manual Payroll</h2>
        <p>If your HR or finance team is still relying on spreadsheets, disconnected time-tracking apps, and manual data entry into banking portals, you are exposing your business to unnecessary risks. Studies show that manual payroll processing has an average error rate of 1.2%. When dealing with hundreds of employees, that error rate translates to significant financial leakage.</p>
        
        <blockquote>
          "Transitioning to automated payroll isn't just about saving time; it's about shifting your HR team's focus from tactical administration to strategic growth."
        </blockquote>
        
        <h2>How Automation Changes the Game</h2>
        <p>A modern HRMS platform fundamentally changes this dynamic. By centralizing employee data, time & attendance, and payroll into a single source of truth, the entire process becomes frictionless.</p>
        
        <ul>
          <li><strong>Instant Tax Calculations:</strong> Tax laws change frequently. Automated systems update tax brackets and compliance rules in real-time, ensuring you never under-withhold or over-pay.</li>
          <li><strong>Zero Data Entry:</strong> Hours worked, overtime, and unpaid leaves are automatically pulled from the Attendance module directly into the payroll run.</li>
          <li><strong>Self-Service Payslips:</strong> Employees no longer need to email HR for past payslips or tax documents. They are automatically generated and securely stored in their portal.</li>
        </ul>

        <h2>The ROI of Integrated HRMS</h2>
        <p>Our customers consistently report that automating payroll reduces processing time from an average of 3 days to less than 3 hours. That is an enormous return on investment, freeing up your team to focus on building culture, recruiting top talent, and improving the employee experience.</p>
      `
    };
  };

  const post = getPostContent();

  return (
    <div className="pt-20 bg-white min-h-screen pb-24">
      {/* Article Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-block bg-primary-50 px-4 py-1.5 rounded-full text-sm font-bold text-primary-700 uppercase tracking-wider mb-6">
          {post.category}
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight mb-8 leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center justify-center gap-6 text-neutral-600 font-medium">
          <div className="flex items-center gap-3">
            <img src={post.author.image} alt={post.author.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            <div className="text-left">
              <p className="text-neutral-900 font-bold text-sm">{post.author.name}</p>
              <p className="text-xs">{post.author.role}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-neutral-200"></div>
          <div className="flex items-center gap-2">
            <span>{post.date}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <img src={post.image} alt={post.title} className="w-full rounded-3xl shadow-2xl border border-neutral-100 object-cover aspect-[21/9]" />
      </div>

      {/* Article Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className="prose prose-lg prose-primary max-w-none text-neutral-700 prose-headings:font-bold prose-headings:text-neutral-900 prose-a:text-primary-600 prose-blockquote:border-l-primary-500 prose-blockquote:bg-primary-50 prose-blockquote:p-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-primary-900 prose-blockquote:font-medium prose-li:marker:text-primary-500"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        {/* Share & Tags */}
        <div className="mt-16 pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">Payroll</span>
            <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">Automation</span>
            <span className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm font-medium">HR Tech</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Share:</span>
            <button className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </button>
            <button className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 pt-24 border-t border-neutral-100">
        <h3 className="text-3xl font-bold text-neutral-900 mb-10 text-center">Keep Reading</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { id: 'geo-fencing-attendance', title: 'Geo-Fencing and Biometrics', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80', cat: 'Technology' },
            { id: 'modern-employee-onboarding', title: 'Guide to Modern Employee Onboarding', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80', cat: 'Culture' },
            { id: 'continuous-feedback-culture', title: 'High-Performance Culture with Feedback', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80', cat: 'Leadership' }
          ].map(related => (
            <Link key={related.id} to={`/blog/${related.id}`} className="group bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-xl transition-shadow block">
              <div className="h-48 overflow-hidden">
                <img src={related.image} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                <div className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">{related.cat}</div>
                <h4 className="text-xl font-bold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2">{related.title}</h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
