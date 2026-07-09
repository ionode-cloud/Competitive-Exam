import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Image, Save, Loader, Trash2, Plus, FileImage, Link as LinkIcon, Sparkles, Edit2, Check, X as CancelIcon } from 'lucide-react';
import { alertSuccess, alertError, confirmAction } from '../../utils/alert';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const defaultGalleryItems = [
  { id: 1, cat: 'Success Stories', title: 'Rahul Cleared SBI PO', emoji: '🏆', color: '#ff6b00', size: 'tall', desc: 'Rank 47 All India — from a small village in Odisha!' },
  { id: 2, cat: 'Online Exams', title: 'Live Exam Interface', emoji: '💻', color: '#3b82f6', size: 'normal', desc: 'Real-time timer, question palette and analytics' },
  { id: 3, cat: 'Achievements', title: '50K Students Milestone', emoji: '🎯', color: '#10b981', size: 'wide', desc: 'Celebrating 50,000 enrolled students!' },
  { id: 4, cat: 'Success Stories', title: 'Priya Got IBPS Clerk', emoji: '⭐', color: '#8b5cf6', size: 'normal', desc: 'First attempt success story — Priya Sharma' },
];

const defaultCategoriesList = ['Success Stories', 'Online Exams', 'Achievements', 'Events', 'Team'];

export default function AdminGallery() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroImageMain, setHeroImageMain] = useState('');
  const [heroImageSub, setHeroImageSub] = useState('');
  const [statNumber, setStatNumber] = useState('');
  const [statLabel, setStatLabel] = useState('');
  const [mainSourceType, setMainSourceType] = useState('url'); // 'file' or 'url'
  const [subSourceType, setSubSourceType] = useState('url'); // 'file' or 'url'
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(defaultCategoriesList);

  // Category management state
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatIndex, setEditingCatIndex] = useState(null);
  const [editingCatValue, setEditingCatValue] = useState('');

  // Form state for adding new item
  const [newType, setNewType] = useState('file'); // 'file' or 'url'
  const [newItem, setNewItem] = useState({
    cat: '',
    title: '',
    desc: '',
    size: 'normal',
    color: '#ff6b00',
    emoji: '🏆',
    url: ''
  });
  const [fileError, setFileError] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/page-content/gallery`);
      if (res.data) {
        setHeroTitle(res.data.heroTitle || "Our Students' Journey");
        setHeroSubtitle(res.data.heroSubtitle || 'Celebrating the milestones, success stories, and memorable moments from our ExamSphere community.');
        setHeroImageMain(res.data.heroImageMain || "/gallery_banner.png");
        setHeroImageSub(res.data.heroImageSub || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&auto=format&fit=crop&q=70");
        setStatNumber(res.data.statNumber || "50K+");
        setStatLabel(res.data.statLabel || "Happy Students");
        setItems(res.data.items && res.data.items.length > 0 ? res.data.items : defaultGalleryItems);
        
        const loadedCats = res.data.categories && res.data.categories.length > 0
          ? res.data.categories
          : defaultCategoriesList;
        setCategories(loadedCats);
        
        // Default category dropdown selection to the first loaded category
        setNewItem(prev => ({ ...prev, cat: loadedCats[0] || '' }));
      } else {
        setHeroTitle("Our Students' Journey");
        setHeroSubtitle('Celebrating the milestones, success stories, and memorable moments from our ExamSphere community.');
        setHeroImageMain("/gallery_banner.png");
        setHeroImageSub("https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&auto=format&fit=crop&q=70");
        setStatNumber("50K+");
        setStatLabel("Happy Students");
        setItems(defaultGalleryItems);
        setCategories(defaultCategoriesList);
        setNewItem(prev => ({ ...prev, cat: defaultCategoriesList[0] }));
      }
    } catch (err) {
      console.error('Failed to fetch gallery content:', err);
      setHeroTitle("Our Students' Journey");
      setHeroSubtitle('Celebrating the milestones, success stories, and memorable moments from our ExamSphere community.');
      setHeroImageMain("/gallery_banner.png");
      setHeroImageSub("https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&auto=format&fit=crop&q=70");
      setStatNumber("50K+");
      setStatLabel("Happy Students");
      setItems(defaultGalleryItems);
      setCategories(defaultCategoriesList);
      setNewItem(prev => ({ ...prev, cat: defaultCategoriesList[0] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  // Category Actions
  const handleAddCategory = () => {
    const value = newCatInput.trim();
    if (!value) return;
    if (categories.some(c => c.toLowerCase() === value.toLowerCase())) {
      alertError('Validation Error', 'Category already exists.');
      return;
    }
    const updatedCats = [...categories, value];
    setCategories(updatedCats);
    setNewCatInput('');
    
    // Automatically set the new item category if none is set
    if (!newItem.cat) {
      setNewItem(prev => ({ ...prev, cat: value }));
    }
    alertSuccess('Category Added', `"${value}" added. Remember to save changes.`);
  };

  const handleStartEditCategory = (index) => {
    setEditingCatIndex(index);
    setEditingCatValue(categories[index]);
  };

  const handleSaveEditCategory = async (index) => {
    const oldValue = categories[index];
    const newValue = editingCatValue.trim();
    if (!newValue) return;
    if (oldValue === newValue) {
      setEditingCatIndex(null);
      return;
    }

    if (categories.some((c, idx) => idx !== index && c.toLowerCase() === newValue.toLowerCase())) {
      alertError('Validation Error', 'Category name already exists.');
      return;
    }

    const updatedCats = [...categories];
    updatedCats[index] = newValue;
    setCategories(updatedCats);

    // Update category name in all matching items!
    setItems(prev => prev.map(item => {
      if (item.cat === oldValue) {
        return { ...item, cat: newValue };
      }
      return item;
    }));

    // Update active dropdown if it matches old category
    if (newItem.cat === oldValue) {
      setNewItem(prev => ({ ...prev, cat: newValue }));
    }

    setEditingCatIndex(null);
    alertSuccess('Category Renamed', `Renamed "${oldValue}" to "${newValue}". Matching items updated.`);
  };

  const handleDeleteCategory = async (catName) => {
    // Count matches
    const matchesCount = items.filter(item => item.cat === catName).length;
    let message = `Are you sure you want to delete category "${catName}"?`;
    if (matchesCount > 0) {
      message = `Category "${catName}" is used by ${matchesCount} gallery items. Deleting it will leave these items without a valid category filter. Proceed?`;
    }

    const confirmed = await confirmAction('Delete Category', message);
    if (!confirmed) return;

    const updatedCats = categories.filter(c => c !== catName);
    setCategories(updatedCats);

    // Update dropdown select
    if (newItem.cat === catName) {
      setNewItem(prev => ({ ...prev, cat: updatedCats[0] || '' }));
    }
    alertSuccess('Category Deleted', `"${catName}" removed. Remember to save changes.`);
  };

  // Handle local image file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 5MB
    const limitBytes = 5 * 1024 * 1024;
    if (file.size > limitBytes) {
      setFileError('Image file exceeds the 5MB size limit.');
      alertError('File Too Large', 'Please select an image smaller than 5MB.');
      e.target.value = ''; // clear input
      return;
    }

    setFileError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewItem(prev => ({ ...prev, url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleMainFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alertError('File Too Large', 'Please select a main image smaller than 5MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setHeroImageMain(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alertError('File Too Large', 'Please select a sub image smaller than 5MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setHeroImageSub(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleStartEditItem = (item) => {
    setNewItem({
      cat: item.cat || categories[0] || '',
      title: item.title || '',
      desc: item.desc || '',
      size: item.size || 'normal',
      color: item.color || '#ff6b00',
      emoji: item.emoji || '🏆',
      url: item.url || ''
    });
    setNewType(item.url && item.url.startsWith('http') ? 'url' : 'file');
    setEditingItemId(item.id);
    const formEl = document.getElementById('gallery-form-container');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEditItem = () => {
    setNewItem({
      cat: categories[0] || '',
      title: '',
      desc: '',
      size: 'normal',
      color: '#ff6b00',
      emoji: '🏆',
      url: ''
    });
    setEditingItemId(null);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.title.trim()) {
      alertError('Validation Error', 'Title is required.');
      return;
    }
    if (!newItem.cat) {
      alertError('Validation Error', 'Please create at least one category before adding images.');
      return;
    }

    if (editingItemId) {
      setItems(prev => prev.map(item => {
        if (item.id === editingItemId) {
          return { ...item, ...newItem, title: newItem.title.trim(), desc: newItem.desc.trim() };
        }
        return item;
      }));
      setEditingItemId(null);
      alertSuccess('Updated', 'Gallery item updated successfully. Remember to save changes.');
    } else {
      const itemToAdd = {
        ...newItem,
        id: Date.now(), // unique ID
        title: newItem.title.trim(),
        desc: newItem.desc.trim()
      };
      setItems(prev => [itemToAdd, ...prev]);
      alertSuccess('Added', 'New image item added to list. Remember to save changes.');
    }

    // Reset Form (keep the chosen category and sizes)
    setNewItem(prev => ({
      ...prev,
      title: '',
      desc: '',
      emoji: '🏆',
      url: ''
    }));
    const fileInput = document.getElementById('gallery-file-input');
    if (fileInput) fileInput.value = '';
  };

  const handleDeleteItem = async (id) => {
    const confirmed = await confirmAction('Delete Item', 'Remove this image from the gallery?');
    if (confirmed) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        heroTitle,
        heroSubtitle,
        heroImageMain,
        heroImageSub,
        statNumber,
        statLabel,
        items,
        categories
      };
      await axios.put(`${API}/api/page-content/gallery`, { content: payload }, cfg());
      alertSuccess('Success', 'Gallery content & categories updated successfully!');
    } catch (err) {
      alertError('Error', 'Failed to save gallery configurations.');
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = { fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 };
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box' };

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '8px', background: 'var(--orange-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Manage Gallery</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Add, delete, or modify categories and success story images shown on the public Gallery page.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><Loader className="spin" size={32} color="var(--primary)" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Left Column: Config Forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Header Content Settings */}
            <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--primary)" /> Header Content
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Hero Title</label>
                  <input type="text" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Hero Subtitle</label>
                  <textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Stat Number</label>
                    <input type="text" value={statNumber} onChange={e => setStatNumber(e.target.value)} placeholder="e.g. 50K+" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Stat Label</label>
                    <input type="text" value={statLabel} onChange={e => setStatLabel(e.target.value)} placeholder="e.g. Happy Students" style={inputStyle} />
                  </div>
                </div>

                {/* Hero Main Image Source Toggle */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                  <label style={labelStyle}>Hero Main Image (Large Circle)</label>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <button type="button" onClick={() => setMainSourceType('file')}
                      style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${mainSourceType === 'file' ? 'var(--primary)' : 'var(--border)'}`, background: mainSourceType === 'file' ? 'var(--primary-ultra)' : 'transparent', color: mainSourceType === 'file' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}>
                      <FileImage size={14} /> Local File (Max 5MB)
                    </button>
                    <button type="button" onClick={() => setMainSourceType('url')}
                      style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${mainSourceType === 'url' ? 'var(--primary)' : 'var(--border)'}`, background: mainSourceType === 'url' ? 'var(--primary-ultra)' : 'transparent', color: mainSourceType === 'url' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}>
                      <LinkIcon size={14} /> Web Image URL
                    </button>
                  </div>
                  {mainSourceType === 'file' ? (
                    <input type="file" accept="image/*" onChange={handleMainFileChange} style={inputStyle} />
                  ) : (
                    <input type="url" value={heroImageMain} onChange={e => setHeroImageMain(e.target.value)} placeholder="https://example.com/image.png" style={inputStyle} />
                  )}
                  {heroImageMain && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={heroImageMain} alt="Main Banner Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                </div>

                {/* Hero Sub Image Source Toggle */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <label style={labelStyle}>Hero Sub Image (Small Floating Badge)</label>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <button type="button" onClick={() => setSubSourceType('file')}
                      style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${subSourceType === 'file' ? 'var(--primary)' : 'var(--border)'}`, background: subSourceType === 'file' ? 'var(--primary-ultra)' : 'transparent', color: subSourceType === 'file' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}>
                      <FileImage size={14} /> Local File (Max 5MB)
                    </button>
                    <button type="button" onClick={() => setSubSourceType('url')}
                      style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${subSourceType === 'url' ? 'var(--primary)' : 'var(--border)'}`, background: subSourceType === 'url' ? 'var(--primary-ultra)' : 'transparent', color: subSourceType === 'url' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}>
                      <LinkIcon size={14} /> Web Image URL
                    </button>
                  </div>
                  {subSourceType === 'file' ? (
                    <input type="file" accept="image/*" onChange={handleSubFileChange} style={inputStyle} />
                  ) : (
                    <input type="url" value={heroImageSub} onChange={e => setHeroImageSub(e.target.value)} placeholder="https://example.com/image.png" style={inputStyle} />
                  )}
                  {heroImageSub && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={heroImageSub} alt="Sub Banner Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* Add New Item Form */}
            <div id="gallery-form-container" className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} color="var(--primary)" /> {editingItemId ? 'Edit Gallery Item' : 'Add New Image / Card'}
              </h3>
              <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select value={newItem.cat} onChange={e => setNewItem({ ...newItem, cat: e.target.value })} style={inputStyle}>
                      {categories.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Card Size Layout</label>
                    <select value={newItem.size} onChange={e => setNewItem({ ...newItem, size: e.target.value })} style={inputStyle}>
                      <option value="normal">Normal (Square)</option>
                      <option value="tall">Tall (Vertical)</option>
                      <option value="wide">Wide (Horizontal)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Theme Color</label>
                    <input type="color" value={newItem.color} onChange={e => setNewItem({ ...newItem, color: e.target.value })} style={{ ...inputStyle, height: '40px', padding: '2px 8px' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Fallback Emoji (optional)</label>
                    <input type="text" value={newItem.emoji} onChange={e => setNewItem({ ...newItem, emoji: e.target.value })} style={inputStyle} placeholder="e.g. 🏆" />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Card Title *</label>
                  <input type="text" required value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} placeholder="e.g. Cleared SBI PO 2026" style={inputStyle} />
                </div>

                <div>
                  <label style={labelStyle}>Card Description</label>
                  <textarea value={newItem.desc} onChange={e => setNewItem({ ...newItem, desc: e.target.value })} placeholder="Describe this milestone or student success story..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                {/* Image Upload Source Type Toggle */}
                <div>
                  <label style={labelStyle}>Image Source</label>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <button type="button" onClick={() => { setNewType('file'); setNewItem(p=>({...p, url:''})); }}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${newType === 'file' ? 'var(--primary)' : 'var(--border)'}`, background: newType === 'file' ? 'var(--primary-ultra)' : 'transparent', color: newType === 'file' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <FileImage size={16} /> Local File (Max 5MB)
                    </button>
                    <button type="button" onClick={() => { setNewType('url'); setNewItem(p=>({...p, url:''})); }}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${newType === 'url' ? 'var(--primary)' : 'var(--border)'}`, background: newType === 'url' ? 'var(--primary-ultra)' : 'transparent', color: newType === 'url' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <LinkIcon size={16} /> Web Image URL
                    </button>
                  </div>

                  {newType === 'file' ? (
                    <div>
                      <input id="gallery-file-input" type="file" accept="image/*" onChange={handleFileChange} style={inputStyle} />
                      {fileError && <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px', fontWeight: 600 }}>⚠️ {fileError}</p>}
                    </div>
                  ) : (
                    <input type="url" value={newItem.url} onChange={e => setNewItem({ ...newItem, url: e.target.value })} placeholder="https://example.com/image.png" style={inputStyle} />
                  )}
                </div>

                {newItem.url && (
                  <div style={{ marginTop: '10px' }}>
                    <label style={labelStyle}>Image Preview</label>
                    <img src={newItem.url} alt="Preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border)' }} />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn btn-outline" style={{ flex: 1, display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--primary-ultra)' }}>
                    <Plus size={16} /> {editingItemId ? 'Update Item' : 'Add to List'}
                  </button>
                  {editingItemId && (
                    <button type="button" onClick={handleCancelEditItem} className="btn btn-outline" style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Previews & Save Changes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Action Bar */}
            <div className="glass" style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Save Configurations</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Apply changes to the public gallery.</p>
              </div>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 20px' }}>
                {saving ? <><Loader size={16} className="spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
              </button>
            </div>

            {/* List & Previews */}
            <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image size={20} color="var(--primary)" /> Gallery Items ({items.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '6px' }}>
                {items.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>No items in gallery. Add images above.</p>
                ) : (
                  items.map(item => (
                    <div key={item.id} style={{ display: 'flex', gap: '16px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', alignItems: 'center' }}>
                      {/* Thumbnail preview */}
                      <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                        {item.url ? (
                          <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.75rem' }}>{item.emoji}</span>
                        )}
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '100px', background: `${item.color}22`, color: item.color, fontWeight: 700 }}>{item.cat}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{item.size}</span>
                        </div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</p>
                      </div>

                      {/* Action */}
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button type="button" onClick={() => handleStartEditItem(item)} title="Edit Item" style={{ padding: '8px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                          <Edit2 size={14} />
                        </button>
                        <button type="button" onClick={() => handleDeleteItem(item.id)} title="Remove Item" style={{ padding: '8px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Category Management Section */}
            <div className="glass" style={{ padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--primary)" /> Manage Categories
              </h3>
              
              {/* Add Category Form */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input type="text" value={newCatInput} onChange={e => setNewCatInput(e.target.value)} placeholder="e.g. Campus Events" style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={handleAddCategory} className="btn btn-outline" style={{ display: 'flex', gap: '6px', alignItems: 'center', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                  <Plus size={16} /> Add
                </button>
              </div>

              {/* Category List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '6px' }}>
                {categories.map((cat, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', marginRight: '2px' }}>
                    {editingCatIndex === index ? (
                      <div style={{ display: 'flex', gap: '8px', flex: 1, marginRight: '8px' }}>
                        <input type="text" value={editingCatValue} onChange={e => setEditingCatValue(e.target.value)} style={{ ...inputStyle, padding: '6px 10px' }} />
                        <button type="button" onClick={() => handleSaveEditCategory(index)} style={{ padding: '6px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer', display: 'flex' }}><Check size={16} /></button>
                        <button type="button" onClick={() => setEditingCatIndex(null)} style={{ padding: '6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', display: 'flex' }}><CancelIcon size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{cat}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => handleStartEditCategory(index)} style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex' }}><Edit2 size={14} /></button>
                          <button type="button" onClick={() => handleDeleteCategory(cat)} style={{ padding: '6px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </AdminLayout>
  );
}
