import React from 'react';
import { FaTrash, FaArrowUp, FaArrowDown, FaCopy, FaCode, FaTag, FaListUl, FaExchangeAlt, FaBookOpen, FaVideo } from 'react-icons/fa';

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

const SectionBuilder = ({ sections = [], onChange }) => {
  const setSections = (newSections) => {
    onChange(newSections);
  };

  const addSection = (type) => {
    setSections([...sections, {
      id: Date.now().toString(),
      type,
      name: `New ${type} Section`,
      isActive: true,
      items: [],
      plans: [],
      comparisons: [],
      code: '',
      customCss: ''
    }]);
  };

  const duplicateSection = (index) => {
    const original = sections[index];
    const clone = JSON.parse(JSON.stringify(original));
    clone.id = Date.now().toString();
    clone.name = `${clone.name || clone.type} (Copy)`;
    const arr = [...sections];
    arr.splice(index + 1, 0, clone);
    setSections(arr);
  };

  const moveSection = (index, dir) => {
    const arr = [...sections];
    if (index + dir >= 0 && index + dir < arr.length) {
      [arr[index + dir], arr[index]] = [arr[index], arr[index + dir]];
      setSections(arr);
    }
  };

  const removeSection = (id) => {
    if (window.confirm('Delete this section?')) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const updateSection = (index, field, value) => {
    const arr = [...sections];
    arr[index][field] = value;
    setSections(arr);
  };

  const addItem = (index) => {
    const arr = [...sections];
    if (!arr[index].items) arr[index].items = [];
    arr[index].items.push({ id: Date.now().toString(), title: '', desc: '', icon: '' });
    setSections(arr);
  };

  const updateItem = (sectionIdx, itemIdx, field, value) => {
    const arr = [...sections];
    if (!arr[sectionIdx].items) arr[sectionIdx].items = [];
    if (!arr[sectionIdx].items[itemIdx]) return;
    arr[sectionIdx].items[itemIdx][field] = value;
    setSections(arr);
  };

  const removeItem = (sectionIdx, itemIdx) => {
    const arr = [...sections];
    if (!arr[sectionIdx].items) return;
    arr[sectionIdx].items.splice(itemIdx, 1);
    setSections(arr);
  };

  const addComparison = (index) => {
    const arr = [...sections];
    if (!arr[index].comparisons) arr[index].comparisons = [];
    arr[index].comparisons.push({ id: Date.now().toString(), feature: '', us: true, them: false });
    setSections(arr);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-neutral-100 p-4 rounded-xl border border-neutral-200 flex flex-wrap gap-2 items-center">
        <span className="text-sm font-bold text-neutral-600 mr-2">Add Section:</span>
        {[
          { type: 'Hero', icon: null },
          { type: 'VideoHero', icon: <FaVideo /> },
          { type: 'SocialProof', icon: null },
          { type: 'FeatureHeavy', icon: <FaListUl /> },
          { type: 'GridFeatures', icon: null },
          { type: 'ComparisonTable', icon: <FaExchangeAlt /> },
          { type: 'ResourceLibrary', icon: <FaBookOpen /> },
          { type: 'Testimonial', icon: null },
          { type: 'CTA', icon: null },
          { type: 'PricingPlans', icon: null },
          { type: 'CustomHTML', icon: <FaCode /> }
        ].map(item => (
          <button key={item.type} type="button" onClick={() => addSection(item.type)}
            className="bg-white border border-neutral-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all flex items-center gap-1.5 shadow-sm">
            {item.icon} {item.type}
          </button>
        ))}
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-neutral-300">
          <p className="text-neutral-400 text-sm font-medium">No sections added yet.</p>
        </div>
      ) : (
        sections.map((section, index) => (
          <div key={section.id}
            className={`bg-white rounded-xl shadow-sm border border-l-4 ${section.isActive !== false ? 'border-l-primary-500' : 'border-l-neutral-300 opacity-75'}`}>
            
            <div className="bg-neutral-50 px-4 py-3 flex justify-between items-center rounded-t-xl border-b border-neutral-100">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded shrink-0 ${section.isActive !== false ? 'bg-primary-100 text-primary-700' : 'bg-neutral-200 text-neutral-600'}`}>
                  {section.type}
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FaTag className="text-neutral-400 shrink-0" size={10} />
                  <input type="text"
                    className="text-sm font-semibold bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary-500 focus:outline-none px-1 py-0.5 min-w-0 w-full"
                    value={section.name || section.type}
                    onChange={(e) => updateSection(index, 'name', e.target.value)}
                    placeholder="Section name..."
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <ToggleSwitch checked={section.isActive !== false} onChange={(val) => updateSection(index, 'isActive', val)} label="Visible" />
                <div className="flex items-center gap-1 border-l pl-4 border-neutral-200">
                  <button type="button" onClick={() => duplicateSection(index)}
                    className="p-1.5 text-neutral-400 hover:text-primary-600 bg-white rounded border border-neutral-200 transition-colors"
                    title="Duplicate section">
                    <FaCopy size={12} />
                  </button>
                  <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0}
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 bg-white rounded border border-neutral-200 disabled:opacity-30 transition-opacity"><FaArrowUp size={12}/></button>
                  <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1}
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 bg-white rounded border border-neutral-200 disabled:opacity-30 transition-opacity"><FaArrowDown size={12}/></button>
                  <button type="button" onClick={() => removeSection(section.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 hover:border-red-200 bg-white rounded border border-neutral-200 ml-2 shadow-sm transition-all"><FaTrash size={12}/></button>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                {(section.type !== 'Testimonial') && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Section Title</label>
                    <input type="text" className="w-full form-input text-sm px-4 py-2.5 rounded-lg bg-neutral-50 border-neutral-200 focus:bg-white transition-all" value={section.title || ''}
                      onChange={(e) => updateSection(index, 'title', e.target.value)} placeholder="Enter heading..." />
                  </div>
                )}
                {(['Hero', 'VideoHero', 'FeatureHeavy', 'GridFeatures', 'CTA', 'PricingPlans', 'CustomHTML'].includes(section.type)) && (
                   <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Subtitle / Description</label>
                    <textarea className="w-full form-textarea text-sm px-4 py-2 rounded-lg bg-neutral-50 border-neutral-200 focus:bg-white transition-all" rows="2" value={section.subtitle || ''}
                      onChange={(e) => updateSection(index, 'subtitle', e.target.value)} placeholder="Enter description..." />
                  </div>
                )}
              </div>

              {section.type === 'VideoHero' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Video Settings</label>
                  <input type="text" className="w-full form-input text-sm bg-white" placeholder="Video URL (Direct link or YouTube/Vimeo)" value={section.videoUrl || ''} onChange={e => updateSection(index, 'videoUrl', e.target.value)} />
                </div>
              )}

              {section.type === 'ComparisonTable' && (
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                   <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Comparison Flags</h4>
                    <button type="button" onClick={() => addComparison(index)} className="text-xs font-bold text-primary-600 hover:underline">+ Add Feature Row</button>
                  </div>
                  {section.comparisons?.map((comp, compIdx) => (
                    <div key={comp.id} className="flex gap-4 items-center bg-neutral-50 p-2 rounded-lg border border-neutral-100 shadow-sm">
                      <input type="text" className="flex-1 form-input text-xs" placeholder="Feature name" value={comp.feature} onChange={e => {
                        const arr = [...section.comparisons]; arr[compIdx].feature = e.target.value; updateSection(index, 'comparisons', arr);
                      }} />
                      <div className="flex items-center gap-4 px-4 border-l border-neutral-200">
                        <ToggleSwitch checked={comp.us} onChange={val => {
                          const arr = [...section.comparisons]; arr[compIdx].us = val; updateSection(index, 'comparisons', arr);
                        }} label="US" />
                        <ToggleSwitch checked={comp.them} onChange={val => {
                          const arr = [...section.comparisons]; arr[compIdx].them = val; updateSection(index, 'comparisons', arr);
                        }} label="HEM" />
                        <button type="button" onClick={() => {
                          const arr = section.comparisons.filter(c => c.id !== comp.id); updateSection(index, 'comparisons', arr);
                        }} className="text-red-400 hover:text-red-600"><FaTrash size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {['FeatureHeavy', 'GridFeatures', 'SocialProof', 'ResourceLibrary'].includes(section.type) && (
                <div className="space-y-4 pt-4 border-t border-neutral-100">
                   <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-neutral-600 uppercase tracking-widest">{section.type} Items</h4>
                    <button type="button" onClick={() => addItem(index)} className="text-xs font-bold text-primary-600 hover:underline">+ Add New Item</button>
                  </div>
                  <div className="grid lg:grid-cols-2 gap-4">
                    {section.items?.map((item, itemIdx) => (
                      <div key={item.id} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 relative group">
                        <button type="button" onClick={() => removeItem(index, itemIdx)} className="absolute top-2 right-2 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash size={10} /></button>
                        <div className="grid gap-3">
                          <div className="flex gap-3">
                            <input type="text" className="w-1/3 form-input text-xs" placeholder="Icon/Emoji" value={item.icon || ''} onChange={e => updateItem(index, itemIdx, 'icon', e.target.value)} />
                            <input type="text" className="flex-1 form-input text-xs font-bold" placeholder="Item Title" value={item.title || item.name || ''} 
                              onChange={e => updateItem(index, itemIdx, section.type === 'SocialProof' ? 'name' : 'title', e.target.value)} />
                          </div>
                          {section.type !== 'SocialProof' && (
                            <textarea className="form-textarea text-xs" rows="2" placeholder="Item Description" value={item.desc || ''} onChange={e => updateItem(index, itemIdx, 'desc', e.target.value)} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <button type="button" onClick={() => updateSection(index, 'showCustomCss', !section.showCustomCss)}
                   className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter flex items-center gap-1 hover:text-neutral-600 mb-2">
                  <FaCode size={10}/> {section.showCustomCss ? 'Hide' : 'Add'} Section Custom CSS
                </button>
                {section.showCustomCss && (
                  <textarea
                    className="w-full font-mono text-xs bg-neutral-900 text-green-500 p-4 rounded-lg border border-neutral-800 focus:outline-none"
                    rows="6"
                    value={section.customCss || ''}
                    onChange={(e) => updateSection(index, 'customCss', e.target.value)}
                    placeholder=".section-class { color: red; }"
                    spellCheck={false}
                  />
                )}
              </div>

              {section.type === 'CustomHTML' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaCode className="text-primary-500" />
                    <label className="text-xs font-bold text-neutral-700">HTML Code</label>
                  </div>
                  <textarea
                    className="w-full font-mono text-sm bg-neutral-950 text-indigo-400 border border-neutral-800 rounded-xl p-5 min-h-[250px] focus:outline-none"
                    value={section.code || ''}
                    onChange={(e) => updateSection(index, 'code', e.target.value)}
                    placeholder={`<div class="p-10 bg-gradient-to-r from-primary-500 to-indigo-600 rounded-3xl">\n  <h3 class="text-white">Custom Block</h3>\n</div>`}
                    spellCheck={false}
                  />
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
