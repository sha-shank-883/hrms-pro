import React from 'react';
import { FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const ToggleSwitch = ({ checked, onChange, label }) => (
  <label className="flex items-center cursor-pointer gap-2" title={checked ? "Visible" : "Hidden"}>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked !== false} onChange={(e) => onChange(e.target.checked)} />
      <div className={`block w-10 h-5 rounded-full transition-colors ${checked !== false ? 'bg-primary-500' : 'bg-neutral-300'}`}></div>
      <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${checked !== false ? 'transform translate-x-5' : ''}`}></div>
    </div>
    {label && <span className="text-xs font-medium text-neutral-600">{label}</span>}
  </label>
);

const SectionBuilder = ({ sections, onChange }) => {
  const setSections = (newSections) => {
    onChange(newSections);
  };

  const addSection = (type) => {
    setSections([...sections, { id: Date.now().toString(), type, isActive: true, items: [], plans: [], code: '' }]);
  };

  const moveSection = (index, dir) => {
    const arr = [...sections];
    if (index + dir >= 0 && index + dir < arr.length) {
      [arr[index + dir], arr[index]] = [arr[index], arr[index + dir]];
      setSections(arr);
    }
  };

  const removeSection = (id) => {
    if (window.confirm('Delete section?')) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const updateSection = (index, field, value) => {
    const arr = [...sections];
    arr[index][field] = value;
    setSections(arr);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-neutral-100 p-4 rounded-xl border border-neutral-200 flex flex-wrap gap-2 items-center">
        <span className="text-sm font-bold text-neutral-600 mr-2">Add Section:</span>
        {['Hero', 'SocialProof', 'DeepDive', 'TimeTracking', 'GridFeatures', 'Testimonial', 'CTA', 'PricingPlans', 'CustomHTML'].map(type => (
          <button key={type} type="button" onClick={() => addSection(type)} className="bg-white border border-neutral-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200">
            + {type}
          </button>
        ))}
      </div>

      {sections.length === 0 ? <div className="text-center py-12 bg-white rounded-xl border border-dashed border-neutral-300">No sections added yet.</div> : (
        sections.map((section, index) => (
          <div key={section.id} className={`bg-white rounded-xl shadow-sm border border-l-4 ${section.isActive !== false ? 'border-l-primary-500' : 'border-l-neutral-300 opacity-75'}`}>
            <div className="bg-neutral-50 px-4 py-3 flex justify-between items-center rounded-t-xl border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded ${section.isActive !== false ? 'bg-primary-100 text-primary-700' : 'bg-neutral-200 text-neutral-600'}`}>{section.type}</span>
              </div>
              <div className="flex items-center gap-4">
                <ToggleSwitch checked={section.isActive !== false} onChange={(val) => updateSection(index, 'isActive', val)} label="Visible" />
                <div className="flex items-center gap-1 border-l pl-4 border-neutral-200">
                  <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} className="p-1.5 text-neutral-400 hover:text-neutral-700 bg-white rounded border border-neutral-200 disabled:opacity-30"><FaArrowUp /></button>
                  <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} className="p-1.5 text-neutral-400 hover:text-neutral-700 bg-white rounded border border-neutral-200 disabled:opacity-30"><FaArrowDown /></button>
                  <button type="button" onClick={() => removeSection(section.id)} className="p-1.5 text-red-500 hover:bg-red-50 hover:border-red-200 bg-white rounded border border-neutral-200 ml-2"><FaTrash /></button>
                </div>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Top Level Text Fields */}
              {(['Hero', 'SocialProof', 'DeepDive', 'TimeTracking', 'GridFeatures', 'CTA', 'PricingPlans', 'CustomHTML'].includes(section.type)) && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                  <input type="text" className="w-full form-input text-sm" value={section.title || ''} onChange={(e) => updateSection(index, 'title', e.target.value)} />
                </div>
              )}
              {(['Hero', 'DeepDive', 'TimeTracking', 'GridFeatures', 'CTA', 'PricingPlans', 'CustomHTML'].includes(section.type)) && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Subtitle</label>
                  <textarea className="w-full form-textarea text-sm" rows="2" value={section.subtitle || ''} onChange={(e) => updateSection(index, 'subtitle', e.target.value)} />
                </div>
              )}

              {/* CustomHTML Field */}
              {section.type === 'CustomHTML' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Raw HTML Code</label>
                  <textarea className="w-full form-textarea text-xs font-mono bg-neutral-900 text-green-400" rows="8" placeholder="<div class='flex'>...</div>" value={section.code || ''} onChange={(e) => updateSection(index, 'code', e.target.value)} />
                  <p className="text-xs text-neutral-500 mt-1">You can write any HTML or Tailwind classes here. It will be injected directly into the page.</p>
                </div>
              )}

              {/* Testimonial Fields */}
              {section.type === 'Testimonial' && (
                <>
                  <textarea className="w-full form-textarea text-sm" rows="3" placeholder="Quote Text" value={section.text || ''} onChange={(e) => updateSection(index, 'text', e.target.value)} />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" className="w-full form-input text-sm" placeholder="Author Name" value={section.author || ''} onChange={(e) => updateSection(index, 'author', e.target.value)} />
                    <input type="text" className="w-full form-input text-sm" placeholder="Role/Company" value={section.role || ''} onChange={(e) => updateSection(index, 'role', e.target.value)} />
                  </div>
                </>
              )}

              {/* PricingPlans Nested Builder */}
              {section.type === 'PricingPlans' && (
                <div className="mt-6 pt-4 border-t border-neutral-100">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-neutral-700">Pricing Tiers</h4>
                    <button type="button" onClick={() => {
                      const arr = [...sections];
                      if (!arr[index].plans) arr[index].plans = [];
                      arr[index].plans.push({ id: Date.now().toString(), name: '', price: '', period: '/month', features: '', isPopular: false });
                      setSections(arr);
                    }} className="text-xs font-semibold text-primary-600 hover:underline">+ Add Plan</button>
                  </div>
                  <div className="space-y-4 pl-4 border-l-2 border-primary-100">
                    {(!section.plans || section.plans.length === 0) && <p className="text-xs text-neutral-400">No plans added.</p>}
                    {section.plans && section.plans.map((plan, planIdx) => (
                      <div key={plan.id} className="bg-neutral-50 p-3 rounded border border-neutral-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="grid grid-cols-3 gap-2 flex-1 pr-4">
                            <input type="text" className="form-input text-xs" placeholder="Plan Name (e.g. Pro)" value={plan.name || ''} onChange={e => { const arr=[...sections]; arr[index].plans[planIdx].name = e.target.value; setSections(arr); }} />
                            <input type="text" className="form-input text-xs" placeholder="Price (e.g. $99)" value={plan.price || ''} onChange={e => { const arr=[...sections]; arr[index].plans[planIdx].price = e.target.value; setSections(arr); }} />
                            <input type="text" className="form-input text-xs" placeholder="Period (e.g. /month)" value={plan.period || ''} onChange={e => { const arr=[...sections]; arr[index].plans[planIdx].period = e.target.value; setSections(arr); }} />
                          </div>
                          <button type="button" onClick={() => { const arr=[...sections]; arr[index].plans.splice(planIdx, 1); setSections(arr); }} className="text-red-400 hover:text-red-600 p-1"><FaTrash size={12}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <textarea className="w-full form-textarea text-xs" rows="3" placeholder="Features (one per line)" value={plan.features || ''} onChange={e => { const arr=[...sections]; arr[index].plans[planIdx].features = e.target.value; setSections(arr); }} />
                          </div>
                          <div className="pt-2">
                            <ToggleSwitch checked={plan.isPopular} onChange={(val) => { const arr=[...sections]; arr[index].plans[planIdx].isPopular = val; setSections(arr); }} label="Highlight as Popular" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nested Items Builder */}
              {['SocialProof', 'DeepDive', 'TimeTracking', 'GridFeatures'].includes(section.type) && (
                <div className="mt-6 pt-4 border-t border-neutral-100">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-neutral-700">Dynamic Items</h4>
                    <button type="button" onClick={() => {
                      const arr = [...sections];
                      if (!arr[index].items) arr[index].items = [];
                      arr[index].items.push({ id: Date.now().toString(), title: '', desc: '', icon: '' });
                      setSections(arr);
                    }} className="text-xs font-semibold text-primary-600 hover:underline">+ Add Item</button>
                  </div>
                  <div className="space-y-3 pl-4 border-l-2 border-primary-100">
                    {(!section.items || section.items.length === 0) && <p className="text-xs text-neutral-400">No items added.</p>}
                    {section.items && section.items.map((item, itemIdx) => (
                      <div key={item.id} className="flex flex-col gap-2 bg-neutral-50 p-3 rounded border border-neutral-200">
                        <div className="flex justify-between items-start">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1 pr-4">
                            {section.type === 'SocialProof' ? (
                              <>
                                <input type="text" className="w-full form-input text-xs" placeholder="Company Name" value={item.name || ''} onChange={e => { const arr=[...sections]; arr[index].items[itemIdx].name = e.target.value; setSections(arr); }} />
                                <input type="text" className="w-full form-input text-xs" placeholder="SVG Path / Icon Name" value={item.icon || ''} onChange={e => { const arr=[...sections]; arr[index].items[itemIdx].icon = e.target.value; setSections(arr); }} />
                              </>
                            ) : (
                              <>
                                <input type="text" className="w-full form-input text-xs" placeholder="Item Title" value={item.title || ''} onChange={e => { const arr=[...sections]; arr[index].items[itemIdx].title = e.target.value; setSections(arr); }} />
                                {section.type === 'GridFeatures' && <input type="text" className="w-full form-input text-xs" placeholder="SVG Path / Icon Name" value={item.icon || ''} onChange={e => { const arr=[...sections]; arr[index].items[itemIdx].icon = e.target.value; setSections(arr); }} />}
                                <textarea className="w-full form-textarea text-xs md:col-span-2" rows="2" placeholder="Item Description" value={item.desc || ''} onChange={e => { const arr=[...sections]; arr[index].items[itemIdx].desc = e.target.value; setSections(arr); }} />
                              </>
                            )}
                          </div>
                          <button type="button" onClick={() => { const arr=[...sections]; arr[index].items.splice(itemIdx, 1); setSections(arr); }} className="text-red-400 hover:text-red-600"><FaTrash size={12}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SectionBuilder;
